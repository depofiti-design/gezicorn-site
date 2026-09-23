# Günlük sosyal medya otomasyonu

Günlük içerik rutini (`DAILY_CONTENT.md`, Claude Code cloud rutini, 06:00 UTC) her gün yeni bir
yazı ekledikten sonra, bu yazıyı sosyal medyaya taşıyan **ikinci, bağımsız bir mekanizma** var:

## Temel akış (otomatik, her gün çalışır)

**`.github/workflows/daily-social.yml`** (GitHub Actions, `0 7 * * *` = 07:00 UTC, günlük içerik
rutininden 1 saat sonra) **`scripts/daily-social.js`**'i çalıştırır. Bu betik LLM kullanmaz,
tamamen deterministiktir:

1. Firestore'daki en yeni yayında (`published:true`) yazıyı bulur.
2. `settings/social_automation.last_posted_slug` ile karşılaştırır, aynı yazı daha önce
   paylaşıldıysa atlar (çift paylaşım engeli).
3. Yazı 36 saatten eskiyse atlar (günlük içerik rutini o gün çalışmadıysa boşa eski yazıyı
   paylaşmasın diye).
4. Yazının `> **Kısaca:** ...` cümlesini (yoksa `excerpt`'i) alıp şablonla Instagram ve Facebook
   altyazısı üretir (Facebook'a `https://www.gezicorn.com/yazi/<slug>/` linki eklenir, Instagram'a
   "profildeki linkte" + kategoriye göre hashtag). Kapak görseli varsa onu, yoksa `og-default.png`'yi
   kullanır (**bu akış kapak üretmez**).
5. `lib-social.js` ile Instagram feed + Facebook feed olmak üzere **2 gönderi** atar (kullanıcının
   22 Eylül 2026'da istediği "günlük en az 2 post" şartını karşılar). **Hikaye artık otomatik atılmıyor**
   (23 Eylül 2026): 16:9 blog kapağı 9:16 hikayeye kötü kırpılıyordu, kullanıcı iki hikayeyi sildi.
   Hikaye gerekirse 1080x1920 özel tasarımla elle atılır (`postInstagramStory`, `social-content/stories2/`).
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
