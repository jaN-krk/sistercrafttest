import {siteOrigin} from '@/lib/site-origin';
import {getProducts} from '@/lib/server';
export default async function sitemap(){const origin=siteOrigin;return [...['','/koleksiyon','/hikayemiz','/gunluk','/iletisim','/sss'].map(p=>({url:origin+p})),...(await getProducts()).filter(p=>p.active).map(p=>({url:origin+'/urun/'+p.id})),...['kendine-bes-dakika','tutsu-ile-ilk-tanisma','mumunun-isigini-koru'].map(slug=>({url:origin+'/gunluk/'+slug}))]}
