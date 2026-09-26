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
import { FOOT_HTML, CSS_V } from './site-parts.js';

const BASE = 'https://www.gezicorn.com';
const AFF = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'affiliates.json'), 'utf-8'));
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
  'Japonya','Güney Kore','Avustralya','Kanada','ABD','İngiltere','Almanya','Schengen','Gürcistan','Azerbaycan','Dubai','Balkanlar'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const jsonLd = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const trLower = s => s.toLocaleLowerCase('tr');
const slugify = s => trLower(s).replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const absImg = u => !u ? null : (u.startsWith('http') ? u : `${BASE}/${u.replace(/^\//,'')}`);
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
// Türkiye saati (UTC+3) sabit: derleyen makinenin saat dilimine göre tarih kaymasın
const trDate = d => { const t = new Date(d.getTime() + 3 * 3600e3); return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`; };
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

const AD_SCRIPT = `<script>(function(){var B='https://firestore.googleapis.com/v1/projects/gezicorn/databases/(default)/documents/banners/';document.querySelectorAll('.ad[data-slot]').forEach(function(el){fetch(B+el.dataset.slot).then(function(r){return r.ok?r.json():null}).then(function(d){if(!d||!d.fields)return;var f=d.fields,on=f.active&&f.active.booleanValue,img=f.image_url&&f.image_url.stringValue;if(!on||!img)return;var a=document.createElement('a');a.href=(f.link_url&&f.link_url.stringValue)||'#';a.rel='sponsored noopener';a.target='_blank';var i=document.createElement('img');i.src=img;i.alt=(f.alt_text&&f.alt_text.stringValue)||'Reklam';i.loading='lazy';a.appendChild(i);var s=document.createElement('small');s.textContent='Reklam';el.appendChild(a);el.appendChild(s);el.classList.add('on');}).catch(function(){});});})();</script>`;

const CODE_SCRIPT = `<script>document.querySelectorAll('.code-copy').forEach(function(b){b.addEventListener('click',function(){var c=b.dataset.code;function ok(){b.classList.add('ok');setTimeout(function(){b.classList.remove('ok')},2000)}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(c).then(ok,function(){})}else{var t=document.createElement('textarea');t.value=c;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){}t.remove()}})});</script>`;
const YT_SCRIPT = `<script>document.querySelectorAll('.yt-frame').forEach(function(f){f.querySelector('.yt-play').addEventListener('click',function(){var i=document.createElement('iframe');i.src='https://www.youtube-nocookie.com/embed/'+f.dataset.yt+'?autoplay=1&rel=0';i.allow='accelerometer; autoplay; encrypted-media; picture-in-picture';i.allowFullscreen=true;i.title='YouTube video';f.innerHTML='';f.appendChild(i);});});</script>`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Nunito+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="/assets/gz.css?v=${CSS_V}">`;

