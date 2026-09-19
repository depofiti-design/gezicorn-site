// Usage: node build-static.js
// Firestore'daki yayında olan yazılardan statik, SEO uyumlu HTML sayfaları üretir:
//   ../yazi/<slug>/index.html   her yazı için (tam metin, JSON-LD, canonical, iç linkler)
//   ../yazi/index.html          tüm yazıların taranabilir listesi
//   ../sitemap.xml              lastmod ile birlikte
//   ../index.html               "Son yazılar" alanına statik HTML enjekte eder (<!--LATEST_START--> ... <!--LATEST_END-->)
// Yazı içeriği hafif markdown: "## H2", "### H3", "- liste", "1. sıralı liste", "> özet kutusu",
// **kalın**, [metin](url). "## Sık sorulan sorular" altındaki "### soru" + paragraf yapısı FAQPage JSON-LD olur.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-client.js';

const BASE = 'https://www.gezicorn.com';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OG = `${BASE}/og-default.png`;
const SITE = 'Gezicorn';

const CAT = {
  vize:   { label: 'Vize & ülkeler',      short: 'vize' },
  rehber: { label: 'Gezi rehberleri',     short: 'rehber' },
  firsat: { label: 'Gönüllü & fırsatlar', short: 'fırsat' },
  haber:  { label: 'Haberler & gelişmeler', short: 'haber' },
};
const COUNTRIES = ['Kırgızistan','Kazakistan','Özbekistan','Rusya','Tayland','Malezya','Hong Kong','Kamboçya','Vietnam',
  'Japonya','Güney Kore','Avustralya','Kanada','ABD','İngiltere','Almanya','Schengen','Gürcistan','Azerbaycan'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const jsonLd = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const trLower = s => s.toLocaleLowerCase('tr');
const slugify = s => trLower(s).replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const absImg = u => !u ? null : (u.startsWith('http') ? u : `${BASE}/${u.replace(/^\//,'')}`);
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const trDate = d => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const isoDate = d => d.toISOString().slice(0, 10);

function inline(str) {
  let s = esc(str);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (m, t, u) =>
    `<a href="${u}"${u.startsWith('http') ? ' rel="noopener"' : ''}>${t}</a>`);
  return s;
}
const plain = str => str.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

