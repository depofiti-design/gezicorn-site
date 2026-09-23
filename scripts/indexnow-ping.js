// IndexNow: sitemap.xml'deki tüm URL'leri Bing ve Yandex'e "yeni/güncellendi" diye bildirir.
// Google IndexNow protokolüne katılmıyor (Google için tek yol Search Console + zaman + backlink).
// Ücretsiz, hesap/anahtar başvurusu gerekmez, anahtar dosyası siteye konur, protokol bunu doğrular.
// Kullanım: node indexnow-ping.js (repo kökünden çalıştırılabilir, sitemap.xml'i otomatik bulur)
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HOST = 'www.gezicorn.com';
const KEY = '74db7fd014ea7fe3a80d37b971258a9b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
const xml = readFileSync(sitemapPath, 'utf-8');
const urlList = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

if (!urlList.length) {
  console.error('sitemap.xml içinde URL bulunamadı.');
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList })
});

console.log(`IndexNow: ${urlList.length} URL gönderildi, yanıt ${res.status}`);
if (res.status >= 300) {
  console.error(await res.text());
  process.exit(1);
}
process.exit(0);
