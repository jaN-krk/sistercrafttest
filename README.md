# SisterCraft&Co mağazası

20 gerçek Trendyol ürününden oluşan Türkçe/İngilizce mağaza. 37 orijinal fotoğraf, ürün referanslarından oluşturulmuş üç vitrin çekimi ve üç ayrı AI kategori fotoğrafı, arama/filtreleme, sunucuda kalıcı sepet ve şifreli yönetim paneli içerir. Beyaz ve koyu yeşil tasarım; iki sıralı blurlu sabit alışveriş menüsü, mobil menü, kontrollü animasyonlar ve erişilebilir etkileşimlerle tamamlanmıştır.

Ana vitrin kenardan kenara uzanır; masaüstünde üst duyuru ve menüden kalan ekran yüksekliğini doldurur (en az 640 px). Büyük başlık, tam boy ürün fotoğrafı ve fotoğraf üzerinde ürün kartı kullanır. Mobilde başlık ve geniş ürün fotoğrafı okunaklı bir dikey düzende sıralanır. Menüde Mağaza, ürün kategorileri, arama, dil seçimi, Siparişlerim ve sepet bulunur. `/magaza` mağaza girişidir; mevcut `/koleksiyon` bağlantıları da çalışır. Ürün ayrıntısında orijinal fotoğraf doğal en/boy oranıyla, sarı yan dolgu olmadan gösterilir. Kategori kartlarında fotoğrafın altındaki ayrı başlık alanı ürünlerin üzerini kapatmaz.

## Teslim edilen durum

Mağaza gerçek veritabanı kullanır. Başlangıç stoku, kullanıcının beyanına göre tüm ürünlerde sıfırdır. Fiyatlar 6 Eylül 2026 Trendyol satıcı sayfasından alınmıştır. İşletmeye ait canlı ödeme hesabı, doğrulanmış gönderici e-postası ve ticari/yasal bilgiler ortamda bulunmadığı için **sipariş kabulü kapalıdır**. Eksikleri uyduran veya ödeme başarılıymış gibi gösteren bir akış yoktur.

## Vercel ve Turso

Vercel için `npm run build:vercel`, Vinext uygulamasını Nitro Node sunucusu ve Build Output API biçiminde derler. `proxy.ts` güvenlik başlıklarını uygulamanın içinde işler. Yerel `npm run dev` Cloudflare D1/R2 ile çalışır.

Üretimde Turso Marketplace bağlantısının sağladığı `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` kullanılır. Dört SQL migration ilk bağlantıda tek transaction içinde uygulanır. SQL trigger'ları noktalı virgülden bölünmez; stok rezervasyonları ve bildirim kuyruğu atomiktir. Vercel Blob Marketplace bağlantısındaki `BLOB_STORE_ID` ve Vercel OIDC, ürün görsellerini kalıcı saklar. Sunucu anahtarları istemciye aktarılmaz.

`APP_ORIGIN=https://sistercrafttest.vercel.app` ve `STORE_NOTIFICATION_EMAIL=ebr.krgl@gmail.com` ayarlanmalıdır. `.env.example` gerekli değişkenlerin adlarını listeler; gerçek değerleri Git'e eklemeyin.

Stok kayıtları, iletişim/iade talepleri ve sipariş/kargo/teslim/iade olayları mağaza sahibine bildirim oluşturur. Yeni form taleplerinde müşteriye ayrı bir alındı mesajı kaydedilir. Genel müşteri üyeliği bulunmaz. E-postalar HTML ve düz metin içerir.

MailerSend Sandbox kurulumu: `EMAIL_PROVIDER=mailersend`, `MAILERSEND_API_KEY`, panelde verilen test alan adına ait `EMAIL_FROM`, `EMAIL_TEST_MODE=true`, `EMAIL_TEST_RECIPIENTS=ebr.krgl@gmail.com`. Site vercel.app adresinde kalır; gönderen MailerSend test alan adıdır. Deneme anahtarı 2 Ekim 2026 tarihinde sona erer. Sandbox yalnızca izin verilen alıcılarla test içindir; test modu canlı ödeme açılışını sağlamaz. Müşteri sipariş e-postaları müşteri adresine, mağaza bildirimleri STORE_NOTIFICATION_EMAIL adresine gider. Başka test alıcıları için sağlayıcının sınırı ve izin listesi güncellenmelidir.

