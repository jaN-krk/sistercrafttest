import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
let checks=0;const ok=(value,message)=>{assert(value,message);checks++;};
const built=await build({entryPoints:['lib/product-feed.ts','lib/product-feed-response.ts'],bundle:true,write:false,platform:'node',format:'esm',outdir:'memory',plugins:[{name:'feed-fixture',setup(b){
  b.onResolve({filter:/^\.\/(server|site-origin)$/},args=>({path:args.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='./server'?'export async function getProducts(){if(globalThis.feedFails)throw Error("private-database-secret");return globalThis.feedProducts} export async function publicConfig(){return globalThis.feedConfig}':'export const siteOrigin="https://sistercraftandco.com";',loader:'js'}));
}}]});
const modules=await Promise.all(built.outputFiles.map(f=>import('data:text/javascript;base64,'+Buffer.from(f.text).toString('base64'))));
const {productFeed}=modules.find(m=>m.productFeed),{productFeedResponse}=modules.find(m=>m.productFeedResponse);
const origin='https://sistercraftandco.com';
const p={id:'test-product',name:'Mum & Tütsü <özel> 🕯',description:'Açıklama ]]> <script>yanlış</script>\u0000',subtitle:'Yedek',category:'Mumlar & kokular',images:['/products/a.jpg','/products/b.jpg','javascript:alert(1)'],priceCents:12345,stock:2,active:true,url:'https://trendyol.com/old',note:'PRIVATE INTERNAL NOTE',customer:{email:'private@example.com'}};
const config={orderingReady:true,shippingConfigured:true,shippingCents:8000,freeShippingCents:20000,business:{taxNumber:'PRIVATE TAX'}};
const parse=xml=>JSON.parse(execFileSync('python',['-c',`import sys,json,xml.etree.ElementTree as E
r=E.fromstring(sys.stdin.buffer.read());n={'g':'http://base.google.com/ns/1.0'}
print(json.dumps([{'id':i.findtext('g:id',namespaces=n),'title':i.findtext('g:title',namespaces=n),'description':i.findtext('g:description',namespaces=n),'price':i.findtext('g:price',namespaces=n),'availability':i.findtext('g:availability',namespaces=n),'shipping':i.findtext('g:shipping/g:price',namespaces=n),'link':i.findtext('g:link',namespaces=n),'images':[e.text for e in i.findall('g:additional_image_link',n)]} for i in r.findall('./channel/item')]))`],{input:xml,encoding:'utf8'}));
const xml=productFeed([p,{...p,id:'hidden',active:false}],config,origin),items=parse(xml);
ok(items.length===1&&items[0].id===p.id,'hidden products are excluded');
ok(items[0].title===p.name,'XML roundtrip preserves Turkish, ampersand, angle brackets and emoji');
ok(items[0].description===p.description.replace('\u0000',''),'unsafe control characters are removed and markup remains text');
ok(items[0].price==='123.45 TRY','prices use exact current kurus and ISO currency');
ok(items[0].shipping==='80.00 TRY','shipping is separate from product price');
ok(items[0].availability==='in_stock','available products can be listed');
ok(items[0].link===origin+'/urun/test-product','links target the storefront, never source marketplaces');
ok(items[0].images[0]===origin+'/products/b.jpg'&&!xml.includes('javascript:'),'images are absolute safe HTTPS URLs');
ok(!xml.includes('PRIVATE')&&!xml.includes('private@example.com')&&!xml.includes('trendyol'),'private fields and source URLs never enter XML');
ok(parse(productFeed([{...p,stock:0}],config,origin))[0].availability==='out_of_stock','zero stock is explicitly unavailable');
ok(parse(productFeed([p],{...config,orderingReady:false},origin))[0].availability==='out_of_stock','paused stores cannot advertise available checkout');
ok(parse(productFeed([{...p,priceCents:25000}],config,origin))[0].shipping==='0.00 TRY','single-product free shipping threshold applies');
ok(parse(productFeed([{...p,priceCents:32100}],config,origin))[0].price==='321.00 TRY','price edits appear on next generation');
for(const broken of [{...p,priceCents:NaN},{...p,priceCents:-1},{...p,stock:-1},{...p,images:[]}]){assert.throws(()=>productFeed([broken],config,origin));checks++;}
globalThis.feedProducts=[p];globalThis.feedConfig=config;
let response=await productFeedResponse();ok(response.status===200&&response.headers.get('content-type')==='application/xml; charset=utf-8','public feed returns XML');
ok(!response.headers.has('set-cookie')&&response.headers.get('cache-control').includes('s-maxage=60'),'feed does not create a session and caches at most 60 seconds');
globalThis.feedFails=true;response=await productFeedResponse();
ok(response.status===503&&response.headers.get('cache-control')==='no-store','database failure never returns an empty successful catalog');
ok(!(await response.text()).includes('private-database-secret'),'feed errors do not disclose internal details');
console.log(JSON.stringify({ok:true,checks,scope:'RSS XML parsed by ElementTree; escaping, catalog visibility, live price/stock, shipping, privacy, cache and failure response; no production mutations'}));
