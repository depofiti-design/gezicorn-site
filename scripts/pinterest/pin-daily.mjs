// Gezicorn Pinterest otomasyonu: her çalıştırmada en fazla PIN_COUNT (varsayılan 3) yazıyı pinler.
// Sıra: son 3 günün pinlenmemiş yazıları önce, sonra kalan arşiv (yeniden eskiye).
// Görsel make-pin.py ile üretilir ve base64 olarak gönderilir (deploy beklemeye gerek yok).
// Durum: scripts/pinterest/state.json { slug: { pin_id, at } } (aynı yazı iki kez pinlenmez).
// Ortam: COMPOSIO_API_KEY (yerelde scripts/composio-key.local.txt), PIN_COUNT, DRY_RUN=1, ONLY_SLUG
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-client.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.env.COMPOSIO_API_KEY || readFileSync(path.join(HERE, '..', 'composio-key.local.txt'), 'utf8').trim();
const ACCOUNT = 'pinterest_tunnel-sublet'; // 27 Kasım 2026, işletme hesabı "Gezicorn"
const BOARDS = JSON.parse(readFileSync(path.join(HERE, 'boards.json'), 'utf8'));
const STATE_P = path.join(HERE, 'state.json');
const state = existsSync(STATE_P) ? JSON.parse(readFileSync(STATE_P, 'utf8')) : {};
const N = +(process.env.PIN_COUNT || 3);
const DRY = process.env.DRY_RUN === '1';
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

async function exec(tool_slug, args) {
  const res = await fetch('https://connect.composio.dev/mcp', {
    method: 'POST',
    headers: { 'x-consumer-api-key': KEY, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: 'COMPOSIO_MULTI_EXECUTE_TOOL', arguments: { tools: [{ tool_slug, arguments: args, account: ACCOUNT }], sync_response_to_workbench: false, memory: {}, session_id: 'gezicorn-pinterest' } } }),
  });
  const t = await res.text();
  const line = t.split('\n').find((l) => l.startsWith('data: '));
  const p = JSON.parse((line || t).replace(/^data: /, ''));
  if (p.error) throw new Error(JSON.stringify(p.error));
  const r = JSON.parse(p.result.content[0].text).data.results[0];
  if (r.error) throw new Error(r.error);
  return r.response.data;
}

const TAGS = { vize: '#vize #evize #vizesiz #seyahat', pasaport: '#pasaport #yurtdışı #seyahat', rehber: '#gezirehberi #seyahat #backpacker', haber: '#seyahat #vize #haber', firsat: '#workandholiday #gönüllülük #yurtdışı' };
const boardOf = (p) => (/pasaport|cikis-harc|cikis-yasag/.test(p.slug) ? 'pasaport' : BOARDS[p.category] ? p.category : 'rehber');
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

const snap = await getDocs(collection(db, 'posts'));
const now = Date.now();
const posts = snap.docs.map((d) => d.data())
  .filter((p) => p.published && p.slug && !p.noindex && !state[p.slug])
  .map((p) => ({ ...p, ts: p.created_at?.seconds ? p.created_at.seconds * 1000 : 0 }))
  .filter((p) => !process.env.ONLY_SLUG || p.slug === process.env.ONLY_SLUG)
  .sort((a, b) => b.ts - a.ts);
const fresh = posts.filter((p) => now - p.ts < 3 * 864e5);
const queue = [...fresh, ...posts.filter((p) => !fresh.includes(p))].slice(0, N);
console.log(`pinlenmemiş ${posts.length} yazı, bu çalıştırmada ${queue.length}`);

mkdirSync(path.join(HERE, 'out'), { recursive: true });
for (const p of queue) {
  const board = boardOf(p);
  const out = path.join(HERE, 'out', p.slug + '.jpg');
  execFileSync(PY, [path.join(HERE, 'make-pin.py'), p.slug, p.title, board, out], { stdio: 'inherit' });
  const link = `https://www.gezicorn.com/yazi/${p.slug}/?utm_source=pinterest&utm_medium=social`;
  const description = clip(`${p.excerpt || ''} Rehberin tamamı gezicorn.com'da. ${TAGS[board] || ''}`.trim(), 495);
  const args = {
    board_id: BOARDS[board], title: clip(p.title, 100), description, link,
    alt_text: clip(p.cover_alt || p.title, 495),
    media_source: { source_type: 'image_base64', content_type: 'image/jpeg', data: readFileSync(out).toString('base64') },
  };
  if (DRY) { console.log('DRY', board, p.slug, '|', args.title); continue; }
  try {
    const r = await exec('PINTEREST_CREATE_PIN', args);
    state[p.slug] = { pin_id: r.id, board, at: new Date().toISOString() };
    writeFileSync(STATE_P, JSON.stringify(state, null, 1));
    console.log('PIN', r.id, board, p.slug);
  } catch (e) { console.log('HATA', p.slug, String(e).slice(0, 300)); }
}
