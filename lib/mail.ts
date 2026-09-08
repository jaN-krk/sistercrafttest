import {db,runtime} from './server';
import {money} from './catalog';
import type {Order} from './commerce';
import {emailTemplate} from './email-template';
import {siteOrigin} from './site-origin';
import {mailConfig} from './mail-config';

type Payload = {from:string;to:string[];subject:string;text:string;html:string;reply_to?:string;_provider?:'resend'|'mailersend'};
type MailRow = {id:string;order_id?:string;source_id?:string;kind:string;payload:string|null};
const labels:Record<string,string> = {paid:'Siparişini aldık',shipped:'Siparişin yola çıktı',delivered:'Sipariş teslim edildi',refunded:'Ödemen iade edildi'};
const ownerLabels:Record<string,string> = {paid:'Yeni ödenmiş sipariş',shipped:'Sipariş kargoya verildi',delivered:'Sipariş teslim edildi',refunded:'Ödeme iade edildi'};
function message(to:string,title:string,text:string,owner:boolean,replyTo?:string):Payload {
  return {from:mailConfig().from,_provider:mailConfig().provider,to:[to],subject:'SisterCraft&Co — '+title,text,
    html:emailTemplate(title,text,siteOrigin+(owner?'/yonetim':'/siparisler'),owner?'Yönetim panelini aç':'Siparişlerimi görüntüle'),
    ...(replyTo?{reply_to:replyTo}:{})};
}
async function payload(row:MailRow,owner:boolean):Promise<Payload|null> {
  const target=String(runtime().STORE_NOTIFICATION_EMAIL||'');
  if(owner&&!target)return null;
  if(owner&&row.kind==='test')return message(target,'Test e-postası','Merhaba,\n\nSisterCraft&Co bildirim bağlantın çalışıyor. Yeni talepler ve sipariş bildirimleri için bu adres kullanılacak.\n\nBu bir test mesajıdır; sipariş veya ödeme oluşturulmadı.',true);
  if(owner&&(row.kind==='request'||row.kind==='request_received')) {
    const request=await db().prepare('SELECT * FROM requests WHERE id=?').bind(row.source_id).first<{email:string;kind:string;body:string;product_id:string|null}>();
    if(!request)return null;
    const details=JSON.parse(request.body);
    const product=request.product_id?await db().prepare('SELECT data FROM products WHERE id=?').bind(request.product_id).first<{data:string}>():null;
    if(row.kind==='request_received') {
      const title=request.kind==='stock'?'Stok haberi talebini aldık':request.kind==='return'?'İade talebini aldık':'Mesajını aldık';
      const body=[`Merhaba ${details.name||''},`, '',request.kind==='stock'?'Stok haberi isteğin kaydedildi.':'Talebin mağazamıza ulaştı. Ekibimiz inceleyerek sana dönüş yapacak.',...(product?[`Ürün: ${JSON.parse(product.data).name}`]:[]),'','SisterCraft&Co'].join('\n');
      const result=message(request.email,title,body,false,target);
      result.html=emailTemplate(title,body,siteOrigin+'/iletisim','Bize ulaş');
      return result;
    }
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
    `${order.number} — ${label}.`,...(owner?[`E-posta: ${customer.email}`,`Telefon: ${customer.phone||''}`,`Teslimat adresi: ${customer.address||''}`,`${customer.district||''} / ${customer.city||''} ${customer.postalCode||''}`,`Sipariş tarihi: ${new Date(order.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}`,...(customer.note?[`Müşteri notu: ${customer.note}`]:[])]:[]),'',
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
      const frozen=JSON.parse(value) as Payload;
      // Legacy frozen payloads belong to Resend. Never switch providers on a retry.
      const provider=frozen._provider||'resend',config=mailConfig();
      if(provider!==config.provider)continue;
      if(config.testMode&&!frozen.to.every(to=>config.recipients.includes(to.toLowerCase()))) {
        await db().prepare(`UPDATE ${table} SET status='blocked',payload=COALESCE(payload,?),updated_at=? WHERE id=? AND status='ready'`).bind(value,now,row.id).run();
        continue;
      }
      // MailerSend has no documented idempotency contract; never resend an uncertain claim.
      if(provider==='mailersend') {
        await db().prepare(`UPDATE ${table} SET status='review',updated_at=? WHERE id=? AND status='sending' AND updated_at<?`).bind(now,row.id,now-60000).run();
      }
      const claimed=await db().prepare(`UPDATE ${table} SET status='sending',payload=COALESCE(payload,?),first_attempt=COALESCE(first_attempt,?),updated_at=? WHERE id=? AND (status='ready' OR (status='sending' AND updated_at<? AND first_attempt>?)) RETURNING payload`)
        .bind(value,now,now,row.id,now-60000,now-23*3600000).first<{payload:string}>();
      if(!claimed)continue;
      const {_provider,...content}=JSON.parse(claimed.payload) as Payload;
      const address=(value:string)=>{const match=value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);return match?{email:match[2],name:match[1]||'SisterCraft&Co'}:{email:value};};
      const body=provider==='resend'?content:{from:address(content.from),to:content.to.map(address),subject:content.subject,html:content.html,text:content.text,settings:{track_opens:false,track_clicks:false,track_content:false},...(content.reply_to?{reply_to:address(content.reply_to)}:{})};
      const response=await fetch(provider==='resend'?'https://api.resend.com/emails':'https://api.mailersend.com/v1/email',{method:'POST',headers:{Authorization:'Bearer '+config.key,'Content-Type':'application/json',...(provider==='resend'?{'Idempotency-Key':'sistercraft/'+table+'/'+row.id}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
      if(!response.ok) {
        if(provider==='mailersend')await db().prepare(`UPDATE ${table} SET status='review',updated_at=? WHERE id=?`).bind(Date.now(),row.id).run();
        console.warn('Email provider rejected notification',{status:response.status});continue;
      }
      const id=provider==='mailersend'?response.headers.get('x-message-id'):(await response.json() as {id?:string}).id;
      if(provider==='mailersend'&&(!id||response.headers.get('x-send-paused')==='true')) {
        await db().prepare(`UPDATE ${table} SET status='review',provider_id=?,updated_at=? WHERE id=?`).bind(id||null,Date.now(),row.id).run();
        continue;
      }
      if(!id)continue;
      await db().prepare(`UPDATE ${table} SET status='sent',provider_id=?,updated_at=? WHERE id=?`).bind(id,Date.now(),row.id).run();
      sent++;
    } catch {console.warn('Email notification remains queued');}
  }
  return sent;
}
export async function drainMail(orderId?:string) {
  const config=mailConfig();
  if(!config.configured)return{sent:0,pending:true};
  for(const table of ['notification_outbox','mail_outbox'] as const) {
    const waiting=await db().prepare(`SELECT id,payload FROM ${table} WHERE status='blocked' LIMIT 100`).all<{id:string;payload:string}>();
    for(const row of waiting.results) {
      const frozen=JSON.parse(row.payload) as Payload;
      if((frozen._provider||'resend')===config.provider&&(!config.testMode||frozen.to.every(to=>config.recipients.includes(to.toLowerCase())))) {
        await db().prepare(`UPDATE ${table} SET status='ready',updated_at=? WHERE id=? AND status='blocked'`).bind(Date.now(),row.id).run();
      }
    }
  }
  let sent=await drainQueue('notification_outbox',orderId);
  sent+=await drainQueue('mail_outbox',orderId);
  return{sent};
}
export async function mailStatus() {
  const e=runtime();
  const rows=await db().prepare("SELECT status,COUNT(*) AS count FROM (SELECT status FROM mail_outbox UNION ALL SELECT status FROM notification_outbox) GROUP BY status").all<{status:string;count:number}>();
  const config=mailConfig();
  return{configured:config.configured,provider:config.provider,testMode:config.testMode,recipient:e.STORE_NOTIFICATION_EMAIL||'',counts:Object.fromEntries(rows.results.map(r=>[r.status,r.count]))};
}

export function customerMailStatement(id:string,customerId:string,to:string,title:string,text:string,url:string,button:string){
  const target=to==='owner'?String(runtime().STORE_NOTIFICATION_EMAIL||''):to;
  const payload={from:mailConfig().from,_provider:mailConfig().provider,to:[target],subject:'SisterCraft&Co — '+title,text,html:emailTemplate(title,text,url,button)};
  return db().prepare("INSERT INTO notification_outbox(id,source_id,kind,status,payload,updated_at) VALUES(?,?,?,'ready',?,?) ON CONFLICT(id) DO NOTHING").bind(id,customerId,'customer_account',JSON.stringify(payload),Date.now());
}
