import {clientIp} from './client-ip';
import {scrypt,randomBytes,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {db,runtime,body,json,audit,rateLimit,type Session} from './server';
import {assert,sha,randomToken,string} from './security';

const ACCOUNT='admin_account';
const PREFIX='admin_session:';
const IDLE=30*60*1000,ABSOLUTE=8*60*60*1000;
type Account={username:string;digest:string;version:string;updatedAt:number};
type AdminSession={username:string;version:string;browserSession:string;createdAt:number;lastSeenAt:number;expiresAt:number;device:string};
let hashing=0;

function cookieName(req:Request){return new URL(req.url).protocol==='https:'?'__Host-sc_admin':'sc_admin';}
function authCookie(req:Request,value:string,maxAge=28800){return `${cookieName(req)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
function secureTransport(req:Request){const u=new URL(req.url);assert(u.protocol==='https:'||['localhost','127.0.0.1','[::1]'].includes(u.hostname),403,'Yönetim girişi güvenli bağlantı gerektirir.');}
function tokenFrom(req:Request){return req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName(req)+'='))?.split('=')[1]||'';}
function validPassword(value:unknown,min=1){assert(typeof value==='string'&&value.length>=min&&value.length<=128,400,min>1?'Şifre 16–128 karakter olmalı.':'Kullanıcı adı veya şifre hatalı.');return value;}

async function derive(password:string,salt:Buffer){
  // OWASP scrypt profile; bounded below workerd's production cost limit.
  assert(hashing<2,429,'Giriş sistemi meşgul. Biraz sonra tekrar dene.');hashing++;
  try{return await new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));}
  finally{hashing--;}
}
export async function passwordDigest(password:string){const salt=randomBytes(16);const key=await derive(password,salt);return `scrypt$32768$8$3$${Array.from(salt,b=>b.toString(16).padStart(2,'0')).join('')}$${Array.from(key,b=>b.toString(16).padStart(2,'0')).join('')}`;}
async function verify(password:string,digest:string){const m=/^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(digest);assert(m,503,'Yönetim giriş yapılandırması tamamlanmadı.');const key=await derive(password,Buffer.from(m[1],'hex'));return timingSafeEqual(key,Buffer.from(m[2],'hex'));}

async function account():Promise<Account>{
  let row=await db().prepare('SELECT value FROM settings WHERE key=?').bind(ACCOUNT).first<{value:string}>();
  if(!row){
    const username=String(runtime().ADMIN_LOGIN_USER||''),digest=String(runtime().ADMIN_PASSWORD_HASH||'');
    assert(/^[a-z0-9._-]{3,40}$/.test(username)&&/^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(digest),503,'Yönetim giriş yapılandırması tamamlanmadı.');
    await db().prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(ACCOUNT,JSON.stringify({username,digest,version:crypto.randomUUID(),updatedAt:Date.now()})).run();
    row=await db().prepare('SELECT value FROM settings WHERE key=?').bind(ACCOUNT).first<{value:string}>();
  }
  assert(row,503,'Yönetim girişi kullanılamıyor.');return JSON.parse(row.value);
}
export async function requireAdminSession(req:Request,touch=true){
  secureTransport(req);const raw=tokenFrom(req);assert(/^[a-f0-9]{64}$/.test(raw),401,'Yönetim paneline giriş yapmalısın.');
  const key=PREFIX+await sha(raw),now=Date.now();
  const[row,owner]=await Promise.all([db().prepare('SELECT value FROM settings WHERE key=?').bind(key).first<{value:string}>(),account()]);
  assert(row,401,'Yönetim oturumun sona erdi. Yeniden giriş yap.');const value=JSON.parse(row.value) as AdminSession;
  const browserToken=req.headers.get('cookie')?.match(/(?:^|;\s*)sc_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  assert(browserToken&&await sha(browserToken)===value.browserSession&&value.username===owner.username&&value.version===owner.version&&value.expiresAt>now&&value.lastSeenAt+IDLE>now,401,'Yönetim oturumun sona erdi. Yeniden giriş yap.');
  if(touch){
    const changed=await db().prepare("UPDATE settings SET value=json_set(value,'$.lastSeenAt',MAX(json_extract(value,'$.lastSeenAt'),?)) WHERE key=? AND json_extract(value,'$.version')=? AND json_extract(value,'$.expiresAt')>? AND json_extract(value,'$.lastSeenAt')>? RETURNING key").bind(now,key,owner.version,now,now-IDLE).first();
    assert(changed,401,'Yönetim oturumun sona erdi. Yeniden giriş yap.');
  }
  return{...value,key};
}
async function createSession(req:Request,browser:Session,owner:Account){
  const raw=randomToken(),now=Date.now();const value:AdminSession={username:owner.username,version:owner.version,browserSession:browser.id,createdAt:now,lastSeenAt:now,expiresAt:now+ABSOLUTE,device:(req.headers.get('user-agent')||'Bilinmeyen cihaz').slice(0,240)};
  const previous=tokenFrom(req);
  const statements=[db().prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind(PREFIX+await sha(raw),JSON.stringify(value)),db().prepare("DELETE FROM settings WHERE key LIKE 'admin_session:%' AND (json_extract(value,'$.expiresAt')<=? OR json_extract(value,'$.lastSeenAt')<=?)").bind(now,now-IDLE)];
  if(/^[a-f0-9]{64}$/.test(previous))statements.push(db().prepare('DELETE FROM settings WHERE key=?').bind(PREFIX+await sha(previous)));
  await db().batch(statements);return authCookie(req,raw);
}
export async function adminAuthRoutes(req:Request,path:string,browser:Session):Promise<Response|null>{
  if(!path.startsWith('admin/auth'))return null;secureTransport(req);
  if(path==='admin/auth/login'&&req.method==='POST'){
    await rateLimit(req,'admin-password-ip',12);
    const data=await body(req),username=string(data.username,1,40).toLowerCase(),password=validPassword(data.password),owner=await account();
    const now=Date.now(),window=Math.floor(now/600000),ip=clientIp(req);
    const attemptKey=await sha('admin-password-pair:'+ip+':'+username+':'+window),cooldownKey=await sha('admin-password-cooldown:'+ip+':'+username);
    const cooldown=await db().prepare('SELECT count,expires FROM rate_limits WHERE key=?').bind(cooldownKey).first<{count:number;expires:number}>();
    assert(!cooldown||cooldown.expires<=now,429,'Çok fazla giriş denemesi. Biraz bekleyip tekrar dene.');
    const attempts=await db().prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(attemptKey,now+1200000).first<{count:number}>();
    assert(attempts&&attempts.count<=8,429,'Çok fazla giriş denemesi. Biraz bekleyip tekrar dene.');
    const matches=await verify(password,owner.digest);
    if(!matches||username!==owner.username){
      await db().prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? OR count<3 THEN ? WHEN count<5 THEN ? WHEN count<7 THEN ? ELSE ? END').bind(cooldownKey,now,now-600000,now-600000,now,now+30000,now+60000,now+120000).run();
      await audit('anonymous','admin.login_failed','password');return json({error:'Kullanıcı adı veya şifre hatalı.'},401);
    }
    await db().batch([db().prepare('DELETE FROM rate_limits WHERE key=?').bind(attemptKey),db().prepare('DELETE FROM rate_limits WHERE key=?').bind(cooldownKey)]);
    const cookie=await createSession(req,browser,owner);await audit(owner.username,'admin.login','password');return json({ok:true,username:owner.username},200,cookie);
  }
  if(path==='admin/auth/logout'&&req.method==='POST'){
    const raw=tokenFrom(req);if(/^[a-f0-9]{64}$/.test(raw))await db().prepare('DELETE FROM settings WHERE key=?').bind(PREFIX+await sha(raw)).run();
    return json({ok:true},200,authCookie(req,'',0));
  }
  const current=await requireAdminSession(req),owner=await account();
  if(path==='admin/auth/sessions'&&req.method==='GET'){
    const rows=await db().prepare("SELECT key,value FROM settings WHERE key LIKE 'admin_session:%' AND json_extract(value,'$.version')=? AND json_extract(value,'$.expiresAt')>? AND json_extract(value,'$.lastSeenAt')>? ORDER BY json_extract(value,'$.createdAt') DESC LIMIT 30").bind(owner.version,Date.now(),Date.now()-IDLE).all<{key:string;value:string}>();
    return json({username:owner.username,passwordChangedAt:owner.updatedAt,idleMinutes:30,absoluteHours:8,sessions:rows.results.map(row=>{const s=JSON.parse(row.value) as AdminSession;return{id:row.key.slice(PREFIX.length),current:row.key===current.key,createdAt:s.createdAt,lastSeenAt:s.lastSeenAt,expiresAt:s.expiresAt,device:s.device};})});
  }
  if(path==='admin/auth/revoke'&&req.method==='POST'){
    const data=await body(req);if(data.others===true)await db().prepare("DELETE FROM settings WHERE key LIKE 'admin_session:%' AND key<>?").bind(current.key).run();
    else{const id=string(data.id,64,64);assert(/^[a-f0-9]{64}$/.test(id)&&PREFIX+id!==current.key,400,'Bu oturum için çıkış düğmesini kullan.');await db().prepare('DELETE FROM settings WHERE key=?').bind(PREFIX+id).run();}
    await audit(current.username,'admin.sessions_revoked',data.others===true?'other sessions':'selected session');return json({ok:true});
  }
  if(path==='admin/auth/password'&&req.method==='POST'){
    await rateLimit(req,'admin-password-change',5);const data=await body(req),password=validPassword(data.currentPassword),next=validPassword(data.newPassword,16);
    assert(password!==next,400,'Yeni şifre mevcut şifreden farklı olmalı.');assert(await verify(password,owner.digest),400,'Mevcut şifre hatalı.');
    const replacement={...owner,digest:await passwordDigest(next),version:crypto.randomUUID(),updatedAt:Date.now()};
    const result=await db().prepare('UPDATE settings SET value=? WHERE key=? AND value=? RETURNING key').bind(JSON.stringify(replacement),ACCOUNT,JSON.stringify(owner)).first();
    assert(result,409,'Şifre başka bir oturumda değişti. Yeniden giriş yap.');
    await db().prepare("DELETE FROM settings WHERE key LIKE 'admin_session:%' AND json_extract(value,'$.version')<>?").bind(replacement.version).run();
    await audit(owner.username,'admin.password_changed','all sessions invalidated');return json({ok:true,reauthenticate:true},200,authCookie(req,'',0));
  }
  return null;
}
