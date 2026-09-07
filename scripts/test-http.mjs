import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://localhost:3000';
let count=0;const check=(value,message)=>{assert(value,message);count++;};
const productResponse=await fetch(origin+'/api/products');check(productResponse.status===200,'products available');const {products,config}=await productResponse.json();check(products.length===20,'20 real products');check(products.reduce((n,p)=>n+p.images.length,0)===37,'37 original photographs');check(!config.orderingReady,'payments fail closed without real configuration');check(products.every(p=>Number.isInteger(p.stock)&&p.stock>=0),'catalog exposes valid current inventory');
for(const path of ['/','/koleksiyon','/hikayemiz','/gunluk','/gunluk/tutsu-ile-ilk-tanisma','/iletisim','/sss','/sepet','/odeme','/siparisler','/yonetim','/gizlilik','/cerezler','/teslimat-iade','/mesafeli-satis',...products.map(p=>'/urun/'+p.id)]){const r=await fetch(origin+path);const html=await r.text();check(r.status===200&&html.includes('<html lang="tr"'),'page renders '+path);check(!html.includes('Your site is taking shape'),'no scaffold '+path);const csp=r.headers.get('content-security-policy');check(csp?.includes("object-src 'none'"),'CSP '+path);if(path==='/'){const nonce=csp.match(/'nonce-([^']+)'/)[1];const inline=[...html.matchAll(/<script\b([^>]*)>/g)].filter(m=>!m[1].includes(' src='));check(inline.every(m=>m[1].includes(`nonce="${nonce}"`)),'SSR inline scripts use request nonce');}}
const missing=await fetch(origin+'/urun/not-a-product');check(missing.status===404,'unknown product returns404');
for(const p of products)for(const src of p.images){const r=await fetch(origin+src,{method:'HEAD'});check(r.ok&&r.headers.get('content-type')?.startsWith('image/'),'real image '+src);}
const cartRes=await fetch(origin+'/api/cart');const cookie=cartRes.headers.get('set-cookie')?.split(';')[0];const cart=await cartRes.json();check(!!cookie&&cart.csrf.length===64,'server session with CSRF');check(cartRes.headers.get('set-cookie').includes('HttpOnly'),'HttpOnly session');
const post=async(path,data,extra={})=>{const response=await fetch(origin+'/api/'+path,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json',Origin:origin,'x-csrf-token':cart.csrf,...extra},body:JSON.stringify(data)});const result=await response.text();if(response.status>=500&&path!=='checkout'&&path!=='payments/webhook')console.error(path,response.status,result.slice(0,250));return response;};
check((await post('cart',{productId:products[0].id,quantity:1})).status===200,'catalog product can be saved in cart');
const saved=await(await fetch(origin+'/api/cart',{headers:{Cookie:cookie}})).json();check(saved.items[0].product.stock===products[0].stock&&saved.total===products[0].priceCents,'saved cart uses real stock and authoritative price');
check((await post('cart',{productId:products[0].id,quantity:21})).status===400,'cart quantity remains bounded');
check((await post('cart',{productId:products[0].id,quantity:1},{Origin:'https://evil.example'})).status===403,'cross-origin mutation rejected');
check((await post('cart',{productId:products[0].id,quantity:1},{'x-csrf-token':'forged'})).status===403,'forged CSRF rejected');
check((await post('cart',{productId:products[0].id,quantity:-1})).status===400,'negative quantity rejected');
check((await post('cart',{productId:"x' OR 1=1--",quantity:1})).status===404,'SQL input treated as data');
check((await post('checkout',{expectedTotal:1})).status===503,'checkout cannot run without production readiness');
check([401,403].includes((await fetch(origin+'/api/admin',{headers:{Cookie:cookie}})).status),'anonymous admin blocked');
check([400,403,503].includes((await post('payments/webhook',{iyziEventType:'CHECKOUT_FORM_AUTH',token:'fake'})).status),'unsigned webhook rejected');
const fresh=await fetch(origin+'/api/orders');const freshOrders=await fresh.json();check(freshOrders.orders.length===0,'fresh session has no customer order access');
check((await post('cart',{productId:products[0].id,quantity:0})).status===200,'test cart cleaned up');
console.log(JSON.stringify({ok:true,checks:count,products:products.length,photos:37,scope:'HTTP and API contract tests; no live charge and no browser UI automation'},null,2));
