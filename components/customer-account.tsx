'use client';
import {useEffect,useState,useRef,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ArrowRight,UserRound,Package,LockKeyhole,LogOut,Eye,EyeOff,LoaderCircle,Leaf} from 'lucide-react';
import {useShop} from './shop-context';
import {useLanguage} from './localization';

type Customer={id:string;name:string;email:string;createdAt:number};
export function CustomerNav({mobile=false}:{mobile?:boolean}){
  const {request}=useShop(),{t}=useLanguage();const[customer,setCustomer]=useState<Customer|null>(null);
  useEffect(()=>{let active=true;const load=()=>request('account').then(r=>{if(active)setCustomer(r.customer)}).catch(()=>{if(active)setCustomer(null)});void load();window.addEventListener('sc:customer-changed',load);window.addEventListener('focus',load);return()=>{active=false;window.removeEventListener('sc:customer-changed',load);window.removeEventListener('focus',load)}},[request]);
  return <div className={mobile?'customer-menu-links':'customer-header-links'}>{customer?<Link className="customer-account-link" href="/hesabim"><UserRound size={19}/>{t('Hesabım','My account')}</Link>:<><Link className="customer-account-link" href="/giris"><UserRound size={19}/>{t('Giriş yap','Sign in')}</Link><Link className="customer-register-link" href="/kayit">{t('Kayıt ol','Sign up')}</Link></>}</div>;
}
function PasswordInput({name,label,newPassword=false}:{name:string;label:string;newPassword?:boolean}){
  const[show,setShow]=useState(false);const{t}=useLanguage();return <label>{label}<span className="customer-password"><input name={name} type={show?'text':'password'} autoComplete={newPassword?'new-password':'current-password'} minLength={newPassword?15:1} maxLength={128} required/><button type="button" aria-label={show?t('Şifreyi gizle','Hide password'):t('Şifreyi göster','Show password')} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>;
}
export function CustomerAccountPage({mode}:{mode:'giris'|'kayit'|'hesabim'|'sifremi-unuttum'|'sifre-yenile'}){
  const{request}=useShop(),{t}=useLanguage();const[customer,setCustomer]=useState<Customer|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[emailReady,setEmailReady]=useState(true),[token]=useState(()=>mode==='sifre-yenile'&&typeof window!=='undefined'?new URLSearchParams(window.location.hash.slice(1)).get('token')||'':'');const tokenRead=useRef(false);
  useEffect(()=>{let active=true;request('account').then(r=>{if(active){setCustomer(r.customer);setEmailReady(r.emailReady)}}).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false}},[request]);
  useEffect(()=>{if(mode==='sifre-yenile'&&!tokenRead.current){tokenRead.current=true;window.history.replaceState(null,'',window.location.pathname)}},[mode]);
  const changed=()=>window.dispatchEvent(new Event('sc:customer-changed'));
  async function submit(event:FormEvent<HTMLFormElement>,action:string){
    event.preventDefault();setBusy(true);setError('');setNotice('');const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));
    try{
      if(data.confirmPassword!==undefined&&data.password!==data.confirmPassword)throw Error(t('Şifreler eşleşmiyor.','Passwords do not match.'));
      const result=await request('account/'+action,{...data,privacy:data.privacy==='on',...(action==='reset'?{token}:{})});
      if(action==='register'||action==='login'){setCustomer(result.customer);changed();window.location.assign('/hesabim');}
      else if(action==='password'||action==='reset'){setCustomer(null);changed();form.reset();setNotice(t('Şifren güncellendi. Tüm hesap oturumları kapatıldı; yeni şifrenle giriş yapabilirsin.','Your password was updated and all account sessions were signed out. Sign in with your new password.'));}
      else{setNotice(t('Bu adresle bir hesabın varsa şifre yenileme isteğin kaydedildi. Gelen kutunu ve spam klasörünü kontrol et.','If an account exists for this address, your reset request has been queued. Check your inbox and spam folder.'));}
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  const signup=mode==='kayit',forgot=mode==='sifremi-unuttum',reset=mode==='sifre-yenile',dashboard=!!customer&&mode==='hesabim';
  const title=dashboard?t('Merhaba, '+customer.name+'.','Hello, '+customer.name+'.'):signup?t('Kendi ritüeline yer aç.','Make room for your ritual.'):forgot?t('Şifreni mi unuttun?','Forgot your password?'):reset?t('Yeni bir başlangıç.','A fresh start.'):t('Yeniden hoş geldin.','Welcome back.');
  return <main id="main-content" className="customer-page"><section className="customer-story"><Link href="/" className="wordmark">sistercraft<span>&co.</span></Link><div><span className="eyebrow">{t('SANA AİT BİR ALAN','A SPACE OF YOUR OWN')}</span><h2>{t('Küçük ritüeller.\nSana özel bir yolculuk.','Little rituals.\nYour own journey.')}</h2><p>{t('Sevdiğin kokulara, özenle seçtiğin hediyelere ve siparişlerinin yolculuğuna tek bir yerden ulaş.','Your favourite scents, thoughtful gifts and order journeys, together in one place.')}</p><span className="customer-story-note"><Leaf size={18}/>{t('Doğadan ilhamla, senin ritminle.','Inspired by nature, at your pace.')}</span></div><Link href="/koleksiyon">{t('Koleksiyonu keşfet','Explore the collection')}<ArrowUpRight size={18}/></Link></section><section className="customer-panel"><div className="customer-form-inner"><UserRound className="customer-symbol" size={28}/><span className="eyebrow">{t('SISTERCRAFT HESABIN','YOUR SISTERCRAFT ACCOUNT')}</span><h1>{title}</h1>
    {loading?<output><LoaderCircle className="loading-spinner"/> {t('Hesabın kontrol ediliyor…','Checking your account…')}</output>:<>
    {error&&<div className="customer-error" role="alert">{error}</div>}{notice&&<output className="customer-success">{notice}<Link href="/giris">{t('Giriş yap','Sign in')} <ArrowRight size={16}/></Link></output>}
    {dashboard?<><p>{customer.email}</p><div className="customer-dashboard-links"><Link href="/siparisler"><Package/><span>{t('Siparişlerim','My orders')}<small>{t('Hesabınla verdiğin siparişleri takip et.','Track orders placed with your account.')}</small></span><ArrowUpRight/></Link><Link href="/iletisim"><Leaf/><span>{t('Bir mesaj uzağındayız','We are a message away')}<small>{t('Ürünler ve siparişlerin için destek.','Help with products and your orders.')}</small></span><ArrowUpRight/></Link></div><details className="customer-security"><summary><LockKeyhole size={17}/>{t('Şifremi değiştir','Change my password')}</summary><form onSubmit={e=>submit(e,'password')}><PasswordInput name="currentPassword" label={t('Mevcut şifre','Current password')}/><PasswordInput name="password" label={t('Yeni şifre (en az 15 karakter)','New password (at least 15 characters)')} newPassword/><PasswordInput name="confirmPassword" label={t('Yeni şifre tekrar','Confirm new password')} newPassword/><button className="button" disabled={busy}>{t('Şifreyi güncelle','Update password')}</button></form></details><button className="customer-signout" disabled={busy} onClick={async()=>{setBusy(true);try{await request('account/logout',{});setCustomer(null);changed();window.location.assign('/giris')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}><LogOut size={17}/>{t('Çıkış yap','Sign out')}</button></>:customer&&!reset&&!forgot?<><p>{t('Hesabına giriş yaptın.','You are signed in.')}</p><Link className="button" href="/hesabim">{t('Hesabıma git','Go to my account')}<ArrowRight size={18}/></Link></>:<>
    <p>{signup?t('Hesabını oluştur, siparişlerini kolayca takip et.','Create an account to keep track of your orders.'):forgot?t('Hesabında kullandığın e-posta adresini yaz.','Enter the email address you use for your account.'):reset?t('En az 15 karakterlik, başka bir yerde kullanmadığın bir şifre seç.','Choose a password of at least 15 characters that you do not use elsewhere.'):t('E-posta adresin ve şifrenle devam et.','Continue with your email and password.')}</p>
    {forgot&&!emailReady&&<p className="customer-mail-note">{t('Şifre yenileme e-postaları şu anda yalnızca doğrulanmış test adreslerine gönderilebiliyor. Diğer adresler için lütfen bizimle iletişime geç.','Password reset emails currently work only for verified test addresses. Please contact us for other addresses.')} <Link href="/iletisim">{t('İletişim','Contact')}</Link></p>}
    {reset&&!token&&!notice?<p className="customer-error">{t('Geçerli bir yenileme bağlantısı bulunamadı.','No valid reset link was found.')} <Link href="/sifremi-unuttum">{t('Yeni bağlantı iste','Request a new link')}</Link></p>:!notice&&<form className="customer-form" onSubmit={e=>submit(e,signup?'register':forgot?'forgot':reset?'reset':'login')}>
      {signup&&<label>{t('Ad soyad','Full name')}<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label>}
      {!reset&&<label>{t('E-posta adresi','Email address')}<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>}
      {!forgot&&<PasswordInput name="password" label={signup||reset?t('Şifre (en az 15 karakter)','Password (at least 15 characters)'):t('Şifre','Password')} newPassword={signup||reset}/>}
      {(signup||reset)&&<PasswordInput name="confirmPassword" label={t('Şifre tekrar','Confirm password')} newPassword/>}
      {signup&&<><label className="customer-consent"><input name="privacy" type="checkbox" required/><span><Link href="/gizlilik" target="_blank" rel="noreferrer">{t('Gizlilik ve KVKK aydınlatma metnini','Privacy notice')}</Link> {t('okudum.','has been read.')}</span></label><p className="customer-fine-print">{t('Üyelik ücretsizdir. Bu kayıt reklam veya pazarlama e-postalarına izin vermez.','Registration is free and does not subscribe you to marketing emails.')}</p></>}
      {!signup&&!forgot&&!reset&&<Link className="customer-forgot" href="/sifremi-unuttum">{t('Şifremi unuttum','Forgot password?')}</Link>}
      <button className="button full-width" disabled={busy}>{busy?<LoaderCircle size={18} className="loading-spinner"/>:signup?t('Hesabımı oluştur','Create my account'):forgot?t('Yenileme bağlantısı iste','Request reset link'):reset?t('Yeni şifremi kaydet','Save new password'):t('Giriş yap','Sign in')}<ArrowRight size={18}/></button>
    </form>}
    {!reset&&!forgot&&<p className="customer-switch">{signup?t('Zaten bir hesabın var mı?','Already have an account?'):t('Henüz hesabın yok mu?','New here?')} <Link href={signup?'/giris':'/kayit'}>{signup?t('Giriş yap','Sign in'):t('Kayıt ol','Sign up')}</Link></p>}
    {(forgot||reset)&&<Link className="customer-forgot" href="/giris">{t('Giriş sayfasına dön','Back to sign in')}</Link>}
    <Link className="customer-guest" href="/siparisler">{t('Üyeliksiz siparişimi sorgula','Track a guest order')}<ArrowUpRight size={15}/></Link>
    </>}
    </>}
    </div></section></main>;
}
