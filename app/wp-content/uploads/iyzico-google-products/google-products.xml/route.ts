import {productFeedResponse} from '@/lib/product-feed-response';

export const dynamic='force-dynamic';
export async function GET(){return productFeedResponse();}
