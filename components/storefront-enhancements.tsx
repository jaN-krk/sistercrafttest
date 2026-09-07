'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {ArrowLeft,ArrowRight,ArrowUpRight,ShoppingBag,Menu,Search,X,UserRound,Plus,Pause,Play,Leaf,ChevronDown} from 'lucide-react';
import {Carousel,CarouselContent,CarouselItem,type CarouselApi} from '@/components/ui/carousel';
import {NavigationMenu,NavigationMenuList,NavigationMenuItem,NavigationMenuTrigger,NavigationMenuContent,NavigationMenuLink} from '@/components/ui/navigation-menu';
import {Sheet,SheetContent,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {useShop} from './shop-context';
import {ProductCard} from './shop';
import {Localized,useLanguage,CurrencyNote} from './localization';
import {categories} from '@/lib/catalog';
import {showcaseScenes} from '@/lib/showcase-scenes';

export function LanguageSwitch(){const{locale,setLocale}=useLanguage();return <div className="language-switch" role="group" aria-label="Language / Dil"><button aria-pressed={locale==='tr'} onClick={()=>setLocale('tr')}>TR <span>₺</span></button><button aria-pressed={locale==='en'} onClick={()=>setLocale('en')}>EN <span>$</span></button></div>}
export function StoreHeader(){
  const {cart,setCartOpen,products,config}=useShop(),{locale,t,format}=useLanguage();
  const [menu,setMenu]=useState(false),[search,setSearch]=useState(false),[query,setQuery]=useState(''),[scrolled,setScrolled]=useState(false);
  const path=usePathname(),router=useRouter(),params=useSearchParams();
  const [categoryMenu,setCategoryMenu]=useState<string|null>(null);
  const category=params.get('kategori');
  const active=(id:string)=>['/magaza','/koleksiyon'].includes(path)&&(category||'tumu')===id;
  useEffect(()=>{setCategoryMenu(null);setMenu(false);setSearch(false)},[path,category]);
  useEffect(()=>{const media=matchMedia('(min-width: 961px)');const changed=()=>{setMenu(false);setCategoryMenu(null)};media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed)},[]);
  useEffect(()=>{setMenu(false);setSearch(false)},[path]);
  useEffect(()=>{const handler=()=>setScrolled(window.scrollY>15);handler();window.addEventListener('scroll',handler,{passive:true});return()=>window.removeEventListener('scroll',handler)},[]);
  if(path.startsWith('/yonetim'))return null;
  const found=products.filter(p=>(p.name+' '+p.subtitle).toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale))).slice(0,5);
  return <Localized>
    <div className="announcement">{locale==='tr'?config.merchandising.announcementTr:config.merchandising.announcementEn}</div>
    <header className={'site-header upgraded-header commerce-header '+(scrolled?'is-scrolled':'')}>
      <div className="header-main">
        <button className="icon-button mobile-menu" aria-label={t('Menüyü aç','Open menu')} aria-expanded={menu} aria-controls={menu?'store-mobile-menu':undefined} onClick={()=>setMenu(true)}><Menu size={21}/></button>
        <Link href="/" className="wordmark">sistercraft<span>&co.</span></Link>
        <button className="header-search" onClick={()=>setSearch(true)}><Search size={19}/><span>{t('Ürün, koku veya ritüel ara…','Search products, scents or rituals…')}</span><span className="search-hint">{t('Keşfet','Discover')}</span></button>
        <div className="header-tools"><LanguageSwitch/><button className="icon-button mobile-search" onClick={()=>setSearch(true)} aria-label={t('Ürün ara','Search products')}><Search size={20}/></button><Link className="header-account" href="/siparisler"><UserRound size={21}/><span>{t('Siparişlerim','My orders')}</span></Link><button className="header-bag" onClick={()=>setCartOpen(true)} aria-label={t('Sepetim','My bag')+` (${cart?.count??0})`}><ShoppingBag size={21}/><span>{t('Sepetim','My bag')}<small>{cart?.count?format(cart.total):t('Ritüelini seç','Find your ritual')}</small></span><b>{cart?.count??0}</b></button></div>
      </div>
      <nav className="commerce-nav" aria-label={t('Mağaza menüsü','Store navigation')}>
        <Link className="shop-nav-link" href="/magaza" aria-current={active('tumu')?'page':undefined}>{t('Mağaza','Shop')}<ArrowUpRight size={15}/></Link>
        <div className="desktop-navigation"><NavigationMenu value={categoryMenu} onValueChange={setCategoryMenu}><NavigationMenuList><NavigationMenuItem value="categories"><NavigationMenuTrigger>{t('Kategoriler','Categories')}</NavigationMenuTrigger><NavigationMenuContent><div className="mega-menu"><div className="mega-links"><span className="eyebrow">{t('RİTÜELİNİ KEŞFET','FIND YOUR RITUAL')}</span>{categories.map(c=><NavigationMenuLink key={c.id} active={active(c.id)} onClick={()=>setCategoryMenu(null)} render={<Link href={'/magaza'+(c.id==='tumu'?'':'?kategori='+c.id)}/>}>{t(c.name)}<ArrowUpRight size={17}/></NavigationMenuLink>)}</div><Link href="/urun/992963569" className="mega-feature" onClick={()=>setCategoryMenu(null)}><img src="/editorial/category-ritual-v4.webp" alt={t('Ritüel Kutusu','Ritual Box')}/><span>{t('Bir kutu dolusu ritüel','A box of little rituals')}<ArrowUpRight size={17}/></span></Link></div></NavigationMenuContent></NavigationMenuItem></NavigationMenuList></NavigationMenu></div>
        <Link href="/magaza?kategori=tutsuler" aria-current={active('tutsuler')?'page':undefined}>{t('Tütsüler','Incense')}</Link><Link href="/magaza?kategori=mumlar" aria-current={active('mumlar')?'page':undefined}>{t('Mumlar','Candles')}</Link><Link href="/magaza?kategori=kutular" aria-current={active('kutular')?'page':undefined}>{t('Hediye kutuları','Gift boxes')}</Link><Link href="/hikayemiz" className="nav-story">{t('Hikâyemiz','Our story')}</Link><Link href="/sss" className="nav-help">{t('Yardım ve destek','Help & support')}<ArrowUpRight size={14}/></Link>
      </nav>
    </header>
    <Sheet open={menu} onOpenChange={setMenu}><SheetContent id="store-mobile-menu" side="left" className="menu-sheet store-menu" showCloseButton={false}>
      <div className="store-menu-heading"><SheetTitle className="wordmark">sistercraft&co.</SheetTitle><SheetClose className="icon-button" aria-label={t('Menüyü kapat','Close menu')}><X size={21}/></SheetClose></div>
      <SheetDescription>{t('Gününe eşlik edecek küçük ritüeller.','Little rituals for your everyday.')}</SheetDescription>
      <button className="store-menu-search" onClick={()=>{setMenu(false);setSearch(true)}}><Search size={18}/>{t('Koleksiyonda ara','Search the collection')}<ArrowRight size={16}/></button>
      <nav aria-label={t('Mobil mağaza menüsü','Mobile store navigation')} onClick={e=>{if((e.target as HTMLElement).closest('a'))setMenu(false)}}>
        <span className="eyebrow">{t('KOLEKSİYONU KEŞFET','EXPLORE THE COLLECTION')}</span>
        {categories.map(c=><Link key={c.id} href={'/magaza'+(c.id==='tumu'?'':'?kategori='+c.id)} aria-current={active(c.id)?'page':undefined}>{c.id==='tumu'?t('Tüm koleksiyon','All products'):t(c.name)}<ArrowUpRight size={18}/></Link>)}
        <span className="eyebrow store-menu-divider">{t('SISTERCRAFT DÜNYASI','THE SISTERCRAFT WORLD')}</span>
        {[['hikayemiz','Hikâyemiz','Our story'],['gunluk','Ritüel günlüğü','Journal'],['siparisler','Siparişlerim','My orders'],['sss','Yardım ve destek','Help & support'],['iletisim','İletişim','Contact']].map(([url,tr,en])=><Link key={url} href={'/'+url} aria-current={path==='/'+url?'page':undefined}>{t(tr,en)}<ArrowUpRight size={16}/></Link>)}
      </nav><div className="store-menu-footer"><span>{t('Dil / Para birimi','Language / Currency')}</span><LanguageSwitch/></div>
    </SheetContent></Sheet>
    <Dialog open={search} onOpenChange={setSearch}><DialogContent className="search-dialog enhanced-search"><DialogTitle>{t('Küçük bir keşfe çık.','Find your next little ritual.')}</DialogTitle><DialogDescription>{t('Koku, ürün veya koleksiyon ara.','Search by scent, product or collection.')}</DialogDescription><form className="search-form" onSubmit={e=>{e.preventDefault();setSearch(false);router.push('/magaza?ara='+encodeURIComponent(query))}}><Input autoFocus value={query} maxLength={100} onChange={e=>setQuery(e.target.value)} aria-label={t('Ürün ara','Search products')} placeholder={t('Vanilya, adaçayı, mum…','Vanilla, sage, candles…')}/><button className="button" aria-label={t('Ara','Search')}><ArrowRight size={19}/></button></form><div className="instant-results">{found.map(p=><Link key={p.id} href={'/urun/'+p.id} onClick={()=>setSearch(false)}><img src={p.images[0]} alt=""/><span>{p.name}<small>{format(p.priceCents)}</small></span><ArrowUpRight size={17}/></Link>)}{!found.length&&<p>{t('Eşleşen ürün bulunamadı.','No matching products.')}</p>}</div></DialogContent></Dialog>
  </Localized>;
}

