# Günlük içerik görevi

Bu talimat, gezicorn-site için her gün otomatik çalışan içerik ekleme rutinidir.
Çalıştıran ajan (Claude) bu dosyayı okuyup adımları sırayla uygular.

## Adımlar

1. `cd scripts && node list-posts.js 20` çalıştır, son 20 yazının başlık/kategorisini gör.
   Bugünün konusu bunlarla **aynı olmasın**, kalıp/kelime tekrarından kaçın.

2. Bugün için **1 yeni post** üret. Kategoriyi şu sırayla döndür (son eklenenin kategorisine bakıp sıradakini seç):
   `haber → vize → rehber → haber → vize → rehber → ...`
   (vize ve rehber ~29+9 yazıyla zaten en kalabalık, haber ile dengeyi koru; firsat kategorisine
   otomatik yazı ekleme, o kategori gerçek fırsat duyuruları için ayrılmış.)

   **Editoryal kurallar (CLAUDE.md'den, kesinlikle uy):**
   - Metinde tire (—) KULLANMA. Nokta, virgül, iki nokta üst üste ile böl.
   - `haber` kategorisi: doğrulayamayacağımız spesifik/tarihli iddia yazma
     ("X ülke Y tarihinde vize kuralını değiştirdi" gibi cümleler YASAK).
     Sadece uzun süredir bilinen yapısal gelişmeler (dijital vize sistemleri, vize ücret
     trendleri, konsolosluk randevu sistemleri, seyahat sigortası, pasaport yenileme gibi genel
     konular) ve her yazının sonunda "güncel durumu resmi kaynaktan teyit et" uyarısı.
   - `vize`/`rehber` kategorisi: genel, zamanla değişmeyecek yapısal bilgi ver (vize türleri,
     pasaport kategorileri, genel süreç anlatımı). Spesifik ücret/süre rakamı verme, rakamlar
     çabuk eskir; "güncel bilgi için resmi kaynağa bak" notu ekle.
   - Ton: samimi, gerçek, yapay zeka şablonu gibi değil. Kısa cümleler.
     YouTube kanalı (@gezikorn) analizi: en çok izlenen içerikler pratik "gitmeden bil" konuları (e-vize başvurusu,
     ülkeye gidiş süreci, kalacak yer, banka/ödeme, işe yarayan uygulamalar, market fiyatları, güvenli mi?).
     Konuları bu ihtiyaçlara yakın seç, birinci ağızdan ama uydurma anı olmadan yaz.
   - **Anlatım çeşitliliği:** her yazı FAQ/bilgi listesi tarzında olmasın. Yaklaşık her 4 yazıdan
     birini birinci ağızdan, "bir gün şöyle oldu" tarzı kısa bir hikaye/anı olarak yaz (yine gerçek,
     doğrulanabilir bir çerçevede, uydurma detay olmadan), geri kalanı normal bilgilendirici tarzda kalsın.
   - **SEO yapısı (zorunlu, kullanıcı 19 Eylül 2026'da "Google, Yandex ve AI asistanlarında çıkacak düzeyde" istedi):**
     - `title`: 60 karakteri geçmesin, aranan ifadeyi başa koy ("Kırgızistan Vizesi 2026: ..." gibi), tırnak/tire yok.
     - `excerpt`: 140 ile 160 karakter, aranan ifadeyi ve net cevabı içeren tek cümle (meta description olarak kullanılır).
     - `content` hafif markdown, sitede statik HTML'e çevrilir (`scripts/build-static.js`):
       - İlk satır `> **Kısaca:** ...` ile başlayan 1 ile 2 cümlelik doğrudan cevap (AI asistanları ve öne çıkan snippet buradan alır).
       - Sonra 3 ile 6 arası `## Başlık` bölümü (H2), gerekirse `### Alt başlık`. Madde işareti için `- `, sıralı adım için `1. `.
       - Sondan bir önceki bölüm `## Sık sorulan sorular`, altında 2 ile 4 adet `### Soru?` + 1 ile 2 cümlelik cevap paragrafı (FAQPage schema'ya dönüşür).
       - En az 2 iç link: `[bağlantı metni](/yazi/baska-yazinin-slugi/)`. Sadece mevcut slug'lara link ver (`node list-posts.js 80` ile bak).
       - Tek dış link: `[T.C. Dışişleri Bakanlığı](https://www.mfa.gov.tr)` resmi kaynak notu.
       - En az 350 kelime, tekrarlayan kalıp cümlelerden kaçın. **kalın** için çift yıldız.
     - Ülke/vize bilgisi yazacaksan rakamı ancak WebSearch/WebFetch ile doğruladıysan ve "Eylül 2026 itibarıyla" gibi tarihle yaz; doğrulayamıyorsan rakam verme. Hatalı vize bilgisi güveni bitirir (19 Eylül 2026'da Japonya, Güney Kore, Hong Kong ve Kırgızistan yazılarındaki yanlışlar bu yüzden düzeltildi).
   - `slug`: küçük harf, Türkçe karaktersiz, tire ile ayrılmış kebab-case (örn: `vize-ucretleri-neden-artiyor`).
     Mevcut sluglarla çakışmasın (script zaten kontrol ediyor, ama önceden bakmak iyi olur).
   - **YouTube videosu:** yazının konusu kanalda anlatılmışsa (Rusya, Tayland, Kırgızistan, Bangkok, market fiyatları, banka/döviz, kalacak yer) ve kullanıcı videonun ID'sini vermişse `youtube_id` alanını kullanıcı ekler, ajan uydurma ID yazmaz.
   - `cover_image`: bu akışta görsel üretilmez, `null` bırak. Kullanıcı kapak görselini Higgsfield ile sonradan üretir
     (`process-cover.py` + `update-post.js`). Kapak yoksa sayfa yine de varsayılan `og-default.png` ile paylaşılır.

3. Yazıyı bir JSON dosyasına yaz (örn. `scripts/tmp-post.json`), sonra:
   ```
   node scripts/add-post.js scripts/tmp-post.json
   ```
   Başarılıysa geçici JSON dosyasını sil.

4. Haftada bir (haftanın ilk çalıştırmasında, ya da son 7 günde deals'a hiç ekleme yapılmadıysa)
   **1 yeni type=flight fırsat kartı** ekle. İstanbul çıkışlı, gerçekten uçulabilen bir rota seç
   (örn. Roma, Almatı, Bangkok, Kuala Lumpur, Taşkent, Tiflis gibi), uydurma fiyat YAZMA
   (`old_price`/`new_price` boş bırakılabilir, kart zaten "canlı fiyata bak" CTA'sı gösteriyor,
   bkz. index.html #gearDeals mantığı). `discount_label` da yoksa boş bırak.
   ```
   node scripts/add-deal.js scripts/tmp-deal.json
   ```
   type=gear EKLEME, o gerçek ürün/affiliate linki gerektirir ve bu otomasyonun kapsamı dışında.

5. **Statik sayfaları üret** (yeni yazı `yazi/<slug>/index.html` olarak yayınlanır, sitemap ve ana sayfa "Son yazılar" da güncellenir):
   ```
   node scripts/build-static.js
   ```
   "N yazı sayfası ... üretildi" satırını gör. Hata varsa commit'leme.

6. Değişiklikleri commit'le ve push'la:
   ```
   git add yazi sitemap.xml index.html img
   git commit -m "Günlük içerik: <bugünün başlığı>"
   git push
   ```
   Vercel push'ta deploy eder, yazı deploy bitince `https://www.gezicorn.com/yazi/<slug>/` adresinde yayına girer
   (Firestore'a yazılan içerik tek başına yetmez, sayfa statik üretilip push'lanmalı, aksi halde Google göremez).

## Sınırlar / yapma

- `firsat` kategorisine otomatik yazı ekleme.
- `deals` koleksiyonuna type=gear ekleme (gerçek ürün/link gerektirir, kullanıcı elle ekleyecek).
- `posts`/`deals` koleksiyonlarından hiçbir kaydı SİLME veya var olanı DÜZENLEME, sadece ekle. (Mevcut yazıları güncellemek kullanıcı ile yapılan ayrı bir iştir: `update-post.js`.)
- seed.html'i tekrar çalıştırma.
- Günde 1'den fazla post ekleme (spam görünümü + kalite düşüşü riski).
- **Instagram/Facebook'a otomatik gönderi atma.** Sosyal medya paylaşımı (`scripts/post-social.js`,
  `scripts/lib-social.js`) bu günlük rutinin parçası DEĞİL, kasıtlı olarak ayrı tutuluyor. 17 Eylül
  2026'da bozuk Türkçe karakter ve yanlış cinsiyette görsel içeren gönderiler otomatik/incelemesiz
  gittiği için kullanıcı önce önizleme (Artifact ile "sanki paylaşılmış gibi" mockup) isteyip onaylama
  akışına geçti. Sosyal medyaya HER gönderi önce kullanıcıya önizleme olarak gösterilip onay alınmadan
  atılmamalı, bu günlük ajan tarafından tetiklenmemeli.
