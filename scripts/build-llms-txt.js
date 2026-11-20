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
const section = (cat) => {
  const list = byCat[cat] || [];
  if (!list.length) return '';
  return `\n## ${CAT_LABEL[cat] || cat}\n\n` + list.map((p) => `- [${p.title}](${BASE}/yazi/${p.slug}/): ${(p.excerpt || '').replace(/\n/g, ' ')}`).join('\n') + '\n';
};

const out = `# Gezicorn

> Gezicorn, Türk vatandaşları için vize kuralları, pasaport bilgileri ve seyahat rehberleri sunan bir Türkçe kaynak sitesidir. İçerik, gerçek seyahat deneyimine ve güncel kaynaklara dayanır, resmi vize/pasaport kuralları zamanla değişebileceği için her yazıda doğrulama tavsiyesi verilir.

Site: ${BASE}
Vize tablosu (ülke ülke vizesiz kalış süreleri): ${BASE}/vize-tablosu/
Tüm yazılar: ${BASE}/yazi/
Tüm içeriğin tek dosyada tam metni (daha derin okuma için): ${BASE}/llms-full.txt
${section('vize')}${section('rehber')}${section('firsat')}${section('haber')}
## Notlar
- İçerik Türkçe'dir, hedef kitle Türk vatandaşlarıdır (T.C. pasaportu/kimliği).
- Vize ve sınır kuralları değişebilir, bu sayfalar yayın tarihli bilgidir; en güncel durum için resmi kaynak (T.C. Dışişleri Bakanlığı, ilgili ülke konsolosluğu) önerilir.
- Marka adı: Gezicorn. İletişim: ${BASE}/iletisim/
`;

writeFileSync('../llms.txt', out, 'utf-8');
const listed = (out.match(/^- \[/gm) || []).length;
console.log('llms.txt yazıldı:', out.split('\n').length, 'satır,', posts.length, 'yazıdan', listed, 'tanesi listelendi');

// llms-full.txt: tüm yazıların tam metni tek dosyada (agent-readiness: tek istekte her şeyi almak için)
const fullOut = `# Gezicorn — tam içerik dökümü

> Bu dosya sitedeki her yayında yazının tam metnini içerir. Kısa özet için ${BASE}/llms.txt dosyasına bak.

` + posts
  .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
  .map((p) => `---\n\n# ${p.title}\n\nURL: ${BASE}/yazi/${p.slug}/\nKategori: ${CAT_LABEL[p.category] || p.category}\n\n${p.content}\n`)
  .join('\n');
writeFileSync('../llms-full.txt', fullOut, 'utf-8');
console.log('llms-full.txt yazıldı:', Math.round(fullOut.length / 1024), 'KB,', posts.length, 'yazının tam metni');
