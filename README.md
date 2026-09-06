# SisterCraft&Co mağazası

20 gerçek Trendyol ürününden oluşan Türkçe/İngilizce mağaza. 37 orijinal fotoğraf, gerçek ürün fotoğraflarını değiştirmeden kullanan üç slaytlı vitrin, iki yeni AI atmosfer arka planı, arama/filtreleme, sunucuda kalıcı sepet ve kapsamlı yönetim paneli içerir. Beyaz ve koyu yeşil tasarım; blurlu sabit menü, mobil menü, kontrollü animasyonlar ve erişilebilir etkileşimlerle tamamlanmıştır.

## Teslim edilen durum

Mağaza gerçek veritabanı kullanır. Başlangıç stoku, kullanıcının beyanına göre tüm ürünlerde sıfırdır. Fiyatlar 6 Eylül 2026 Trendyol satıcı sayfasından alınmıştır. İşletmeye ait canlı ödeme hesabı, doğrulanmış gönderici e-postası ve ticari/yasal bilgiler ortamda bulunmadığı için **sipariş kabulü kapalıdır**. Eksikleri uyduran veya ödeme başarılıymış gibi gösteren bir akış yoktur.

**İnternet yayını henüz tamamlanmadı.** İlk özel yayın Sites veritabanı migration aşamasında `incomplete input: SQLITE_ERROR` hatasıyla durdu. Uzak servis uygulanmış/uygulanmamış migration sınırını göstermediği için veritabanı geçmişi değiştirilmedi ve aynı hata körlemesine tekrar denenmedi. V2 bu dosyaları değiştirmez. Üç migration yerel gerçek SQLite ve Wrangler üzerinde başarıyla uygulanır; hosting ayrıştırıcısıyla uyumsuzluk olasılığı vardır, kesin neden doğrulanmış değildir. Sites tarafından hatalı dosyanın ve uygulanmış migration kayıtlarının belirlenmesi gerekir.

Planlanan ilk yayın yalnızca sahibine açıktır. iyzico callback/webhook sunucuları bu özel erişimden geçemez. Gerçek satış için hosting sorunu çözülmeli, işletme kurulumu tamamlanmalı ve site kamuya açık HTTPS erişime geçirilmelidir.

## Yönetim

`/yonetim` adresi ChatGPT hesabıyla doğrulanan yöneticiye açıktır. İlk kayıt sırasında `ADMIN_BOOTSTRAP_PRIVATE=true` **yalnızca Sites erişimi owner-only iken** kullanılır. İlk yönetim ziyaretindeki güvenilir platform kullanıcı kimliği D1'de `admin_owner` olarak kaydedilir. Site genel erişime açılmadan önce bu ayar `false` yapılmalıdır. İsteğe bağlı `ADMIN_EMAILS` açık izin listesidir. Tarayıcıdan gelen rol/kimlik bilgileri yetkilendirmede kullanılmaz; Sites dispatcher tarafından sağlanan kimlik esas alınır.

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
- Güvenlik: kurulum durumu, işlem kayıtları ve operasyon bakım araçları.

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
| `ADMIN_BOOTSTRAP_PRIVATE` | Yönetici bağlandıktan ve kamuya açık erişimden önce `false` |
| `ADMIN_EMAILS` | İsteğe bağlı, virgülle ayrılan yönetici e-posta izin listesi |

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
- `scripts/test-commerce-v2.mjs`: izole yerel D1 ve R2 üzerinde yönetim → mağaza → sepet bağlantısı, TR/EN fiyat, medya ve yetki akışları. Bu script boş ve yalnızca test için ayrılmış veritabanında çalıştırılır; gerçek mağazada çalıştırılmaz.
- TypeScript doğrulaması ve production build.

Canlı/sandbox merchant hesabıyla gerçek ödeme ve iade yapılmadı; bu hesap erişimi yoktur. Tarayıcı tıklama/görsel otomasyon testi talep edilmediği için yapılmadı. WebMCP arama ve sepet araçları eklendi; desteklenen bir WebMCP test bağlamı bulunmadığından gerçek kayıt/çağrı doğrulaması yapılmış sayılmaz.

Üretim bağımlılıklarında npm audit açık bildirmemiştir. Eski Drizzle geliştirme aracının geçişli esbuild sürümünde kalan geliştirme bağımlılığı uyarıları deploy edilen Worker'ın parçası değildir. Bu, bağımsız bir sızma testi veya mutlak güvenlik garantisi değildir.

## Yerel çalışma

Node 22.13+ ve npm kullanılır. `npm install`, `npm run dev`, `npm run build`. Windows yolundaki `&` nedeniyle npm script shell sorun yaşarsa ilgili vinext Node girişini doğrudan çalıştır: `node node_modules/vinext/dist/cli.js dev` / `build`.

Yönetim önizlemesinde `.dev.vars` içine `ADMIN_BOOTSTRAP_PRIVATE=true` konur; `/signin-with-chatgpt?return_to=%2Fyonetim` adresi yerel geliştirme kimliğini açar. Bu yerel ayar ve veritabanı Git’e dahil edilmez. Üretim ortamında kimlik yalnızca Sites dispatcher üzerinden kabul edilir. Yüklenen görseller için `.openai/hosting.json` dosyasında `r2: "MEDIA"` bağlaması vardır.

Cloudflare D1 schema değişiklikleri `db/schema.ts` ve `drizzle/` içindedir. Yerel kurulumda migrationlar sıra ile `wrangler d1 execute DB --local --config wrangler.local.json --file drizzle/FILE.sql` ile uygulanır. Yayında Sites migrationları uygular. Uygulanmış migration dosyaları değiştirilmez; yenileri eklenir.

## Görseller ve kaynaklar

Orijinal 37 ürün fotoğrafı `public/products/` altındadır; baytları değiştirilmemiştir. V2 slider, `public/editorial/ritual-forest-empty-plinth.webp` ve `ritual-linen-empty-plinth.webp` adlı iki AI arka plan üzerinde gerçek fotoğrafı ayrı bir katman olarak kullanır. AI arka planlarda ürün, ambalaj veya yazı yoktur. V1 ürünlü AI sahneleri dosya geçmişi için korunur ancak mağazada kullanılmaz. Kullanıcının istemediği parıltı simgesi kaldırılmıştır.

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
