import {db,body,json,rateLimit,type Session} from './server';
import {assert,email,string,sha,randomToken} from './security';
import {passwordDigest,verifyPassword} from './admin-auth';
import {mailConfig} from './mail-config';
import {drainMail,customerMailStatement} from './mail';
import {siteOrigin} from './site-origin';

type Customer={id:string;email:string;name:string;digest:string;version:string;created_at:number};
const lifetime=30*86400000,idle=7*86400000;
const dummyDigest='scrypt$32768$8$3$'+'0'.repeat(32)+'$'+'0'.repeat(64);
function cookieName(req:Request){return new URL(req.url).protocol==='https:'?'__Host-sc_customer':'sc_customer';}
function cookie(req:Request,value:string,age=2592000){return `${cookieName(req)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
function rawToken(req:Request){return req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName(req)+'='))?.slice(cookieName(req).length+1)||'';}
function password(value:unknown,min=1){assert(typeof value==='string'&&value.length>=min&&value.length<=128,400,min>1?'Şifren 15–128 karakter olmalı.':'E-posta veya şifre hatalı.');return value;}
function view(c:Customer){return{id:c.id,email:c.email,name:c.name,createdAt:c.created_at};}
export function customerEmailAvailable(address:string){const c=mailConfig();return c.configured&&(!c.testMode||c.recipients.includes(address));}

export async function customerSession(req:Request,s:Session):Promise<Customer|null>{
  const raw=rawToken(req);if(!/^[a-f0-9]{64}$/.test(raw))return null;
  const hash=await sha(raw),now=Date.now();
  const customer=await db().prepare('SELECT c.* FROM customer_sessions s JOIN customers c ON c.id=s.customer_id AND c.version=s.version WHERE s.id=? AND s.browser_session=? AND s.expires>? AND s.last_seen>?').bind(hash,s.id,now,now-idle).first<Customer>();
  if(customer)await db().prepare('UPDATE customer_sessions SET last_seen=MAX(last_seen,?) WHERE id=?').bind(now,hash).run();
  return customer;
}
async function startSession(req:Request,s:Session,c:Customer){
  const raw=randomToken(),now=Date.now(),previous=rawToken(req);
  await db().batch([
    db().prepare('INSERT INTO customer_sessions(id,customer_id,version,browser_session,expires,last_seen) VALUES(?,?,?,?,?,?)').bind(await sha(raw),c.id,c.version,s.id,now+lifetime,now),
    db().prepare('DELETE FROM customer_sessions WHERE id=? OR expires<=? OR last_seen<=?').bind(await sha(previous),now,now-idle),
  ]);
  return cookie(req,raw);
}

// Email matching never grants order access. Only the customer ID recorded at checkout does.
export async function orderAccess(req:Request,s:Session){const customer=await customerSession(req,s);return{condition:'((customer_id IS NULL AND session=?) OR customer_id=?)',values:[s.id,customer?.id||'']};}

export async function customerAuthRoutes(req:Request,path:string,s:Session):Promise<Response|null>{
  if(path!=='account'&&!path.startsWith('account/'))return null;
  const u=new URL(req.url);assert(u.protocol==='https:'||['localhost','127.0.0.1','[::1]'].includes(u.hostname),403,'Güvenli bağlantı gerekli.');
  if(path==='account'&&req.method==='GET'){
    const c=await customerSession(req,s),m=mailConfig();return json({customer:c?view(c):null,emailReady:m.configured&&!m.testMode,csrf:s.csrf},200,s.cookie);
  }
  if(path==='account/register'&&req.method==='POST'){
    await rateLimit(req,'customer-register',5);
    const data=await body(req),address=email(data.email),name=string(data.name,2,100),secret=password(data.password,15);
    assert(data.privacy===true,400,'Gizlilik ve KVKK aydınlatma metnini okuduğunu belirt.');
    const digest=await passwordDigest(secret),now=Date.now(),id=crypto.randomUUID(),version=crypto.randomUUID();
    const created=await db().prepare('INSERT INTO customers(id,email,name,digest,version,created_at,privacy_version) VALUES(?,?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING RETURNING *').bind(id,address,name,digest,version,now,'2026-09-08').first<Customer>();
    assert(created,409,'Bu bilgilerle kayıt tamamlanamadı. Giriş yapmayı veya şifreni yenilemeyi deneyebilirsin.');
    const authCookie=await startSession(req,s,created);
    // Registration remains usable when the email provider is unavailable.
    try{await db().batch([
      customerMailStatement('customer-welcome:'+id,id,address,'Aramıza hoş geldin',`Merhaba ${name},\n\nSisterCraft&Co hesabın oluşturuldu. Hesabına giriş yaparak yeni siparişlerini takip edebilirsin.\n\nBu işlemi sen yapmadıysan iletişim sayfamızdan bize ulaş.`,siteOrigin+'/hesabim','Hesabımı aç'),
      customerMailStatement('customer-owner:'+id,id,'owner','Yeni müşteri kaydı',`Yeni bir müşteri hesabı oluşturuldu.\n\nAd: ${name}\nE-posta: ${address}\nKayıt tarihi: ${new Date(now).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}\n\nBu kayıt pazarlama izni anlamına gelmez. E-posta sahipliği henüz doğrulanmamıştır.`,siteOrigin+'/yonetim','Yönetim panelini aç'),
    ]);await drainMail(id);}catch{console.warn('Customer registration notification unavailable');}
    return json({customer:view(created)},201,authCookie);
  }
  if(path==='account/login'&&req.method==='POST'){
    await rateLimit(req,'customer-login',15);const data=await body(req),address=email(data.email),secret=password(data.password);
    await rateLimit(req,'customer-login:'+await sha(address),8);
    const c=await db().prepare('SELECT * FROM customers WHERE email=?').bind(address).first<Customer>();
    const valid=await verifyPassword(secret,c?.digest||dummyDigest);assert(c&&valid,401,'E-posta veya şifre hatalı.');
    return json({customer:view(c)},200,await startSession(req,s,c));
  }
  if(path==='account/logout'&&req.method==='POST'){
    await db().prepare('DELETE FROM customer_sessions WHERE id=?').bind(await sha(rawToken(req))).run();return json({ok:true},200,cookie(req,'',0));
  }
  if(path==='account/forgot'&&req.method==='POST'){
    await rateLimit(req,'customer-forgot',5);const data=await body(req),address=email(data.email);
    assert(customerEmailAvailable(address),503,'Şifre yenileme e-postaları şu anda bu adres için kullanılamıyor. Lütfen iletişim sayfasından bize ulaş.');
    const c=await db().prepare('SELECT * FROM customers WHERE email=?').bind(address).first<Customer>();
    if(c){
      const raw=randomToken(),now=Date.now(),id=await sha(raw),link=siteOrigin+'/sifre-yenile#token='+raw;
      await db().batch([
        db().prepare('DELETE FROM customer_reset_tokens WHERE customer_id=? OR expires<=?').bind(c.id,now),
        db().prepare('INSERT INTO customer_reset_tokens(id,customer_id,version,expires) VALUES(?,?,?,?)').bind(id,c.id,c.version,now+30*60000),
        customerMailStatement('customer-reset:'+id,c.id,address,'Şifreni yenile',`Merhaba ${c.name},\n\nYeni şifreni belirlemek için aşağıdaki bağlantıyı kullan. Bağlantı 30 dakika geçerlidir ve yalnızca bir kez kullanılabilir.\n\n${link}\n\nBu isteği sen yapmadıysan mesajı yok sayabilirsin.`,link,'Yeni şifre belirle'),
      ]);
      await drainMail(c.id);
    }
    return json({ok:true,message:'Bu adresle bir hesabın varsa şifre yenileme bağlantısı gönderilmek üzere kaydedildi. Gelen kutunu ve spam klasörünü kontrol et.'});
  }
  if(path==='account/reset'&&req.method==='POST'){
    await rateLimit(req,'customer-reset',8);const data=await body(req),raw=string(data.token,64,64),secret=password(data.password,15);
    assert(/^[a-f0-9]{64}$/.test(raw),400,'Bağlantı geçersiz veya süresi dolmuş.');
    const hash=await sha(raw),now=Date.now(),digest=await passwordDigest(secret),version=crypto.randomUUID();
    // A conditional update and token consumption in one transaction reject concurrent replays.
    const result=await db().batch([
      db().prepare('UPDATE customers SET digest=?,version=? WHERE id IN (SELECT customer_id FROM customer_reset_tokens WHERE id=? AND expires>?) AND version=(SELECT version FROM customer_reset_tokens WHERE id=?) RETURNING id').bind(digest,version,hash,now,hash),
      db().prepare('DELETE FROM customer_sessions WHERE customer_id IN (SELECT customer_id FROM customer_reset_tokens WHERE id=?) AND version<>(SELECT version FROM customers WHERE id=customer_sessions.customer_id)').bind(hash),
      db().prepare('DELETE FROM customer_reset_tokens WHERE id=?').bind(hash),
    ]);
    assert(result[0].results.length===1,400,'Bağlantı kullanılmış, geçersiz veya süresi dolmuş. Yeni bir bağlantı iste.');
    return json({ok:true},200,cookie(req,'',0));
  }
  const c=await customerSession(req,s);assert(c,401,'Hesabına giriş yapmalısın.');
  if(path==='account/password'&&req.method==='POST'){
    await rateLimit(req,'customer-password',5);const data=await body(req),current=password(data.currentPassword),next=password(data.password,15);
    assert(await verifyPassword(current,c.digest),400,'Mevcut şifre hatalı.');assert(current!==next,400,'Yeni şifren mevcut şifrenden farklı olmalı.');
    const digest=await passwordDigest(next),version=crypto.randomUUID();
    const result=await db().batch([
      db().prepare('UPDATE customers SET digest=?,version=? WHERE id=? AND version=? RETURNING id').bind(digest,version,c.id,c.version),
      db().prepare('DELETE FROM customer_sessions WHERE customer_id=?').bind(c.id),
      db().prepare('DELETE FROM customer_reset_tokens WHERE customer_id=?').bind(c.id),
    ]);assert(result[0].results.length===1,409,'Hesap bilgilerin değişti. Yeniden giriş yap.');
    return json({ok:true},200,cookie(req,'',0));
  }
  return json({error:'İşlem bulunamadı.'},404);
}
