export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function assert(value:unknown,status:number,message:string):asserts value{if(!value)throw new HttpError(status,message)}
export function string(value:unknown,min=1,max=200){assert(typeof value==='string',400,'Lütfen alanları kontrol et.');const s=value.trim();assert(s.length>=min&&s.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s),400,'Bir alan eksik veya fazla uzun.');return s;}
export function email(value:unknown){const e=string(value,5,254).toLowerCase();assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),400,'Geçerli bir e-posta adresi yaz.');return e;}
export function int(value:unknown,min:number,max:number){assert(typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=max,400,'Geçersiz sayı.');return value;}
export async function sha(value:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))}
export function hex(buffer:ArrayBuffer){return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('')}
export async function hmac(secret:string,value:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))}
export function timingEqual(a:string,b:string){if(a.length!==b.length)return false;let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0;}
export const randomToken=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
export function toCents(value:unknown){const v=String(value);assert(/^\d+(\.\d{1,2})?$/.test(v),502,'Ödeme tutarı doğrulanamadı.');const [whole,decimal='']=v.split('.');const result=Number(whole)*100+Number(decimal.padEnd(2,'0'));assert(Number.isSafeInteger(result),502,'Geçersiz ödeme tutarı.');return result;}
export function normalizedMoney(value:unknown){return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/,'$1')}
export function safeReturn(value:unknown){return typeof value==='string'&&/^\/[a-z0-9/?=&%-]*$/i.test(value)&&!value.startsWith('//')?value:'/';}
