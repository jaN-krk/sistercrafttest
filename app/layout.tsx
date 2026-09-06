import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import './enhancements.css';
import './refinements.css';
import {ShopProvider,Footer} from '@/components/shop';
import {getProducts,publicConfig} from '@/lib/server';
import {cookies} from 'next/headers';
import {PageMotion,StoreHeader as Header} from '@/components/storefront-enhancements';
import {LanguageProvider} from '@/components/localization';
const manrope = Manrope({variable:'--font-manrope',subsets:['latin','latin-ext'],display:'swap'});
export const metadata: Metadata = {title:{default:'SisterCraft&Co | Sana ait bir an',template:'%s | SisterCraft&Co'},description:'Doğal tütsüler, özenle hazırlanan mumlar ve ritüel kutuları. Doğadan ilhamla, senin ritminle.',metadataBase:new URL('https://sistercraft-co.cankarakas.chatgpt.site')};
export const dynamic='force-dynamic';
export default async function RootLayout({children}:{children:React.ReactNode}){const[products,config,jar]=await Promise.all([getProducts(),publicConfig(),cookies()]);const locale=jar.get('sc_language')?.value==='en'?'en':'tr';return <html lang={locale}><body className={manrope.variable}><a className="skip-link" href="#main-content">{locale==='en'?'Skip to content':'İçeriğe geç'}</a><LanguageProvider initialLocale={locale} config={config}><ShopProvider products={products.filter(p=>p.active)} config={config}><Header/>{children}<Footer/><PageMotion/></ShopProvider></LanguageProvider></body></html>}
