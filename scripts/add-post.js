// Usage: node add-post.js post.json
// post.json: { title, slug, category, excerpt, content, cover_image? }
// category must be one of: vize | firsat | rehber | haber
import { readFileSync } from 'fs';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-client.js';

const VALID_CATEGORIES = ['vize', 'firsat', 'rehber', 'haber'];

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node add-post.js post.json');
  process.exit(1);
}

const post = JSON.parse(readFileSync(jsonPath, 'utf-8'));

for (const field of ['title', 'slug', 'category', 'excerpt', 'content']) {
  if (!post[field] || typeof post[field] !== 'string' || !post[field].trim()) {
    console.error(`Missing/invalid required field: ${field}`);
    process.exit(1);
  }
}
if (!VALID_CATEGORIES.includes(post.category)) {
  console.error(`Invalid category "${post.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  process.exit(1);
}
if (post.content.includes('—') || post.title.includes('—') || post.excerpt.includes('—')) {
  console.error('Content/title/excerpt contains an em dash (—). This site never uses dashes in copy — rewrite without it.');
  process.exit(1);
}

// SEO yapı kontrolleri (bkz. DAILY_CONTENT.md "SEO yapısı")
const wordCount = post.content.split(/\s+/).filter(Boolean).length;
const seoErrors = [];
if (wordCount < 300) seoErrors.push(`content ${wordCount} kelime, en az 300 olmalı`);
if (!/^>\s*\*\*Kısaca:?\*\*/m.test(post.content)) seoErrors.push('content "> **Kısaca:** ..." özet satırıyla başlamalı');
if ((post.content.match(/^##\s+/gm) || []).length < 3) seoErrors.push('en az 3 adet "## Başlık" bölümü gerekli');
if (!/^##\s+Sık sorulan sorular/m.test(post.content)) seoErrors.push('"## Sık sorulan sorular" bölümü gerekli');
if (!/\]\(\/yazi\/[a-z0-9-]+\/\)/.test(post.content)) seoErrors.push('en az 1 iç link gerekli: [metin](/yazi/slug/)');
if (post.excerpt.length > 165) seoErrors.push(`excerpt ${post.excerpt.length} karakter, en fazla 165 olmalı (meta description)`);
if (post.title.length > 65) seoErrors.push(`title ${post.title.length} karakter, en fazla 65 olmalı`);
if (seoErrors.length) {
  console.error('SEO kontrolü başarısız:\n- ' + seoErrors.join('\n- '));
  process.exit(1);
}

const existing = await getDocs(collection(db, 'posts'));
const slugTaken = existing.docs.some(d => d.data().slug === post.slug);
if (slugTaken) {
  console.error(`Slug "${post.slug}" already exists. Choose a unique slug.`);
  process.exit(1);
}

const docRef = await addDoc(collection(db, 'posts'), {
  title: post.title,
  slug: post.slug,
  category: post.category,
  excerpt: post.excerpt,
  content: post.content,
  cover_image: post.cover_image || null,
  cover_alt: post.cover_alt || null,
  seo_description: post.seo_description || null,
  published: true,
  created_at: serverTimestamp()
});

console.log(`Post added: ${docRef.id} (/${post.slug})`);
process.exit(0);
