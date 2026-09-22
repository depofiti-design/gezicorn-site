// Günlük sosyal medya rutini (GitHub Actions cron ile çalışır, scripts/DAILY_SOCIAL.md'nin
// tamamen deterministik/koda dökülmüş hali: LLM kullanmaz, kapak üretmez, sadece o günkü en yeni
// yayında yazıyı Instagram feed + Facebook feed + Instagram hikaye olarak paylaşır).
// Aynı yazıyı iki kez paylaşmamak için settings/social_automation.last_posted_slug'a bakar.
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-client.js';
import { postInstagram, postFacebook, postInstagramStory } from './lib-social.js';

const HASHTAGS = {
  vize: '#vize', rehber: '#gezirehberi', haber: '#seyahathaberleri', firsat: '#firsat'
};

function pickKisaca(content) {
  const m = /^>\s*\*\*Kısaca:\*\*\s*(.+)$/m.exec(content || '');
  return m ? m[1].trim() : null;
}

async function main() {
  const snap = await getDocs(collection(db, 'posts'));
  const posts = snap.docs.map(d => d.data()).filter(p => p.published);
  posts.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  const latest = posts[0];
  if (!latest) { console.log('Yayında yazı yok, çıkılıyor.'); return; }

  const ageHours = latest.created_at?.seconds ? (Date.now() / 1000 - latest.created_at.seconds) / 3600 : 999;
  if (ageHours > 36) {
    console.log(`En yeni yazı (${latest.slug}) ${ageHours.toFixed(1)} saat önce eklenmiş, bugüne ait değil gibi görünüyor. Paylaşım atlanıyor.`);
    return;
  }

  const stateRef = doc(db, 'settings', 'social_automation');
  const stateSnap = await getDoc(stateRef);
  const lastSlug = stateSnap.exists() ? stateSnap.data().last_posted_slug : null;
  if (lastSlug === latest.slug) {
    console.log(`${latest.slug} zaten paylaşıldı (settings/social_automation), tekrar atlanıyor.`);
    return;
  }

  const hook = pickKisaca(latest.content) || latest.excerpt || latest.title;
  const tag = HASHTAGS[latest.category] || '';
  const image_url = latest.cover_image || 'https://www.gezicorn.com/og-default.png';
  const url = `https://www.gezicorn.com/yazi/${latest.slug}/`;

  const caption = `${latest.title}\n\n${hook}\n\nYazının tamamı profildeki linkte.\n\n#gezicorn ${tag}`.trim();
  const caption_facebook = `${latest.title}\n\n${hook}\n\n${url}`;

  console.log('Paylaşılıyor:', latest.slug, '| kapak:', image_url);

  const igId = await postInstagram({ image_url, caption });
  console.log('Instagram feed:', igId);
  const fbId = await postFacebook({ image_url, caption_facebook });
  console.log('Facebook:', fbId);
  const storyId = await postInstagramStory({ image_url });
  console.log('Instagram hikaye:', storyId);

  await setDoc(stateRef, { last_posted_slug: latest.slug, last_posted_at: serverTimestamp() }, { merge: true });
  console.log('Tamamlandı:', latest.slug, { igId, fbId, storyId });
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
