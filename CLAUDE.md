# Gezicorn — Proje Bağlamı

## Proje nedir

Gezicorn — Barbaros'un YouTube (@gezikorn) ve Instagram gezi/vize içerik kanalına bağlı bir blog + affiliate sitesi.

**İçerik odağı:** Vize kuralları (hangi pasaportla nereye vizesiz gidilir, Avrupa vizesi red sebepleri vb.), genç gönüllü projeleri/fırsatlar, gezi rehberleri (özellikle Orta Asya + Güneydoğu Asya rotası). Affiliate olarak uçak bileti ve kamp/gezi ürünleri satışı da hedefleniyor.

**Barbaros'un gerçekten gittiği 8 ülke** (site içeriğinde ve globe pin'lerinde bunlar kullanılıyor): Kırgızistan (ikamet), Kazakistan, Özbekistan, Rusya, Tayland, Malezya, Hong Kong, Kamboçya.

## Tasarım dili — DEĞİŞTİRİLMEMELİ

Uzun bir mockup sürecinden sonra netleşen, onaylanmış tasarım:

- **Tema:** "Pasaport & sıcak fırsat vitrini" — lacivert (`#141F38`/`#0B1326`) + krem (`#F6F1E4`/`#FCFAF4`) + altın (`#E0A526`) + mercan/coral (`#E3512E`) + çamur yeşili (`#2F8C74`)
- **Tipografi:** Fraunces (serif, başlıklar) + IBM Plex Sans (gövde) + IBM Plex Mono (rakamlar, etiketler, rota kodları)
- **İmza görsel öğe:** Hero'da dönen bir "globe" — SVG meridyen çizgileri yavaşça dönüyor, gidilen 8 ülke sabit pin olarak duruyor. "Bas döndür" butonu globe'u hızlandırıp yanındaki kutuda rastgele bir sıcak bilet fırsatı gösteriyor (slot machine efekti)
- Damga/pasaport motifleri (dashed circle "ONAYLI ROTA" damgası), rozet tarzı kategori etiketleri
- **Kaçınılması gereken:** Mor-mavi gradient, ortalanmış generic hero, "AI yaptı" hissi veren şablon görünüm

Bu tasarım claude.ai'de (farklı bir sohbette) kullanıcıyla adım adım onaylandı — kullanıcı "harika olmuş, buna uygun yapalım" dedi. Tasarımı sorgulamadan bu temel üzerine inşa et.

## Tech stack

