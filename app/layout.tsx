import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import {ShopProvider,Header,Footer} from '@/components/shop';
import {getProducts,publicConfig} from '@/lib/server';
const manrope = Manrope({variable:'--font-manrope',subsets:['latin','latin-ext'],display:'swap'});
export const metadata: Metadata = {title:{default:'SisterCraft&Co | Sana ait bir an',template:'%s | SisterCraft&Co'},description:'Doğal tütsüler, özenle hazırlanan mumlar ve ritüel kutuları. Doğadan ilhamla, senin ritminle.',metadataBase:new URL('https://sistercraft-co.cankarakas.chatgpt.site')};
export const dynamic='force-dynamic';
export default async function RootLayout({children}:{children:React.ReactNode}){const[products,config]=await Promise.all([getProducts(),publicConfig()]);return <html lang="tr"><body className={manrope.variable}><a className="skip-link" href="#main-content">İçeriğe geç</a><ShopProvider products={products.filter(p=>p.active)} config={config}><Header/>{children}<Footer/></ShopProvider></body></html>}
