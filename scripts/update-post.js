// Usage: node update-post.js updates.json
// updates.json: bir nesne ya da nesne dizisi. Her nesne { slug, ...alanlar }.
// Güncellenebilir alanlar: title, excerpt, content, category, cover_image, cover_alt, seo_description, noindex, published, youtube_id, youtube_title, youtube_note
// Her güncellemede updated_at otomatik yenilenir (yazı sayfasında "Güncelleme" tarihi ve sitemap lastmod olur).
import { readFileSync } from 'fs';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-client.js';

const ALLOWED = ['title', 'excerpt', 'content', 'category', 'cover_image', 'cover_alt', 'seo_description', 'noindex', 'published', 'youtube_id', 'youtube_title', 'youtube_note', 'affiliate', 'affiliate_text'];
const VALID_CATEGORIES = ['vize', 'firsat', 'rehber', 'haber'];

const jsonPath = process.argv[2];
if (!jsonPath) { console.error('Usage: node update-post.js updates.json'); process.exit(1); }
let updates = JSON.parse(readFileSync(jsonPath, 'utf-8'));
if (!Array.isArray(updates)) updates = [updates];

const snap = await getDocs(collection(db, 'posts'));
const bySlug = new Map(snap.docs.map(d => [d.data().slug, d.id]));

let ok = 0;
for (const u of updates) {
  const id = bySlug.get(u.slug);
  if (!id) { console.error(`SKIP: slug bulunamadı: ${u.slug}`); continue; }
  const data = {};
  for (const k of ALLOWED) if (u[k] !== undefined) data[k] = u[k];
  if (data.category && !VALID_CATEGORIES.includes(data.category)) { console.error(`SKIP ${u.slug}: geçersiz kategori`); continue; }
  const texts = [data.title, data.excerpt, data.content, data.seo_description].filter(Boolean).join('\n');
  if (texts.includes('—')) { console.error(`SKIP ${u.slug}: metinde tire (—) var`); continue; }
  data.updated_at = serverTimestamp();
  await updateDoc(doc(db, 'posts', id), data);
  ok++;
  console.log(`updated: ${u.slug} [${Object.keys(data).filter(k => k !== 'updated_at').join(', ')}]`);
}
console.log(`${ok}/${updates.length} yazı güncellendi.`);
process.exit(0);