- **Frontend:** Düz HTML/CSS/JS (framework yok, build adımı yok)
- **Veritabanı:** Firebase Firestore (Supabase'den geçildi — kullanıcı Supabase free plan proje limitine takıldı, bütçe kısıtı nedeniyle ücretsiz kalması gerekiyordu)
- **Hosting:** Vercel (henüz bağlanmadı — bir sonraki adım)
- **GitHub:** `depofiti-design` organizasyonu altında (henüz repo oluşturulmadı — bir sonraki adım)

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

## Dosyalar ve ne işe yaradıkları

- **`index.html`** — canlı site. Firestore'dan posts/deals/countries/route_recommendations/banners/social_links okuyor.
- **`admin.html`** — şifreli yönetim paneli (şifre: `gezicorn2025`, kullanıcı isterse değiştirir). Yazı ekleme, fırsat ekleme, 2 banner slotu (aktif/pasif), 4 sosyal medya linki (Telegram/Instagram/YouTube/Kick — hepsi varsayılan **pasif**, sitede görünmesi için kullanıcı admin'den aktif etmeli).
- **`seed.html`** — TEK SEFERLİK çalıştırıldı, başlangıç verisini (8 ülke, 4 rota önerisi, boş banner/sosyal doküman) yükledi. **Bir daha çalıştırılmamalı** (tekrar basılırsa ülkeler/öneriler ikinci kez eklenir, kopya veri oluşur). Repoya dahil etmeye gerek yok, arşiv olarak tutulabilir.
- **`firestore-yapisi.md`** — Firestore koleksiyon şeması dokümantasyonu.

## Firestore koleksiyonları

- `posts` — title, slug, category (vize/firsat/rehber), excerpt, content, cover_image, published, created_at
- `deals` — type (gear/flight), title, route_from, route_to, old_price, new_price, discount_label, affiliate_url, active, created_at
- `banners` — sabit 2 doküman: `banner_1`, `banner_2` (image_url, link_url, alt_text, active)
- `social_links` — sabit 4 doküman: `telegram`, `instagram`, `youtube`, `kick` (url, follower_label, active)
- `countries` — name, visited, visa_status, duration_days, pin_x, pin_y (globe koordinatları)
- `route_recommendations` — budget_min, budget_max, destination, note, estimated_price, active

## Önemli mimari kararlar (neden böyle yapıldı)

1. **Uçak bileti fiyatları canlı olmalı** — kullanıcı "fiyatların güncel olması lazım" dedi. Çözüldü: `index.html`'deki `#flightWidget` div'inde artık **Aviasales "Flights Search Form" widget'ı** (Travelpayouts ortaklık ağı üzerinden, `tpwdgt.com` script'i) çalışıyor — kalkış İstanbul (IST) önceden dolu, para birimi USD, buton rengi site temasına (gold/navy) özelleştirildi, `promo_id=3414&campaign_id=111`. Fiyatlar tamamen canlı/otomatik, Firestore'a elle girilmiyor. Not: Travelpayouts'un "Drive" adlı otomatik monetizasyon aracı denendi ama CORS hatası nedeniyle çalışmadığı için kaldırıldı — bunun yerine klasik widget kullanıldı.
2. **Kamp/gezi ürünü fırsatları manuel** — bunlar sık değişmiyor, admin panelden elle girilip güncelleniyor (`deals` koleksiyonu, type=gear).
3. **Sosyal medya ikonları varsayılan gizli** — kullanıcı "panelde dursun ama sitede görünmesin, ben aktif ettiğimde görünsün" dedi. Bu yüzden `social_links` hepsi `active: false` ile başlıyor.
4. **Banner'lar da aynı mantıkla varsayılan pasif.**
5. **Rota planlayıcı** — bütçe + gün girip destinasyon önerisi alan özellik, `route_recommendations` koleksiyonundan JS ile eşleştiriliyor (aralık sorgusu Firestore'da index gerektirmesin diye tüm aktif kayıtlar çekilip client-side filtreleniyor).

## Deploy durumu

- **GitHub:** https://github.com/depofiti-design/gezicorn-site (main branch)
- **Vercel:** proje adı `gezicorn`, takım `depofiti-1840s-projects`, GitHub reposuna bağlı — her `git push` otomatik yeni deploy tetikler
- **Canlı URL:** https://gezicorn-depofiti-1840s-projects.vercel.app
- Yerelde `.vercel/` klasörü var (proje linki), `.gitignore`'a eklendi.
- **Önemli:** Vercel projesinde varsayılan olarak "SSO/Vercel Authentication" koruması açıktı (`.vercel.app` adresleri özel domain bağlanana kadar sadece Vercel hesabı olanlara görünüyordu, gerçek ziyaretçiler giriş ekranıyla karşılaşıyordu). Bu kapatıldı (`vercel project protection disable gezicorn --sso`), site artık tamamen herkese açık.

## Kalan işler (henüz yapılmadı)

- [ ] Domain (gezicorn.com veya .com.tr) — kullanıcı sonra alacak, Vercel'e bağlanacak
- [ ] "Tümünü gör" — tüm yazıları listeleyen bir blog index sayfası yok, şu an ana sayfada sadece son 3 yazı gösteriliyor
- [ ] Vize detay sayfası, öneriler/affiliate mağaza sayfası gibi ek iç sayfalar (tekil blog yazısı sayfası `post.html` olarak yapıldı)
- [ ] `deals` koleksiyonu hâlâ boş — kullanıcı admin panelden gerçek fırsatlar (kamp/gezi ürünleri) ekleyecek
- [ ] Firestore güvenlik kuralları hâlâ "test modu" (herkes okuyup yazabiliyor) — site artık herkese açık olduğu için ileride sıkılaştırmak gerekebilir

## Kullanıcı hakkında (ton/yaklaşım için)

Barbaros — freelance web geliştirici, Bişkek'ten Phnom Penh'e taşınma sürecinde, aynı anda iş değişikliği/bütçe kısıtları yaşıyor. Vercel+Supabase/Firebase+vanilla JS stack'ini birden fazla projede (TikoBey, BonusRota, kipzone, Perdeci TV) kullanmış, bu akışa aşina. Türkçe konuşuyor, adım adım, teknik ama sade anlatım tercih ediyor.