// Ortak tokenlar, gezinme, düğme, kart, damga, altbilgi: assets/gz.css. Burada sadece yazı ve liste sayfalarına özel stiller.
const CSS = `
.crumbs{max-width:760px;margin:0 auto;padding:22px 24px 0;font:600 12px var(--f-mono);color:var(--muted);}
.crumbs a{border-bottom:2px dashed currentColor;}
.crumbs span{margin:0 6px;}
.cover{width:100%;max-width:760px;aspect-ratio:16/9;object-fit:cover;display:block;margin:20px auto 0;border:3px solid var(--ink);border-radius:24px;box-shadow:var(--sh);background:var(--teal);}
.article{max-width:760px;margin:0 auto;padding:30px 24px 72px;}
.head-row{display:flex;gap:18px;align-items:flex-start;justify-content:space-between;}
.article h1{font:800 clamp(30px,4.6vw,46px)/1.06 var(--f-display);letter-spacing:-.03em;margin-bottom:14px;text-wrap:balance;}
.article .stamp{--s:132px;flex:none;margin-top:4px;}
.meta{font:600 12.5px var(--f-mono);color:var(--muted);margin-bottom:22px;display:flex;flex-wrap:wrap;gap:4px 14px;}
.excerpt{font-size:18px;color:#2C4745;margin-bottom:26px;}
.toc{background:var(--mint);border:3px solid var(--ink);border-radius:18px;padding:16px 20px;margin-bottom:30px;box-shadow:var(--sh-s);}
.toc strong{display:block;font:600 11px var(--f-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
.toc ol{padding-left:20px;font-size:15px;font-weight:600;}
.toc li{margin:4px 0;}
.toc a{border-bottom:2px dashed var(--teal);}
.body h2{font:800 clamp(24px,3.4vw,30px)/1.15 var(--f-display);letter-spacing:-.025em;margin:40px 0 12px;scroll-margin-top:90px;}
.body h3{font:800 20px/1.25 var(--f-display);letter-spacing:-.01em;margin:26px 0 8px;}
.body p{font-size:17.5px;line-height:1.75;margin-bottom:16px;}
.body ul,.body ol{margin:0 0 18px 22px;font-size:17.5px;line-height:1.7;}
.body li{margin-bottom:6px;}
.body li::marker{color:var(--or-d);font-weight:800;}
.body strong{font-weight:800;}
.body a{color:var(--teal-d);font-weight:700;border-bottom:2px solid rgba(15,118,110,.35);}
.body a:hover{background:var(--yl);}
.callout{background:var(--sand);border:3px solid var(--ink);border-radius:18px;padding:14px 18px;box-shadow:var(--sh-s);font-size:17px!important;}
.ad-inline{margin:0 0 26px;}
.ad-inline img{max-height:180px;object-fit:cover;}
.ad-left,.ad-right{position:fixed;top:110px;width:180px;}
.ad-left{left:calc(50% - 380px - 200px);}
.ad-right{left:calc(50% + 380px + 20px);}
@media(max-width:1299px){.ad-left.on,.ad-right.on{display:none;}}
.aff{display:flex;gap:16px;align-items:center;justify-content:space-between;background:var(--sand);border:3px solid var(--ink);border-radius:20px;box-shadow:var(--sh);padding:18px 22px;margin:34px 0 8px;}
.aff b{display:block;font:800 19px var(--f-display);margin-bottom:4px;}
.aff p{font-size:14.5px;color:#2C4745;margin:0;line-height:1.55;}
.aff a.btn{flex:none;}
.aff-note{font-size:12px;color:var(--muted);margin-top:8px;}
.aff-code{margin-top:10px!important;font-size:13.5px!important;}
.aff-code span{color:var(--muted);}
.code-copy{font:700 15px var(--f-mono);background:var(--yl);border:2px solid var(--ink);border-radius:8px;padding:2px 10px;cursor:pointer;letter-spacing:.06em}
.code-copy.ok::after{content:" kopyalandı";font:600 12px var(--f-body)}
.aff+.aff{margin-top:14px}
@media(max-width:640px){.aff{flex-direction:column;align-items:stretch;}.aff a.btn{justify-content:center;}.head-row{flex-direction:column-reverse;align-items:flex-start;gap:6px;}.article .stamp{--s:110px;}}
.yt{margin:6px 0 26px;}
.yt-frame{position:relative;aspect-ratio:16/9;border:3px solid var(--ink);border-radius:20px;box-shadow:var(--sh);overflow:hidden;background:#000;}
.yt-short{max-width:340px;margin-left:auto;margin-right:auto}.yt-short .yt-frame{aspect-ratio:9/16}
.yt-frame img,.yt-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:cover;}
.yt-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:rgba(11,43,43,.25);}
.yt-play span{width:66px;height:66px;border-radius:50%;background:var(--or);border:3px solid var(--ink);color:var(--ink);display:flex;align-items:center;justify-content:center;font-size:24px;padding-left:4px;box-shadow:var(--sh-s);}
.yt-cap{font-size:13px;color:var(--muted);margin-top:10px;line-height:1.5;}
.author{display:flex;gap:14px;align-items:flex-start;background:var(--mint);border:3px solid var(--ink);border-radius:20px;padding:18px 20px;margin-top:40px;box-shadow:var(--sh-s);}
.author img{width:48px;height:48px;border-radius:50%;flex:none;border:2px solid var(--ink);}
.author p{font-size:14px;color:#2C4745;line-height:1.6;}
.author b{display:block;margin-bottom:2px;font:800 16px var(--f-display);}
.author a{border-bottom:2px dashed var(--teal);}
.next{display:flex;flex-wrap:wrap;gap:14px 20px;align-items:center;background:var(--teal);color:#fff;border:3px solid var(--ink);border-radius:26px;box-shadow:var(--sh);padding:18px 22px;margin-top:34px;}
.next img{width:92px;flex:none;filter:drop-shadow(0 8px 8px rgba(0,0,0,.3));}
.next div{flex:1 1 220px;}
.next b{display:block;font:800 22px/1.1 var(--f-display);letter-spacing:-.02em;margin-bottom:4px;}
.next p{font-size:14px;color:#D9FBF5;}
.next .btns{display:flex;gap:10px;flex-wrap:wrap;flex:none;}
.disclaimer{font-size:13px;color:var(--muted);margin-top:18px;line-height:1.6;}
.related{max-width:1100px;margin:0 auto;padding:0 24px 72px;}
.related h2{font:800 clamp(24px,3.4vw,32px) var(--f-display);letter-spacing:-.03em;margin-bottom:22px;}
.list-hero{max-width:1220px;margin:24px auto 0;padding:0 clamp(12px,3vw,32px);}
.list-hero .in{background:var(--teal);color:#fff;border:3px solid var(--ink);border-radius:30px;box-shadow:8px 8px 0 var(--ink);padding:clamp(24px,4vw,48px);display:flex;gap:24px;align-items:center;justify-content:space-between;position:relative;overflow:hidden;}
.list-hero .in::after{content:"";position:absolute;right:-70px;top:-70px;width:240px;height:240px;border-radius:50%;background:rgba(250,204,21,.25);}
.list-hero h1{font:800 clamp(32px,5vw,58px)/1 var(--f-display);letter-spacing:-.035em;margin-bottom:12px;text-wrap:balance;position:relative;z-index:1;}
.list-hero h1 mark{background:var(--or);color:var(--ink);padding:0 .12em;border-radius:8px;}
.list-hero p{color:#D9FBF5;max-width:46ch;position:relative;z-index:1;}
.list-hero img{width:clamp(120px,20vw,230px);flex:none;position:relative;z-index:1;filter:drop-shadow(0 20px 18px rgba(0,0,0,.3));animation:bob 5s ease-in-out infinite;}
@keyframes bob{50%{translate:0 -10px;}}
.chips{max-width:1220px;margin:26px auto 0;padding:0 clamp(16px,4vw,44px);display:flex;gap:10px;flex-wrap:wrap;}
.chips a{padding:8px 16px;border-radius:99px;border:2.5px solid var(--ink);background:var(--paper);font:800 13px var(--f-body);box-shadow:2px 2px 0 var(--ink);}
.chips a:hover{background:var(--yl);}
.sec h2{display:flex;align-items:center;gap:14px;scroll-margin-top:90px;}
.sec h2 img{width:64px;height:64px;object-fit:contain;flex:none;}
@media(max-width:640px){.list-hero .in{flex-direction:column-reverse;align-items:flex-start;}.list-hero img{width:120px;}.article{padding:22px 18px 56px;}.crumbs{padding:16px 18px 0;}.related{padding:0 18px 56px;}}
`;

