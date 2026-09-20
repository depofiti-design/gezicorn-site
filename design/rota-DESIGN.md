# Gezicorn "Rota" tasarım sistemi (20 Eylül 2026)

Kullanıcı DesignMD'den şu üç yönden ikisini seçti: 2 Harita (LocalGuide) ve 3 Bavul (WanderMap), ayrıca 1 Pasaport'taki vize damgası ve 3D bavul/pasaport parçalarını sevdi. Sonuç bu harman sistem. Kod: `assets/gz.css` (ortak), sayfaya özel stiller sayfada ya da `scripts/build-static.js` içinde.

## Karakter
Kalın 3px koyu çerçeve, sert ofset gölge (5px 5px 0), yuvarlak köşe (20 ile 34px), teal ve turuncu ağırlıklı, sarı vurgu. Başlıklarda `mark` ile turuncu vurgu. Kartlar bagaj etiketi gibi (üstte delik), rozetler vize damgası gibi.

## Renk
- Ink `#0B2B2B` (çerçeve ve metin), Teal `#0F766E` (hero, birincil yüzey), Turuncu `#F97316` (eylem), Sarı `#FACC15` (vurgu, hover), Sky `#0EA5E9` (dekor), Zemin `#FFFBF5`, Mint `#E6FAF5`, Kum `#FEF3C7`, Şeftali `#FFEDD5`.
- Turuncu metin gerekiyorsa `#C2410C` (kontrast). Turuncu zeminde koyu (ink) yazı.

## Tipografi
Bricolage Grotesque 800 (başlık, sıkı letter-spacing), Nunito Sans (gövde), IBM Plex Mono (etiket, damga alt yazısı, tarih).

## Bileşenler
`.gz-nav`, `.btn` (.alt .teal .yl), `.card`, `.chip` (.vize .rehber .firsat .haber), `.tagcard` (bagaj etiketi yazı kartı), `.stamp` (.e = e-vize, turuncu), `.stamps` grid, `.gz-foot`, `.ad`.

## 3D varlıklar (`assets/3d/`)
Higgsfield `gpt_image_2_5` ile şeffaf arka planlı 3D render (webp): passport, globe, suitcase, compass, plane, backpack, ticket, phone, pin, camera, tuktuk, yurt, stampobj. `suitcase.glb` gerçek WebGL modeli (Higgsfield image_to_3d, texture küçültülmüş), ana sayfa hero'sunda three.js ile dönüyor, yüklenemezse `suitcase.webp` görünür. Yeni render eklemek için aynı stil isteminden ("soft glossy claymorphism style, studio lighting, no text, isolated on transparent background") üret.

## Vize damgaları
`scripts/stamps.json` tek kaynak: ana sayfa, `/yazi/` listesi ve ilgili yazının başlığındaki damga buradan üretilir. Vize kuralı değişince önce yazıyı doğrula, sonra buraya işle ve `node scripts/build-static.js` çalıştır.
