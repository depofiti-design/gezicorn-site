// Usage: node list-posts.js [n]
// Prints the n most recently created posts (default 15): category, title, slug, date.
// Use this before writing new content so today's topic doesn't repeat a recent one.
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-client.js';

const n = parseInt(process.argv[2] || '15', 10);

const snap = await getDocs(collection(db, 'posts'));
const posts = snap.docs.map(d => {
  const p = d.data();
  const ts = p.created_at && p.created_at.seconds ? p.created_at.seconds : 0;
  return { ts, category: p.category, title: p.title, slug: p.slug, published: p.published };
});
posts.sort((a, b) => b.ts - a.ts);

console.log(`Total posts: ${posts.length}\n`);
for (const p of posts.slice(0, n)) {
  const date = p.ts ? new Date(p.ts * 1000).toISOString().slice(0, 10) : '?';
  console.log(`[${date}] (${p.category}) ${p.title}  /${p.slug}${p.published ? '' : '  [DRAFT]'}`);
}
process.exit(0);
