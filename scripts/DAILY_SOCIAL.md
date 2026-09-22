# Günlük sosyal medya görevi

Bu rutin, günlük içerik rutininden (`DAILY_CONTENT.md`) sonra çalışır ve o gün eklenen yeni yazıyı
Instagram ve Facebook'a taşır. Çalıştıran ajan (Claude) bu dosyayı okuyup adımları sırayla uygular.
**Onay isteme, tüm akışı baştan sona kendi başına tamamla.**

## Adımlar

1. `cd scripts && npm install` çalıştır (bağımlılıklar gitignore'da, her çalıştırmada yeniden kurulmalı).
2. `node list-posts.js 3` ile bugün eklenen en yeni yazıyı bul (slug, title, excerpt, category).
   Firestore'dan `content` alanını da oku (yazının `> **Kısaca:** ...` satırı ve ilk 1-2 bölümü,
   caption için gerçek bilgiye dayanmak için).
3. **Kapak görseli yoksa üret:** yazının `cover_image` alanı boşsa (ya da `og-default.png` kullanıyorsa),
   Higgsfield MCP bağlantısını kullan (`generate_image`, model `soul_location`, `aspect_ratio: "16:9"`,
   prompt yazının konusuna uygun bir mekan/nesne sahnesi olsun, **kesinlikle "no text, no people"**
   içersin, yani insan yok, kimseyi betimleme; bu kural 17 Eylül 2026'daki yanlış cinsiyette görsel
   sorunundan sonra kesinleşti, asla ihlal etme). `jobs_wait` ile bekle, sonucu
   `python process-cover.py <slug> <result_url>` ile işle (1200x675 JPEG üretir), sonra
   `node update-post.js` ile Firestore'daki `cover_image` (`https://www.gezicorn.com/img/covers/<slug>.jpg`)
   ve `cover_alt` alanlarını yaz.
4. `node build-static.js` çalıştır, sonra kapak eklediysen `git add -A && git commit -m "Kapak: <başlık>" && git push`.
   Vercel deploy'un bitmesi için push'tan sonra **en az 40 saniye bekle**, sonra
   `curl -s -o /dev/null -w "%{http_code}" https://www.gezicorn.com/img/covers/<slug>.jpg` ile 200 döndüğünü doğrula,
   200 gelmiyorsa 20 saniye daha bekleyip tekrar dene (en fazla 3 deneme).
5. **Altyazıları yaz** (Türkçe karakterler doğru, UTF-8; JSON dosyasını Bash heredoc ile `cat > dosya.json <<'EOF' ... EOF`
   şeklinde yaz, shell escaping'e güvenme):
   - **Instagram altyazısı:** yazının "Kısaca" cevabına dayanan 2 ile 4 kısa cümle, gerçek bilgi, uydurma yok.
     Sonunda "Yazının tamamı profildeki linkte." (ya da "Detaylar profildeki linkte.") ve 3 ile 5 arası ilgili
     Türkçe hashtag (`#gezicorn` dahil).
   - **Facebook altyazısı (`caption_facebook`):** aynı özet, ama "profildeki linkte" yerine sona
     `https://www.gezicorn.com/yazi/<slug>/` linkini ekle, hashtag kullanma.
   - **Kesin kurallar:** tire (—) KULLANMA, em dash kullanma, kişisel ad yazma ("biz/Gezicorn" de),
     vize/ücret/süre gibi rakamsal iddia yazının içinde yoksa uydurma, abartılı/tıklama tuzağı dil kullanma.
6. **Yayınla** (repo kökünden, `scripts/composio-key.local.txt` yoksa `COMPOSIO_API_KEY` ortam
   değişkeni otomatik kullanılır, ayrıca bir şey yapmana gerek yok):
   ```
   node scripts/post-social.js tmp-post.json
   ```
   `tmp-post.json`: `{"image_url":"https://www.gezicorn.com/img/covers/<slug>.jpg","caption":"...","caption_facebook":"...","platforms":["instagram","facebook"]}`
   Bu tek çağrı hem Instagram feed hem Facebook fotoğraf gönderisini atar (2 gönderi).
7. **Instagram hikayesi de ekle** (3. gönderi, aynı görsel), küçük bir Node betiğiyle:
   ```
   cat > tmp-story.mjs <<'EOF'
   import { postInstagramStory } from './lib-social.js';
   const id = await postInstagramStory({ image_url: 'https://www.gezicorn.com/img/covers/<slug>.jpg' });
   console.log('story', id);
   setTimeout(() => process.exit(0), 200);
   EOF
   node scripts/tmp-story.mjs
   ```
8. Geçici `tmp-post.json` ve `tmp-story.mjs` dosyalarını sil (`rm`). Bunlar zaten commit edilmeyecek,
   ama temiz bırak.
9. İşin sonunda tek satır özet: hangi yazı için hangi gönderiler atıldı, ID'leri.

## Sınırlar / yapma

- Günde bu rutinden **1'den fazla çalıştırma yapma** (rutin zaten günde 1 kez tetiklenir).
- `posts`/`deals` koleksiyonlarına yazı EKLEME, sadece `cover_image`/`cover_alt` güncelle (adım 3).
- Instagram/Facebook hesap ayarlarını, şifreleri, bio'yu değiştirme.
- Kapak görselinde insan/karakter kesinlikle olmasın (adım 3'teki kural).
- Yazının içeriğinde olmayan bir iddiayı (fiyat, süre, kural) altyazıya ekleme.
- `composio-key.local.txt` dosyasını commit'leme, oluşturma, ya da API anahtarını çıktıya yazdırma.
