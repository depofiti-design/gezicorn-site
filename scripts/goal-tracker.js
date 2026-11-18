// Günlük/haftalık büyüme hedefi takibi (kullanıcı 18 Kasım 2026): günlük en az 100 görüntüleme,
// günlük etkileşim artışı en az 20; haftalık en az 1000 görüntüleme, etkileşim artış trendi.
// "Görüntüleme" = GSC gösterimi (impressions) + Instagram reach + Facebook reach toplamı.
// "Etkileşim" = GSC tıklaması + Instagram (beğeni+yorum) + Facebook (reaksiyon+yorum) toplamı.
// Composio API bu makinede Node fetch ile Kaspersky SSL enjeksiyonuna takılıyor, NODE_OPTIONS=--use-system-ca
// ile çalıştırılmalı (GitHub Actions'ta sorun yok, sadece yerel test için gerekli).
// Çıktı: seo-reports/goal-tracker-latest.md
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';

const COMPOSIO_KEY = process.env.COMPOSIO_API_KEY || (existsSync('composio-key.local.txt') ? readFileSync('composio-key.local.txt', 'utf8').trim() : '');
const IG_USER_ID = '28470759025941073';
const IG_ACCOUNT = 'instagram_stoop-ensoul';
const FB_PAGE_ID = '144062395450039';
const FB_ACCOUNT = 'facebook_harr-iao';
const MCP_URL = 'https://connect.composio.dev/mcp';

const DAILY_VIEW_TARGET = 100;
const DAILY_ENGAGEMENT_GROWTH_TARGET = 20;
const WEEKLY_VIEW_TARGET = 1000;

async function callMcp(args) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'x-consumer-api-key': COMPOSIO_KEY, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: 'COMPOSIO_MULTI_EXECUTE_TOOL', arguments: { tools: [args], sync_response_to_workbench: false, memory: {}, session_id: 'goal-tracker' } } }),
  });
  const raw = await res.text();
  const line = raw.split('\n').find((l) => l.startsWith('data: '));
  const payload = JSON.parse((line || raw).replace(/^data: /, ''));
  if (payload.error) throw new Error(JSON.stringify(payload.error));
  const parsed = JSON.parse(payload.result.content[0].text);
  const result = parsed.data.results[0];
  if (result.error) throw new Error(result.error);
  return result.response.data;
}

async function igInsights(metric, since, until) {
  try {
    const data = await callMcp({ tool_slug: 'INSTAGRAM_GET_USER_INSIGHTS', arguments: { ig_user_id: IG_USER_ID, metric, period: 'day', metric_type: 'time_series', since, until }, account: IG_ACCOUNT });
    const series = data.data?.[0]?.values || [];
    return Object.fromEntries(series.map((v) => [v.end_time.slice(0, 10), v.value]));
  } catch (e) {
    console.log(`[IG ${metric}] hata:`, e.message || e);
    return {};
  }
}

async function igRecentMediaEngagement(sinceDate) {
  // Son medyalarin like_count/comments_count alanlariyla birlikte listesi: hesap seviyesindeki
  // total_interactions metriği düşük hacimli hesaplarda boş dönebiliyor, bu yüzden post bazlı toplanıyor.
  try {
    const data = await callMcp({ tool_slug: 'INSTAGRAM_GET_IG_USER_MEDIA', arguments: { ig_user_id: IG_USER_ID, fields: 'id,timestamp,like_count,comments_count', limit: 25 }, account: IG_ACCOUNT });
    const byDay = {};
    for (const m of data.data || []) {
      const day = (m.timestamp || '').slice(0, 10);
      if (!day || day < sinceDate) continue;
      byDay[day] = (byDay[day] || 0) + (m.like_count || 0) + (m.comments_count || 0);
    }
    return byDay;
  } catch (e) {
    console.log('[IG media engagement] hata:', e.message || e);
    return {};
  }
}

async function fbInsights(metric, since, until) {
  try {
    const data = await callMcp({ tool_slug: 'FACEBOOK_GET_PAGE_INSIGHTS', arguments: { page_id: FB_PAGE_ID, metric, period: 'day', since, until }, account: FB_ACCOUNT });
    const series = data.data?.[0]?.values || [];
    const out = {};
    for (const v of series) { const day = (v.end_time || '').slice(0, 10); if (day) out[day] = v.value; }
    return out;
  } catch (e) {
    console.log(`[FB ${metric}] hata:`, e.message || e);
    return {};
  }
}

// --- GSC (gsc-report.js ile ayni JWT akisi) ---
async function gscToken() {
  const raw = process.env.GSC_SA_KEY || (existsSync('gsc-sa.local.json') ? readFileSync('gsc-sa.local.json', 'utf8') : '');
  if (!raw) return null;
  const sa = JSON.parse(raw);
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sign = createSign('RSA-SHA256'); sign.update(`${head}.${body}`); sign.end();
  const jwt = `${head}.${body}.${sign.sign(sa.private_key).toString('base64url')}`;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  const j = await r.json();
  return j.access_token || null;
}