// içeriği bloklara ayır
function parseBlocks(content) {
  const lines = (content || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    let m;
    if ((m = line.match(/^###\s+(.*)/))) { flush(); blocks.push({ t: 'h3', text: m[1] }); }
    else if ((m = line.match(/^##\s+(.*)/))) { flush(); blocks.push({ t: 'h2', text: m[1] }); }
    else if ((m = line.match(/^>\s?(.*)/))) { flush(); blocks.push({ t: 'quote', text: m[1] }); }
    else if ((m = line.match(/^[-*]\s+(.*)/))) {
      if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\d+[.)]\s+(.*)/))) {
      if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\*\*([^*]+?)\*\*[:?]?$/))) { flush(); blocks.push({ t: 'h2', text: m[1].replace(/:$/, '') }); }
    else { flush(); blocks.push({ t: 'p', text: line }); }
  }
  flush();
  return blocks;
}

function renderBody(blocks) {
  const used = new Set();
  const toc = [];
  const html = blocks.map(b => {
    switch (b.t) {
      case 'h2': {
        let id = slugify(plain(b.text)) || 'bolum';
        while (used.has(id)) id += '-2';
        used.add(id);
        toc.push({ id, text: plain(b.text) });
        return `<h2 id="${id}">${inline(b.text)}</h2>`;
      }
      case 'h3': return `<h3>${inline(b.text)}</h3>`;
      case 'quote': return `<p class="callout">${inline(b.text)}</p>`;
      case 'ul': return `<ul>${b.items.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol>${b.items.map(i => `<li>${inline(i)}</li>`).join('')}</ol>`;
      default: return `<p>${inline(b.text)}</p>`;
    }
  }).join('\n');
  return { html, toc };
}

function extractFaq(blocks) {
  const faq = [];
  let inFaq = false, q = null;
  for (const b of blocks) {
    if (b.t === 'h2') { inFaq = /sık sorulan|sss/i.test(b.text); q = null; continue; }
    if (!inFaq) continue;
    if (b.t === 'h3') { q = { name: plain(b.text), answer: [] }; faq.push(q); }
    else if (q && (b.t === 'p' || b.t === 'ul' || b.t === 'ol'))
      q.answer.push(b.t === 'p' ? plain(b.text) : b.items.map(plain).join(' '));
  }
  return faq.filter(f => f.answer.length).map(f => ({ name: f.name, text: f.answer.join(' ') }));
}

function wordCount(content) { return (content || '').split(/\s+/).filter(Boolean).length; }

function countryOf(p) {
  return COUNTRIES.filter(c => trLower(p.title).includes(trLower(c)));
}

function related(post, all) {
  const cs = countryOf(post);
  const words = new Set(post.slug.split('-').filter(w => w.length > 3));
  return all.filter(o => o.slug !== post.slug).map(o => {
    let score = o.category === post.category ? 1 : 0;
    if (cs.length && countryOf(o).some(c => cs.includes(c))) score += 4;
    else if (cs.length && countryOf(o).length) score += 3;   // ülke yazıları birbirine bağlansın
    for (const w of o.slug.split('-')) if (words.has(w)) score += 1;
    return { o, score };
  }).sort((a, b) => b.score - a.score || b.o.ts - a.o.ts).slice(0, 4).map(x => x.o);
}

const YT_SCRIPT = `<script>document.querySelectorAll('.yt-frame').forEach(function(f){f.querySelector('.yt-play').addEventListener('click',function(){var i=document.createElement('iframe');i.src='https://www.youtube-nocookie.com/embed/'+f.dataset.yt+'?autoplay=1&rel=0';i.allow='accelerometer; autoplay; encrypted-media; picture-in-picture';i.allowFullscreen=true;i.title='YouTube video';f.innerHTML='';f.appendChild(i);});});</script>`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">`;

const CSS = `
:root{--navy:#101B30;--navy-deep:#070C18;--cream:#F1ECDD;--paper:#FAF7EF;--gold:#B08D57;--coral:#9C3B2C;--teal:#33604F;--ink:#181611;--muted:#6E6A5D;}
*{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-text-size-adjust:100%;}
body{background:var(--cream);color:var(--ink);font-family:'IBM Plex Sans',system-ui,sans-serif;line-height:1.6;overflow-x:hidden;}
a{color:inherit;text-decoration:none;}
img{max-width:100%;height:auto;}
.nav{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 52px;background:var(--navy);color:var(--cream);}
.brand{font-family:'Fraunces',serif;font-weight:800;font-size:21px;letter-spacing:.05em;display:flex;align-items:center;gap:9px;}
.brand img{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--gold);object-fit:cover;flex:none;}
.nav-links{display:flex;gap:22px;font-size:13px;font-weight:500;list-style:none;}
.nav-links a:hover{color:var(--gold);}
.crumbs{max-width:760px;margin:0 auto;padding:22px 24px 0;font-size:12.5px;color:var(--muted);}
.crumbs a{border-bottom:1px dashed rgba(20,31,56,.3);}
.crumbs span{margin:0 6px;}
.cover{width:100%;max-width:1000px;aspect-ratio:16/9;object-fit:cover;display:block;margin:20px auto 0;border-radius:12px;background:var(--navy);}
.article{max-width:760px;margin:0 auto;padding:28px 24px 72px;}
.post-tag{display:inline-flex;border:1.5px dashed var(--teal);border-radius:20px;padding:4px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--teal);text-transform:uppercase;margin-bottom:16px;}
.article h1{font-family:'Fraunces',serif;font-weight:800;font-size:38px;line-height:1.18;color:var(--navy);margin-bottom:14px;}
.meta{font-size:13px;color:var(--muted);margin-bottom:22px;display:flex;flex-wrap:wrap;gap:4px 14px;}
.excerpt{font-size:17.5px;color:#3d3a30;margin-bottom:26px;}
.toc{background:var(--paper);border:1px solid rgba(20,31,56,.1);border-radius:10px;padding:16px 20px;margin-bottom:30px;}
.toc strong{display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:8px;}
.toc ol{padding-left:20px;font-size:14.5px;}
.toc li{margin:4px 0;}
.toc a{color:var(--navy);border-bottom:1px dashed rgba(20,31,56,.3);}
.body h2{font-family:'Fraunces',serif;font-weight:800;font-size:26px;line-height:1.25;color:var(--navy);margin:38px 0 12px;scroll-margin-top:16px;}
.body h3{font-family:'Fraunces',serif;font-weight:600;font-size:19px;line-height:1.3;color:var(--navy);margin:26px 0 8px;}
.body p{font-size:17px;line-height:1.75;margin-bottom:16px;}
.body ul,.body ol{margin:0 0 18px 22px;font-size:17px;line-height:1.7;}
.body li{margin-bottom:6px;}
.body strong{color:var(--navy);}
.body a{color:var(--coral);border-bottom:1px solid rgba(156,59,44,.35);}
.callout{background:var(--paper);border-left:4px solid var(--gold);border-radius:0 10px 10px 0;padding:14px 18px;font-size:16.5px!important;color:#2b2820;}
.yt{margin:6px 0 26px;}
.yt-frame{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000;}
.yt-frame img,.yt-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:cover;}
.yt-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:rgba(7,12,24,.25);cursor:pointer;border:0;}
.yt-play span{width:64px;height:64px;border-radius:50%;background:var(--gold);color:var(--navy-deep);display:flex;align-items:center;justify-content:center;font-size:24px;padding-left:4px;}
.yt-cap{font-size:13px;color:var(--muted);margin-top:8px;line-height:1.5;}
.author{display:flex;gap:14px;align-items:flex-start;background:var(--paper);border:1px solid rgba(20,31,56,.1);border-radius:12px;padding:18px 20px;margin-top:40px;}
.author img{width:48px;height:48px;border-radius:50%;flex:none;border:1.5px solid var(--gold);}
.author p{font-size:14px;color:var(--muted);line-height:1.6;}
.author b{color:var(--navy);display:block;margin-bottom:2px;font-size:15px;}
.disclaimer{font-size:13px;color:var(--muted);margin-top:18px;line-height:1.6;}
.related{max-width:1000px;margin:0 auto;padding:0 24px 64px;}
.related h2{font-family:'Fraunces',serif;font-size:22px;color:var(--navy);margin-bottom:16px;}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
.card{display:block;background:var(--paper);border:1px solid rgba(20,31,56,.1);border-radius:12px;overflow:hidden;transition:border-color .15s;}
.card:hover{border-color:var(--gold);}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:var(--navy);}
.card .in{padding:16px 18px 18px;}
.card h3{font-family:'Fraunces',serif;font-size:17px;line-height:1.3;color:var(--navy);margin-bottom:6px;}
.card p{font-size:13.5px;color:var(--muted);line-height:1.5;}
.list-head{max-width:1100px;margin:0 auto;padding:36px 24px 8px;}
.list-head h1{font-family:'Fraunces',serif;font-weight:800;font-size:36px;color:var(--navy);margin-bottom:10px;line-height:1.2;}
.list-head p{color:var(--muted);max-width:40em;}
.chips{max-width:1100px;margin:0 auto;padding:12px 24px;display:flex;gap:10px;flex-wrap:wrap;}
.chips a{padding:8px 16px;border-radius:20px;border:1.5px solid rgba(20,31,56,.2);background:var(--paper);font-size:13px;font-weight:500;}
.chips a:hover{border-color:var(--gold);}
.sec{max-width:1100px;margin:0 auto;padding:12px 24px 24px;}
.sec h2{font-family:'Fraunces',serif;font-size:24px;color:var(--navy);margin:18px 0 14px;scroll-margin-top:16px;}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
footer{padding:28px 24px;font-size:12.5px;color:var(--muted);text-align:center;background:var(--cream);border-top:1px solid rgba(20,31,56,.08);}
footer a{border-bottom:1px dashed rgba(20,31,56,.3);margin:0 8px;}
@media(max-width:900px){.grid3{grid-template-columns:repeat(2,1fr);}}
@media(max-width:640px){
 .nav{padding:12px 16px;}.brand{font-size:18px;}.brand img{width:34px;height:34px;}
 .nav-links{gap:14px;font-size:12.5px;}.nav-links li:nth-child(n+3){display:none;}
 .article{padding:20px 18px 56px;}.article h1{font-size:28px;}
 .excerpt{font-size:16.5px;}.body h2{font-size:22px;}.body p,.body ul,.body ol{font-size:16.5px;}
 .cover{border-radius:0;margin-top:0;}.crumbs{padding:16px 18px 0;}
 .grid,.grid3{grid-template-columns:1fr;}.related{padding:0 18px 48px;}
 .list-head{padding:24px 18px 4px;}.list-head h1{font-size:28px;}.chips,.sec{padding-left:18px;padding-right:18px;}
}`;

const NAV = `<header class="nav"><a class="brand" href="/"><img src="/logo-128.png" alt="Gezicorn logo" width="40" height="40">GEZICORN</a>
<nav aria-label="Ana menü"><ul class="nav-links"><li><a href="/yazi/">Yazılar</a></li><li><a href="/yazi/#vize">Vize</a></li><li><a href="/yazi/#rehber">Rehber</a></li><li><a href="/danismanlik.html">Danışmanlık</a></li></ul></nav></header>`;
const FOOTER = `<footer><a href="/">Ana sayfa</a><a href="/yazi/">Tüm yazılar</a><a href="/danismanlik.html">Danışmanlık</a><a href="https://www.youtube.com/@gezikorn" rel="noopener">YouTube</a><a href="https://www.instagram.com/gezicorn/" rel="noopener">Instagram</a><a href="https://www.facebook.com/profile.php?id=144062395450039" rel="noopener">Facebook</a>
<p style="margin-top:12px;">© Gezicorn · Vize ve seyahat kuralları değişebilir, başvurudan önce mutlaka resmi kaynağı kontrol et.</p></footer>`;

const headCommon = ({ title, desc, canonical, image, type = 'website', extra = '', robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' }) => `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${canonical}">
<meta property="og:site_name" content="${SITE}">
<meta property="og:locale" content="tr_TR">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${image}">
<meta name="theme-color" content="#101B30">
<link rel="icon" type="image/png" href="/logo-256.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONTS}${extra}`;

function pageTitle(t) { const full = `${t} | ${SITE}`; return full.length <= 62 ? full : t; }

function renderPost(p, all) {
  const blocks = parseBlocks(p.content);
  const { html, toc } = renderBody(blocks);
  const faq = extractFaq(blocks);
  const url = `${BASE}/yazi/${p.slug}/`;
  const image = absImg(p.cover_image) || DEFAULT_OG;
  let desc = p.seo_description || p.excerpt || '';
  if (desc.length > 160) desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  const words = wordCount(p.content);
  const mins = Math.max(1, Math.round(words / 200));
  const cat = CAT[p.category] || { label: p.category };
  const rel = related(p, all);

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: p.title, description: desc, image: [image], inLanguage: 'tr-TR',
      datePublished: p.created.toISOString(), dateModified: p.updated.toISOString(),
      wordCount: words, articleSection: cat.label,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Person', name: 'Barbaros', url: 'https://www.youtube.com/@gezikorn', sameAs: ['https://www.youtube.com/@gezikorn', 'https://www.instagram.com/gezicorn/', 'https://www.facebook.com/profile.php?id=144062395450039'] },
      publisher: { '@type': 'Organization', name: SITE, url: `${BASE}/`, logo: { '@type': 'ImageObject', url: `${BASE}/logo-256.png` } },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Yazılar', item: `${BASE}/yazi/` },
        { '@type': 'ListItem', position: 3, name: cat.label, item: `${BASE}/yazi/#${p.category}` },
        { '@type': 'ListItem', position: 4, name: p.title, item: url },
      ],
    },
  ];
  if (faq.length) ld.push({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: f.name, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
  });

  const tocHtml = toc.length >= 3
    ? `<nav class="toc" aria-label="İçindekiler"><strong>Bu yazıda</strong><ol>${toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : '';
  const ytHtml = p.youtube_id ? `<figure class="yt"><div class="yt-frame" data-yt="${esc(p.youtube_id)}"><img src="https://i.ytimg.com/vi/${esc(p.youtube_id)}/hqdefault.jpg" alt="${esc(p.youtube_title || p.title)} videosu" loading="lazy" width="480" height="360"><button class="yt-play" type="button" aria-label="Videoyu oynat"><span>&#9654;</span></button></div><figcaption class="yt-cap">Kanalda bu konuyu anlattık: ${esc(p.youtube_title || '')}. Video eski tarihli olabilir, güncel kurallar için yazıdaki bilgiye bak.</figcaption></figure>` : '';
  const relHtml = rel.length ? `<section class="related" aria-label="İlgili yazılar"><h2>Bunlar da işine yarayabilir</h2><div class="grid">${rel.map(cardHtml).join('')}</div></section>` : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
${headCommon({ title: pageTitle(p.title), desc, canonical: url, image, type: 'article', robots: p.noindex ? 'noindex,follow' : undefined,
  extra: `\n<meta property="article:published_time" content="${p.created.toISOString()}">\n<meta property="article:modified_time" content="${p.updated.toISOString()}">\n<meta property="article:section" content="${esc(cat.label)}">\n<meta property="article:author" content="Barbaros">` })}
<script type="application/ld+json">${jsonLd(ld)}</script>
<style>${CSS}</style>
</head>
<body>
${NAV}
<main>
<nav class="crumbs" aria-label="Sayfa yolu"><a href="/">Ana sayfa</a><span>›</span><a href="/yazi/">Yazılar</a><span>›</span><a href="/yazi/#${p.category}">${esc(cat.label)}</a></nav>
${p.cover_image ? `<img class="cover" src="${image}" alt="${esc(p.cover_alt || p.title)}" width="1200" height="675" fetchpriority="high">` : ''}
<article class="article">
<span class="post-tag">${esc(CAT[p.category]?.short || p.category)}</span>
<h1>${esc(p.title)}</h1>
<div class="meta"><span>Yazan: Barbaros</span><span>Güncelleme: <time datetime="${isoDate(p.updated)}">${trDate(p.updated)}</time></span><span>${mins} dk okuma</span></div>
${p.excerpt && blocks[0]?.t !== 'quote' ? `<p class="excerpt">${inline(p.excerpt)}</p>` : ''}
${tocHtml}
${ytHtml}
<div class="body">
${html}
</div>
<aside class="author"><img src="/logo-128.png" alt="Gezicorn" width="48" height="48"><p><b>Barbaros, Gezicorn</b>Kırgızistan'da yaşadı, şimdi Kamboçya'da yaşıyor ve Orta Asya'dan Güneydoğu Asya'ya rotasını <a href="https://www.youtube.com/@gezikorn" rel="noopener" style="border-bottom:1px dashed rgba(20,31,56,.3);">YouTube kanalında</a> paylaşıyor. Yazılar kendi deneyimine ve resmi kaynaklara dayanır.</p></aside>
<p class="disclaimer">Bu yazı genel bilgi amaçlıdır. Vize, ücret ve giriş kuralları ülkeye ve döneme göre değişir. Başvurudan önce ilgili ülkenin konsolosluğunun veya resmi e-vize sitesinin güncel duyurularını kontrol et.</p>
</article>
${relHtml}
</main>
${FOOTER}
${p.youtube_id ? YT_SCRIPT : ''}
</body>
</html>
`;
}

function cardHtml(p) {
  const img = absImg(p.cover_image);
  return `<a class="card" href="/yazi/${p.slug}/">${img ? `<img src="${img}" alt="${esc(p.cover_alt || p.title)}" loading="lazy" width="1200" height="675">` : ''}<div class="in"><h3>${esc(p.title)}</h3><p>${esc(p.excerpt || '')}</p></div></a>`;
}

function renderList(posts) {
  const groups = ['vize', 'rehber', 'firsat', 'haber'].map(c => ({ c, items: posts.filter(p => p.category === c) })).filter(g => g.items.length);
  const desc = 'Türk pasaportuyla vize kuralları, e-vize başvuruları, Orta Asya ve Güneydoğu Asya rota rehberleri, seyahat ipuçları. Kendi gezdiğimiz ülkelerden.';
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Gezicorn yazıları', url: `${BASE}/yazi/`, description: desc, inLanguage: 'tr-TR' },
    { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/yazi/${p.slug}/`, name: p.title })) },
  ];
  return `<!DOCTYPE html>
<html lang="tr">
<head>
${headCommon({ title: 'Vize ve Gezi Rehberleri, Türk Pasaportuna Göre | Gezicorn', desc, canonical: `${BASE}/yazi/`, image: DEFAULT_OG })}
<script type="application/ld+json">${jsonLd(ld)}</script>
<style>${CSS}</style>
</head>
<body>
${NAV}
<main>
<div class="list-head"><h1>Vize ve gezi rehberleri</h1><p>Türk pasaportuyla nereye vizesiz gidilir, e-vize nasıl alınır, rota nasıl kurulur. Kırgızistan'dan Kamboçya'ya kendi gezdiğimiz ülkelerden ve resmi kaynaklara bakarak yazıyoruz.</p></div>
<nav class="chips" aria-label="Kategoriler">${groups.map(g => `<a href="#${g.c}">${esc(CAT[g.c].label)} (${g.items.length})</a>`).join('')}</nav>
${groups.map(g => `<section class="sec" id="${g.c}"><h2>${esc(CAT[g.c].label)}</h2><div class="grid3">${g.items.map(cardHtml).join('')}</div></section>`).join('\n')}
</main>
${FOOTER}
</body>
</html>
`;
}

