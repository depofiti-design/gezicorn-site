// /vize-tablosu/: Türk pasaportu (bordo) için ülke bazlı, aranabilir ve filtrelenebilir vize durumu tablosu.
// Veriler sitedeki rehber yazılarından ve T.C. Dışişleri Bakanlığı ülke sayfalarından (24 Eylül 2026) alındı.
// Kullanım: node scripts/build-vize-tablosu.js  (Firestore gerekmez). Veri değişince ROWS'u düzenle, çalıştır, sonra build-static + push.
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { FOOT_HTML, CSS_V } from './site-parts.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.gezicorn.com';
const UPDATED = '24 Eylül 2026';

// tur: v = vizesiz, e = e-vize / varışta vize, x = vize gerekli
const ROWS = [
  { u: 'Gürcistan', b: 'Kafkasya', t: 'v', k: '1 yıl', n: 'Yeni tip çipli kimlikle de girilir. 2026\'dan beri en az 30.000 GEL teminatlı sigorta zorunlu.', s: 'gurcistan-vizesi-turkler-icin-kimlikle-giris-sigorta' },
  { u: 'Kırgızistan', b: 'Orta Asya', t: 'v', k: '180 günde 90 gün', n: 'Visa-run ile süre sıfırlanmıyor.', s: 'kirgizistan-vizesi-turkler-icin-ne-gerekiyor' },
  { u: 'Kazakistan', b: 'Orta Asya', t: 'v', k: '30 gün', n: 'Türk pasaportuyla vizesiz.', s: 'kazakistana-vizesiz-girmek-mumkun-mu' },
  { u: 'Özbekistan', b: 'Orta Asya', t: 'v', k: '30 gün', n: 'Otel ya da adres kaydı önemli.', s: 'ozbekistan-vize-kurallari-kalis-suresi' },
  { u: 'Tacikistan', b: 'Orta Asya', t: 'x', k: '-', n: 'Bordo pasaportla vize gerekiyor.', s: 'orta-asyada-vizesiz-ulkeler-listesi' },
  { u: 'Türkmenistan', b: 'Orta Asya', t: 'x', k: '-', n: 'Davet mektubuna bağlı vize, genelde tur operatörüyle.', s: 'orta-asyada-vizesiz-ulkeler-listesi' },
  { u: 'Tayland', b: 'Güneydoğu Asya', t: 'v', k: '30 gün', n: 'Girişten önce TDAC formu doldurulur.', s: 'tayland-vize-muafiyeti-kuru-sezon-rehberi' },
  { u: 'Malezya', b: 'Güneydoğu Asya', t: 'v', k: '90 gün', n: 'Varıştan önceki 3 gün içinde ücretsiz MDAC formu.', s: 'malezyaya-kac-gun-vizesiz-kalinabilir' },
  { u: 'Kamboçya', b: 'Güneydoğu Asya', t: 'e', k: 'e-vize ya da varışta', n: 'Ayrıca ücretsiz e-Arrival Card gerekiyor.', s: 'kambocya-vizesi-turkler-icin-e-vize-sureci' },
  { u: 'Vietnam', b: 'Güneydoğu Asya', t: 'e', k: 'e-vize', n: 'Resmi e-vize portalından başvuru.', s: 'vietnam-vizesi-turkler-icin-e-vize-sureci' },
  { u: 'Hong Kong', b: 'Doğu Asya', t: 'v', k: '90 gün', n: 'Türk vatandaşları için vizesiz giriş.', s: 'hong-konga-giriste-vize-gerekiyor-mu' },
  { u: 'Japonya', b: 'Doğu Asya', t: 'v', k: '90 gün', n: 'Turistik seyahat için vizesiz.', s: 'japonya-vizesi-turkler-icin-zor-mu' },
  { u: 'Güney Kore', b: 'Doğu Asya', t: 'v', k: '90 gün', n: 'K-ETA konusunu resmi kaynaktan kontrol et.', s: 'guney-kore-vize-surecinde-dikkat-edilmesi-gerekenler' },
  { u: 'Rusya', b: 'Doğu Avrupa', t: 'e', k: 'e-vize ya da konsolosluk', n: 'Başvuru türü seyahat amacına göre değişir.', s: 'rusya-e-vize-basvurusu-nasil-yapilir' },
  { u: 'Bosna-Hersek', b: 'Balkanlar', t: 'v', k: '180 günde 90 gün', n: 'Transit geçişe de izin var.', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin' },
  { u: 'Arnavutluk', b: 'Balkanlar', t: 'v', k: '6 ayda 90 gün', n: 'İlk giriş tarihinden itibaren sayılır.', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin' },
  { u: 'Sırbistan', b: 'Balkanlar', t: 'v', k: '6 ayda 90 gün', n: 'Sınırda dönüş bileti ve nakit sorulabilir.', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin' },
  { u: 'Karadağ', b: 'Balkanlar', t: 'v', k: '180 günde 30 gün', n: 'Özel evde kalırsan 24 saat içinde kayıt yaptır.', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin' },
  { u: 'Birleşik Arap Emirlikleri (Dubai)', b: 'Orta Doğu', t: 'x', k: '-', n: 'Bordo pasaportla vize gerekiyor, yeşil ve gri pasaport 90 güne kadar muaf.', s: 'dubai-vizesi-turkler-icin-bordo-yesil-pasaport' },
  { u: 'Schengen (Almanya ve diğerleri)', b: 'Avrupa', t: 'x', k: '-', n: '29 ülkeyi kapsayan tek Schengen vizesi.', s: 'almanya-vizesi-nasil-alinir' },
  { u: 'İngiltere', b: 'Avrupa', t: 'x', k: '-', n: 'Schengen dışında, ayrı vize gerekiyor.', s: 'ingiltere-vizesi-schengenden-farkli-mi' },
  { u: 'ABD', b: 'Amerika', t: 'x', k: '-', n: 'B1/B2 vizesi ve mülakat.', s: 'abd-vizesi-neden-bu-kadar-zor' },
  { u: 'Kanada', b: 'Amerika', t: 'x', k: '-', n: 'Ziyaretçi vizesi başvurusu gerekiyor.', s: 'kanada-vizesi-basvuru-sureci-red-sebepleri' },
  { u: 'Avustralya', b: 'Okyanusya', t: 'x', k: '-', n: 'Subclass 600 ziyaretçi vizesi.', s: 'avustralya-vizesi-turkler-icin-ne-kadar-zor' },
];

const LABEL = { v: 'Vizesiz', e: 'E-vize / varışta', x: 'Vize gerekli' };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugTr = (s) => s.toLowerCase().replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

const NAV = `<header class="gz-nav"><a class="gz-brand" href="/"><img src="/logo-128.png" alt="Gezicorn logo" width="38" height="38"><span>gezicorn</span></a>
<nav aria-label="Ana menü"><ul class="gz-links"><li><a href="/yazi/#vize">Vize</a></li><li><a href="/yazi/#rehber">Rehberler</a></li><li><a href="/yazi/#haber">Haberler</a></li><li><a href="/#bilet">Bilet ara</a></li><li><a class="hl" href="/danismanlik.html">Danışmanlık</a></li></ul></nav></header>`;

const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Nunito+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="/assets/gz.css?v=${CSS_V}">`;

const TITLE = 'Türk Pasaportuyla Vize Tablosu 2026: Ülke Ülke Vize Durumu';
const DESC = 'Türk pasaportu (bordo) için ülke ülke vize durumu: vizesiz, e-vize ve vize gerekli ülkeler, kalış süreleri ve rehber linkleri tek tabloda. Ara ve filtrele.';
const url = `${BASE}/vize-tablosu/`;

const cards = ROWS.map((r) => `<li class="vt-row" data-t="${r.t}" data-q="${esc(slugTr(r.u + ' ' + r.b))}">
<div class="vt-main"><h3>${esc(r.u)}</h3><span class="vt-b">${esc(r.b)}</span></div>
<span class="vt-tag t-${r.t}">${LABEL[r.t]}</span>
<div class="vt-k"><b>${r.k === '-' ? 'Önceden vize alınır' : esc(r.k)}</b><span>${esc(r.n)}</span></div>
<a class="vt-go" href="/yazi/${r.s}/" aria-label="${esc(r.u)} rehberini oku">Rehber →</a>
</li>`).join('\n');

const jsonld = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'WebPage', name: TITLE, url, description: DESC, inLanguage: 'tr-TR',
  isPartOf: { '@type': 'WebSite', name: 'Gezicorn', url: BASE + '/' },
  breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: BASE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Vize tablosu', item: url },
  ] },
});

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITLE} | Gezicorn</title>
<meta name="description" content="${DESC}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Gezicorn"><meta property="og:locale" content="tr_TR"><meta property="og:type" content="website">
<meta property="og:url" content="${url}"><meta property="og:title" content="${TITLE} | Gezicorn"><meta property="og:description" content="${DESC}">
<meta property="og:image" content="${BASE}/og-default.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0F766E">
<link rel="icon" type="image/png" href="/logo-256.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
${HEAD_FONTS}
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
${NAV}
<main class="vt">
<span class="kicker">Bordo pasaport</span>
<h1>Türk pasaportuyla vize tablosu</h1>
<p class="vt-lead">Ülke adını yaz ya da filtrele. Her satırdan o ülkenin ayrıntılı rehberine geçebilirsin. Veriler bordo (umuma mahsus) pasaport içindir ve <b>${UPDATED}</b> itibarıyla T.C. Dışişleri Bakanlığı ile rehber yazılarımızdan derlendi.</p>
<div class="vt-tools">
<label class="vt-search"><span class="sr">Ülke ara</span><input id="vtq" type="search" placeholder="Ülke ya da bölge ara: Gürcistan, Balkanlar..." autocomplete="off"></label>
<div class="vt-filters" role="group" aria-label="Vize durumuna göre filtrele">
<button class="on" data-f="all" type="button">Tümü</button><button data-f="v" type="button">Vizesiz</button><button data-f="e" type="button">E-vize / varışta</button><button data-f="x" type="button">Vize gerekli</button>
</div>
</div>
<p class="vt-count" id="vtc" aria-live="polite"></p>
<ul class="vt-list" id="vtl">
${cards}
</ul>
<p class="vt-empty" id="vte" hidden>Aradığın ülke listede yok. <a href="/yazi/">Tüm rehberlere</a> bak ya da <a href="/danismanlik.html">bize sor</a>.</p>
<aside class="vt-note"><b>Önemli:</b> Vize kuralları ve kalış süreleri değişebilir. Yola çıkmadan önce mutlaka <a href="https://www.mfa.gov.tr" rel="noopener">T.C. Dışişleri Bakanlığı</a> ve ilgili ülkenin resmi kaynağından teyit et. Yeşil, gri ve siyah pasaportlar için kurallar farklı olabilir: <a href="/yazi/pasaport-turleri-bordo-yesil-hususi-gri-fark/">pasaport türleri farkı</a>.</aside>
</main>
${FOOT_HTML}
<script>
(function(){
var q=document.getElementById('vtq'),rows=[].slice.call(document.querySelectorAll('.vt-row')),btns=[].slice.call(document.querySelectorAll('.vt-filters button')),c=document.getElementById('vtc'),e=document.getElementById('vte'),f='all';
function tr(s){return s.toLowerCase().replace(/ı/g,'i').replace(/i̇/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c');}
function run(){var t=tr(q.value.trim()),n=0;rows.forEach(function(r){var ok=(f==='all'||r.dataset.t===f)&&(!t||r.dataset.q.indexOf(t)>-1);r.hidden=!ok;if(ok)n++;});c.textContent=n+' ülke gösteriliyor';e.hidden=n>0;}
q.addEventListener('input',run);
btns.forEach(function(b){b.addEventListener('click',function(){f=b.dataset.f;btns.forEach(function(x){x.classList.toggle('on',x===b);});run();});});
run();
})();
</script>
</body>
</html>
`;

mkdirSync(path.join(ROOT, 'vize-tablosu'), { recursive: true });
writeFileSync(path.join(ROOT, 'vize-tablosu', 'index.html'), html, 'utf-8');
console.log(`vize-tablosu: ${ROWS.length} ülke satırı yazıldı.`);
