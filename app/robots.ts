import {siteOrigin} from '@/lib/site-origin';
export default function robots(){return{rules:{userAgent:'*',allow:'/',disallow:['/api/','/yonetim','/odeme','/sepet','/siparisler']},sitemap:siteOrigin+'/sitemap.xml'}}