// ---- çalıştır ----
const snap = await getDocs(collection(db, 'posts'));
const posts = snap.docs.map(d => {
  const p = d.data();
  const created = p.created_at?.seconds ? new Date(p.created_at.seconds * 1000) : new Date('2026-08-01');
  const updated = p.updated_at?.seconds ? new Date(p.updated_at.seconds * 1000) : created;
  return { ...p, created, updated, ts: created.getTime() };
}).filter(p => p.published && p.slug).sort((a, b) => b.ts - a.ts);

const pub = posts.filter(p => !p.noindex);   // listeler, sitemap, ilgili yazılar ve ana sayfa sadece bunları kullanır
const outDir = path.join(ROOT, 'yazi');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
for (const p of posts) {
  const dir = path.join(outDir, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), renderPost(p, pub), 'utf-8');
}
writeFileSync(path.join(outDir, 'index.html'), renderList(pub), 'utf-8');

// sitemap
const newest = pub.reduce((m, p) => (p.updated > m ? p.updated : m), new Date(0));
const urls = [
  { loc: `${BASE}/`, lastmod: newest, priority: '1.0' },
  { loc: `${BASE}/yazi/`, lastmod: newest, priority: '0.9' },
  { loc: `${BASE}/danismanlik.html`, lastmod: null, priority: '0.6' },
  ...pub.map(p => ({ loc: `${BASE}/yazi/${p.slug}/`, lastmod: p.updated, priority: '0.7' })),
];
writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u =>
    `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${isoDate(u.lastmod)}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`, 'utf-8');

