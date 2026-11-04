// Günlük sosyal medya rutini (GitHub Actions cron ile çalışır, scripts/DAILY_SOCIAL.md'nin koda dökülmüş hali: LLM kullanmaz).
// O günkü en yeni yayında yazıdan hikaye görseli üretir (social-image.py): 1080x1920 (9:16),
// img/social/auto/ altına commit'leyip push'lar, sitede 200 dönene kadar bekler, sonra SADECE Instagram hikaye atar.
// KURAL (kullanıcı 4 Kasım 2026, kalıcı): normal feed gönderisi (Instagram/Facebook fotoğraf postu) ARTIK ATILMIYOR,
// sadece hikaye. Eskiden burada feed + hikaye ikisi de atılıyordu, feed adımı kaldırıldı.
// KURAL (kullanıcı 23 ve 26 Eylül 2026): yatay 16:9 kapak/og görseli asla doğrudan feed ya da hikaye olmaz. Görsel üretilemezse HİÇBİR ŞEY paylaşılmaz.
// Aynı yazıyı iki kez paylaşmamak için settings/social_automation.last_posted_slug'a bakar.
// FORCE_SLUG=<slug>: o yazıyı zorla paylaşır (yaş ve last_posted_slug kontrolü yok, last_posted_slug değişmez).
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { execFileSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './firebase-client.js';
import { postInstagramStory } from './lib-social.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const BASE = 'https://www.gezicorn.com';

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

async function main() {
  const snap = await getDocs(collection(db, 'posts'));
  const posts = snap.docs.map((d) => d.data()).filter((p) => p.published);
  posts.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  const force = process.env.FORCE_SLUG;
  const latest = force ? posts.find((p) => p.slug === force) : posts[0];
  if (!latest) { console.log('Yayında yazı yok, çıkılıyor.'); return; }

  const stateRef = doc(db, 'settings', 'social_automation');
  if (!force) {
    const ageHours = latest.created_at?.seconds ? (Date.now() / 1000 - latest.created_at.seconds) / 3600 : 999;
    if (ageHours > 36) {
      console.log(`En yeni yazı (${latest.slug}) ${ageHours.toFixed(1)} saat önce eklenmiş, bugüne ait değil. Paylaşım atlanıyor.`);
      return;
    }
    const stateSnap = await getDoc(stateRef);
    if ((stateSnap.exists() ? stateSnap.data().last_posted_slug : null) === latest.slug) {
      console.log(`${latest.slug} zaten paylaşıldı, tekrar atlanıyor.`);
      return;
    }
  }

  const hook = strip(pickKisaca(latest.content) || latest.excerpt || latest.title);

  // 1) hikaye görselini üret (9:16). social-image.py feed görselini de üretir ama artık kullanılmıyor/paylaşılmıyor.
  const outDir = path.join(ROOT, 'img', 'social', 'auto');
  mkdirSync(outDir, { recursive: true });
  const inputPath = path.join(HERE, 'tmp-social-input.json');
  writeFileSync(inputPath, JSON.stringify({ slug: latest.slug, title: latest.title, hook, category: latest.category, cover_url: latest.cover_image || '', out_dir: outDir }));
  const py = process.platform === 'win32' ? 'python' : 'python3';
  console.log(execFileSync(py, [path.join(HERE, 'social-image.py'), inputPath], { encoding: 'utf8' }).trim());
  const storyRel = `img/social/auto/${latest.slug}-story.jpg`;
  if (!existsSync(path.join(ROOT, storyRel))) throw new Error('Hikaye görseli üretilemedi, paylaşım iptal.');

  // 2) siteye yükle (Instagram herkese açık URL ister) ve yayına girmesini bekle
  git('add', storyRel);
  try {
    git('commit', '-m', `Sosyal görsel: ${latest.slug}`);
    try { git('pull', '--rebase', '--autostash'); } catch (e) { console.log('pull uyarı:', String(e.stderr || e).slice(0, 200)); }
    git('push');
  } catch (e) {
    console.log('commit/push notu:', String(e.stdout || e.stderr || e).slice(0, 300));
  }
  const storyUrl = `${BASE}/${storyRel}`;
  if (!(await waitFor(storyUrl))) throw new Error('Hikaye görseli sitede yayına girmedi, paylaşım iptal.');

  if (process.env.DRY_RUN) { console.log('DRY_RUN: hikaye görseli üretildi ve yayında, paylaşım yapılmadı:', storyUrl); return; }

  // 3) paylaş (SADECE hikaye, normal feed postu yok)
  console.log('Paylaşılıyor (hikaye):', latest.slug);
  const storyId = await postInstagramStory({ image_url: storyUrl });
  console.log('Instagram hikaye:', storyId);

  if (!force) await setDoc(stateRef, { last_posted_slug: latest.slug, last_posted_at: serverTimestamp() }, { merge: true });
  console.log('Tamamlandı:', latest.slug, { storyId });
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
