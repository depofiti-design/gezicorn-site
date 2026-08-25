// Usage: node generate-sitemap.js
// Regenerates ../sitemap.xml from all published posts in Firestore.
// BASE_URL below must be updated once a real domain is connected (see CLAUDE.md "Kalan işler").
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-client.js';

const BASE_URL = 'https://gezicorn-depofiti-1840s-projects.vercel.app';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'sitemap.xml');

const snap = await getDocs(collection(db, 'posts'));
const posts = snap.docs
  .map(d => d.data())
  .filter(p => p.published)
  .sort((a, b) => (a.slug > b.slug ? 1 : -1));

const staticUrls = [
  { loc: `${BASE_URL}/`, priority: '1.0' },
  { loc: `${BASE_URL}/posts.html`, priority: '0.8' },
  { loc: `${BASE_URL}/danismanlik.html`, priority: '0.7' },
];

const postUrls = posts.map(p => ({
  loc: `${BASE_URL}/post.html?slug=${p.slug}`,
  priority: '0.6'
}));

const all = [...staticUrls, ...postUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all
  .map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`)
  .join('\n')}\n</urlset>\n`;

writeFileSync(outPath, xml, 'utf-8');
console.log(`sitemap.xml regenerated: ${postUrls.length} posts + ${staticUrls.length} static pages.`);
process.exit(0);