Yönetim → Güvenlik ve açılış bölümünde test e-postası düğmesi, sağlayıcı kabul sayısı, sıra ve kontrol bekleyen bildirimler bulunur. Sağlayıcı kabulü teslim onayı değildir. MailerSend için belirsiz ağ sonucu, duraklatma ve reddedilen gönderimler otomatik tekrarlanmaz; sağlayıcı panelinde kontrol edilir. İzin listesinde olmayan test alıcıları `blocked` durumunda bekler; izin verilince yeniden gönderilebilir. Resend alternatif desteği korunur; aynı idempotency anahtarıyla 23 saat içinde güvenli tekrar yapar. Sağlayıcı ve içerik ilk denemede sabitlenir. API anahtarları sunucuda tutulur. MailerSend istekleri açılma, tıklama ve içerik takibini kapatır.

Ödeme anahtarları, doğrulanmış gönderici, gerçek ticari bilgiler ve stoklar tamamlanmadan sipariş kabulü açılmaz. Müşteri hesap üyeliği bulunmaz; sipariş takibi ve stok bildirim kayıtları mevcuttur.

Doğrulama: `node scripts/test-turso.mjs`, `node scripts/test-mail.mjs`, `node scripts/test-http.mjs`, `node node_modules/typescript/bin/tsc --noEmit`. HTTP testinin adresi `TEST_ORIGIN` ile değiştirilebilir. E-posta testleri gerçek SQLite üzerinde sahte sağlayıcı kullanır ve dışarıya e-posta göndermez.

## Yönetim

`/yonetim` adresi kullanıcı adı ve şifreyle giriş gerektirir. Her yönetim API isteğinde sunucudaki yönetici oturumu doğrulanır. ChatGPT/Sites oturumu veya kimlik başlıkları yönetici erişimi sağlamaz; eski ilk ziyaretçiyi yönetici yapma akışı kaldırılmıştır. `ADMIN_BOOTSTRAP_PRIVATE` ve `ADMIN_EMAILS` yetkilendirmede kullanılmaz.

İlk hesap, sunucuya güvenli biçimde tanımlanan `ADMIN_LOGIN_USER` ve `ADMIN_PASSWORD_HASH` değerlerinden bir kez oluşturulur. Kullanıcı adı 3–40 küçük harf, rakam, nokta, alt çizgi veya tire içerir. Şifre düz metin olarak tutulmaz: 16 bayt rastgele salt ile scrypt (`N=32768`, `r=8`, `p=3`, 32 bayt çıktı) kullanılır. Hash sunucu sırrıdır; kaynak koduna, tarayıcıya veya bu belgeye yazılmaz. İlk kurulumdan sonra geçerli hesap D1'de tutulur; panelden yapılan şifre değişikliği sonraki başlatmada ortam değerleriyle geri alınmaz.

Yönetici için müşteri sepet oturumundan ayrı, rastgele ve tarayıcı oturumuna bağlı bir çerez oluşturulur. Sunucuda yalnızca oturum belirtecinin SHA-256 özeti saklanır. HTTPS üzerinde `__Host-`, `Secure`, `HttpOnly` ve `SameSite=Strict` kullanılır; HTTP istisnası yalnızca yerel geliştirme adresleridir. Oturum 30 dakika etkinlik olmadığında veya girişten itibaren en fazla 8 saat sonra sona erer. Başarısız girişlerde IP ve IP/kullanıcı adı sınırları ile artan bekleme süresi uygulanır.

Panelin Güvenlik bölümünden açık oturumlar görülebilir, seçilen veya diğer oturumlar kapatılabilir. Şifre değişikliği mevcut şifreyi gerektirir; yeni şifre 16–128 karakter olmalı ve mevcut şifreden farklı olmalıdır. Değişiklik eski oturumları sunucuda geçersiz kılar ve yeniden giriş ister. Çıkış düğmesi sunucu oturum kaydını siler.