// ana sayfa: son yazılar (taranabilir statik HTML, JS yüklenince aynı şeyi dinamik basar)
const idxPath = path.join(ROOT, 'index.html');
let idx = readFileSync(idxPath, 'utf-8');
const latest = pub.slice(0, 6).map(p =>
  `<a class="post-card" href="/yazi/${p.slug}/"><span class="post-tag">${esc(CAT[p.category]?.short || p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt || '')}</p></a>`).join('');
if (idx.includes('<!--LATEST_START-->')) {
  idx = idx.replace(/<!--LATEST_START-->[\s\S]*?<!--LATEST_END-->/, `<!--LATEST_START-->${latest}<!--LATEST_END-->`);
  writeFileSync(idxPath, idx, 'utf-8');
}

// ana sayfa: ülke rehberi linkleri (her ülke için o ülkeyi başlığında geçiren en yeni vize yazısı)
{
  let cur = readFileSync(idxPath, 'utf-8');
  if (cur.includes('<!--COUNTRIES_START-->')) {
    const chips = COUNTRIES.map(c => {
      const hit = pub.find(p => p.category === 'vize' && trLower(p.title).includes(trLower(c)))
        || pub.find(p => trLower(p.title).includes(trLower(c)));
      return hit ? `<a href="/yazi/${hit.slug}/">${esc(c)}</a>` : '';
    }).filter(Boolean).join('');
    cur = cur.replace(/<!--COUNTRIES_START-->[\s\S]*?<!--COUNTRIES_END-->/, `<!--COUNTRIES_START-->${chips}<!--COUNTRIES_END-->`);
    writeFileSync(idxPath, cur, 'utf-8');
  }
}

console.log(`build-static: ${posts.length} yazı sayfası (${posts.length - pub.length} noindex) + liste + sitemap (${urls.length} URL) üretildi.`);
process.exit(0);
