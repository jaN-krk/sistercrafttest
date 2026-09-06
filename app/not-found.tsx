import Link from 'next/link';
import {Leaf,ArrowUpRight} from 'lucide-react';
export default function NotFound(){return <main id="main-content" className="empty-state not-found"><Leaf size={40}/><span className="eyebrow">404 · KÜÇÜK BİR SAPAK</span><h1>Bu sayfa yolunu kaybetmiş.</h1><p>Koleksiyona dönüp kendine güzel bir an bulabilirsin.</p><Link href="/koleksiyon" className="button">Koleksiyona dön <ArrowUpRight size={18}/></Link></main>}