export function HeroShowcase() {
  const {products,config,setQuantity,cart,busy}=useShop();
  const {t,format}=useLanguage();
  const [api,setApi]=useState<CarouselApi>();
  const [index,setIndex]=useState(0),[playing,setPlaying]=useState(true),[hover,setHover]=useState(false);
  const selected=config.merchandising.heroIds.map(id=>products.find(p=>p.id===id)).filter(Boolean) as typeof products;
  const slides=selected.length?selected:products.slice(0,3);
  useEffect(()=>{if(!api)return;const sync=()=>setIndex(api.selectedScrollSnap());api.on('select',sync);return()=>{api.off('select',sync)}},[api]);
  useEffect(()=>{if(!api||!playing||hover||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=setInterval(()=>{if(!document.hidden)api.scrollNext()},6500);return()=>clearInterval(timer)},[api,playing,hover]);
  if(!slides.length)return null;
  return <section className="showcase-hero integrated-showcase" aria-label={t('Koleksiyon vitrini','Collection showcase')}
    onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)}
    onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setHover(false)}}>
    <div className="showcase-intro">
      <div className="eyebrow"><span className="small-line"/>{t('DOĞANIN RİTMİNE DÖN','RETURN TO YOUR NATURE')}</div>
      <h1>{t('Bir nefes.','Breathe in.')}<br/>{t('Bir niyet.','Slow down.')}<br/><span>{t('Sana ait bir an.','Make it yours.')}</span></h1>
      <p>{t('Doğal tütsüler, özenle hazırlanan mumlar ve kendine ayırdığın küçük ritüeller.','Natural incense, thoughtfully selected candles and little rituals that make room for you.')}</p>
      <div className="hero-links"><Link className="button" href="/koleksiyon">{t('Koleksiyonu keşfet','Explore the collection')}<ArrowUpRight size={18}/></Link><Link className="quiet-link" href="/hikayemiz">{t('Hikâyemiz','Our story')}<ArrowRight size={16}/></Link></div>
      <div className="hero-index"><span>{String(index+1).padStart(2,'0')}</span><div>{slides.map((p,i)=><button key={p.id} aria-label={p.name} aria-pressed={i===index} onClick={()=>api?.scrollTo(i)}><span/></button>)}</div><small>{String(slides.length).padStart(2,'0')}</small></div>
    </div>
    <div className="showcase-gallery">
      <Carousel opts={{loop:slides.length>1}} setApi={setApi}>
        <CarouselContent className="showcase-track">
          {slides.map((p,i)=>{
            const scene=showcaseScenes[p.id];
            return <CarouselItem key={p.id} className="showcase-slide" data-active={i===index} data-showcase-product={p.id}>
              <div className={'showcase-art is-'+(scene?.tone||'linen')}>
                <Link href={'/urun/'+p.id} className="showcase-scene-link" aria-label={p.name}>
                  <img className="showcase-scene-image" src={scene?.image||p.images[0]} alt={p.name+' — '+t('ürün vitrini','product showcase')}
                    style={{objectPosition:scene?.position||'50% 50%'}} fetchPriority={i===0?'high':'auto'} loading={i===0?'eager':'lazy'}/>
                </Link>
                <div className="showcase-caption">SISTERCRAFT&CO<br/>{t('GÜNLÜK RİTÜELLER','EVERYDAY RITUALS')}</div>
              </div>
              <div className="showcase-product-bar">
                <Link href={'/urun/'+p.id}><small>{t(categories.find(c=>c.id===p.group)?.name||p.category)}</small><h2>{p.name}</h2><strong>{format(p.priceCents)}</strong></Link>
                <button disabled={busy} className="round-add" aria-label={t('Sepete ekle','Add to bag')+' — '+p.name}
                  onClick={()=>void setQuantity(p,Math.min(20,(cart?.items.find(l=>l.product.id===p.id)?.quantity??0)+1)).catch(()=>{})}><Plus size={23}/></button>
              </div>
            </CarouselItem>;
          })}
        </CarouselContent>
      </Carousel>
      <div className="showcase-controls"><button onClick={()=>api?.scrollPrev()} aria-label={t('Önceki ürün','Previous product')}><ArrowLeft size={19}/></button><button onClick={()=>setPlaying(v=>!v)} aria-label={t(playing?'Otomatik geçişi durdur':'Otomatik geçişi başlat',playing?'Pause slideshow':'Play slideshow')}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><button onClick={()=>api?.scrollNext()} aria-label={t('Sonraki ürün','Next product')}><ArrowRight size={19}/></button></div>
    </div>
  </section>;
}