Panelin on bölümü aynı mağaza verileriyle çalışır:

- Genel bakış: 7/30/90/365 günlük net satış, tamamlanan iadeler, ödeme alınan siparişler, günlük grafik, en çok satan ürünler ve CSV raporu. Başlangıçta gerçek satış bulunmadığından boş durumlar gösterilir.
- Ürünler: yeni ürün oluşturma; Türkçe ve İngilizce isim, kısa/uzun açıklama, içerik ve özellikler; kategori, fiyat, görünürlük, fotoğraflar ve kapak seçimi.
- Stok: arama, stok dışı/azalan stok filtreleri, toplu atomik artış ve azalış. Stok satılabilir miktardır; ödeme rezervasyonları düşülmüştür. Eşzamanlı işlem nedeniyle uygulanamayan satırlar açıkça gösterilir.
- Siparişler: arama, durum filtreleri, sayfalama, CSV, ayrıntılar, kargo bilgileri, teslimat, iade ve belirsiz ödeme mutabakatı.
- Müşteriler: gerçek siparişlerden oluşturulan müşteri listesi, net tahsilat, arama, sayfalama ve CSV.
- Medya: orijinal fotoğraflar, R2 yüklemeleri, kapak seçimi ve sonraki sayfaları yükleme. JPG/PNG/WebP, en fazla 4 MB; MIME/dosya imzası kontrolü, SVG reddi ve varlık doğrulaması. Fotoğraf baytları değiştirilmez.
- Vitrin: slider ürünleri/sıralaması, öne çıkan ürünler, iki dilde duyuru ve TCMB kur güncelleme.
- Talepler: stok bildirimi ve müşteri mesajlarının yönetimi.
- Ayarlar: işletme, iletişim, kargo, iade, hukuki metinler ve sipariş kabulü.
- Güvenlik: şifre değiştirme, etkin oturumlar ve uzaktan oturum kapatma; kurulum durumu, işlem kayıtları ve operasyon bakım araçları.

Stok güncellemesi mevcut miktarın üzerine yazmaz; atomik fark uygular. Kur, vitrin ve işletme ayarları bağımsız `json_patch` işlemleriyle kaydedilir. Yönetim işlemleri denetim kaydına yazılır. CSV dışa aktarımında formül enjeksiyonu engellenir.

## Dil, fiyatlar ve sepet

Dil tercihi Türkçe/İngilizce olarak çerezle korunur ve ilk sunucu çıktısına uygulanır. 20 ürünün İngilizce adı, açıklamaları, özellikleri ve içerikleri mevcuttur; panelden değiştirilebilir.

Ana fiyatlar TL/kuruş olarak tutulur. İngilizce görünüm USD karşılığını `TL / USDTRY` üzerinden iki ondalığa yuvarlar. Başlangıç kuru 4 Eylül 2026 TCMB döviz satış kuru, **1 USD = 48,3195 TRY**; 6 Eylül pazar günü son yayımlanmış kurdur. Örnek: 2.000 TL ≈ $41.39. Panelden resmî kur güncellenebilir; eski tarihli kur yeni değerin üzerine yazamaz.

İngilizce görünen dolar tutarı bilgilendirme karşılığıdır. Mevcut iyzico entegrasyonu **TRY tahsil eder**; kesin TL tutarı ödeme öncesinde açıklanır. Çoklu para birimi yetkisi doğrulanmadığından USD tahsilatı yapılmış gibi gösterilmez.

Stok dışı ürün sepete eklenip saklanabilir, ancak stok uygun olmadan satın alınamaz. Ürün fiyatı, etkinliği ve stok ödeme öncesinde sunucuda yeniden denetlenir. Sepette gizlenmiş ürünler de kaldırılabilir. İstemciden gönderilen fiyatlar kullanılmaz.

## Canlı ödeme açılışı

Sunucu ortamına aşağıdaki değerler Sites üzerinden tanımlanır. Sırlar hiçbir zaman Git'e veya istemci koduna yazılmaz.

