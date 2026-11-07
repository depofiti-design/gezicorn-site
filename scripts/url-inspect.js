// Search Console URL Inspection API: sitemap.xml'deki tüm URL'lerin gerçek Google dizin durumunu çeker.
// Servis hesabı JSON'u GSC_SA_KEY (GitHub secret) ya da scripts/gsc-sa.local.json (gsc-report.js ile aynı).
// Çıktı: konsola özet + seo-reports/index-status.json (tüm sonuçlar, bir sonraki karşılaştırma için).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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

function sitemapUrls() {
  const xml = readFileSync('../sitemap.xml', 'utf-8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return urls;
}

async function inspect(T, url) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST', headers: { authorization: `Bearer ${T}`, 'content-type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
  });
  const j = await r.json();
  if (j.error) return { url, error: j.error.message || JSON.stringify(j.error) };
  const res = j.inspectionResult?.indexStatusResult || {};
  return { url, verdict: res.verdict, coverageState: res.coverageState, lastCrawlTime: res.lastCrawlTime, robotsTxtState: res.robotsTxtState };
}

async function main() {
  const T = await token();
  const urls = sitemapUrls();
  console.log(`${urls.length} URL kontrol edilecek...`);
  const out = [];
  const CONC = 4;
  for (let i = 0; i < urls.length; i += CONC) {
    const batch = urls.slice(i, i + CONC);
    const results = await Promise.all(batch.map((u) => inspect(T, u).catch((e) => ({ url: u, error: String(e) }))));
    out.push(...results);
    process.stdout.write(`\r${Math.min(i + CONC, urls.length)}/${urls.length}`);
  }
  console.log();

  const indexed = out.filter((r) => r.verdict === 'PASS');
  const notIndexed = out.filter((r) => r.verdict && r.verdict !== 'PASS');
  const errored = out.filter((r) => r.error);

  console.log(`\nDizinli: ${indexed.length} | Dizinli değil: ${notIndexed.length} | Hata: ${errored.length}`);
  console.log('\n--- Dizinli olmayanlar (coverageState) ---');
  for (const r of notIndexed) console.log(`${r.coverageState || r.verdict} | ${r.url}`);
  if (errored.length) {
    console.log('\n--- Hata alanlar ---');
    for (const r of errored) console.log(`${r.url} -> ${r.error}`);
  }

  writeFileSync('../seo-reports/index-status.json', JSON.stringify({ checked_at: new Date().toISOString(), total: urls.length, indexed: indexed.length, not_indexed: notIndexed.length, errors: errored.length, results: out }, null, 2));
  console.log('\nKaydedildi: seo-reports/index-status.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
