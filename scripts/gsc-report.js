// Search Console günlük raporu. Servis hesabı JSON'u GSC_SA_KEY (GitHub secret) ya da scripts/gsc-sa.local.json.
// Çıktı: seo-reports/latest.md + seo-reports/YYYY-MM-DD.md
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';

const SITE = process.env.GSC_SITE || 'sc-domain:gezicorn.com';
const raw = process.env.GSC_SA_KEY || (existsSync('gsc-sa.local.json') ? readFileSync('gsc-sa.local.json', 'utf8') : '');
if (!raw) { console.log('GSC_SA_KEY yok, atlandı.'); process.exit(0); }
const sa = JSON.parse(raw);

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${body}.${sig}` });
  const j = await r.json();
  if (!j.access_token) throw new Error('token alınamadı: ' + JSON.stringify(j));
  return j.access_token;
}

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const T = await token();
async function q(start, end, dimensions, rowLimit = 250) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
    method: 'POST', headers: { authorization: `Bearer ${T}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit }),
  });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.rows || [];
}

// GSC verisi ~2 gün gecikmeli: son tam veri günü = bugün-3
const end = iso(daysAgo(3)), start = iso(daysAgo(9));
const pEnd = iso(daysAgo(10)), pStart = iso(daysAgo(16));
const [pages, prevPages, queries, pq] = await Promise.all([
  q(start, end, ['page']), q(pStart, pEnd, ['page']), q(start, end, ['query']), q(start, end, ['page', 'query'], 500),
]);

const short = (u) => u.replace(/^https?:\/\/(www\.)?gezicorn\.com/, '') || '/';
const pos = (n) => n.toFixed(1);
const prev = new Map(prevPages.map((r) => [r.keys[0], r]));
const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
const L = [];
L.push(`# Gezicorn Search Console raporu`, `Dönem: ${start} → ${end} (önceki: ${pStart} → ${pEnd})`, '');
L.push(`**Toplam:** ${sum(pages, 'clicks')} tık, ${sum(pages, 'impressions')} gösterim (önceki dönem: ${sum(prevPages, 'clicks')} tık, ${sum(prevPages, 'impressions')} gösterim)`, '');

L.push('## Ön plandaki sayfalar (gösterime göre)', '| Sayfa | Gösterim | Tık | Ort. sıra | Önceki gösterim |', '|---|---|---|---|---|');
for (const r of [...pages].sort((a, b) => b.impressions - a.impressions).slice(0, 15))
  L.push(`| ${short(r.keys[0])} | ${r.impressions} | ${r.clicks} | ${pos(r.position)} | ${prev.get(r.keys[0])?.impressions ?? 0} |`);

L.push('', '## Yükselenler (gösterim artışı)', '| Sayfa | Şimdi | Önceki |', '|---|---|---|');
const up = pages.map((r) => ({ u: r.keys[0], n: r.impressions, o: prev.get(r.keys[0])?.impressions ?? 0 })).filter((x) => x.n - x.o >= 3).sort((a, b) => b.n - b.o - (a.n - a.o)).slice(0, 8);
L.push(...(up.length ? up.map((x) => `| ${short(x.u)} | ${x.n} | ${x.o} |`) : ['| (yok) | | |']));

L.push('', '## Düşenler', '| Sayfa | Şimdi | Önceki |', '|---|---|---|');
const seen = new Set(pages.map((r) => r.keys[0]));
const down = prevPages.map((r) => ({ u: r.keys[0], o: r.impressions, n: pages.find((p) => p.keys[0] === r.keys[0])?.impressions ?? 0 })).filter((x) => x.o - x.n >= 3).sort((a, b) => b.o - b.n - (a.o - a.n)).slice(0, 8);
L.push(...(down.length ? down.map((x) => `| ${short(x.u)} | ${x.n} | ${x.o} |`) : ['| (yok) | | |']));

L.push('', '## Fırsat: 8-20. sıradaki sorgular (küçük iyileştirmeyle 1. sayfaya çıkabilir)', '| Sorgu | Sayfa | Gösterim | Sıra |', '|---|---|---|---|');
const strike = pq.filter((r) => r.position >= 8 && r.position <= 20 && r.impressions >= 2).sort((a, b) => b.impressions - a.impressions).slice(0, 12);
L.push(...(strike.length ? strike.map((r) => `| ${r.keys[1]} | ${short(r.keys[0])} | ${r.impressions} | ${pos(r.position)} |`) : ['| (yok) | | | |']));

L.push('', '## 1-5. sırada ama tık yok (başlık/açıklama zayıf olabilir)', '| Sorgu | Sayfa | Gösterim | Sıra |', '|---|---|---|---|');
const weak = pq.filter((r) => r.position <= 5 && r.clicks === 0 && r.impressions >= 3).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
L.push(...(weak.length ? weak.map((r) => `| ${r.keys[1]} | ${short(r.keys[0])} | ${r.impressions} | ${pos(r.position)} |`) : ['| (yok) | | | |']));

L.push('', '## En çok gösterim alan sorgular', '| Sorgu | Gösterim | Tık | Sıra |', '|---|---|---|---|');
for (const r of [...queries].sort((a, b) => b.impressions - a.impressions).slice(0, 15)) L.push(`| ${r.keys[0]} | ${r.impressions} | ${r.clicks} | ${pos(r.position)} |`);

mkdirSync('../seo-reports', { recursive: true });
const out = L.join('\n') + '\n';
writeFileSync('../seo-reports/latest.md', out);
writeFileSync(`../seo-reports/${iso(new Date())}.md`, out);
console.log(out);