| Alan | Kullanımı |
|---|---|
| `APP_ORIGIN` | Sitenin gerçek HTTPS origin adresi |
| `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` | Onaylı canlı iyzico mağaza hesabı |
| `IYZICO_MODE` | Canlı satışta `live`; sağlayıcı entegrasyon kontrollerinde `sandbox` |
| `IYZICO_VERIFIED` | Sağlayıcı başarı, başarısızlık, tekrar bildirim ve iade akışları doğrulandıktan sonra `true` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Doğrulanmış alan adıyla sipariş e-postaları |
| `ADMIN_LOGIN_USER` | İlk yönetici hesabının kullanıcı adı |
| `ADMIN_PASSWORD_HASH` | İlk yönetici hesabının salt içeren scrypt özeti; gizli sunucu değişkeni |

Yönetimde ticari unvan, açık adres, vergi bilgileri, KEP, statüye uygun MERSİS/sicil ve meslek odası, destek iletişimi, iade adresi/taşıyıcısı ve kargo bedelleri tamamlanır. Metinler işletmenin gerçek süreçleriyle gözden geçirilir. ETBİS, veri aktarımı ve saklama süreçleri işletmeye göre değerlendirilir. Gerçek stok eklenir. Tüm kontroller tamamlandığında sipariş kabulü açılır. Genel politika sayfaları hazırlanmıştır; henüz girilmeyen şirket bilgileri veya kuruluşa özgü KVKK aktarım mekanizmaları için hukuki uygunluk onayı verilmiş değildir.

iyzico callback: `/api/payments/callback`

iyzico V3 imzalı webhook: `/api/payments/webhook`

3D Secure ve sağlayıcıdaki merchant risk ayarları canlı hesap üzerinden doğrulanmalıdır. CF kart verileri mağazadan geçmez. Kimlik numarası sağlayıcıya iletilir, D1'de saklanmaz. Taksit sayısı 1 ile sınırlandırılmıştır; sunucu ve sağlayıcı tutarları kuruş bazında tam eşleşmelidir.

## Ödeme ve operasyon güvenceleri

- HMAC-SHA256 istek, yanıt ve V3 webhook doğrulaması; sağlayıcı sonucunu tekrar sorgulama; kullanıcı dönüş URL'sinden ödeme kararı vermeme.
- Veritabanı işlemi içinde fiyat doğrulama ve stok rezervasyonu. Aynı sepet için tek açık ödeme.
- Önceki ödemeye otomatik yönlendirme yok: müşteri Siparişlerim'de kayıtlı siparişi görerek açıkça sürdürür.
- Başarısız ödeme rezervasyonu bir kez serbest bırakır. Belirsiz veya incelemedeki ödeme ürün gönderimine izin vermez.
- Süresi geçen işlemler yönetimin bakım işlemiyle sağlayıcıdan sorgulanır. Sonucu belirsiz, özellikle token alınamayan işlemlerde iyzico paneli kontrol edilip sipariş numarası ve kanıt notuyla en az bir saat sonra onaylı kapatma yapılabilir. Sırf yerel süre geçti diye hâlâ ödenebilir bağlantının stoku serbest bırakılmaz.
- İade kalemleri tek tek kaydedilir. İkinci deneme yalnızca hiç gönderilmemiş `ready` kalemlerini işler; `sending` veya `unknown` kalemi körlemesine tekrar etmez. Belirsiz iadeler iyzico panelinde mutabakat gerektirir. Müşteri iade kabulü fiziksel ürünün stok miktarını kendiliğinden artırmaz.
- Sipariş, kargo ve iade e-postaları işlemle aynı veritabanı değişikliğinde kuyruğa yazılır. Resend aynı idempotency key ile 23 saat içinde yeniden denenebilir; 24 saatlik sağlayıcı penceresi aşıldığında otomatik tekrar yapılmaz. Bakım ekranı kuyruktaki uygun işleri gönderir. Belirsiz eski e-posta için sağlayıcı kaydı incelenir.
- Siparişe özel sözleşme ve ön bilgilendirme kopyası siparişle değişmez biçimde saklanır; müşteri indirebilir ve ödeme onay e-postasında alır.

