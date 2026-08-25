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
   - İçerik alanı (`content`) düz metin, paragraflar arasında boş satır, **kalın** için çift yıldız
     kullanılabilir (post.html bunu render ediyor).
   - `excerpt`: kart üzerinde görünen 1-2 cümlelik özet.
   - `slug`: küçük harf, Türkçe karaktersiz, tire ile ayrılmış kebab-case (örn: `vize-ucretleri-neden-artiyor`).
     Mevcut sluglarla çakışmasın (script zaten kontrol ediyor, ama önceden bakmak iyi olur).
   - `cover_image`: yok, `null` bırak (görsel üretimi bu akışın kapsamında değil).

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

5. `node scripts/generate-sitemap.js` çalıştır, sitemap.xml'i güncelle.

6. Değişiklikleri commit'le ve push'la:
   ```
   git add sitemap.xml
   git commit -m "Günlük içerik: <bugünün başlığı>"
   git push
   ```
   (Post/deal zaten Firestore'a yazıldığı için index.html/posts.html anında günceldir, git'e sadece
   sitemap.xml gider. Vercel bu push'ta yeniden deploy tetikleyecek ama içerik zaten Firestore'dan
   canlı okunduğu için deploy beklemeden de görünür.)

## Sınırlar / yapma

- `firsat` kategorisine otomatik yazı ekleme.
- `deals` koleksiyonuna type=gear ekleme (gerçek ürün/link gerektirir, kullanıcı elle ekleyecek).
- `posts`/`deals` koleksiyonlarından hiçbir kaydı SİLME veya var olanı DÜZENLEME, sadece ekle.
- seed.html'i tekrar çalıştırma.
- Günde 1'den fazla post ekleme (spam görünümü + kalite düşüşü riski).