export function ProductRail(){const{products,config}=useShop(),{t}=useLanguage();const[api,setApi]=useState<CarouselApi>();const chosen=config.merchandising.featuredIds.map(id=>products.find(p=>p.id===id)).filter(Boolean) as typeof products;return <section className="section curated-rail"><div className="section-title"><div><div className="eyebrow">{t('SANA İYİ GELENİ KEŞFET','FIND YOUR EVERYDAY FAVOURITES')}</div><h2>{t('Küçük şeyler. Güzel hisler.','Small things. Lovely feelings.')}</h2></div><div className="rail-actions"><Link className="text-link" href="/koleksiyon">{t('Tüm koleksiyon','All products')}<ArrowUpRight size={17}/></Link><button className="icon-button" aria-label={t('Önceki','Previous')} onClick={()=>api?.scrollPrev()}><ArrowLeft size={19}/></button><button className="icon-button" aria-label={t('Sonraki','Next')} onClick={()=>api?.scrollNext()}><ArrowRight size={19}/></button></div></div><Carousel setApi={setApi} opts={{align:'start'}}><CarouselContent>{(chosen.length?chosen:products.slice(0,8)).map(p=><CarouselItem className="product-rail-item" key={p.id}><ProductCard product={p}/></CarouselItem>)}</CarouselContent></Carousel><CurrencyNote/></section>}

export function PageMotion(){const path=usePathname();useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const targets=document.querySelectorAll('main .section-title,main .category-card,main .statement,main .ritual-feature,main .values-grid>div');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:.2,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.2,.7,.2,1)'});observer.unobserve(e.target)}}),{threshold:.12});targets.forEach(t=>observer.observe(t));return()=>observer.disconnect()},[path]);return null}
