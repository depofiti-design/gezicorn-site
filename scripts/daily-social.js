// Günlük sosyal medya rutini (GitHub Actions cron ile çalışır, scripts/DAILY_SOCIAL.md'nin koda dökülmüş hali: LLM kullanmaz).
// KURAL (kullanıcı 4 Kasım 2026, kalıcı): normal feed gönderisi (Instagram/Facebook fotoğraf postu) YOK, sadece hikaye.
// Günde 2 hikaye atar: (A) günün yeni yazısından "kısaca" formatı, (B) scripts/story-evergreen.json havuzundan
// güne göre dönen (gün-of-year % havuz uzunluğu) ikinci bir format (büyük sayı / mit kırma / liste / karşılaştırma).
// Formatlar scripts/story-formats.py'de (5 farklı tasarım, kullanıcı 4 Kasım'da hepsini onayladı). 3. hikaye (özel
// durum: düzeltme, haber vb.) otomasyonun dışında, elle eklenir.
// KURAL (kullanıcı 23 ve 26 Eylül 2026): yatay 16:9 kapak/og görseli asla doğrudan feed ya da hikaye olmaz. Görsel üretilemezse HİÇBİR ŞEY paylaşılmaz.
// Aynı yazıyı iki kez paylaşmamak için settings/social_automation.last_posted_slug'a bakar (sadece A hikayesi için).
// FORCE_SLUG=<slug>: o yazıyı zorla A hikayesi yapar (yaş ve last_posted_slug kontrolü yok, last_posted_slug değişmez).
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './firebase-client.js';
import { postInstagramStory } from './lib-social.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const BASE = 'https://www.gezicorn.com';
const PY = process.platform === 'win32' ? 'python' : 'python3';

function pickKisaca(content) {
  const m = /^>\s*\*\*Kısaca:\*\*\s*(.+)$/m.exec(content || '');
  return m ? m[1].trim() : null;
}
const strip = (s) => (s || '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

function git(...args) {
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { method: 'HEAD' }); if (r.ok) return true; } catch (_) { /* tekrar dene */ }
    await new Promise((r) => setTimeout(r, 8000));
  }
  return false;
}

// Bir hikaye formatını render edip siteye push'layıp yayına girmesini bekler, dosya adı için benzersiz bir 'tag' alır.
async function buildStory(tag, fmt, data) {
  const outDir = path.join(ROOT, 'img', 'social', 'auto');
  mkdirSync(outDir, { recursive: true });
  const dataPath = path.join(HERE, `tmp-story-${tag}.json`);
  writeFileSync(dataPath, JSON.stringify(data));
  const rel = `img/social/auto/${tag}-story.jpg`;
  const outPath = path.join(ROOT, rel);
  console.log(execFileSync(PY, [path.join(HERE, 'story-formats.py'), 'render', fmt, dataPath, outPath], { encoding: 'utf8' }).trim());
  if (!existsSync(outPath)) throw new Error(`Hikaye görseli üretilemedi (${tag}), bu hikaye atlanıyor.`);

  git('add', rel);
  try {
    git('commit', '-m', `Sosyal hikaye: ${tag}`);
    try { git('pull', '--rebase', '--autostash'); } catch (e) { console.log('pull uyarı:', String(e.stderr || e).slice(0, 200)); }
    git('push');
  } catch (e) {
    console.log('commit/push notu:', String(e.stdout || e.stderr || e).slice(0, 300));
  }
  const url = `${BASE}/${rel}`;
  if (!(await waitFor(url))) throw new Error(`Hikaye görseli sitede yayına girmedi (${tag}), bu hikaye atlanıyor.`);
  return url;
}

async function storyA() {
  const snap = await getDocs(collection(db, 'posts'));
  const posts = snap.docs.map((d) => d.data()).filter((p) => p.published);
  posts.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  const force = process.env.FORCE_SLUG;
  const latest = force ? posts.find((p) => p.slug === force) : posts[0];
  if (!latest) { console.log('[A] Yayında yazı yok, atlanıyor.'); return null; }

  const stateRef = doc(db, 'settings', 'social_automation');
  if (!force) {
    const ageHours = latest.created_at?.seconds ? (Date.now() / 1000 - latest.created_at.seconds) / 3600 : 999;
    if (ageHours > 36) { console.log(`[A] En yeni yazı (${latest.slug}) ${ageHours.toFixed(1)} saat önce eklenmiş, bugüne ait değil. Atlanıyor.`); return null; }
    const stateSnap = await getDoc(stateRef);
    if ((stateSnap.exists() ? stateSnap.data().last_posted_slug : null) === latest.slug) { console.log(`[A] ${latest.slug} zaten paylaşıldı, atlanıyor.`); return null; }
  }

  const hook = strip(pickKisaca(latest.content) || latest.excerpt || latest.title);
  const url = await buildStory(latest.slug, 'f1_kisaca', { title: latest.title, category: latest.category, answer: hook });
  if (process.env.DRY_RUN) { console.log('[A] DRY_RUN, paylaşılmadı:', url); return null; }
  const storyId = await postInstagramStory({ image_url: url });
  console.log('[A] Instagram hikaye:', storyId, latest.slug);
  if (!force) await setDoc(stateRef, { last_posted_slug: latest.slug, last_posted_at: serverTimestamp() }, { merge: true });
  return storyId;
}

async function storyB() {
  const pool = JSON.parse(readFileSync(path.join(HERE, 'story-evergreen.json'), 'utf-8'));
  const dayOfYear = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 864e5);
  const entry = pool[dayOfYear % pool.length];
  const tag = `evergreen-${entry.format}-${dayOfYear % pool.length}`;
  const url = await buildStory(tag, entry.format, entry.data);
  if (process.env.DRY_RUN) { console.log('[B] DRY_RUN, paylaşılmadı:', url); return null; }
  const storyId = await postInstagramStory({ image_url: url });
  console.log('[B] Instagram hikaye:', storyId, entry.format);
  return storyId;
}

async function main() {
  const a = await storyA().catch((e) => { console.error('[A] hata:', e.message || e); return null; });
  const b = await storyB().catch((e) => { console.error('[B] hata:', e.message || e); return null; });
  console.log('Tamamlandı:', { a, b });
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