## Güvenlik ve doğrulama

Hazırlanmış SQL ifadeleri, yönetici izin kontrolü, HttpOnly/SameSite oturumu, HTTPS Secure çerezi, CSRF + Origin kontrolü, giriş doğrulama/boyut sınırları, istek sınırlaması, CSP nonce, HSTS ve güvenlik başlıkları vardır. API yanıtları ve müşteri sayfaları cache edilmez. Sipariş detayları oturuma bağlıdır. Başka cihazdan sorgulama, tahmin edilmesi güç sipariş numarası ve e-posta eşleşmesiyle sınırlı durum bilgisi verir.

Doğrulama araçları:

- `scripts/test-database.py`: gerçek SQLite migrationları üzerinde 10 işlem/rezervasyon/geri alma/idempotency testi.
- `scripts/test-payments.mjs`: gerçek dış servis çağrısı yapmadan 20 HMAC, tutar, imza, webhook ve yönlendirme kontrolü.
- `scripts/test-http.mjs`: 162 katalog, sayfa, HTTP ve API kontrolü.
- `scripts/test-admin-sql.py`: 8 gerçek sorgu kontrolü; kısmi iadeler, İstanbul tarih sınırı, müşteri net tutarı ve bağımsız ayar güncellemeleri.
- `scripts/test-commerce-v2.mjs`: şifreli yönetici girişiyle izole yerel D1 ve R2 üzerinde 29 yönetim → mağaza → sepet bağlantısı, TR/EN fiyat, medya ve yetki kontrolü. Bu script boş ve yalnızca test için ayrılmış veritabanında çalıştırılır; gerçek mağazada çalıştırılmaz.
- `scripts/test-admin-auth-v4.mjs`: ayrı yerel Worker ve test veritabanında 35 doğrulama; gerçek scrypt girişi, yanlış şifre, platform kimliğiyle erişim denemesi, CSRF/Origin, tarayıcı bağı, oturum kapatma, şifre değişikliği, 30 dakika/8 saat sınırları ve giriş denemesi kısıtlamaları. Test doğrudan izole oturum kayıtlarının tarihlerini değiştirir; gerçek mağaza veritabanına yönlendirilmez.
- TypeScript doğrulaması ve production build.

Canlı/sandbox merchant hesabıyla gerçek ödeme ve iade yapılmadı; bu hesap erişimi yoktur. Tarayıcı tıklama/görsel otomasyon testi talep edilmediği için yapılmadı. WebMCP arama ve sepet araçları eklendi; desteklenen bir WebMCP test bağlamı bulunmadığından gerçek kayıt/çağrı doğrulaması yapılmış sayılmaz.

Üretim bağımlılıklarında npm audit açık bildirmemiştir. Eski Drizzle geliştirme aracının geçişli esbuild sürümünde kalan geliştirme bağımlılığı uyarıları deploy edilen Worker'ın parçası değildir. Bu, bağımsız bir sızma testi veya mutlak güvenlik garantisi değildir.

## Yerel çalışma

Node 22.13+ ve npm kullanılır. `npm install`, `npm run dev`, `npm run build`. Windows yolundaki `&` nedeniyle npm script shell sorun yaşarsa ilgili vinext Node girişini doğrudan çalıştır: `node node_modules/vinext/dist/cli.js dev` / `build`.

Yerel `.dev.vars` dosyasında `ADMIN_LOGIN_USER` ve bu uygulamanın scrypt biçimindeki `ADMIN_PASSWORD_HASH` tanımlanır. `.env.example` gerekli alanları gösterir; boş alanlar geçerli bir yönetici hesabı oluşturmaz. Hash güvenli bir kurulum sürecinde `lib/admin-auth.ts` içindeki `passwordDigest` ile üretilir. Düz metin şifre komut geçmişine, kaynak dosyalarına veya Git'e konmaz. Yerel ve yayımlanan ortamların veritabanı/oturumları ayrıdır. `/yonetim` giriş formu kullanılır; eski `/signin-with-chatgpt` akışı yönetim erişimi vermez. Yerel ayarlar ve veritabanı Git’e dahil edilmez. Yüklenen görseller için `.openai/hosting.json` dosyasında `r2: "MEDIA"` bağlaması vardır.

