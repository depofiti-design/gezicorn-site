# Gezicorn — Proje Bağlamı

## Proje nedir

Gezicorn — Barbaros'un YouTube (@gezikorn) ve Instagram gezi/vize içerik kanalına bağlı bir blog + affiliate sitesi.

**İçerik odağı:** Vize kuralları (hangi pasaportla nereye vizesiz gidilir, Avrupa vizesi red sebepleri vb.), genç gönüllü projeleri/fırsatlar, gezi rehberleri (özellikle Orta Asya + Güneydoğu Asya rotası). Affiliate olarak uçak bileti ve kamp/gezi ürünleri satışı da hedefleniyor.

**Barbaros'un gerçekten gittiği 9 ülke** (site içeriğinde ve globe pin'lerinde bunlar kullanılıyor): Kırgızistan (ikamet), Kazakistan, Özbekistan, Rusya, Tayland, Malezya, Hong Kong, Kamboçya, Vietnam (21 Ağustos 2026'da eklendi). Ülke sayısı `index.html`'deki hero istatistiğinde artık Firestore'dan dinamik okunuyor (`#countryCount`), yeni ülke eklenince elle güncellemeye gerek yok — ama hero paragrafındaki "9 ülke, tek pasaport" cümlesi hâlâ statik metin, yeni ülke eklenince onu elle güncellemek gerekiyor.

## DEVAM NOTU ve YAPILACAKLAR (21 Eylül 2026, yeni sohbet buradan devam etsin)

**Önce bunu oku.** Kullanıcı (Türkçe konuşur, kısa ve net cevap ister, "onay sorma, yap sonra bildir" kuralı, metinde tire yok, sadece erkek figür, marka adı her yerde "Gezicorn") bu oturumu böyle kapattı. Her cevabın sonunda aşağıdaki bekleyenleri hatırlat.

### Bu oturumda tamamlananlar (özet)
- Domain gezicorn.com canlı, Search Console doğrulandı, sitemap gönderildi, 8 URL için "Dizine ekleme iste" yapıldı.
- 78 yazı statik sayfa (`yazi/<slug>/`), JSON-LD, SSS, iç linkler, kapak görselleri (`img/covers/`), hatalı vize bilgileri düzeltildi. Yazıların büyük kısmı derinleştirildi ama ~25 yazı hâlâ kısa (200 ile 270 kelime).
- Klook affiliate (`scripts/affiliates.json`), reklam alanları (sol/sağ/yazı içi/ana sayfa şeridi), YouTube video gömme, Instagram/YouTube/Facebook butonları aktif.
- Sosyal: Kırgızistan, Vietnam, Tayland, Malezya, Hong Kong, üç ülke uygulama gönderisi (Kırgızistan, Kamboçya, Tayland 21 Eylül), 22 Eylül'den itibaren günlük en az 2 gönderi otomatik (yukarı bak) (Kırgızistan carousel, Kamboçya carousel) yayınlandı. Kural: uygulama/liste gönderileri **kaydırmalı carousel**, kendiliğinden kayan reel yapma.
- Yeni tasarım **"Rota" sistemi** (Harita + Bavul harmanı, vize damgaları, 3D Higgsfield renderlar, WebGL bavul): tüm site geçti. `assets/gz.css`, `assets/3d/`, `scripts/stamps.json`, `design/rota-DESIGN.md`. admin.html de geçti (21 Eylül, kendi içinde stil, gz.css'e bağlı değil).
- Uçak suyu reeli: Higgsfield ile 4 animasyon sahnesi üretildi (`social-content/reels-ucak/`), doğruluk kontrollü senaryo `senaryo.md` içinde (Gemini taslağındaki "ısıtıcı 100 dereceye çıkmıyor" yanlış, söylenmeyecek). Sesi kullanıcı kaydedip birleştirecek.
- **Yazım/dil taraması** (78 yazı okundu, 39 düzeltildi), Kamboçya iki vize yazısı tek yazıda birleştirildi (301), Tayland rota notu ve danışmanlık metni düzeltildi. Ayrıntı "Claude'un yapacakları" 1. madde ve "Bilinen notlar".
- **Yasal sayfalar ve çerez onayı** (21 Eylül): `/gizlilik/` (KVKK), `/cerez-politikasi/`, `/kullanim-kosullari/`, `/hakkimizda/`, `/iletisim/`, çerez banner'ı, ortak altbilgi, güvenlik başlıkları. Ayrıntı "Yasal sayfalar ve çerez onayı" bölümü.
- Facebook sayfa adı Gezicorn yapıldı, Travelpayouts tıklamaları hesapta görünüyor (kullanıcı doğruladı).

### Yapılacaklar (yapılmadı)
**Kullanıcının yapacakları:**
1. Kamboçya **reelini** Instagram'dan silmek: kullanıcı şimdilik dursun dedi, tekrarlanmaması yeterli (kaydırmalı carousel kuralı geçerli).
2. ~~Facebook sayfa adı~~ tamam: kullanıcı 21 Eylül 2026'da "Gezicorn" yaptı.
3. Affiliate başvuruları: Surfshark, NordVPN (Airalo kodu geldi ve işlendi, SafetyWing vazgeçildi). Onay gelince linkleri Claude'a ver, `scripts/affiliates.json`'a ve ilgili yazılara `affiliate` alanıyla işlenecek. Klook için Travelpayouts eklentisiyle derin linkler üretilecek (Angkor Wat, Bangkok, Phuket, Hong Kong, Tokyo, Ha Long).
4. Reels çekimleri: uçak suyu videosunun sesi, Tayland 30 gün kuralı, Rusya e-vize, Japonya "vize getirdi" yalanı, Kamboçya e-vize sahte site tuzağı.
5. Kamboçya uygulama gönderisini (PassApp, Grab, foodpanda, Bakong Tourists) yaşadığı yerden gözden geçirip yanlış/eksik varsa söylemesi.
6. DesignMD **gerçek API anahtarı** (designmd.ai/settings, `dk_...`) verirse MCP'ye bağlanacak, kit içeriği indirilebilir. Şu an sadece arama çalışıyor.
7. ~~Travelpayouts uçak bileti kutusu kontrolü~~ tamam: tıklamalar Travelpayouts hesabında görünüyor.
8. **Admin panel > Danışmanlık sekmesine e-posta adresini yaz** (`settings/consultancy.email`). Boş olduğu için iletişim sayfasında ve KVKK başvurusunda sadece sosyal hesaplar var.
9. ~~Şirket bilgileri~~ gerek yok (kullanıcı 21 Eylül 2026): işletme **Kamboçya merkezli şahıs şirketi, adı Gezicorn**. "GEZİCORN TRAVEL LTD" ifadesi siteden ve yazılardan kaldırıldı (yasal sayfalar, danışmanlık sayfası, 3 yazı; yazı adresi `gezicorn-travel-ltd-danismanlik-basladi` eski link bozulmasın diye aynı). Unvan/adres/vergi numarası isteme, uydurma. Not: `vize-danismanligi-secerken-nelere-dikkat-etmeli` yazısı "şirket kaydı ve vergi numarası paylaşmayandan uzak dur" diyor, şahıs şirketi için tutarsız kalabilir, gerekirse yumuşat.

**Claude'un yapacakları (kullanıcı isteyince):**
1. **Yazım/dil hatası taraması: 20 Eylül 2026 tamamlandı** (78 yazının tamamı okundu, 39 yazı düzeltildi; deals, rota önerileri, sosyal linkler ve ana sayfa/danışmanlık metinleri tarandı). Düzeltilenler: bozuk başlıklar (`turklerin-en-sevdigi-vizesiz-rotalar`, `neden-gezmeli-rotasiz-hayat`), sen/siz karışıklığı, ret/red, imkân/bekâr, check-in, Rusya kart cümleleri, danışmanlık sayfasındaki "süren göre", Tayland rota notundaki "kuru sezon". Eski site duyuruları `yakinda-kamp-gezi-urunu-firsatlari` ve `dunya-haritasi-yenilendi` yayından kaldırıldı (`published:false`, eski tasarıma ve boş fırsat bölümüne atıf yapıyordu). `konsoloslukta-randevu-beklerken-ogrendiklerim` yazısındaki kişisel anlatı (uydurma olabilir) nötr anlatıma çevrildi, başlık "Konsolosluk Randevusu Beklerken Bilinmesi Gerekenler" oldu (slug aynı). Kullanıcı teyit etti: kiralık ev yazısındaki ve Neden Gezmeli yazısındaki kişisel cümleler gerçek, yerinde kalıyor; Kamboçya/Kırgızistan "yaşayan biri olarak" cümleleri de gerçek. Kamboçya iki yazısı birleştirildi (aşağıya bak), vize mülakatı iki yazısı ayrı kalıyor (kullanıcı "yok" dedi). `kategori-sayfalari-eklendi` (noindex) "ana sayfa son 3 yazıyı gösteriyor" cümlesi düzeltildi (21 Eylül). Günlük otomasyonun eklediği `vize-basvuru-merkezi-vfs-tlscontact-ne-is-yapar` okundu, "ret etme" düzeltildi ve konusu yakın `konsolosluk-randevu-sistemleri-idata-vfs-bls` ile karşılıklı iç link verildi (birbirini yiyen çift, ilerde birleştirmek düşünülebilir).
2. ~25 kısa yazıyı (200 ile 270 kelime) gerçek deneyim/fiyat/süre bilgisiyle genişlet (uydurma bilgi yok, kullanıcıdan bilgi al).
3. ~~admin.html'i yeni "Rota" paletine geçir~~ tamam (21 Eylül 2026).
4. Sosyal medya görsellerini (carousel) yeni Rota renkleriyle (teal/turuncu/sarı) üret, ülke uygulama gönderilerini diğer ülkeler için tekrarla (Tayland carousel 21 Eylül'de yayınlandı; foodpanda Mayıs 2025'te Tayland'dan çekildi, Bolt Mayıs 2026'da inceleme altındaydı, ikisi listede yok. Yeni Rota betiği `social-content/apps/build_rota.py`).
5. Uçak suyu videosu için kullanıcı sesi hazır olunca birleştirme/altyazı yardımı, sonra Instagram+Facebook'a yayın (önce önizleme onayı).
6. Ekipman yazılarına (çanta, çadır, bavul listesi) affiliate linkleri, eSIM yazısına Airalo/Klook eSIM linki (onay gelince).
7. Günlük otomasyon (`scripts/DAILY_CONTENT.md`) yeni yazıya kapak üretmiyor: yeni günlük yazılar varsayılan kapakla çıkıyor, arada Higgsfield ile kapak üretip `process-cover.py` + `update-post.js` ile ekle. Yeni günlük yazıları yazım hatası için de tara.
8. Yeni ülke gezildiğinde `scripts/stamps.json` ve hero metinleri güncellenecek.
9. Google Fonts ve Font Awesome (cdnjs) kendi sunucudan servis edilebilir (gizlilik için IP aktarımı kalkar). Yeni üçüncü taraf betik eklenirse çerez onayına bağla, çerez politikası tablosunu güncelle.

### Bilinen notlar
- **Tarih biçimi (21 Eylül 2026):** `build-static.js` içindeki `trDate` artık Türkiye saatine (UTC+3) sabit, derleyen makinenin saat dilimine göre yazı tarihi kaymıyor (önceden `datetime` UTC, görünen tarih yerel saatti). 7 yazının görünen tarihi bu yüzden 1 gün ileri gitti, doğru olan budur.
- **Kamboçya vizesi (20 Eylül 2026, kullanıcı):** `kamboca-e-vize-basvurusu-adim-adim` yazısı `kambocya-vizesi-turkler-icin-e-vize-sureci` içine birleştirildi, eski adres `vercel.json` ile 301 yönlendiriliyor, yazı `published:false`. Kullanıcının bilgisi: Kamboçya'da 30 günden uzun kalış/uzun süreli işlemlerde çoğu zaman aracı gerekiyor, GEZİCORN TRAVEL LTD bunu (e-vize başvurusu dahil) danışmanlıkla yapıyor. Yazıda bu şekilde, danışmanlık sayfasına linkle geçiyor. Kullanıcının tam kastı net değildi ("uzun süreli turistik hariç e visa için"), yanlış anlaşıldıysa metni düzelt.
- Vize damgaları (`stamps.json`) Eylül 2026 itibarıyla doğrulanmış bilgi: Kırgızistan 90, Kazakistan 30, Özbekistan 30, Tayland 30 (+TDAC), Malezya 90 (+MDAC), Hong Kong 90, Japonya 90 gün vizesiz; Vietnam, Kamboçya, Rusya e-vize. Kural değişince yazıyı ve damgayı birlikte güncelle.
- Playwright MCP ve DesignMD MCP kullanıcı düzeyinde kurulu (yeni sohbette araçlar görünür).

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
- **`yazi/`** — **build çıktısı (elle düzenleme, `node scripts/build-static.js` üretir)**: her yazı `yazi/<slug>/index.html` (canlı URL `https://www.gezicorn.com/yazi/<slug>/`) + `yazi/index.html` (tüm yazıların taranabilir listesi). Statik HTML olduğu için Google/Yandex/AI botları JS çalıştırmadan tam metni görür. Bkz. "SEO mimarisi".
- **`post.html`** — artık sadece eski `post.html?slug=` linkleri için yönlendirme sayfası (Vercel `vercel.json` 301 ile `/yazi/<slug>/`'a yönlendiriyor).
- **`posts.html`** — (noindex, canonical `/yazi/`) kategoriye ve ülkeye göre JS ile filtrelenebilen kullanıcı arayüzü sayfası; ülke filtresi (`?country=Vietnam`) burada.
- **`posts.html` (eski açıklama)** — kategoriye göre filtrelenebilen (`?category=vize|firsat|rehber|haber`) tüm yazılar listeleme sayfası. Ana sayfadaki nav ("Vize & ülkeler", "Gönüllü & fırsatlar", "Gezi rehberleri", "Haberler") ve "tümünü gör" linki buraya bağlı. "Sıcak fırsatlar" sekmesi ise ana sayfadaki `#gearDeals`'a kaydırıyor.
- **`robots.txt`** / **`sitemap.xml`** — admin.html ve seed.html'i arama motorlarından gizliyor. `sitemap.xml` Firestore'daki yayında olan yazılardan **statik olarak** üretildi (05 Ağustos 2026, 46 yazı) — yeni yazı eklendiğinde otomatik güncellenmiyor, elle yeniden üretilmesi gerekiyor (bkz. "Kalan işler").
- **`danismanlik.html`** — GEZİCORN TRAVEL LTD (Kamboçya merkezli resmi şirket) için profesyonel danışmanlık/hizmet tanıtım sayfası: vize danışmanlığı, uçak bileti desteği, rota planlama. İletişim kısmında **3 ayrı buton** (WhatsApp/Telegram/E-posta) + ayrı bir **"Sosyal medya hesaplarımız"** bölümü (Instagram/TikTok/X) var, hepsi `settings/consultancy` dokümanından okunuyor — her alan tek tek boş/dolu, dolduruldukça o buton/ikon otomatik görünür (aktif/pasif anahtarına gerek yok). Ana sayfa nav'ında altın renkli, ayrı bir link olarak duruyor; rota planlayıcı bölümünde de "hiç fikrin yok mu, kararsız mısın?" CTA'sı bu sayfaya bağlı.
- **`gizlilik/`, `cerez-politikasi/`, `kullanim-kosullari/`, `hakkimizda/`, `iletisim/`** — yasal ve kurumsal sayfalar, **`scripts/build-legal.js` üretir (elle düzenleme)**. `assets/consent.js` çerez onayı, `scripts/site-parts.js` ortak altbilgi ve sürüm numarası.

## İçerik durumu

Firestore `posts` koleksiyonunda **78 yazı** var (21 Eylül 2026: 75 statik sayfa yayında, 3 tanesi `published:false`) (25 Ağustos 2026'dan itibaren her gün +1, bkz. "Günlük içerik otomasyonu"): başlangıçta 29 vize, 9 rehber, 3 fırsat, 9 haber. İlk 30'u toplu eklendi (pasaport türleri — bordo/yeşil-hususi/gri-hizmet/siyah-diplomatik ayrımı dahil —, Avrupa/Schengen, Orta Asya, Uzak Doğu/Güneydoğu Asya, Rusya/BDT, "en zor vizeler", gönüllülük fırsatları, genel rehber). 8 tanesinde Higgsfield (`soul_location` modeli) ile üretilmiş kapak görseli var (`cover_image` alanı, harici CloudFront URL'i — Firebase Storage'a taşınmadı, doğrudan kullanılıyor). **`haber` kategorisi** sonradan eklendi — sitenin kendi gelişim geçmişini anlatan yazılar (canlı widget, 30 rehber, kategori sayfaları, Vietnam eklenmesi, danışmanlık hizmeti duyurusu) + pasaport/vize dünyasındaki genel gelişmeler (AB dijital Schengen vizesi planı, vize ücretleri, dijital nomad vizesi, pasaport yenileme, konsolosluk randevu sistemleri, danışmanlık seçimi, seyahat sigortası, Vietnam e-vize rehberi). **Önemli editoryal kural:** bu kategoriye doğrulayamayacağımız spesifik/tarihli iddialar ("X ülke Y tarihinde vize kuralını değiştirdi" gibi) yazılmıyor — sadece uzun süredir var olduğunu bildiğimiz yapısal gelişmeler, hep "güncel durumu resmi kaynaktan teyit et" uyarısıyla birlikte.

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
- **23 Eylül 2026: IndexNow kuruldu (kullanıcı "hiç görünmüyoruz, ücretsiz araç ekleyelim" dedi).** `74db7fd014ea7fe3a80d37b971258a9b.txt` (anahtar dosyası, kök dizinde) + `scripts/indexnow-ping.js`, sitemap.xml'deki tüm URL'leri Bing ve Yandex'e anında bildiriyor (protokol: indexnow.org, ücretsiz, hesap gerekmez). `.github/workflows/indexnow.yml` her `sitemap.xml` değişikliğinde otomatik tetikleniyor. **Google IndexNow'a katılmıyor**, Google için hâlâ tek yol Search Console + zaman + backlink. İlk ping 23 Eylül'de atıldı (80 URL, 202 yanıt). Teknik denetim için `npx lighthouse` (Google'ın kendi aracı, GoogleChrome/lighthouse, 30K+ yıldız) kullanılabilir, hesap/anahtar gerekmez. 23 Eylül'de e-vize yazısında çalıştırıldı: SEO 100, Accessibility 100, Best Practices 100, Performance 77 (mobil, LCP/FCP font+görsel yüklemesinden yavaş). **Sonuç: teknik SEO'da sorun yok**, görünürlük sorunu tamamen domain yaşı/backlink meselesi. Windows'ta `--output-path` mutlak Windows yolu olmalı, iş bitince chrome-launcher temp klasörünü silerken EPERM hatası verip exit code 1 dönebilir ama JSON rapor öncesinde zaten diske yazılmış oluyor, görmezden gel.
- **Gerçek durum (23 Eylül 2026):** Domain 19 Eylül'de bağlandı, yani Google'a göre 4 günlük. "e vize nedir" gibi jenerik terimlerde evisa.gov.tr (resmi) ve büyük seyahat acenteleriyle yarışıyoruz, `site:gezicorn.com e-vize` araması bile sonuç vermedi (sayfa muhtemelen henüz indekslenmedi, 21 Eylül'deki Search Console verisiyle tutarlı: 115 sayfadan sadece 4'ü indekste). Bu bir kod/SEO hatası değil, yeni domain + sıfır backlink + zaman meselesi. Asıl kaldıraç: backlink (YouTube/Instagram bio linkleri zaten var) ve zaman. Kullanıcıya her seferinde bunu hatırlat, "daha fazla teknik ince ayar" bu sorunu çözmez.

- **23 Eylül 2026 (devam): "bunlar tarzında yazı ekle" isteğine yeni yazı.** Kullanıcı "e vize nedir", "bordo kırmızı pasaport", "vizesiz ülkeler ve günleri" konularında yazı istedi. İlk ikisi zaten dedike yazıya sahipti (cannibalization olmasın diye yeni yazı açılmadı), üçüncüsü gerçek bir boşluktu: **`turk-pasaportuyla-vizesiz-ulkeler-ve-gun-sayilari`** eklendi (rehber, bölge bölge Orta Asya/Uzak Doğu/Balkanlar/Orta Doğu, WebSearch ile doğrulanmış rakamlar, Gürcistan'ın 1 Ocak 2026 sigorta şartı dahil). Kapak görseli yok (Higgsfield o an bağlı değildi), sıraya eklendi. Kullanıcı "gönderileri şimdi yapmayalım" dedi: e-vize ve vizesiz ülkeler için carousel görselleri üretilip siteye push'landı ama Instagram/Facebook'a ATILMADI, taslak altyazılar `social-content/captions.md` sonunda. "Gönder" denince doğrudan post-social.js ile atılabilir.

- **23 Eylül 2026: Search Console sorgu verisiyle SEO ince ayarı.** Kullanıcı ilk gerçek arama sorgularını (Queries sekmesi) paylaştı: "yeşil ve bordo pasaport farkı", "bordo yeşil pasaport farkı", "yeşil kırmızı pasaport farkı" (halk dilinde bordo yerine kırmızı deniyor, siteye hiç işlenmemişti), "e-vize nedir", "uluslararası aşı kartı"/"sertifikası", "orta asya ülkeleri vize istiyor mu", "ingiltere schengen'e dahil mi", "pasaport ne zaman yenilenir". Hepsi için zaten ilgili yazı vardı, yeni yazı açmadım: `pasaport-turleri-bordo-yesil-hususi-gri-fark` başlığına "(Kırmızı)" eklendi + kırmızı eş anlamı içeriğe işlendi, 6 yazıya sorgu cümlesiyle birebir eşleşen FAQ soruları eklendi (`e-vize-nedir-hangi-ulkelerde-var`, `sari-kart-uluslararasi-asi-sertifikasi-nedir`, `orta-asyada-vizesiz-ulkeler-listesi`, `ingiltere-vizesi-schengenden-farkli-mi`, `pasaport-yenileme-sureci-nasil-isliyor`, ve pasaport türleri yazısı). Ayrıca pasaport renkleri konusunu (en çok impression alan sorgu grubu) 3 kareli Instagram carousel + hikaye olarak paylaştı, sormadan (bkz. "Sosyal medya (Composio)"). Not: impression sayıları çok düşüktü (1 ile 3 arası), site 4 günlük yeni crawl'da, bu normal, alarm değil.

- **22 Eylül 2026: sosyal medya da otomatikleşti** (kullanıcı: "günlük en az 2 post ayarla, sorma"). `.github/workflows/daily-social.yml` (GitHub Actions, `0 7 * * *` = günlük içerik rutininden 1 saat sonra) `scripts/daily-social.js`'i çalıştırır: en yeni yayındaki yazıyı bulur, `settings/social_automation.last_posted_slug` ile çift paylaşımı engeller, Instagram feed + Facebook feed (link'li) + Instagram hikaye olmak üzere 3 gönderi atar. LLM kullanmaz, deterministik şablon altyazı üretir. Composio anahtarı GitHub repo secret'ı (`COMPOSIO_API_KEY`, `gh secret set` ile eklendi); Claude Code cloud rutinleri secret desteklemediği için (`environment_variables is not supported on triggers`) bu iş GH Actions'a alındı. Detay ve elle zenginleştirme akışı `scripts/DAILY_SOCIAL.md`. İlk gerçek çalıştırma 23 Eylül 2026 sabahı (07:00 UTC), manuel `workflow_dispatch` testi 22 Eylül'de başarılı.

## SEO mimarisi (19 Eylül 2026)

Kullanıcı "Google/Yandex aramasında, Google AI asistanında çıkacak düzeyde SEO, bundan sonraki yazılarda da sıralamaya dikkat" dedi. Yapılanlar:

- **Statik yazı sayfaları:** `scripts/build-static.js` Firestore'daki yayında yazılardan `yazi/<slug>/index.html` üretir: `<title>`, meta description (excerpt, 160 karaktere kırpılır), canonical, Open Graph/Twitter, `BlogPosting` + `BreadcrumbList` + (varsa) `FAQPage` JSON-LD, içindekiler, ilgili yazılar (iç link), yazar kutusu, resmi kaynak uyarısı, mobil uyumlu CSS. Sitemap (`lastmod`'lu), ana sayfa "Son yazılar" ve "Ülke ülke vize rehberleri" alanları da aynı script ile güncellenir. `scripts/generate-sitemap.js` artık sadece bunu çağırıyor.
- **İçerik biçimi (hafif markdown):** `> **Kısaca:** ...` (AI/snippet için doğrudan cevap), `## H2`, `### H3`, `- ` liste, `1. ` sıralı liste, `**kalın**`, `[metin](/yazi/slug/)`. Tek başına `**Başlık**` satırı otomatik H2 olur. `## Sık sorulan sorular` altındaki `### Soru?` + paragraf FAQ schema'ya dönüşür. `add-post.js` bu yapıyı zorunlu kılar (en az 300 kelime, Kısaca, 3+ H2, SSS, iç link, excerpt ≤165, title ≤65).
- **Firestore ek alanları:** `updated_at` (sayfada "Güncelleme" + sitemap lastmod), `seo_description`, `cover_alt`, `noindex` (true ise sayfa `noindex,follow`, sitemap/liste/ilgili yazılardan çıkar; "Gezicorn yayında" gibi site duyuru yazılarında kullanıldı), `youtube_id`/`youtube_title` (yazıya tıklayınca oynayan YouTube video embed'i, `youtube-nocookie`).
- **Mevcut yazıları güncelleme:** `node scripts/update-post.js updates.json` (nesne dizisi, her nesne `{slug, ...alanlar}`), ardından `node scripts/build-static.js`, sonra `git add -A && git commit && git push`. Firestore'a yazmak tek başına yetmez, statik sayfa üretilip push'lanmadan Google göremez.
- **Kapak görselleri:** artık kendi domainimizde `img/covers/<slug>.jpg` (1200x675 JPEG, ~100KB). Higgsfield `soul_location` ile üretilir (16:9, "no text, no people" istemi, en fazla 8 eşzamanlı iş), `python scripts/process-cover.py <slug> <url>` ile işlenir (çok karanlıksa otomatik açar), `update-post.js` ile `cover_image` (`https://www.gezicorn.com/img/covers/<slug>.jpg`) ve `cover_alt` yazılır. Kapaksız sayfa `og-default.png` kullanır. Görsellerde sadece erkek figür/insansız kural devam ediyor.
- **İçerik doğruluğu:** 19 Eylül 2026'da bir denetimde eski yazılarda yanlış vize bilgileri bulundu ve düzeltildi (Japonya Türklere vizesiz 90 gün, Güney Kore vizesiz 90 gün, Hong Kong 90 gün, Kırgızistan 90 gün, Schengen 29 ülke, Tayland 15 Eylül 2026'dan beri 30 gün + TDAC, Malezya MDAC). Yeni vize yazılarında rakam yazmadan önce WebSearch/WebFetch ile doğrula ve tarih ver.
- **Google Search Console:** `gezicorn.com` domain property, DNS TXT ile doğrulandı (TXT kaydı Spaceship DNS'inde durmalı, silinirse doğrulama düşer), `https://www.gezicorn.com/sitemap.xml` gönderildi. Sitemap URL'leri 19 Eylül 2026'da `/yazi/<slug>/` biçimine geçti, Google yeniden okur.
- **Mobil test:** `node` + Chrome DevTools Protocol ile 390px mobil emülasyon (scratchpad'de `shot.mjs`); `python -m http.server` ile yerelden bakılabilir. Ana sayfada sahte "12 açık gönüllü projesi" sayacı, varsayılan "fırsat" rozeti ve "Supabase" hata metni kaldırıldı, globe üçgen-çapraz çizgi yerine enlem/boylam çizgileriyle çizildi, mobil nav tek satır kaydırmalı yapıldı.
- **YouTube kanalı analizi (kanal adı Gezicorn, @gezikorn, açıklama "Solo travel Instagram: @gezicorn"):** en çok izlenenler pratik "nasıl yapılır" videoları: Rusya e-vize başvurusu (~9,6B), Tayland'a gidiş süreci (~7,3B), Rusya'da kalacak yer/banka/uygulamalar (~3,4B), Bişkek'te dondurucu soğuk vlog (~2,2B), Kırgızistan market fiyatları (~1,2B), Manas Üniversitesi soruları. Ton: birinci ağızdan, "gelmeden bil", "güvenli mi?", "market fiyatları", "uygulamalar", numaralı bölümler (#126, #136), Türkiye ile karşılaştırma. Blog yazıları bu ihtiyaçlarla eşleşmeli: gitmeden önce bilinmesi gerekenler, yaşam maliyeti, kalacak yer, banka/ödeme, işe yarayan uygulamalar, güvenlik. Yanlış/uydurma detay yok, sadece kanalda gerçekten anlatılan konular.

## Facebook kaydırmalı (çoklu foto) gönderi düzeltmesi (23 Eylül 2026)

Kullanıcı fark etti: carousel modundaki gönderilerde Facebook'a hiç post gitmiyordu (`post-social.js` eski hali sadece `mode==='photo'` için Facebook'a atıyordu, carousel/reel modunda FB adımı sessizce atlanıyordu). Composio'da `FACEBOOK_CREATE_PHOTO_POST` tek foto atıyor, gerçek çoklu foto/kaydırmalı FB gönderisi için ayrı bir araç var: **`FACEBOOK_CREATE_MULTI_PHOTO_POST`** (`page_id`, `photo_urls[]`, `message` — dahili olarak fotoları `published:false` yükleyip tek `/feed` post'unda `attached_media` ile birleştiriyor). `lib-social.js`'e `postFacebookCarousel()`, `post-social.js`'e carousel modunda Facebook adımı eklendi. Reel modunda Facebook'a hâlâ video atılmıyor (ayrı format/yükleme işi, kapsam dışı bırakıldı, şimdilik sadece Instagram reel). 23 Eylül'de e-vize gönderisiyle uçtan uca test edildi, IG carousel + FB çoklu foto ikisi de başarılı.

## 24 Eylül 2026 günü

- 23 Eylül 17:00 için kurulan oturum-içi CronCreate tetiklenmedi (oturum kapanınca ölüyor, güvenme). "Vizesiz ülkeler" carousel'i 24 Eylül sabahı IG + FB (çoklu foto) olarak atıldı. Otomasyon aynı konuyu 23'ünde tek kapak görseliyle zaten paylaşmıştı.
- Yeni yazı: `kambocya-e-arrival-card-nedir-nasil-doldurulur` (vize, YouTube videosu gömülü, kapak `yt-kambocya/v1.png` yazısız hali). Sitede e-Arrival hiç geçmiyordu, gerçek boşluktu. Doğrulama: arrival.gov.kh ücretsiz, varıştan en fazla 7 gün önce, resmi anlatımda tüm yolcular. Giriş noktası (hava/kara/deniz) ayrımı yazıda bilerek yok.
- Site QA: 92 HTML, 3377 iç link/görsel, kırık yok (tek "hata" posts.html içindeki JS şablonu, yanlış pozitif). Canlı kritik sayfalar 200, konsol hatası yok, mobil damga şeridi doğru.
- e-Arrival sosyal gönderisi 17:03'e oturum-içi cron ile kuruldu (`scripts/tmp-earrival-social.json`, gönderilmeden önce `last_posted_slug` kontrol eder). Oturum kapanırsa gitmez.

## Otomatik hikaye kapatıldı (23 Eylül 2026)

Kullanıcı en son atılan 2 Instagram hikayesini "hatalıydı" diyerek sildi. Sebep: `daily-social.js` 16:9 (1200x675) blog kapağını olduğu gibi 9:16 hikaye olarak atıyordu. Otomasyondan hikaye adımı kaldırıldı (feed + Facebook devam ediyor). Hikaye ancak 1080x1920 özel tasarımla, elle atılır. İsteğe bağlı iyileştirme: kapaktan otomatik 9:16 hikaye üretici (bulanık arka plan + ortada kapak + başlık), henüz yapılmadı.

## YouTube video duyurusu → Facebook (23 Eylül 2026)

Kullanıcı yeni yayınladığı YouTube videosunu ("Kamboçya Vizesi Kaldırıldı mı? Büyük Deport Dalgası ve Yalan Haberler", `youtube.com/watch?v=9F6fgDcy4GM`) Gemini video analiziyle birlikte verdi, Facebook'ta duyuru istedi (SEO kancalı açıklama + metin sonunda site linki). `FACEBOOK_CREATE_POST` (`link` + `message`) kullanıldı: `link` alanı YouTube URL'i, FB kendi önizleme kartını (video başlığı/kapağı) otomatik oluşturuyor, ayrıca metnin sonuna `kambocya-vizesi-turkler-icin-e-vize-sureci` yazısının linki eklendi (konu örtüşüyor: turist e-vize, kapıda vize, e-Arrival Card). Bu akış `lib-social.js`'e `postFacebookLink({link, message})` olarak eklendi, ileride video duyurularında tekrar kullanılabilir. Yayınlandı: post `144062395450039_122283320438056880`.

## Sosyal medya (Composio)

Instagram (`instagram_warmus-musery`) ve Facebook sayfası (Yol Var Nizam Var) Composio MCP ile `scripts/post-social.js` üzerinden paylaşım yapılıyor (`composio-key.local.txt` gitignore'da). Görseller `social-content/` klasöründe, sıra ve altyazılar `social-content/captions.md` + `preview.html`. Kurallar: her gönderi önce kullanıcıya önizleme + onay, gönderi metninde site linki YOK. 19 Eylül 2026'da kullanıcı Instagram altyazılarına "Detaylar profildeki linkte." cümlesinin eklenmesini onayladı (bio'ya linki kendisi ekledi), Facebook altyazısında "profildeki linkte" cümlesi olmaz, yerine **Facebook gönderilerine site linki (https://www.gezicorn.com) eklenir** (kullanıcı 21 Eylül 2026 kuralı, `caption_facebook` ile ayrı metin), tire yok, sadece erkek figür. Paylaşılanlar: Kırgızistan (16 Eylül), Vietnam ve Tayland (19 Eylül). Sırada: Malezya, Hong Kong (ayrıca `social-content/captions.md` içinde Kazakistan, Özbekistan, Rusya, Kamboçya). Tayland altyazısındaki "kuru sezon başladı" yanlıştı (kuru sezon kasımda başlar), "yaklaşıyor" olarak düzeltildi; altyazılardaki mevsim/vize iddialarını atmadan önce kontrol et. Instagram'da silme aracı yok (Composio), yanlış gönderi kullanıcı tarafından uygulamadan silinir.

## Güncel tasarım: "Rota" sistemi (20 Eylül 2026, aşağıdaki NomadKit uyarlamasının yerine geçti)

Kullanıcı üç şablondan 2 (Harita, LocalGuide) ve 3'ü (Bavul, WanderMap) seçip harmanlanmasını, ayrıca 1'deki vize damgasını ve 3D bavul/pasaport parçalarını beğendiğini, benzerlerinin diğer sayfalarda da kullanılmasını istedi. Tüm site buna geçti: ortak stil `assets/gz.css` (cache için `?v=` sürümü, değişince artır), ayrıntılar `design/rota-DESIGN.md`. Palet teal/turuncu/sarı/ink, Bricolage Grotesque + Nunito Sans + IBM Plex Mono, 3px koyu çerçeve + sert gölge, bagaj etiketi kartlar (`.tagcard`), vize damgaları (`scripts/stamps.json` tek kaynak, ana sayfa + `/yazi/` + ilgili yazı başlığı), 3D varlıklar `assets/3d/*.webp` (Higgsfield), gerçek WebGL bavul `assets/3d/suitcase.glb` (ana sayfa hero). Yeniden yazılan sayfalar: index.html, danismanlik.html, posts.html, 404.html, `build-static.js` çıktıları (yazı sayfaları, `/yazi/` listesi, "Sıradaki durak" kutusu). Aşağıdaki eski renk/font bilgileri (Fraunces, `--gold` vb.) artık geçerli değil, admin.html hâlâ eski paletle.

## (Eski) NomadKit uyarlaması (19 Eylül 2026)

Kullanıcı designmd sitesinden NomadKit tasarım sistemini verdi ("yapay zeka gibi durmasın diye sitemiz, uyarlayabiliriz"). `design/nomadkit-DESIGN.md` içinde. Renk değişkenleri güncellendi (`--cream #FFFDF7`, `--paper #FFFFFF`, `--gold #D4A373` Sand, `--coral #0E7490` Ocean, `--teal #166534` Forest, lacivert korundu), tüm sayfalarda ve `scripts/build-static.js` CSS'inde. Aviasales widget düğmesi de sand. Yeni bileşen eklerken bu paleti kullan, mor/mavi gradient ve jenerik ortalanmış hero yok. Gerçek fotoğraf kapaklar, gerçek logo ve YouTube video embed'leri "yapay zeka görünümünü" azaltan öğeler, bunları koru.

## Kalıcı içerik kuralları (kullanıcı 19 Eylül 2026)

- **YouTube videosu:** Bir yazının konusuyla eşleşen video kanalda varsa `youtube_id` + `youtube_title` (+ gerekirse `youtube_note`) ile yazıya göm. Videosu olan konuda Instagram altyazısında "Videosu YouTube kanalımızda da var" de. Kanaldaki eski video güncel kuralla çelişiyorsa `youtube_note` ile açıkça belirt (Tayland videosu 60 gün diyor, güncel süre 30).
- **Reels önerisi:** Arada kullanıcıya yazılarla bağlantılı kısa reels/video fikri öner (`social-content/reels-fikirleri.md`).
- **Tarayıcı otomasyonu:** Playwright MCP (Microsoft resmi, `@playwright/mcp@0.0.82`, headless + isolated) kullanıcı düzeyinde eklendi, yeni oturumda araçlar görünür. Google hesabı gerektiren işler (Search Console vb.) kullanıcıya bırakılır.

## Marka adı ve reklam alanları (19 Eylül 2026)

- **Marka adı her yerde "Gezicorn".** Kullanıcı sitedeki "Yazan: Barbaros", MRZ şeridindeki BARBAROS ve benzeri kişisel ad kullanımlarından rahatsız oldu ("gezicorn ismini kullan her yerde"). Yazar bilgisi Organization "Gezicorn" (JSON-LD), yazar kutusu "Gezicorn", MRZ şeridi `P<TURGEZICORN<<SOLO<TRAVEL`. Yeni içerikte kişisel ad yazma, "biz/Gezicorn" de. Facebook sayfasının adı hâlâ "Yol Var Nizam Var" (kullanıcı Facebook'tan Gezicorn olarak değiştirmeli).
- **Reklam alanları:** yazı sayfalarında `banners` koleksiyonundaki `banner_left`, `banner_right` (180px, sadece ≥1300px geniş ekran) ve `banner_inline` (yazı başında yatay, mobilde de görünür); ana sayfada `banner_1/2` şeridi. Hepsi admin panelde Banner sekmesinden görsel/link/alt metinle açılır, "Reklam" etiketi ve `rel="sponsored"` otomatik. Yazı sayfaları Firestore REST ile okuyor, kapalı olan slot boş yer bırakmaz.
- **Ana sayfada anlamsız/yanlış metin yok:** MRZ şeridi (okunmaz gibi görünen harf dizisi), "Şu an için ideal: Kamboçya, Tayland (kuru sezon)" (eylülde yanlış), "canlı" istatistiği kaldırıldı; Taşkent kartı "e-vize" diyordu (Özbekistan vizesiz), Tayland kartı "kuru sezon başladı" diyordu, ikisi düzeltildi. `deals` kartlarına vize/mevsim iddiası yazarken doğrula.
- **Kapaksız kart:** listelerde kapağı olmayan yazı `img/covers/_default.jpg` ile aynı boyda görünür (grid bozulmasın).
- **Ekipman yazıları:** ilk kez yurt dışına çıkanlar için çanta, çadır, Decathlon alternatifleri ve bavul listesi yazıları eklendi; ileride affiliate (Amazon, Trendyol, Klook vb.) linkleri buralara konur.
- **YouTube kanal bannerı:** `brand/youtube-banner-2560x1440.jpg` (Higgsfield `gpt_image_2_5` ile kullanıcının video kapaklarından referansla üretilen sahne + `scratchpad/yt/compose.py` ile yazı). Eski banner krem tuval içinde küçük bir şerit olduğu için TV ve mobilde kötü görünüyordu. Güvenli alan 1546x423 (ortada), yazılar bunun içinde.

## Affiliate sistemi (19 Eylül 2026)

- Ortaklık programları `scripts/affiliates.json` içinde (`active: true` olanlar sitede görünür). Şu an: **Klook** (Travelpayouts kısa linki `https://klook.tpk.lv/E7wCjYCm`, kullanıcının hesabı onaylı). Yeni program onaylanınca buraya ekle (name, url, title, blurb, cta, active).
- Yazıya kutu koymak için Firestore'da `affiliate: 'klook'` (+ isteğe bağlı `affiliate_text`) alanını `update-post.js` ile yaz; kutu yazar kutusundan önce çıkar, "ortaklık bağlantısıdır" notu otomatik, linkler `rel="sponsored nofollow noopener"`. Klook kutusu Kamboçya, Tayland, Malezya, Hong Kong, Vietnam, Japonya, Güney Kore ve eSIM yazılarında. Ana sayfada "Önerdiklerimiz" bölümü aynı dosyadan dolar.
- Kullanıcı Travelpayouts Chrome eklentisini kurdu; derin linkleri (örn. Klook Angkor Wat sayfası) eklentiyle üretip gönderirse kutu linkini sayfaya özel yap.
- **Airalo (21 Eylül 2026): link değil TAVSİYE KODU** `DEPO1112`, kullanıcı hesap açarken "Tavsiye veya kupon kodu" alanına girmeli (kayıt sırasında). `affiliates.json` içinde `code` alanı var: yazı kutusunda kopyala düğmeli kod, ana sayfada kartta kod görünür. Bir yazıda birden fazla ortak için `affiliate: "airalo,klook"` (virgüllü). Şu an eSIM yazısında (`yurt-disinda-esim-kullanimi-nasil-calisir`) ve ana sayfada. Airalo'nun kullanıcıya verdiği indirim/kredi miktarını bilmiyoruz, yazma. Sosyal gönderide kodu yaz.
- **SafetyWing: vazgeçildi** (kullanıcı: "değmez"), tekrar önerme.
- Bekleyen başvurular: Surfshark, NordVPN. Onay gelince `affiliates.json`'a ekle, ilgili yazılara `affiliate` alanı ver.

## Ülke uygulamaları gönderileri (19 Eylül 2026)

- `social-content/apps/build_slides.py` (gitignore'da, yerel): iki ülke için 8 karelik kaydırmalı gönderi (1080x1350) ve reel karesi (1080x1920) üretir; uygulama ikonları iTunes Search/Lookup API'den (resmi mağaza ikonu). `make_music.py` telifsiz sentez müzik, `make_video.py` geçişli MP4 (imageio-ffmpeg). Yeni ülke eklemek için `SETS` sözlüğüne 6 uygulama ekle (id = App Store trackId, isimleri ve özellikleri doğrula).
- `scripts/post-social.js` artık `carousel_images` (herkese açık JPEG URL listesi, sadece Instagram) ve `video_url` (reel, MP4, müzik videonun içinde) destekliyor. Görselleri önce `img/social/` altına koyup push'la, URL'ler 200 dönmeli.
- Yayınlananlar: Kırgızistan kaydırmalı (19 Eylül 13:40), Kamboçya reel (19 Eylül 19:10, kullanıcı beğenmedi: otomatik kayıyor, kullanıcı kendi kaydırmak istiyor; uygulamadan silmesi gerekir), Kamboçya kaydırmalı (20 Eylül). **Kural: uygulama/liste gönderileri kaydırmalı carousel olur, kendiliğinden kayan reel yapma.** Reel gerekiyorsa gerçek çekim ya da kısa animasyon + kullanıcının sesi. Zamanlayıcı görevi kaldırıldı.
- Detay yazıları: `kirgizistanda-ise-yarayan-uygulamalar-taksi-yemek-harita`, `kambocyada-ise-yarayan-uygulamalar-tuktuk-yemek-odeme`.

## Yeni tasarım şablonları (20 Eylül 2026)

Kullanıcı DesignMD/açık kaynak tasarımlardan 3 yeni şablon istedi (3D destekli). Artifact: https://claude.ai/artifact/YRjxQ8LHiwpbvZRFZvM9va (kaynak `scratchpad/d3/template.html`): 1 Pasaport (ResortLux: lacivert/altın/fildişi, Instrument Serif, vize damgaları, 3D pasaport render), 2 Harita (LocalGuide: turuncu/turkuaz/sarı, Bricolage Grotesque, 3D küre + dönen uçak), 3 Bavul (WanderMap: turkuaz/mercan, bento, bagaj etiketi kartlar, gerçek WebGL 3D bavul GLB). DesignMD MCP gerçek API anahtarı olmadan kit içeriğini indirmiyor (`Authentication required`), sadece arama çalışıyor. Kullanıcı seçince siteye uygulanacak. 3D varlıklar: Higgsfield `gpt_image_2_5` (transparent arka plan) ve `image_to_3d` (GLB, texture 768px'e küçültülerek ~1MB). Passport GLB kötü çıktı (yan yatık/lekeli), bavul GLB iyi.

## Yasal sayfalar ve çerez onayı (21 Eylül 2026)

Kullanıcı "gizlilik politikası, hata sayfası, çerezler vesaire eksiklerimizi ayarla" dedi. Eklenenler:
- **Sayfalar:** `/gizlilik/` (KVKK aydınlatma dahil), `/cerez-politikasi/`, `/kullanim-kosullari/` (sorumluluk reddi, ortaklık açıklaması), `/hakkimizda/`, `/iletisim/`. Kaynak `scripts/build-legal.js` (Firestore gerekmez): metni orada değiştir, `node scripts/build-legal.js && node scripts/build-static.js`, push. Aynı script index/danismanlik/posts/404 altbilgisini (`<!--FOOT_START-->` işaretçisi) yeniler. Ortak altbilgi ve sürüm numarası `scripts/site-parts.js` (`CSS_V`, `gz.css` ve `consent.js` değişince artır). Sitemap'e build-static ekliyor.
- **Çerez onayı:** `assets/consent.js` (tercih localStorage `gz_consent`, 12 ay). Gerekli depolama her zaman açık, "ortak içerik" kapalı başlar. Şu an tek izne bağlı öğe: ana sayfadaki uçak bileti kutusu (Travelpayouts), izin yoksa `.consent-slot` bilgi kutusu görünür (`data-consent-script` ile sonradan yüklenir). Yeni üçüncü taraf betik (analiz, reklam vb.) eklenirse aynı kalıpla izne bağla ve çerez politikası tablosunu güncelle. Analiz/reklam çerezi kullanılmıyor, yazılarda YouTube sadece oynat'a basınca yükleniyor.
- **İletişim sayfası** e-posta/WhatsApp/Telegram'ı Firestore `settings/consultancy` dokümanından okur, boşsa göstermez. **E-posta henüz boş:** admin panelden doldurulunca KVKK başvuru kanalı da netleşir.
- **Hata sayfaları:** `404.html` vardı (altbilgi ve çerez betiği eklendi), `posts.html` yükleme hatası mesajı bağlantılı hale getirildi. `vercel.json`'a `X-Frame-Options` ve `Permissions-Policy` başlıkları eklendi (CSP eklenmedi, sayfalarda inline betik çok).
- Metinler hukuk danışmanı yazısı değil, standart şablon; yetkili mahkeme/uyuşmazlık maddesi bilerek yok, şirket unvanı/adres/sicil bilgisi uydurulmadı.
- Google Fonts ve cdnjs (Font Awesome) üçüncü taraftan yükleniyor, gizlilik politikasında IP aktarımı olarak belirtildi. İleride kendi sunucuya alınabilir.

## Yönetim paneli bilgisi

Panel giriş bilgileri `admin/PANEL-GIRIS.txt` dosyasında (klasör `.gitignore`'da, GitHub'a çıkmaz). Panel: `https://www.gezicorn.com/admin.html`, sadece şifre. Instagram, YouTube ve Facebook sosyal butonları `social_links` koleksiyonunda aktif (Telegram ve Kick kapalı).

## Deploy durumu

- **GitHub:** https://github.com/depofiti-design/gezicorn-site (main branch)
- **Vercel:** proje adı `gezicorn`, takım `depofiti-1840s-projects`, GitHub reposuna bağlı — her `git push` otomatik yeni deploy tetikler
- **Canlı URL:** https://www.gezicorn.com (Spaceship'ten alındı, 19 Eylül 2026'da Vercel'e bağlandı; apex `gezicorn.com` 308 ile www'ye yönleniyor; DNS: `@` A 76.76.21.21, `www` CNAME cname.vercel-dns.com). Eski `gezicorn-depofiti-1840s-projects.vercel.app` ve `aaaa-eta-gray.vercel.app` hâlâ çalışıyor.
- Yerelde `.vercel/` klasörü var (proje linki), `.gitignore`'a eklendi.
- **Önemli:** Vercel projesinde varsayılan olarak "SSO/Vercel Authentication" koruması açıktı (`.vercel.app` adresleri özel domain bağlanana kadar sadece Vercel hesabı olanlara görünüyordu, gerçek ziyaretçiler giriş ekranıyla karşılaşıyordu). Bu kapatıldı (`vercel project protection disable gezicorn --sso`), site artık tamamen herkese açık.

## Kalan işler (henüz yapılmadı)

Kullanıcı 21 Ağustos 2026'da "sadece domain almak kalsın, buna göre ayarla" dedi — o hedefe göre geriye kalanlar, hepsi **kullanıcının kendi dolduracağı gerçek bilgi** gerektiriyor, kod/tasarım eksiği değil:

- [x] **Domain** — gezicorn.com alındı ve bağlandı (19 Eylül 2026), sitemap/robots/generate-sitemap.js `https://www.gezicorn.com`'a çevrildi. Sosyal medyada "site linki koyma" kuralı, kullanıcı linkleri eklemeye başlayalım diyene kadar geçerli (kullanıcı: "domain alacam, sonra ekleriz linkleri"); link eklenecekse adres `https://www.gezicorn.com`.
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

## Günlük Search Console raporu (24 Eylül 2026)
`scripts/gsc-report.js` + `.github/workflows/gsc-report.yml` (06:30 UTC): Search Console API'den son 7 gün vs önceki 7 gün raporu üretir, `seo-reports/latest.md` ve tarihli dosyaya commit'ler. Servis hesabı `gsc-repor@gezicorn-seo.iam.gserviceaccount.com` (GCP projesi gezicorn-seo, GSC'de Restricted), anahtar GitHub secret `GSC_SA_KEY`, yerelde `scripts/gsc-sa.local.json` (gitignore). Mülk `sc-domain:gezicorn.com`. Veri ~3 gün gecikmeli. "SEO raporuna bak" denince `seo-reports/latest.md` oku, 8-20. sıradaki sorgular ve tıksız 1-5. sıra sorgular için başlık/meta/içerik düzelt. Not: anahtar bir kez sohbete yapıştırıldı, istenirse GCP'den silinip yenilenir.
