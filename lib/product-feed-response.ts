import {getProducts,publicConfig} from './server';
import {siteOrigin} from './site-origin';
import {productFeed} from './product-feed';

export async function productFeedResponse(){
  try{
    const [products,config]=await Promise.all([getProducts(),publicConfig()]);
    return new Response(productFeed(products,config,siteOrigin),{headers:{
      'Content-Type':'application/xml; charset=utf-8',
      'Cache-Control':'public, max-age=0, s-maxage=60, must-revalidate',
      'X-Content-Type-Options':'nosniff',
      'X-Robots-Tag':'noindex',
    }});
  }catch{
    // A failed read must not look like an empty catalog and remove listings.
    return new Response('Product feed temporarily unavailable',{status:503,headers:{
      'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Retry-After':'60',
      'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex',
    }});
  }
}
