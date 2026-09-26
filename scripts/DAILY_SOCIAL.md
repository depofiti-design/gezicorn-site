# Günlük sosyal medya otomasyonu

Günlük içerik rutini (`DAILY_CONTENT.md`, Claude Code cloud rutini, 06:00 UTC) her gün yeni bir
yazı ekledikten sonra, bu yazıyı sosyal medyaya taşıyan **ikinci, bağımsız bir mekanizma** var:

## Temel akış (otomatik, her gün çalışır)

**`.github/workflows/daily-social.yml`** (Node + Python/Pillow, `contents: write`; elle çalıştırırken `force_slug` ve `dry_run` girdileri var) (GitHub Actions, `0 7 * * *` = 07:00 UTC, günlük içerik
rutininden 1 saat sonra) **`scripts/daily-social.js`**'i çalıştırır. Bu betik LLM kullanmaz,
tamamen deterministiktir:

1. Firestore'daki en yeni yayında (`published:true`) yazıyı bulur.
2. `settings/social_automation.last_posted_slug` ile karşılaştırır, aynı yazı daha önce
   paylaşıldıysa atlar (çift paylaşım engeli).
3. Yazı 36 saatten eskiyse atlar (günlük içerik rutini o gün çalışmadıysa boşa eski yazıyı
   paylaşmasın diye).
4. Yazının `> **Kısaca:** ...` cümlesini (yoksa `excerpt`'i) alır. `scripts/social-image.py` ile **iki görsel üretir**:
   feed **1080x1350 (4:5 dikey)** ve hikaye **1080x1920 (9:16)**. Kapak varsa çerçeveli görsel, yoksa kategoriye uygun 3D nesne
   (`assets/3d`). **Yatay 16:9 kapak ya da `og-default.png` ASLA doğrudan feed/hikaye olmaz** (kullanıcı 23 ve 26 Eylül 2026'da iki kez
   şikayet etti). Görseller `img/social/auto/<slug>-feed.jpg` ve `-story.jpg` olarak commit'lenip push'lanır, sitede 200 dönene kadar
   beklenir (Instagram/Facebook herkese açık URL ister). Görsel üretilemezse hiçbir şey paylaşılmaz, çalışma hata verir.
5. `lib-social.js` ile **3 gönderi**: Instagram feed (4:5), Facebook feed (aynı görsel + site linki), Instagram hikaye (9:16).
   Altyazı şablonludur (Instagram "profildeki linkte" + hashtag, Facebook site linki).
6. `settings/social_automation`'ı günceller.

Composio API anahtarı GitHub repo secret'ı (`COMPOSIO_API_KEY`, `gh secret set` ile eklendi,
`scripts/composio-key.local.txt` gitignore'da kalmaya devam ediyor, sadece yerel kullanım için).
Bu betik hem yerelde (dosyadan) hem Action'da (secret'tan) çalışır, `lib-social.js`'teki
`process.env.COMPOSIO_API_KEY || readFileSync(...)` satırı ikisini de destekler.

**Neden Claude Code cloud rutini değil de GitHub Actions:** Claude Code rutinleri (`RemoteTrigger`/
`schedule` skill) trigger config'ine ortam değişkeni/secret koymayı desteklemiyor ("environment_variables
is not supported on triggers"), repo da public olduğu için anahtarı koda gömmek mümkün değildi.
GitHub Actions secret'ı bu ihtiyacı güvenli karşılıyor, ayrıca Claude kotası harcamıyor.

## Zenginleştirilmiş akış (isteğe bağlı, Claude elle yapar)

Kullanıcı ya da Claude bir günün yazısını daha özel bir gönderiyle (Higgsfield ile üretilmiş kapak/
carousel, elle yazılmış çeşitli altyazı, hikaye tasarımı) desteklemek isterse, bunu bu dosyanın eski
sürümündeki gibi elle yapabilir (bkz. `social-content/apps/build_rota.py` örnek şablonu, 21-22 Eylül
2026'daki Tayland ve konsolosluk gönderileri gibi). **Bunu yaptıktan sonra mutlaka
`settings/social_automation.last_posted_slug`'ı o günün slug'ına elle güncelle** (Firestore konsolundan
ya da küçük bir script'le), yoksa ertesi gün GitHub Actions aynı yazıyı bir daha (şablon altyazıyla)
paylaşır.

## Sınırlar / yapma

- Kapak görselinde insan/karakter olmasın (17 Eylül 2026'daki yanlış cinsiyette görsel sorunundan sonra
  kesinleşen kural, elle üretilen kapaklarda geçerli).
- `posts`/`deals` koleksiyonuna bu akıştan yazı ekleme.
- `composio-key.local.txt`'i commit'leme, API anahtarını çıktıya yazdırma.
- Günde bu betikten fazladan çalıştırma yapma (zaten `last_posted_slug` kontrolü engelliyor).