const NAV = `<header class="gz-nav"><a class="gz-brand" href="/"><img src="/logo-128.png" alt="Gezicorn logo" width="38" height="38"><span>gezicorn</span></a>
<nav aria-label="Ana menü"><ul class="gz-links"><li><a class="hl2" href="/vize-tablosu/">Vize Tablosu</a></li><li><a href="/yazi/#vize">Vize</a></li><li><a href="/yazi/#rehber">Rehberler</a></li><li><a href="/yazi/#haber">Haberler</a></li><li><a href="/#bilet">Bilet ara</a></li><li><a class="hl" href="/danismanlik.html">Danışmanlık</a></li></ul></nav></header>`;
const FOOTER = FOOT_HTML;

const STAMPS = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'stamps.json'), 'utf-8')).stamps;
const STAMP_BY_SLUG = Object.fromEntries(STAMPS.map(x => [x.slug, x]));
const ROT = [-4, 3, -2, 5, -5, 2, -3, 4, -1, 2];
const CAT_ICON = { vize: 'passport', rehber: 'compass', firsat: 'backpack', haber: 'camera' };
const stampHtml = (st, i = 0, link = false) => {
  const inner = `<div><b>${esc(st.name)}</b><small>${esc(st.text)}</small></div>`;
  const cls = `stamp${st.kind === 'e' ? ' e' : ''}`;
  return link ? `<a class="${cls}" style="--r:${ROT[i % ROT.length]}deg" href="/yazi/${st.slug}/">${inner}</a>`
              : `<div class="${cls}" style="--r:-6deg" role="img" aria-label="${esc(st.name)}: ${esc(st.text)}">${inner}</div>`;
};

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
<meta name="theme-color" content="#0F766E">
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
      author: { '@type': 'Organization', name: 'Gezicorn', url: `${BASE}/`, sameAs: ['https://www.youtube.com/@gezikorn', 'https://www.instagram.com/gezicorn/', 'https://www.facebook.com/profile.php?id=144062395450039'] },
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
  if (p.youtube_id && p.youtube_date) ld.push({
    '@context': 'https://schema.org', '@type': 'VideoObject',
    name: p.youtube_title || p.title, description: desc, uploadDate: p.youtube_date,
    thumbnailUrl: [`https://i.ytimg.com/vi/${p.youtube_id}/${p.youtube_short ? 'oar2' : 'hqdefault'}.jpg`],
    embedUrl: `https://www.youtube.com/embed/${p.youtube_id}`, contentUrl: `https://www.youtube.com/watch?v=${p.youtube_id}`,
    inLanguage: 'tr-TR', publisher: { '@type': 'Organization', name: SITE, url: `${BASE}/` },
  });
  if (faq.length) ld.push({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: f.name, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
  });

  const tocHtml = toc.length >= 3
    ? `<nav class="toc" aria-label="İçindekiler"><strong>Bu yazıda</strong><ol>${toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : '';
  const ytHtml = p.youtube_id ? `<figure class="yt${p.youtube_short ? ' yt-short' : ''}"><div class="yt-frame" data-yt="${esc(p.youtube_id)}"><img src="https://i.ytimg.com/vi/${esc(p.youtube_id)}/${p.youtube_short ? 'oar2' : 'hqdefault'}.jpg" alt="${esc(p.youtube_title || p.title)} videosu" loading="lazy" width="480" height="360"><button class="yt-play" type="button" aria-label="Videoyu oynat"><span>&#9654;</span></button></div><figcaption class="yt-cap">Kanalda bu konuyu anlattık: ${esc(p.youtube_title || '')}. ${esc(p.youtube_note || 'Video eski tarihli olabilir, güncel kurallar için yazıdaki bilgiye bak.')}</figcaption></figure>` : '';
  const affList = String(p.affiliate || '').split(',').map(x => x.trim()).filter(x => AFF[x] && AFF[x].active);
  const affBox = (aff, single) => `<div class="aff"><div><b>${esc(aff.title)}</b><p>${esc((single && p.affiliate_text) || aff.blurb)}</p>${aff.code ? `<p class="aff-code">Tavsiye kodu: <button type="button" class="code-copy" data-code="${esc(aff.code)}" aria-label="Kodu kopyala">${esc(aff.code)}</button> <span>Hesap açarken "Tavsiye veya kupon kodu" alanına yaz.</span></p>` : ''}</div><a class="btn" href="${aff.url}" rel="sponsored nofollow noopener" target="_blank">${esc(aff.cta)} →</a></div>`;
  const affNote = affList.some(k => AFF[k].code)
    ? 'Bu kutulardaki bağlantı ve tavsiye kodu ortaklık kapsamındadır. Senin ödediğin fiyat değişmez, kullanırsan Gezicorn küçük bir komisyon kazanabilir.'
    : 'Bu kutudaki bağlantı bir ortaklık (affiliate) bağlantısıdır. Senin ödediğin fiyat değişmez, satın alırsan Gezicorn küçük bir komisyon kazanabilir.';
  const affHtml = affList.length ? affList.map(k => affBox(AFF[k], affList.length === 1)).join('') + `<p class="aff-note">${affNote}</p>` : '';
  const relHtml = rel.length ? `<section class="related" aria-label="İlgili yazılar"><h2>Bunlar da işine yarayabilir</h2><div class="grid">${rel.map(cardHtml).join('')}</div></section>` : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
