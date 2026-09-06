'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="empty-state" id="main-content"><h1>Kısa bir mola.</h1><p>Sayfa yüklenemedi. Bir kez daha deneyebilirsin.</p><button className="button" onClick={reset}>Yeniden dene</button></main>}
