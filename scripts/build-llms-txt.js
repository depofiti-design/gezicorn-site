// /llms.txt üretir: yapay zeka arama/yanıt motorlarının (ChatGPT, Perplexity, Claude, Google AI Overview vb.)
// siteyi hızlı anlaması için kısa, yapılandırılmış özet. Format: llmstxt.org kuralları.
// Çalıştır: node scripts/build-llms-txt.js
import { writeFileSync } from 'node:fs';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-client.js';

const BASE = 'https://www.gezicorn.com';
const posts = (await getDocs(collection(db, 'posts'))).docs
  .map((d) => d.data())
  .filter((p) => p.published && !p.noindex);

const byCat = {};
for (const p of posts) (byCat[p.category] ??= []).push(p);
for (const k in byCat) byCat[k].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

const CAT_LABEL = { vize: 'Vize rehberleri', rehber: 'Seyahat rehberleri', haber: 'Güncel haberler', firsat: 'Fırsatlar ve gönüllülük' };
const section = (cat, n) => {
  const list = (byCat[cat] || []).slice(0, n);
  if (!list.length) return '';
  return `\n## ${CAT_LABEL[cat] || cat}\n\n` + list.map((p) => `- [${p.title}](${BASE}/yazi/${p.slug}/): ${(p.excerpt || '').replace(/\n/g, ' ')}`).join('\n') + '\n';
};

const out = `# Gezicorn

> Gezicorn, Türk vatandaşları için vize kuralları, pasaport bilgileri ve seyahat rehberleri sunan bir Türkçe kaynak sitesidir. İçerik, gerçek seyahat deneyimine ve güncel kaynaklara dayanır, resmi vize/pasaport kuralları zamanla değişebileceği için her yazıda doğrulama tavsiyesi verilir.

Site: ${BASE}
Vize tablosu (ülke ülke vizesiz kalış süreleri): ${BASE}/vize-tablosu/
Tüm yazılar: ${BASE}/yazi/
${section('vize', 60)}${section('rehber', 40)}${section('firsat', 25)}${section('haber', 15)}
## Notlar
- İçerik Türkçe'dir, hedef kitle Türk vatandaşlarıdır (T.C. pasaportu/kimliği).
- Vize ve sınır kuralları değişebilir, bu sayfalar yayın tarihli bilgidir; en güncel durum için resmi kaynak (T.C. Dışişleri Bakanlığı, ilgili ülke konsolosluğu) önerilir.
- Marka adı: Gezicorn. İletişim: ${BASE}/iletisim/
`;

writeFileSync('../llms.txt', out, 'utf-8');
const listed = (out.match(/^- \[/gm) || []).length;
console.log('llms.txt yazıldı:', out.split('\n').length, 'satır,', posts.length, 'yazıdan', listed, 'tanesi listelendi');
