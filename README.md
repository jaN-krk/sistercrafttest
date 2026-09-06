# SisterCraft&Co mağazası

20 gerçek Trendyol ürününden oluşan Türkçe mağaza. 37 orijinal fotoğraf, iki AI editoryal sahne, ürün arama/filtreleme, kalıcı sepet, iyzico Checkout Form, sipariş/kargo/iade yönetimi, bildirim talepleri ve işletme ayarları içerir.

## Teslim edilen durum

Mağaza gerçek veritabanı kullanır. Başlangıç stoku, kullanıcının beyanına göre tüm ürünlerde sıfırdır. Fiyatlar 6 Eylül 2026 Trendyol satıcı sayfasından alınmıştır. İşletmeye ait canlı ödeme hesabı, doğrulanmış gönderici e-postası ve ticari/yasal bilgiler ortamda bulunmadığı için **sipariş kabulü kapalıdır**. Eksikleri uyduran veya ödeme başarılıymış gibi gösteren bir akış yoktur.

Sitenin ilk yayını yalnızca sahibinin erişebildiği özel yayındır. İyzico callback/webhook sunucuları bu özel yayına erişemez. Gerçek satış için işletme kurulumunu tamamlamak ve siteyi kamuya açık HTTPS erişime geçirmek gerekir.

## Yönetim

`/yonetim` adresi ChatGPT hesabıyla doğrulanan yöneticiye açıktır. İlk kayıt sırasında `ADMIN_BOOTSTRAP_PRIVATE=true` **yalnızca Sites erişimi owner-only iken** kullanılır. İlk yönetim ziyaretindeki güvenilir platform kullanıcı kimliği D1'de `admin_owner` olarak kaydedilir. Site genel erişime açılmadan önce bu ayar `false` yapılmalıdır. İsteğe bağlı `ADMIN_EMAILS` açık izin listesidir. Tarayıcıdan gelen rol/kimlik bilgileri yetkilendirmede kullanılmaz; Sites dispatcher tarafından sağlanan kimlik esas alınır.

Ürün fiyatı ve kısa açıklaması değiştirilebilir. Stok güncellemesi mutlak miktar yazmak yerine atomik artış/azalıştır; yönetici eski ekranı kaydettiğinde eşzamanlı rezervasyonun üzerine yazılmaz. Farklı yönetim işlemleri denetim kaydına yazılır.

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
- `scripts/test-http.mjs`: 20 ürün/37 fotoğraf, sayfa, HTTP ve API erişim kontrolleri.
- TypeScript doğrulaması ve production build.

Canlı/sandbox merchant hesabıyla gerçek ödeme ve iade yapılmadı; bu hesap erişimi yoktur. Tarayıcı tıklama/görsel otomasyon testi talep edilmediği için yapılmadı. WebMCP arama ve sepet araçları eklendi; desteklenen bir WebMCP test bağlamı bulunmadığından gerçek kayıt/çağrı doğrulaması yapılmış sayılmaz.

Üretim bağımlılıklarında npm audit açık bildirmemiştir. Eski Drizzle geliştirme aracının geçişli esbuild sürümünde kalan geliştirme bağımlılığı uyarıları deploy edilen Worker'ın parçası değildir. Bu, bağımsız bir sızma testi veya mutlak güvenlik garantisi değildir.

## Yerel çalışma

Node 22.13+ ve npm kullanılır. `npm install`, `npm run dev`, `npm run build`. Windows yolundaki `&` nedeniyle npm script shell sorun yaşarsa ilgili vinext Node girişini doğrudan çalıştır: `node node_modules/vinext/dist/cli.js dev` / `build`.

Cloudflare D1 schema değişiklikleri `db/schema.ts` ve `drizzle/` içindedir. Yerel kurulumda migrationlar sıra ile `wrangler d1 execute DB --local --config wrangler.local.json --file drizzle/FILE.sql` ile uygulanır. Yayında Sites migrationları uygular. Uygulanmış migration dosyaları değiştirilmez; yenileri eklenir.

## Görseller ve kaynaklar

Orijinal ürün fotoğrafları `public/products/`, AI editoryal görseller `public/editorial/` altındadır. AI sahneleri ürün fotoğraflarından oluşturulmuştur; küçük etiket yazılarında üretim farklılıkları olabilir. Ambalaj/ürün ayrıntısı için orijinal galeri fotoğrafları esastır. Yeni ürün görseli veya stok görseli uydurulmamıştır.

- [Trendyol SisterCraft&Co mağazası](https://www.trendyol.com/sr?mid=1172460&os=1)
- [iyzico CF](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-initialize)
- [iyzico yanıt imzaları](https://docs.iyzico.com/en/advanced/response-signature-validation)
- [iyzico webhook](https://docs.iyzico.com/ek-servisler/webhook)
- [iyzico iade ve iptal](https://docs.iyzico.com/en/advanced/refund-and-cancel)
- [Resend e-posta API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Ticaret Bakanlığı mesafeli sözleşmeler](https://tuketici.ticaret.gov.tr/yayinlar/tuketici-bilgi-rehberi/mesafeli-sozlesmeler-hakkinda-bilgilendirme)
- [KVKK aydınlatma yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-)