Ürün ve stok yönetimi yerel veritabanına kalıcı olarak kaydedilir. Geliştirme sunucusunu yeniden başlatmak veya arayüzü güncellemek için bu veritabanı sıfırlanmaz. Yönetim testlerinde ayrı `--persist-to` dizini ve fixture hesabı kullanılır; mevcut mağaza stoğu üzerine test verisi yazılmaz.

Cloudflare D1 schema değişiklikleri `db/schema.ts` ve `drizzle/` içindedir. Yerel kurulumda migrationlar sıra ile `wrangler d1 execute DB --local --config wrangler.local.json --file drizzle/FILE.sql` ile uygulanır. Yayında Sites migrationları uygular. Uygulanmış migration dosyaları değiştirilmez; yenileri eklenir.

## Görseller ve kaynaklar

Orijinal 37 ürün fotoğrafı `public/products/` altındadır; katalog galerilerindeki fotoğraf baytları değiştirilmemiştir. V3 slider, `public/editorial/ritual-box-showcase-v3.webp`, `amber-noir-showcase-v3.webp` ve `incense-bundles-showcase-v3.webp` fotoğraflarını kullanır. Ürünler yapay zekâ ile oluşturulan çekimin içinde fiziksel olarak yer alır; eski çerçeveli fotoğraf sunumu kaldırılmıştır. Her sahne ilgili ürünün orijinal fotoğrafı referans alınarak built-in image_gen ile tek çağrıda üretilmiştir. Ana ürün biçimi, malzemesi, demet sayısı ve belirgin etiketler görsel incelemede korunmuştur; çok küçük ambalaj yazıları birebir piksel eşliği taşımaz. Ürün ayrıntısındaki orijinal galeri esastır. Sahne eşlemesi ürün kimliğiyle yapılır; vitrin sırası değiştiğinde yanlış ürün sahnesi kullanılmaz. Sahnesi üretilmemiş ürünlerde kendi gerçek fotoğrafı gösterilir.

V4 kategori alanları için üç yeni yatay 3:2 fotoğraf oluşturuldu: tek SAGE demeti, Amber Noir + Vanilla mumları ve kapalı Ritüel Kutusu ile kendi bileşenleri. Bunlar `public/editorial/category-incense-v4.webp`, `category-candles-v4.webp` ve `category-ritual-v4.webp` dosyalarıdır. Mum fotoğrafındaki Vanilla ürün kodu için ayrıca hedefli bir düzeltme yapıldı. Üç çekim ve bir düzeltme built-in image_gen ile üretildi; WebP kopyaları yalnızca web sunumu için dönüştürüldü. Orijinal katalog fotoğrafları aynı kalır. [V4 görsel dosyaları, referanslar ve kullanılan tam üretim metinleri](docs/site-imagery-v4.md) ile [V3 vitrin üretim metinleri](docs/showcase-prompts-v3.md) belgelenmiştir.

- [Trendyol SisterCraft&Co mağazası](https://www.trendyol.com/sr?mid=1172460&os=1)
- [TCMB 4 Eylül 2026 kur verisi](https://www.tcmb.gov.tr/kurlar/202609/04092026.xml)
- [iyzico CF](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-initialize)
- [iyzico yanıt imzaları](https://docs.iyzico.com/en/advanced/response-signature-validation)
- [iyzico webhook](https://docs.iyzico.com/ek-servisler/webhook)
- [iyzico iade ve iptal](https://docs.iyzico.com/en/advanced/refund-and-cancel)
- [Resend e-posta API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Ticaret Bakanlığı mesafeli sözleşmeler](https://tuketici.ticaret.gov.tr/yayinlar/tuketici-bilgi-rehberi/mesafeli-sozlesmeler-hakkinda-bilgilendirme)
- [KVKK aydınlatma yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-)
