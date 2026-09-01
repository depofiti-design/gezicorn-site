# Gezicorn — Proje Bağlamı

## Proje nedir

Gezicorn — Barbaros'un YouTube (@gezikorn) ve Instagram gezi/vize içerik kanalına bağlı bir blog + affiliate sitesi.

**İçerik odağı:** Vize kuralları (hangi pasaportla nereye vizesiz gidilir, Avrupa vizesi red sebepleri vb.), genç gönüllü projeleri/fırsatlar, gezi rehberleri (özellikle Orta Asya + Güneydoğu Asya rotası). Affiliate olarak uçak bileti ve kamp/gezi ürünleri satışı da hedefleniyor.

**Barbaros'un gerçekten gittiği 9 ülke** (site içeriğinde ve globe pin'lerinde bunlar kullanılıyor): Kırgızistan (ikamet), Kazakistan, Özbekistan, Rusya, Tayland, Malezya, Hong Kong, Kamboçya, Vietnam (21 Ağustos 2026'da eklendi). Ülke sayısı `index.html`'deki hero istatistiğinde artık Firestore'dan dinamik okunuyor (`#countryCount`), yeni ülke eklenince elle güncellemeye gerek yok — ama hero paragrafındaki "9 ülke, tek pasaport" cümlesi hâlâ statik metin, yeni ülke eklenince onu elle güncellemek gerekiyor.

## Tasarım dili (29 Ağustos 2026'da profesyonelleştirildi)

Orijinal tasarım claude.ai'de adım adım onaylanmıştı ("harika olmuş, buna uygun yapalım"), ama kullanıcı sonradan "fontları, renkleri profesyonelleştirelim, yapay zeka slot görseller yerine gerçekçi şeyler, yer yer 3D, telefonu kasmayacak şeyler ekle" dedi. Palet ve hero yenilendi, mimari/yapı aynı kaldı:

- **Tema:** hâlâ "Pasaport & sıcak fırsat vitrini" ama daha az doygun/daha kurumsal tonlarla — koyu lacivert-ink (`#101B30`/`#070C18`) + parşömen krem (`#F1ECDD`/`#FAF7EF`) + pirinç/bronz (`#B08D57`, eski parlak altın `#E0A526` yerine) + gümrük damgası kırmızısı (`#9C3B2C`, eski canlı mercan `#E3512E` yerine) + koyu çam yeşili (`#33604F`). CSS değişken isimleri aynı kaldı (`--navy`,`--gold`,`--coral`,`--teal` vb.), sadece hex değerleri değişti, bu yüzden tüm sayfalarda (index/post/posts/danismanlik/admin) tek seferde tutarlı güncellendi.
- **Tipografi:** Fraunces (serif, başlıklar) + IBM Plex Sans (gövde) + IBM Plex Mono (rakamlar, etiketler, rota kodları) — aynı kaldı, Türkçe karakter desteği canlıda kanıtlı olduğu için font ailesi değiştirilmedi, sadece h1/brand'de letter-spacing ile daha "kazınmış/resmi" bir his eklendi.
- **İmza görsel öğe (yenilendi):** Hero'daki düz SVG globe yerine artık **three.js ile gerçek 3D dönen globe** var (`index.html`, r128 UMD build, cdnjs). Mobilde performans için: pixel ratio 1.5 ile sınırlı, IntersectionObserver ile ekran dışındayken render durduruyor, `prefers-reduced-motion` saygı görüyor (tek kare render edip duruyor), doku/texture yok (sadece renkli sphere + wireframe meridyen + glow), ağır kütüphane/OrbitControls yok.
- **Slot-machine efekti kaldırıldı:** Eski "bas döndür → rastgele metin çıkar" mekaniği, gerçek bir havalimanı **split-flap rota tahtası** ile değiştirildi (`#depBoard`, CSS `rotateX` flip animasyonu, gerçek `deals` koleksiyonundaki flight kayıtları arasında dönüyor, 5.5sn'de bir otomatik + "globe'u döndür" butonuyla manuel ilerliyor).
- **Yeni yapısal öğe: MRZ şeridi** — hero altında, gerçek pasaport machine-readable-zone formatını taklit eden, gerçek ülke kodlarını (KGZ/KAZ/UZB/RUS/THA/MYS/HKG/KHM/VNM) encode eden dekoratif ama anlamlı bir monospace şerit (`.mrz-strip`).
- Damga/pasaport motifleri, rozet tarzı kategori etiketleri korundu.
- **Kaçınılması gereken (hâlâ geçerli):** Mor-mavi gradient, ortalanmış generic hero, "AI yaptı" hissi veren şablon görünüm.
- **Henüz yapılmadı / sıradaki:** Yazı kapak görselleri (8 tanesi Higgsfield `soul_location` ile üretilmişti) hâlâ eski/daha "parlak AI" stilinde — kullanıcı bunların da daha gerçekçi/fotografik tarzda yenilenmesini istedi ama bu ayrı bir iş turu, henüz yapılmadı.

## Tech stack

- **Frontend:** Düz HTML/CSS/JS (framework yok, build adımı yok)
- **Veritabanı:** Firebase Firestore (Supabase'den geçildi — kullanıcı Supabase free plan proje limitine takıldı, bütçe kısıtı nedeniyle ücretsiz kalması gerekiyordu)
- **Hosting:** Vercel, proje `gezicorn`, takım `depofiti-1840s-projects` — bağlı ve çalışıyor (bkz. "Deploy durumu")
- **GitHub:** `depofiti-design/gezicorn-site` — public repo, bağlı ve çalışıyor

## Firebase config (gerçek, aktif proje)

```js
const firebaseConfig = {
  apiKey: "AIzaSyBTMRufCWKbfrLBN3WiVDWCjzrpxMhrFmc",
  authDomain: "gezicorn.firebaseapp.com",
  projectId: "gezicorn",
  storageBucket: "gezicorn.firebasestorage.app",
  messagingSenderId: "542127745680",
  appId: "1:542127745680:web:c59e7919eb0e78865c0615"
};
```

Bu zaten `index.html` ve `admin.html` içinde tanımlı. Firestore "test modunda" (herkes okuyup yazabiliyor) — admin panel şifreyle korunuyor ama veritabanı seviyesinde ekstra kilit yok. Bu, kullanıcının diğer sitelerindeki (TikoBey, BonusRota) risk toleransıyla aynı seviyede, bilinçli bir tercih.

**Önemli olay (05 Temmuz 2026):** Firebase konsolundan başlangıçta seçilen "test modu" kuralları otomatik bir son kullanma tarihiyle geliyor — o tarih geçince Firestore tüm okuma/yazmayı sessizce 403'e düşürüyor. Bu yüzden site bir süre canlıda veri göstermedi (posts, deals, countries, route_recommendations, banners, social_links hepsi etkilendi). `firestore.rules` + `firebase.json` + `.firebaserc` eklendi, kurallar artık `allow read, write: if true` (son kullanma tarihi yok) ve `firebase deploy --only firestore:rules --project gezicorn` ile deploy edildi. **Bu durum periyodik olarak kontrol edilmeli** — Firebase konsolunda kuralları elle değiştirirsen yine son kullanma tarihi ekleyebilir, dikkat et.

## Dosyalar ve ne işe yaradıkları

- **`index.html`** — canlı site. Firestore'dan posts/deals/countries/route_recommendations/banners/social_links okuyor.
- **`admin.html`** — şifreli yönetim paneli (şifre: `gezicorn2025`, kullanıcı isterse değiştirir). Yazı ekleme, fırsat ekleme, 2 banner slotu (aktif/pasif), 4 sosyal medya linki (Telegram/Instagram/YouTube/Kick — hepsi varsayılan **pasif**, sitede görünmesi için kullanıcı admin'den aktif etmeli).
- **`seed.html`** — TEK SEFERLİK çalıştırıldı, başlangıç verisini (8 ülke, 4 rota önerisi, boş banner/sosyal doküman) yükledi. **Bir daha çalıştırılmamalı** (tekrar basılırsa ülkeler/öneriler ikinci kez eklenir, kopya veri oluşur). Repoya dahil etmeye gerek yok, arşiv olarak tutulabilir.
- **`firestore-yapisi.md`** — Firestore koleksiyon şeması dokümantasyonu.
- **`posts.html`** — kategoriye göre filtrelenebilen (`?category=vize|firsat|rehber|haber`) tüm yazılar listeleme sayfası. Ana sayfadaki nav ("Vize & ülkeler", "Gönüllü & fırsatlar", "Gezi rehberleri", "Haberler") ve "tümünü gör" linki buraya bağlı. "Sıcak fırsatlar" sekmesi ise ana sayfadaki `#gearDeals`'a kaydırıyor.
- **`robots.txt`** / **`sitemap.xml`** — admin.html ve seed.html'i arama motorlarından gizliyor. `sitemap.xml` Firestore'daki yayında olan yazılardan **statik olarak** üretildi (05 Ağustos 2026, 46 yazı) — yeni yazı eklendiğinde otomatik güncellenmiyor, elle yeniden üretilmesi gerekiyor (bkz. "Kalan işler").
- **`danismanlik.html`** — GEZİCORN TRAVEL LTD (Kamboçya merkezli resmi şirket) için profesyonel danışmanlık/hizmet tanıtım sayfası: vize danışmanlığı, uçak bileti desteği, rota planlama. İletişim kısmında **3 ayrı buton** (WhatsApp/Telegram/E-posta) + ayrı bir **"Sosyal medya hesaplarımız"** bölümü (Instagram/TikTok/X) var, hepsi `settings/consultancy` dokümanından okunuyor — her alan tek tek boş/dolu, dolduruldukça o buton/ikon otomatik görünür (aktif/pasif anahtarına gerek yok). Ana sayfa nav'ında altın renkli, ayrı bir link olarak duruyor; rota planlayıcı bölümünde de "hiç fikrin yok mu, kararsız mısın?" CTA'sı bu sayfaya bağlı.

## İçerik durumu

Firestore `posts` koleksiyonunda **51+ yazı** var (25 Ağustos 2026'dan itibaren her gün +1, bkz. "Günlük içerik otomasyonu"): başlangıçta 29 vize, 9 rehber, 3 fırsat, 9 haber. İlk 30'u toplu eklendi (pasaport türleri — bordo/yeşil-hususi/gri-hizmet/siyah-diplomatik ayrımı dahil —, Avrupa/Schengen, Orta Asya, Uzak Doğu/Güneydoğu Asya, Rusya/BDT, "en zor vizeler", gönüllülük fırsatları, genel rehber). 8 tanesinde Higgsfield (`soul_location` modeli) ile üretilmiş kapak görseli var (`cover_image` alanı, harici CloudFront URL'i — Firebase Storage'a taşınmadı, doğrudan kullanılıyor). **`haber` kategorisi** sonradan eklendi — sitenin kendi gelişim geçmişini anlatan yazılar (canlı widget, 30 rehber, kategori sayfaları, Vietnam eklenmesi, danışmanlık hizmeti duyurusu) + pasaport/vize dünyasındaki genel gelişmeler (AB dijital Schengen vizesi planı, vize ücretleri, dijital nomad vizesi, pasaport yenileme, konsolosluk randevu sistemleri, danışmanlık seçimi, seyahat sigortası, Vietnam e-vize rehberi). **Önemli editoryal kural:** bu kategoriye doğrulayamayacağımız spesifik/tarihli iddialar ("X ülke Y tarihinde vize kuralını değiştirdi" gibi) yazılmıyor — sadece uzun süredir var olduğunu bildiğimiz yapısal gelişmeler, hep "güncel durumu resmi kaynaktan teyit et" uyarısıyla birlikte.

## Firestore koleksiyonları

- `posts` — title, slug, category (vize/firsat/rehber/haber), excerpt, content, cover_image, published, created_at
- `deals` — type (gear/flight), title, route_from, route_to, old_price, new_price, discount_label, affiliate_url, active, created_at
- `banners` — sabit 2 doküman: `banner_1`, `banner_2` (image_url, link_url, alt_text, active)
- `social_links` — sabit 4 doküman: `telegram`, `instagram`, `youtube`, `kick` (url, follower_label, active)
- `countries` — name, visited, visa_status, duration_days, pin_x, pin_y (globe koordinatları)
- `route_recommendations` — budget_min, budget_max, destination, note, estimated_price, active. **Bütçe "uçak bileti hariç"** — konaklama/yeme-içme/aktivite toplamı anlamında (17 Ağustos 2026'da netleşti, planlayıcının label'ına "(uçak bileti hariç)" notu eklendi). Güncel bantlar: Özbekistan ~32.000₺, Tayland ~44.000₺, Malezya ~56.000₺, Hong Kong ~68.000₺; slider 25.000-70.000₺ aralığında. (Not: 05 Ağustos'ta önce 10.000-40.000₺'ye çekilmişti, hâlâ gerçek dışı bulunup 17 Ağustos'ta tekrar yükseltildi — bu rakamlar tahmini, gerçek fiyat garantisi yok, kullanıcı geri bildirimine göre ayarlandı.)
- `settings/consultancy` — tek doküman, GEZİCORN TRAVEL LTD danışmanlık sayfasının iletişim + sosyal medya alanları: `whatsapp_url`, `telegram_url`, `email`, `instagram_url`, `tiktok_url`, `x_url` (hepsi string, hepsi boş = gizli). Admin panelden "Danışmanlık" sekmesinden yönetiliyor, henüz **hepsi boş** — kullanıcı dolduracak. (Eski `contact_url`/`active` alanları da dokümanda duruyor ama artık kullanılmıyor, silinebilir.)
- `settings/branding` — tek doküman, `logo_url` (string, boşsa mevcut "G" rozeti kullanılır). Admin panelde "Site Ayarları" sekmesinden yönetiliyor, henüz **boş**. index.html/post.html/posts.html/danismanlik.html hepsi bu alanı okuyor.

## Önemli mimari kararlar (neden böyle yapıldı)

1. **Uçak bileti fiyatları canlı olmalı** — kullanıcı "fiyatların güncel olması lazım" dedi. Çözüldü: `index.html`'deki `#flightWidget` div'inde artık **Aviasales "Flights Search Form" widget'ı** (Travelpayouts ortaklık ağı üzerinden, `tpwdgt.com` script'i) çalışıyor — kalkış İstanbul (IST) önceden dolu, para birimi USD, buton rengi site temasına (gold/navy) özelleştirildi, `promo_id=3414&campaign_id=111`. Fiyatlar tamamen canlı/otomatik, Firestore'a elle girilmiyor. Not: Travelpayouts'un "Drive" adlı otomatik monetizasyon aracı denendi ama CORS hatası nedeniyle çalışmadığı için kaldırıldı — bunun yerine klasik widget kullanıldı.
2. **Kamp/gezi ürünü fırsatları manuel** — bunlar sık değişmiyor, admin panelden elle girilip güncelleniyor (`deals` koleksiyonu, type=gear). **"Bugünün sıcak fırsatları" bölümü artık type=flight ile dolduruldu** (17 Ağustos 2026) — İstanbul çıkışlı 4 rota kartı (Roma, Almatı, Bangkok, Kuala Lumpur), fiyat uydurmak yerine "canlı fiyata bak" CTA'sı gösteriyor; karta tıklayınca sayfa yukarıdaki Aviasales widget'ına kayıp altın çerçeveyle vurgulanıyor + "rotanı gir, Ara'ya bas" ipucu çıkıyor. **Teknik sınır:** widget cross-origin iframe olduğu için nokta/tarihi otomatik dolduramıyoruz, sadece scroll+vurgula+ipucu ile yönlendiriyoruz — kullanıcı "kiwi ref'e yönlendir" istemişti ama güvenilmeyen bir deep-link formatı uydurmak yerine bu garanti çalışan yöntemi seçtik. `scrollToFlightSearch()` fonksiyonu (21 Ağustos 2026'dan itibaren) hero'daki "ŞU AN: İstanbul → Bangkok" pill'inden ve "bas döndür" sonrası çıkan mesajdan da tetikleniyor — önceden ikisi de tıklanamayan, sadece dekoratif metindi ve "yukarıdaki widget'a bak" diyordu (widget aslında aşağıda), kullanıcı bunu "çalışmayan buton" olarak fark edip düzelttirdi.
3. **Sosyal medya ikonları varsayılan gizli** — kullanıcı "panelde dursun ama sitede görünmesin, ben aktif ettiğimde görünsün" dedi. Bu yüzden `social_links` hepsi `active: false` ile başlıyor.
4. **Banner'lar da aynı mantıkla varsayılan pasif.**
5. **Rota planlayıcı** — bütçe + gün girip destinasyon önerisi alan özellik, `route_recommendations` koleksiyonundan JS ile eşleştiriliyor (aralık sorgusu Firestore'da index gerektirmesin diye tüm aktif kayıtlar çekilip client-side filtreleniyor).
6. **Yazı dilinde tire (—) kesinlikle kullanılmıyor** (23 Ağustos 2026'dan itibaren). Kullanıcı "yapay zeka gibi değil, gerçek ve samimi olmalı" dedi, tüm 50 yazı ve public sayfalardaki statik metinler nokta/virgül/iki nokta üst üste ile temizlendi. Yeni içerik yazarken de kullanma, gerekirse cümleyi böl.
7. **Mobil responsive** (23 Ağustos 2026) — `index.html`'de `@media(max-width:900px)` bloğu eklendi (nav wrap, hero-grid ve planner tek sütun, globe küçülüyor). Diğer sayfalarda (posts/post/danismanlik) zaten vardı. Yeni bir grid/çok sütunlu bölüm eklersen mobilde mutlaka test et, bu site hiç build adımı olmadan çalıştığı için tarayıcıda görmeden fark edilmiyor.

## Günlük içerik otomasyonu (25 Ağustos 2026'dan itibaren)

Kullanıcı "her gün yeni haberler/fırsatlar eklensin, site güncel kalsın" dedi. Bunun için `scripts/` klasörü eklendi ve Claude Code'un zamanlanmış cloud agent özelliğiyle her gün otomatik çalışan bir rutin kuruldu.

- **`scripts/DAILY_CONTENT.md`** — otomasyonun tam talimatı (kategori rotasyonu haber→vize→rehber, editoryal kurallar, slug/tekrar kontrolü, haftada 1 flight deal kartı, neyin YAPILMAYACAĞI). Zamanlanmış ajan her çalıştığında bu dosyayı okuyup uyguluyor.
- **`scripts/add-post.js`** — JSON dosyasından `posts` koleksiyonuna tek yazı ekliyor. Slug çakışması ve tire (—) karakteri varsa hata verip durduruyor.
- **`scripts/add-deal.js`** — JSON dosyasından `deals` koleksiyonuna tek fırsat ekliyor. type=gear için gerçek `affiliate_url` şart, uydurma link geçmiyor.
- **`scripts/generate-sitemap.js`** — Firestore'daki yayında olan tüm yazılardan `sitemap.xml`'i yeniden üretiyor. **Domain bağlanınca bu dosyanın içindeki `BASE_URL` sabiti güncellenmeli.**
- **`scripts/list-posts.js`** — son N yazıyı listeler, ajan yeni konu seçmeden önce tekrarı görmek için kullanıyor.
- Bağımlılıklar `scripts/package.json` içinde (`firebase` JS SDK, admin credential gerekmiyor çünkü Firestore kuralları zaten `allow read, write: if true`). `scripts/node_modules` ve `scripts/tmp-*.json` gitignore'da.
- **Kapsam dışı bırakılan:** `firsat` kategorisine otomatik yazı, `deals`'a type=gear (gerçek ürün/link gerektirir), var olan kayıtları silme/düzenleme. Bunlar hâlâ kullanıcının admin panelden elle yapacağı işler.
- İlk canlı test 25 Ağustos 2026'da yapıldı: `pasaport-gecerlilik-suresi-neden-6-ay-sart` slug'ıyla bir haber yazısı eklendi ve sitemap yeniden üretildi, akış uçtan uca çalıştığı doğrulandı.

## Deploy durumu

- **GitHub:** https://github.com/depofiti-design/gezicorn-site (main branch)
- **Vercel:** proje adı `gezicorn`, takım `depofiti-1840s-projects`, GitHub reposuna bağlı — her `git push` otomatik yeni deploy tetikler
- **Canlı URL:** https://gezicorn-depofiti-1840s-projects.vercel.app
- Yerelde `.vercel/` klasörü var (proje linki), `.gitignore`'a eklendi.
- **Önemli:** Vercel projesinde varsayılan olarak "SSO/Vercel Authentication" koruması açıktı (`.vercel.app` adresleri özel domain bağlanana kadar sadece Vercel hesabı olanlara görünüyordu, gerçek ziyaretçiler giriş ekranıyla karşılaşıyordu). Bu kapatıldı (`vercel project protection disable gezicorn --sso`), site artık tamamen herkese açık.

## Kalan işler (henüz yapılmadı)

Kullanıcı 21 Ağustos 2026'da "sadece domain almak kalsın, buna göre ayarla" dedi — o hedefe göre geriye kalanlar, hepsi **kullanıcının kendi dolduracağı gerçek bilgi** gerektiriyor, kod/tasarım eksiği değil:

- [ ] **Domain** — kullanıcı alacak (gezicorn.com veya .com.tr), Vercel'e bağlanacak. Bağlanınca şunlar güncellenmeli: `sitemap.xml`, `robots.txt` ve tüm `og:image`/`og:url`/deploy referanslarındaki `gezicorn-depofiti-1840s-projects.vercel.app` → gerçek domain.
- [ ] **Danışmanlık iletişim/sosyal bilgileri boş** — `settings/consultancy` dokümanındaki 6 alan (whatsapp_url, telegram_url, email, instagram_url, tiktok_url, x_url) admin panelin "Danışmanlık" sekmesinden doldurulacak. Sahte/uydurma link koymadık, bilerek boş bıraktık.
- [ ] **Logo boş** — `settings/branding` → `logo_url`, admin panelin "Site Ayarları" sekmesinden bir görsel URL girilirse "G" rozetinin yerine geçer.
- [ ] **`deals` koleksiyonunda gear (kamp/gezi ürünü) tipi hâlâ boş** — type=flight kartları dolduruldu (rota önerileri), ama gerçek ürün/affiliate linki gerektiren type=gear hiç eklenmedi; kullanıcı admin panelden gerçek ürün bilgisiyle ekleyecek.
- [ ] Firestore güvenlik kuralları hâlâ "test modu" (herkes okuyup yazabiliyor) — site herkese açık olduğu için ileride sıkılaştırılabilir, ama bilinçli bir tercih olarak şimdilik böyle bırakıldı.
- [x] `sitemap.xml` artık günlük otomasyonun bir parçası olarak `scripts/generate-sitemap.js` ile her gün yeniden üretiliyor (25 Ağustos 2026'dan itibaren, bkz. "Günlük içerik otomasyonu"). Elle çalıştırma gerekmiyor.
- [ ] Vize detay sayfası, öneriler/affiliate mağaza sayfası gibi ek iç sayfalar hâlâ yok (tekil blog yazısı sayfası `post.html` olarak yapıldı, kategori sayfası `posts.html` olarak yapıldı, bunlar yeterli görülüyorsa bu madde kapatılabilir).
- [ ] Kullanıcı "admin panelde yeni sayfa ekle" gibi genel bir sayfa oluşturucu istedi ama ne tür bir sayfa net değildi, inşa edilmedi. Somut bir sayfa fikri gelirse konuşulup yapılabilir.
- [x] Tire (—) temizliği ve mobil taşma sorunu (23 Ağustos 2026'da giderildi, madde 6-7'ye bak).

## Kullanıcı hakkında (ton/yaklaşım için)

Barbaros — freelance web geliştirici, Bişkek'ten Phnom Penh'e taşınma sürecinde, aynı anda iş değişikliği/bütçe kısıtları yaşıyor. Vercel+Supabase/Firebase+vanilla JS stack'ini birden fazla projede (TikoBey, BonusRota, kipzone, Perdeci TV) kullanmış, bu akışa aşina. Türkçe konuşuyor, adım adım, teknik ama sade anlatım tercih ediyor.
