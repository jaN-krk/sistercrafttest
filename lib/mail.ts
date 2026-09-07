import {db,runtime} from './server';
import {money} from './catalog';
import type {Order} from './commerce';
import {emailTemplate} from './email-template';
import {siteOrigin} from './site-origin';

type Payload = {from:string;to:string[];subject:string;text:string;html:string;reply_to?:string};
type MailRow = {id:string;order_id?:string;source_id?:string;kind:string;payload:string|null};
const labels:Record<string,string> = {paid:'Siparişini aldık',shipped:'Siparişin yola çıktı',delivered:'Sipariş teslim edildi',refunded:'Ödemen iade edildi'};
const ownerLabels:Record<string,string> = {paid:'Yeni ödenmiş sipariş',shipped:'Sipariş kargoya verildi',delivered:'Sipariş teslim edildi',refunded:'Ödeme iade edildi'};
function message(to:string,title:string,text:string,owner:boolean,replyTo?:string):Payload {
  return {from:String(runtime().EMAIL_FROM),to:[to],subject:'SisterCraft&Co — '+title,text,
    html:emailTemplate(title,text,siteOrigin+(owner?'/yonetim':'/siparisler'),owner?'Yönetim panelini aç':'Siparişlerimi görüntüle'),
    ...(replyTo?{reply_to:replyTo}:{})};
}
async function payload(row:MailRow,owner:boolean):Promise<Payload|null> {
  const target=String(runtime().STORE_NOTIFICATION_EMAIL||'');
  if(owner&&!target)return null;
  if(owner&&row.kind==='request') {
    const request=await db().prepare('SELECT * FROM requests WHERE id=?').bind(row.source_id).first<{email:string;kind:string;body:string;product_id:string|null}>();
    if(!request)return null;
    const details=JSON.parse(request.body);
    const product=request.product_id?await db().prepare('SELECT data FROM products WHERE id=?').bind(request.product_id).first<{data:string}>():null;
    const title=request.kind==='stock'?'Yeni stok bildirim kaydı':request.kind==='return'?'Yeni iade talebi':'Yeni iletişim mesajı';
    return message(target,title,[`Gönderen: ${details.name||'İsim belirtilmedi'}`,`E-posta: ${request.email}`,
      ...(product?[`Ürün: ${JSON.parse(product.data).name}`]:[]),...(details.orderNumber?[`Sipariş: ${details.orderNumber}`]:[]),
      '',details.message||'Ürün yeniden stokta olduğunda haber verilmesini istiyor.','',
      'Talep yönetim paneline kaydedildi. Bu e-postayı yanıtlayarak müşteriye ulaşabilirsin.'].join('\n'),true,request.email);
  }
  const order=await db().prepare('SELECT * FROM orders WHERE id=?').bind(row.order_id||row.source_id).first<Order>();
  if(!order)return null;
  const customer=JSON.parse(order.customer),contract=JSON.parse(order.consent);
  const label=(owner?ownerLabels:labels)[row.kind]||row.kind;
  const lines=await db().prepare('SELECT name,quantity,price FROM order_lines WHERE order_id=?').bind(order.id).all<{name:string;quantity:number;price:number}>();
  const text=[owner?`Müşteri: ${customer.name} ${customer.surname||''}`:`Merhaba ${customer.name},`,
    `${order.number} — ${label}.`,...(owner?[`E-posta: ${customer.email}`]:[]),'',
    ...lines.results.map(i=>`${i.quantity} × ${i.name}: ${money(i.quantity*i.price)}`),
    'Kargo: '+money(order.shipping),'Vergiler dahil toplam: '+money(order.total),
    ...(row.kind==='shipped'?[`Kargo: ${order.carrier}`,`Takip numarası: ${order.tracking}`]:[]),
    '',`${owner?'Yönetim paneli':'Sipariş durumun'}: ${siteOrigin}${owner?'/yonetim':'/siparisler'}`,
    ...(!owner?['',`Sipariş sözleşmesi / ön bilgilendirme (${contract.version})`,`Satıcı: ${contract.seller.name}`,
      `Adres: ${contract.seller.address}`,`İletişim: ${contract.seller.email} / ${contract.seller.phone}`,`KEP: ${contract.seller.kep}`,
      `Vergi dairesi/no: ${contract.seller.taxOffice} / ${contract.seller.taxNumber}`,`İade: ${contract.seller.returnAddress}`,
      `İade taşıyıcısı: ${contract.seller.returnCarrier}`,contract.terms]:[]),'','SisterCraft&Co'].join('\n');
  return message(owner?target:customer.email,label+' · '+order.number,text,owner,owner?customer.email:target||undefined);
}
async function drainQueue(table:'mail_outbox'|'notification_outbox',orderId?:string) {
  const now=Date.now(),owner=table==='notification_outbox';
  const source=owner?'source_id':'order_id';
  const rows=await db().prepare(`SELECT * FROM ${table} WHERE (status='ready' OR (status='sending' AND updated_at<? AND first_attempt>?)) AND (? IS NULL OR ${source}=?) ORDER BY updated_at LIMIT 5`)
    .bind(now-60000,now-23*3600000,orderId||null,orderId||null).all<MailRow>();
  let sent=0;
  for(const row of rows.results) {
    try {
      // Freeze recipients and content so retries use the identical provider request.
      const value=row.payload||JSON.stringify(await payload(row,owner));
      if(value==='null')continue;
      const claimed=await db().prepare(`UPDATE ${table} SET status='sending',payload=COALESCE(payload,?),first_attempt=COALESCE(first_attempt,?),updated_at=? WHERE id=? AND (status='ready' OR (status='sending' AND updated_at<? AND first_attempt>?)) RETURNING payload`)
        .bind(value,now,now,row.id,now-60000,now-23*3600000).first<{payload:string}>();
      if(!claimed)continue;
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+runtime().RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'sistercraft/'+table+'/'+row.id},body:claimed.payload,signal:AbortSignal.timeout(10000)});
      if(!response.ok) {console.warn('Email provider rejected notification',{status:response.status});continue;}
      const result=await response.json() as {id?:string};
      if(!result.id)continue;
      await db().prepare(`UPDATE ${table} SET status='sent',provider_id=?,updated_at=? WHERE id=?`).bind(result.id,Date.now(),row.id).run();
      sent++;
    } catch {console.warn('Email notification remains queued');}
  }
  return sent;
}
export async function drainMail(orderId?:string) {
  const e=runtime();
  if(!e.RESEND_API_KEY||!e.EMAIL_FROM)return{sent:0,pending:true};
  let sent=await drainQueue('notification_outbox',orderId);
  sent+=await drainQueue('mail_outbox',orderId);
  return{sent};
}
export async function mailStatus() {
  const e=runtime();
  const rows=await db().prepare("SELECT status,COUNT(*) AS count FROM (SELECT status FROM mail_outbox UNION ALL SELECT status FROM notification_outbox) GROUP BY status").all<{status:string;count:number}>();
  return{configured:!!(e.RESEND_API_KEY&&e.EMAIL_FROM),recipient:e.STORE_NOTIFICATION_EMAIL||'',counts:Object.fromEntries(rows.results.map(r=>[r.status,r.count]))};
}