${headCommon({ title: pageTitle(p.title), desc, canonical: url, image, type: 'article', robots: p.noindex ? 'noindex,follow' : undefined,
  extra: `\n<meta property="article:published_time" content="${p.created.toISOString()}">\n<meta property="article:modified_time" content="${p.updated.toISOString()}">\n<meta property="article:section" content="${esc(cat.label)}">\n<meta property="article:author" content="Gezicorn">` })}
<script type="application/ld+json">${jsonLd(ld)}</script>
<style>${CSS}</style>
</head>
<body>
${NAV}
<aside class="ad ad-left" data-slot="banner_left" aria-label="Reklam"></aside><aside class="ad ad-right" data-slot="banner_right" aria-label="Reklam"></aside>
<main>
<nav class="crumbs" aria-label="Sayfa yolu"><a href="/">Ana sayfa</a><span>›</span><a href="/yazi/">Yazılar</a><span>›</span><a href="/yazi/#${p.category}">${esc(cat.label)}</a></nav>
${p.cover_image ? `<img class="cover" src="${image}" alt="${esc(p.cover_alt || p.title)}" width="1200" height="675" fetchpriority="high">` : ''}
<article class="article">
<span class="chip ${esc(p.category)}">${esc(CAT[p.category]?.short || p.category)}</span>
<div class="head-row"><h1 style="margin-top:12px">${esc(p.title)}</h1>${STAMP_BY_SLUG[p.slug] ? stampHtml(STAMP_BY_SLUG[p.slug]) : ''}</div>
<div class="meta"><span>Yazan: Gezicorn</span><span>Güncelleme: <time datetime="${isoDate(p.updated)}">${trDate(p.updated)}</time></span><span>${mins} dk okuma</span></div>
${p.excerpt && blocks[0]?.t !== 'quote' ? `<p class="excerpt">${inline(p.excerpt)}</p>` : ''}
${tocHtml}
<aside class="ad ad-inline" data-slot="banner_inline" aria-label="Reklam"></aside>
${ytHtml}
<div class="body">
${html}
</div>
${affHtml}
<aside class="author"><img src="/logo-128.png" alt="Gezicorn" width="48" height="48"><p><b>Gezicorn</b>Kırgızistan'dan Kamboçya'ya solo seyahat rotasını <a href="https://www.youtube.com/@gezikorn" rel="noopener">YouTube kanalında</a> paylaşan gezi ve vize rehberi. Yazılar kendi deneyimimize ve resmi kaynaklara dayanır.</p></aside>
<aside class="next"><img src="/assets/3d/plane.webp" alt="" width="92" height="92" loading="lazy"><div><b>Sıradaki durak neresi?</b><p>Canlı uçak biletini ara ya da başka bir ülkenin rehberine göz at.</p></div><div class="btns"><a class="btn yl" href="/#bilet">Uçak bileti ara</a><a class="btn alt" href="/yazi/#vize">Vize rehberleri</a></div></aside>
<p class="disclaimer">Bu yazı genel bilgi amaçlıdır. Vize, ücret ve giriş kuralları ülkeye ve döneme göre değişir. Başvurudan önce ilgili ülkenin konsolosluğunun veya resmi e-vize sitesinin güncel duyurularını kontrol et.</p>
</article>
${relHtml}
</main>
${FOOTER}
${AD_SCRIPT}${p.youtube_id ? YT_SCRIPT : ''}${affList.some(k => AFF[k].code) ? CODE_SCRIPT : ''}
</body>
</html>
`;
}

function cardHtml(p) {
  const img = (absImg(p.cover_image) || `${BASE}/img/covers/_default.jpg`).replace(BASE, '');   // kapaksız yazı da aynı boyda kart olsun, kendi domainimizde göreli yol
  return `<a class="tagcard" href="/yazi/${p.slug}/"><img src="${img}" alt="${esc(p.cover_alt || p.title)}" loading="lazy" width="1200" height="675"><span class="chip ${esc(p.category)}">${esc(CAT[p.category]?.short || p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt || '')}</p></a>`;
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
<section class="list-hero"><div class="in"><div><h1>Vize ve <mark>gezi</mark> rehberleri</h1><p>Türk pasaportuyla nereye vizesiz gidilir, e-vize nasıl alınır, rota nasıl kurulur. Kırgızistan'dan Kamboçya'ya kendi gezdiğimiz ülkelerden ve resmi kaynaklara bakarak yazıyoruz.</p></div><img src="/assets/3d/passport.webp" alt="" width="230" height="230"></div></section>
<nav class="chips" aria-label="Kategoriler">${groups.map(g => `<a href="#${g.c}">${esc(CAT[g.c].label)} (${g.items.length})</a>`).join('')}</nav>
<section class="sec"><div class="sec-head"><h2>Vize damgaları</h2><span>Eylül 2026 itibarıyla</span></div><div class="stamps">${STAMPS.map((st, i) => stampHtml(st, i, true)).join('')}</div></section>
${groups.map(g => `<section class="sec" id="${g.c}" style="padding-top:8px"><div class="sec-head"><h2><img src="/assets/3d/${CAT_ICON[g.c]}.webp" alt="" width="64" height="64" loading="lazy">${esc(CAT[g.c].label)}</h2></div><div class="tags">${g.items.map(cardHtml).join('')}</div></section>`).join('\n')}
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
  { loc: `${BASE}/vize-tablosu/`, lastmod: null, priority: '0.8' },
  ...['hakkimizda', 'iletisim', 'gizlilik', 'cerez-politikasi', 'kullanim-kosullari'].map(s => ({ loc: `${BASE}/${s}/`, lastmod: null, priority: '0.3' })),
  ...pub.map(p => ({ loc: `${BASE}/yazi/${p.slug}/`, lastmod: p.updated, priority: '0.7' })),
];
writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u =>
    `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${isoDate(u.lastmod)}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`, 'utf-8');

// ana sayfa: son yazılar (taranabilir statik HTML, JS yüklenince aynı şeyi dinamik basar)
const idxPath = path.join(ROOT, 'index.html');
let idx = readFileSync(idxPath, 'utf-8');
const latest = pub.slice(0, 8).map(cardHtml).join('');
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

// ana sayfa: vize damgaları (stamps.json)
{
  let cur = readFileSync(idxPath, 'utf-8');
  if (cur.includes('<!--STAMPS_START-->')) {
    cur = cur.replace(/<!--STAMPS_START-->[\s\S]*?<!--STAMPS_END-->/, `<!--STAMPS_START-->${STAMPS.map((st, i) => stampHtml(st, i, true)).join('')}<!--STAMPS_END-->`);
    writeFileSync(idxPath, cur, 'utf-8');
  }
}

// ana sayfa: Önerdiklerimiz (affiliates.json içinde active olanlar)
{
  let cur = readFileSync(idxPath, 'utf-8');
  const cards = Object.values(AFF).filter(a => a.active).map(a =>
    `<a class="partner-card" href="${a.url}" rel="sponsored nofollow noopener" target="_blank">${a.img ? `<img src="${a.img}" alt="" width="78" height="78" loading="lazy">` : ''}<div><b>${esc(a.title)}</b><p>${esc(a.blurb)}</p><span>${a.code ? `Kod: ${esc(a.code)} · ` : ''}${esc(a.cta)} →</span></div></a>`).join('');
  if (cur.includes('<!--PARTNERS_START-->')) {
    cur = cur.replace(/<!--PARTNERS_START-->[\s\S]*?<!--PARTNERS_END-->/, `<!--PARTNERS_START-->${cards}<!--PARTNERS_END-->`);
    writeFileSync(idxPath, cur, 'utf-8');
  }
}

console.log(`build-static: ${posts.length} yazı sayfası (${posts.length - pub.length} noindex) + liste + sitemap (${urls.length} URL) üretildi.`);
process.exit(0);
