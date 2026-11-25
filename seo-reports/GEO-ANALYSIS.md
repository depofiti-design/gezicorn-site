# Gezicorn GEO / yapay zeka araması analizi (25 Kasım 2026)

Araç: claude-seo v2.6.2 `seo-geo` ölçütleri. İncelenen: ana sayfa, `/yazi/pasaport-gecerlilik-suresi-neden-6-ay-sart/`, `/yazi/kazakistana-vizesiz-girmek-mumkun-mu/` + 193 yazı sayfasının toplu taraması + GSC 90 gün.

Not: Google'ın kendi rehberine göre yapay zeka araması için optimizasyon "hâlâ SEO". AI Overviews büyük ölçüde zaten iyi sıralanan sayfaları kaynak gösteriyor. Bizim ortalama sıramız 22 (mobil 11, masaüstü 38), yani asıl kaldıraç klasik sıralama.

## GEO hazırlık puanı: 71/100 (sezgisel kontrol listesi, atıf oranı tahmini değil)

| Alan | Puan | Durum |
|---|---|---|
| Alıntılanabilirlik | 18/25 | Her yazı "Kısaca:" cevap bloğuyla açılıyor (ilk 40-60 kelimede net cevap), SSS bölümü var. Eksik: rakamların yanında kaynak yok. |
| Yapı | 15/20 | H2 hiyerarşisi temiz, SSS soru biçimli. Eksik: 193 yazıda hiç tablo yok (süre/ücret/belge karşılaştırması tablo için ideal). |
| Çoklu ortam | 11/15 | Kapak görseli + gömülü YouTube videosu çoğu yazıda var. Görsel aramada 90 günde 1.339 gösterim, 0 tık. |
| Otorite ve marka | 8/20 | Yazar `Organization` (Gezicorn), kişi yok. 60 yazıda resmi kaynak linki 0, 131 yazıda 1. Wikipedia/Reddit/Ekşi varlığı yok. YouTube (2.330 abone, 264 bin izlenme) en güçlü marka sinyalimiz. |
| Teknik erişim | 19/20 | Statik HTML (JS gerektirmiyor), robots.txt herkese açık, BlogPosting + FAQPage + BreadcrumbList şeması, dateModified, sameAs, llms.txt mevcut. |

## Yapay zeka tarayıcı erişimi (robots.txt: `User-agent: * Allow: /`)
- Arama atfı: Googlebot (AI Overviews/AI Mode) izinli, OAI-SearchBot (ChatGPT Search) izinli, PerplexityBot izinli, Claude-SearchBot izinli, Applebot izinli.
- Eğitim: GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended da izinli (tercih meselesi, görünürlüğü etkilemez).
- llms.txt: var, 186 yazı listeli (Google bunu kullanmıyor, diğer sistemler için zararsız).

## Ölçülen görünürlük
- Gemini (google_search grounding) 10 soruluk test: 0/10 (`ai-visibility-latest.md`). ChatGPT/Perplexity ölçülmedi (araç yok).

## En etkili 5 değişiklik
1. **Kişi yazar (E-E-A-T, Google'ın "kim yazdı" testi).** Sitenin rakiplerden farkı birinci elden deneyim (Kırgızistan'dan Kamboçya'ya 9 ülke, Phnom Penh'te yaşıyor). Yazar şemasını `Person` + YouTube kanalı sameAs yapıp yazı sonuna kısa bir yazar kutusu eklemek. Gerçek ad/fotoğraf kullanımı için kullanıcı onayı gerekiyor.
2. **Rakamlara kaynak.** Ücret, süre ve kural rakamlarının yanına resmi kaynak linki (Dışişleri, NVİ, GİB, ilgili ülke e-vize sitesi). Önce trafik alan 20 yazı.
3. **"Bir bakışta" tablosu.** Ülke vize yazılarına 4 satırlık tablo: vize türü, kalış süresi, ücret, nereden alınır. `vize-tablosu` sayfası zaten bu veriyi tutuyor.
4. **YouTube ile marka sinyali.** Vize reellerini Shorts olarak da yayınlamak (kanaldaki vize/kural başlıklı Shorts'ların medyanı 1.285, diğerleri 564) ve her açıklamada ilgili yazıya link vermek. YouTube bahsi, yapay zeka atfıyla en güçlü ilişkili sinyal (Ahrefs, korelasyon).
5. **Masaüstü sıralaması (38) ve görsel aramada 0 tık.** Kapak görsellerinin `alt` metnini sorgu diliyle yazmak, görsel dosya adlarını anlamlı tutmak.

## Şema önerileri
- `BlogPosting.author` → `Person` (onay sonrası), `publisher` → `Organization` kalır.
- Ülke vize yazılarında tablo eklenince ekstra şema gerekmez, tablo HTML'i yeterli.

## İçerik biçimi önerileri
- "Kısaca" bloklarına rakamı ve tarihi koymak (ör. "2026 itibarıyla 30 gün"). Yapay zeka cevapları tarihli, net cümleleri tercih ediyor.
- Ülke sayfalarında ilk H2'yi halk diliyle soru yapmak (CLAUDE.md "halk dili" kuralı ile aynı).