async function gscDaily(tok, start, end) {
  if (!tok) return {};
  const site = process.env.GSC_SITE || 'sc-domain:gezicorn.com';
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions: ['date'], rowLimit: 25 }),
  });
  const j = await r.json();
  const out = {};
  for (const row of j.rows || []) out[row.keys[0]] = { impressions: row.impressions, clicks: row.clicks };
  return out;
}

function fmt(d) { return d.toISOString().slice(0, 10); }

async function main() {
  const today = new Date();
  const since8 = fmt(new Date(today.getTime() - 8 * 86400000));
  const until = fmt(today);

  const [igReach, fbReach, fbEngaged, igEngage, gscTok] = await Promise.all([
    igInsights('reach', since8, until),
    fbInsights('page_impressions_unique', since8, until).catch(() => ({})),
    fbInsights('page_post_engagements', since8, until).catch(() => ({})),
    igRecentMediaEngagement(since8),
    gscToken(),
  ]);
  const gsc = await gscDaily(gscTok, since8, until);

  // Son 8 gunun tarih listesi (bugun haric, tamamlanmis gunler)
  const days = [];
  for (let i = 7; i >= 1; i--) days.push(fmt(new Date(today.getTime() - i * 86400000)));

  const rows = days.map((d) => {
    const views = (gsc[d]?.impressions || 0) + (igReach[d] || 0) + (fbReach[d] || 0);
    const engagement = (gsc[d]?.clicks || 0) + (igEngage[d] || 0) + (fbEngaged[d] || 0);
    return { day: d, views, engagement };
  });

  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const weekViews = rows.reduce((s, r) => s + r.views, 0);
  const weekEngagement = rows.reduce((s, r) => s + r.engagement, 0);
  const engagementGrowth = prev ? last.engagement - prev.engagement : null;

  const dailyViewsPass = last.views >= DAILY_VIEW_TARGET;
  const dailyEngagementPass = engagementGrowth !== null ? engagementGrowth >= DAILY_ENGAGEMENT_GROWTH_TARGET : null;
  const weeklyViewsPass = weekViews >= WEEKLY_VIEW_TARGET;

  const pass = (b) => (b === null ? '—' : b ? '✅' : '❌');

  const md = `# Gezicorn büyüme hedefi takibi
Oluşturulma: ${new Date().toISOString()}

**Tanım:** Görüntüleme = GSC gösterimi + Instagram reach + Facebook reach. Etkileşim = GSC tıklama + Instagram (beğeni+yorum) + Facebook (reaksiyon+yorum+paylaşım).

## Hedefler
| Hedef | Değer | Son gün durumu |
|---|---|---|
| Günlük görüntüleme | ≥ ${DAILY_VIEW_TARGET} | ${last.views} ${pass(dailyViewsPass)} |
| Günlük etkileşim artışı (bir önceki güne göre) | ≥ ${DAILY_ENGAGEMENT_GROWTH_TARGET} | ${engagementGrowth === null ? '—' : engagementGrowth} ${pass(dailyEngagementPass)} |
| Haftalık (son 7 gün) toplam görüntüleme | ≥ ${WEEKLY_VIEW_TARGET} | ${weekViews} ${pass(weeklyViewsPass)} |
| Haftalık toplam etkileşim | takip | ${weekEngagement} |

## Son 7 gün günlük detay
| Gün | Görüntüleme | Etkileşim |
|---|---|---|
${rows.map((r) => `| ${r.day} | ${r.views} | ${r.engagement} |`).join('\n')}

## Not
- Instagram hesap seviyesi \`total_interactions\` metriği düşük hacimli hesaplarda boş dönebiliyor (Meta API davranışı), bu yüzden etkileşim son gönderilerin beğeni+yorum sayıları toplanarak hesaplanıyor.
- GSC verisi ~2-3 gün gecikmeli geliyor, son 1-2 günün görüntüleme/tıklama rakamı eksik görünebilir, bu normal.
- Hedef tanımları ("günlük 20 etkileşim artışı" gibi) yorumlanabilir ifadelerdi, burada "bir önceki güne göre net artış" olarak uygulandı; farklı bir tanım istenirse script kolayca değiştirilebilir.
`;

  writeFileSync('../seo-reports/goal-tracker-latest.md', md, 'utf-8');
  console.log('goal-tracker-latest.md yazıldı.');
  console.log(`Son gün: ${last.day} | görüntüleme ${last.views} (hedef ${DAILY_VIEW_TARGET}) | etkileşim artışı ${engagementGrowth} (hedef ${DAILY_ENGAGEMENT_GROWTH_TARGET})`);
  console.log(`Haftalık: görüntüleme ${weekViews} (hedef ${WEEKLY_VIEW_TARGET}) | etkileşim ${weekEngagement}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
