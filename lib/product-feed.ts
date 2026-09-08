import type {Product, PublicConfig} from './catalog';

// Export only storefront attributes. Never serialize database rows or settings.
function xml(value:string){
  return value.replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu,'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function imageUrl(value:string,origin:string){
  try{const url=new URL(value,origin);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
const element=(name:string,value:string)=>`      <g:${name}>${xml(value)}</g:${name}>`;

export function productFeed(products:Product[],config:Pick<PublicConfig,'orderingReady'|'shippingConfigured'|'shippingCents'|'freeShippingCents'>,origin:string){
  const base=new URL(origin);
  if(base.protocol!=='https:'||base.username||base.password)throw new Error('Invalid storefront origin');
  const items=products.filter(p=>p.active).map(p=>{
    if(!p.id||!p.name.trim()||!Number.isSafeInteger(p.priceCents)||p.priceCents<=0||!Number.isSafeInteger(p.stock)||p.stock<0)throw new Error('Invalid product feed data');
    const images=[...new Set(p.images.map(src=>imageUrl(src,base.origin)).filter((src):src is string=>!!src))];
    if(!images.length)throw new Error('Product feed image is missing');
    const description=(p.description||p.subtitle||p.name).trim();
    const lines=[element('id',p.id),element('title',p.name),element('description',description),
      element('link',new URL('/urun/'+encodeURIComponent(p.id),base.origin).href),
      element('image_link',images[0]),...images.slice(1,11).map(src=>element('additional_image_link',src)),
      element('availability',config.orderingReady&&p.stock>0?'in_stock':'out_of_stock'),
      element('price',(p.priceCents/100).toFixed(2)+' TRY'),element('condition','new'),
      element('brand','SisterCraft&Co'),...(p.category?[element('product_type',p.category)]:[])];
    if(config.shippingConfigured){
      const shipping=config.freeShippingCents>0&&p.priceCents>=config.freeShippingCents?0:config.shippingCents;
      if(!Number.isSafeInteger(shipping)||shipping<0)throw new Error('Invalid shipping price');
      lines.push('      <g:shipping>',element('country','TR'),element('service','Standart kargo'),element('price',(shipping/100).toFixed(2)+' TRY'),'      </g:shipping>');
    }
    return '    <item>\n'+lines.join('\n')+'\n    </item>';
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>SisterCraft&amp;Co ürün kataloğu</title>\n    <link>'+xml(base.origin)+'</link>\n    <description>SisterCraft&amp;Co güncel ürün, fiyat ve stok durumu</description>\n'+items.join('\n')+'\n  </channel>\n</rss>\n';
}
