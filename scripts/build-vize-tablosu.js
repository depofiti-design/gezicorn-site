// /vize-tablosu/: "Pasaportunu seç" sayfası. Bordo (umuma mahsus) ya da yeşil (hususi) pasaport seçilir,
// ülkeler vizesiz / e-vize ya da varışta / vize gerekli / teyit gerekli gruplarında listelenir.
// Veri kaynağı: T.C. Dışişleri Bakanlığı ülke sayfaları (24-25 Eylül 2026) ve sitedeki rehber yazıları.
// Kullanım: node scripts/build-vize-tablosu.js  (Firestore gerekmez). Veri değişince ROWS'u düzenle, çalıştır, build-static, push.
// KURAL: Yeşil pasaport verisi sadece resmi kaynakta teyit edilenler için yazılır, gerisi t:'u' (teyit gerekli) kalır. Tahmin yazma.
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { FOOT_HTML, CSS_V } from './site-parts.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.gezicorn.com';
const UPDATED = '25 Eylül 2026';

// t: v = vizesiz, e = e-vize / varışta vize, x = vize gerekli, u = yeşil için teyit gerekli
const U = { t: 'u', k: 'Teyit et', n: 'Yeşil pasaport için resmi kaynaktan kontrol et. Bordo kuralı geçerli olmayabilir.' };
const ROWS = [
  { u: 'Gürcistan', b: 'Kafkasya', s: 'gurcistan-vizesi-turkler-icin-kimlikle-giris-sigorta',
    pb: { t: 'v', k: '1 yıl', n: 'Yeni tip çipli kimlikle de girilir. 2026\'dan beri en az 30.000 GEL teminatlı sigorta zorunlu.' },
    py: { t: 'v', k: '1 yıl', n: 'Tüm pasaport türleri muaf. Sigorta şartı aynı.' } },
  { u: 'Kırgızistan', b: 'Orta Asya', s: 'kirgizistan-vizesi-turkler-icin-ne-gerekiyor',
    pb: { t: 'v', k: '180 günde 90 gün', n: 'Visa-run ile süre sıfırlanmıyor.' },
    py: { t: 'v', k: '180 günde 90 gün', n: 'Bordo ile aynı kural.' } },
  { u: 'Kazakistan', b: 'Orta Asya', s: 'kazakistana-vizesiz-girmek-mumkun-mu',
    pb: { t: 'v', k: '90 gün', n: 'Dışişleri\'ne göre 90 gün. Bazı kaynaklar giriş başına 30 gün diyor, teyit et.' },
    py: { t: 'v', k: '90 gün', n: 'Tüm pasaport türleri için 90 gün. Pasaport 6 ay geçerli olmalı.' } },
  { u: 'Özbekistan', b: 'Orta Asya', s: 'ozbekistan-vize-kurallari-kalis-suresi',
    pb: { t: 'v', k: '30 gün', n: 'Otel ya da adres kaydı önemli. Pasaport 6 ay geçerli olmalı.' }, py: U },
  { u: 'Tacikistan', b: 'Orta Asya', s: 'orta-asyada-vizesiz-ulkeler-listesi',
    pb: { t: 'x', k: 'Önceden vize', n: 'Bordo pasaportla vize gerekiyor, resmi portaldan başvurulur.' },
    py: { t: 'v', k: '180 günde 60 gün', n: 'Hususi pasaport vizeden muaf. Varıştan sonra adres kaydı gerekir.' } },
  { u: 'Türkmenistan', b: 'Orta Asya', s: 'orta-asyada-vizesiz-ulkeler-listesi',
    pb: { t: 'x', k: 'Önceden vize', n: 'Davet mektubuna bağlı vize, genelde tur operatörüyle.' }, py: U },
  { u: 'Tayland', b: 'Güneydoğu Asya', s: 'tayland-vize-muafiyeti-kuru-sezon-rehberi',
    pb: { t: 'v', k: '30 gün', n: 'Varıştan önce TDAC dijital varış kartı doldurulur.' }, py: U },
  { u: 'Malezya', b: 'Güneydoğu Asya', s: 'malezyaya-kac-gun-vizesiz-kalinabilir',
    pb: { t: 'v', k: '90 gün', n: 'Varıştan önceki 3 gün içinde ücretsiz MDAC. Pasaport 6 ay geçerli olmalı.' },
    py: { t: 'v', k: '90 gün', n: 'Tüm pasaport türleri için 90 gün. MDAC gerekli.' } },
  { u: 'Kamboçya', b: 'Güneydoğu Asya', s: 'kambocya-vizesi-turkler-icin-e-vize-sureci',
    pb: { t: 'e', k: 'E-vize ya da varışta', n: 'Ayrıca ücretsiz e-Arrival Card gerekiyor.' }, py: U },
  { u: 'Vietnam', b: 'Güneydoğu Asya', s: 'vietnam-vizesi-turkler-icin-e-vize-sureci',
    pb: { t: 'e', k: 'E-vize', n: 'Resmi e-vize portalından başvuru yapılır.' },
    py: { t: 'v', k: '90 gün', n: 'Hususi, hizmet ve diplomatik pasaport 90 güne kadar vizeden muaf.' } },
  { u: 'Hong Kong', b: 'Doğu Asya', s: 'hong-konga-giriste-vize-gerekiyor-mu',
    pb: { t: 'v', k: '90 gün', n: 'Türk vatandaşları için vizesiz giriş.' }, py: U },
  { u: 'Japonya', b: 'Doğu Asya', s: 'japonya-vizesi-turkler-icin-zor-mu',
    pb: { t: 'v', k: '90 gün', n: 'Turistik ve kısa iş ziyareti için vizesiz.' },
    py: { t: 'v', k: '90 gün', n: 'Tüm pasaport türleri için aynı.' } },
  { u: 'Güney Kore', b: 'Doğu Asya', s: 'guney-kore-vize-surecinde-dikkat-edilmesi-gerekenler',
    pb: { t: 'v', k: '90 gün', n: 'K-ETA onayı gerekli, en az 72 saat önce alınır.' },
    py: { t: 'v', k: '90 gün', n: 'K-ETA onayı gerekli, en az 72 saat önce alınır.' } },
  { u: 'Rusya', b: 'Doğu Avrupa', s: 'rusya-e-vize-basvurusu-nasil-yapilir',
    pb: { t: 'e', k: 'E-vize ya da konsolosluk', n: 'Başvuru türü seyahat amacına göre değişir.' }, py: U },
  { u: 'Bosna-Hersek', b: 'Balkanlar', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin',
    pb: { t: 'v', k: '180 günde 90 gün', n: 'Transit geçişe de izin var.' },
    py: { t: 'v', k: '180 günde 90 gün', n: 'Hususi pasaport da kapsamda.' } },
  { u: 'Arnavutluk', b: 'Balkanlar', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin',
    pb: { t: 'v', k: '6 ayda 90 gün', n: 'İlk giriş tarihinden itibaren sayılır.' },
    py: { t: 'v', k: '6 ayda 90 gün', n: 'Özel pasaport da kapsamda.' } },
  { u: 'Sırbistan', b: 'Balkanlar', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin',
    pb: { t: 'v', k: '6 ayda 90 gün', n: 'Sınırda dönüş bileti ve nakit sorulabilir.' },
    py: { t: 'v', k: '6 ayda 90 gün', n: 'Hususi pasaport vizeden muaf.' } },
  { u: 'Karadağ', b: 'Balkanlar', s: 'balkanlara-vizesiz-gidilir-mi-turkler-icin',
    pb: { t: 'v', k: '180 günde 30 gün', n: 'Özel evde kalırsan 24 saat içinde kayıt yaptır.' }, py: U },
  { u: 'Dubai (BAE)', b: 'Orta Doğu', s: 'dubai-vizesi-turkler-icin-bordo-yesil-pasaport',
    pb: { t: 'x', k: 'Önceden vize', n: 'Bordo pasaportla vize gerekiyor.' },
    py: { t: 'v', k: '90 gün', n: 'Hususi, hizmet ve diplomatik pasaport vizeden muaf.' } },
  { u: 'Schengen (Almanya vb.)', b: 'Avrupa', s: 'almanya-vizesi-nasil-alinir',
    pb: { t: 'x', k: 'Önceden vize', n: '29 ülkeyi kapsayan tek Schengen vizesi.' }, py: U },
  { u: 'İngiltere', b: 'Avrupa', s: 'ingiltere-vizesi-schengenden-farkli-mi',
    pb: { t: 'x', k: 'Önceden vize', n: 'Schengen dışında, ayrı vize gerekiyor.' }, py: U },
  { u: 'ABD', b: 'Amerika', s: 'abd-vizesi-neden-bu-kadar-zor',
    pb: { t: 'x', k: 'Önceden vize', n: 'B1/B2 vizesi ve mülakat.' }, py: U },
  { u: 'Kanada', b: 'Amerika', s: 'kanada-vizesi-basvuru-sureci-red-sebepleri',
    pb: { t: 'x', k: 'Önceden vize', n: 'Ziyaretçi vizesi başvurusu gerekiyor.' }, py: U },
  { u: 'Avustralya', b: 'Okyanusya', s: 'avustralya-vizesi-turkler-icin-ne-kadar-zor',
    pb: { t: 'x', k: 'Önceden vize', n: 'Subclass 600 ziyaretçi vizesi.' }, py: U },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugTr = (s) => s.toLowerCase().replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

const NAV = `<header class="gz-nav"><a class="gz-brand" href="/"><img src="/logo-128.png" alt="Gezicorn logo" width="38" height="38"><span>gezicorn</span></a>
<nav aria-label="Ana menü"><ul class="gz-links"><li><a class="hl2 on" href="/vize-tablosu/">Vize Tablosu</a></li><li><a href="/yazi/#vize">Vize</a></li><li><a href="/yazi/#rehber">Rehberler</a></li><li><a href="/yazi/#haber">Haberler</a></li><li><a href="/#bilet">Bilet ara</a></li><li><a class="hl" href="/danismanlik.html">Danışmanlık</a></li></ul></nav></header>`;

const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Nunito+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="/assets/gz.css?v=${CSS_V}">`;

const TITLE = 'Pasaportunu Seç: Bordo ve Yeşil Pasaportla Vizesiz Ülkeler';
const DESC = 'Bordo ya da yeşil pasaportunu seç, vizesiz gidebileceğin, e-vize alabileceğin ve vize gerektiren ülkeleri gör. Kalış süreleri ve rehber linkleri tek sayfada.';
const url = `${BASE}/vize-tablosu/`;

const kv = (o) => `<div class="vt-k"><b>${esc(o.k)}</b><span>${esc(o.n)}</span></div>`;
const cards = ROWS.map((r) => `<li class="vt-row" data-tb="${r.pb.t}" data-ty="${r.py.t}" data-q="${esc(slugTr(r.u + ' ' + r.b))}">
<div class="vt-top"><h3>${esc(r.u)}</h3><span class="vt-b">${esc(r.b)}</span></div>
<div class="kb">${kv(r.pb)}</div><div class="ky">${kv(r.py)}</div>
<a class="vt-go" href="/yazi/${r.s}/" aria-label="${esc(r.u)} rehberini oku">Rehberi oku →</a>
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
<span class="kicker">Pasaport sorgula</span>
<h1>Pasaportunu seç, <mark>nereye</mark> gidebileceğini gör</h1>
<p class="vt-lead">Önce hangi pasaporta sahip olduğunu seç. Sana uygun vizesiz, e-vizeli ve vize gerektiren ülkeleri ayrı ayrı listeleyelim. Bilgiler <b>${UPDATED}</b> itibarıyla T.C. Dışişleri Bakanlığı ve rehber yazılarımızdan derlendi.</p>

<p class="vt-step">1. Pasaportunu seç</p>
<div class="vt-pass" role="group" aria-label="Pasaport türü">
<button type="button" class="pp" data-p="b" aria-pressed="true"><span class="pbook bordo" aria-hidden="true"></span><span><b>Bordo pasaport</b><small>Umuma mahsus. Çoğu kişinin kullandığı standart pasaport (kırmızı da denir).</small></span></button>
<button type="button" class="pp" data-p="y" aria-pressed="false"><span class="pbook yesil" aria-hidden="true"></span><span><b>Yeşil pasaport</b><small>Hususi damgalı. Belirli kamu görevlileri ve yakınları için.</small></span></button>
</div>

<p class="vt-step">2. Ne aradığını seç</p>
<div class="vt-stats c3" id="vts" role="group" aria-label="Vize durumu">
<button type="button" class="st" data-tab="v" aria-pressed="true"><span class="n" data-n="v">0</span><span class="l">Vizesiz gidilen</span></button>
<button type="button" class="st" data-tab="e" aria-pressed="false"><span class="n" data-n="e">0</span><span class="l">E-vize / varışta</span></button>
<button type="button" class="st" data-tab="x" aria-pressed="false"><span class="n" data-n="x">0</span><span class="l">Vize gerekli</span></button>
<button type="button" class="st" data-tab="u" aria-pressed="false"><span class="n" data-n="u">0</span><span class="l">Teyit gerekli</span></button>
</div>

<div class="vt-tools"><label class="vt-search"><span class="sr">Ülke ara</span><input id="vtq" type="search" placeholder="Ülke ya da bölge ara: Gürcistan, Balkanlar..." autocomplete="off"></label></div>
<p class="vt-count" id="vtc" aria-live="polite"></p>
<ul class="vt-list is-b" id="vtl">
${cards}
</ul>
<p class="vt-empty" id="vte" hidden>Bu grupta aradığın ülke yok. <a href="/yazi/">Tüm rehberlere</a> bak ya da <a href="/danismanlik.html">bize sor</a>.</p>
<aside class="vt-note"><b>Önemli:</b> Vize kuralları ve kalış süreleri değişebilir. Yola çıkmadan önce mutlaka <a href="https://www.mfa.gov.tr" rel="noopener">T.C. Dışişleri Bakanlığı</a> ve ilgili ülkenin resmi kaynağından teyit et. Yeşil pasaport için yalnızca resmi kaynakta gördüğümüz ülkeleri işaretledik, gerisi "teyit gerekli" grubunda. Pasaport renklerinin farkını <a href="/yazi/pasaport-turleri-bordo-yesil-hususi-gri-fark/">bu yazıda</a> anlattık.</aside>
</main>
${FOOT_HTML}
<script>
(function(){
var list=document.getElementById('vtl'),rows=[].slice.call(list.children),q=document.getElementById('vtq'),c=document.getElementById('vtc'),e=document.getElementById('vte'),
pbtn=[].slice.call(document.querySelectorAll('.pp')),sbtn=[].slice.call(document.querySelectorAll('.st')),p='b',tab='v';
function tr(s){return s.toLowerCase().replace(/ı/g,'i').replace(/i̇/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c');}
function key(r){return p==='b'?r.dataset.tb:r.dataset.ty;}
function run(){
  var t=tr(q.value.trim()),counts={v:0,e:0,x:0,u:0},shown=0;
  list.className='vt-list is-'+p;
  rows.forEach(function(r){var k=key(r);counts[k]++;r.dataset.cur=k;});
  var vis=0;
  sbtn.forEach(function(b){var k=b.dataset.tab;b.querySelector('.n').textContent=counts[k];b.hidden=counts[k]===0&&k!=='v';if(!b.hidden)vis++;});
  if(counts[tab]===0){tab='v';}
  sbtn.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.tab===tab?'true':'false');});
  document.getElementById('vts').className='vt-stats c'+vis;
  rows.forEach(function(r){var ok=key(r)===tab&&(!t||r.dataset.q.indexOf(t)>-1);r.hidden=!ok;if(ok)shown++;});
  c.textContent=shown+' ülke gösteriliyor';e.hidden=shown>0;
}
pbtn.forEach(function(b){b.addEventListener('click',function(){p=b.dataset.p;pbtn.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});try{history.replaceState(null,'',p==='y'?'#yesil':'#bordo');}catch(_){}run();});});
sbtn.forEach(function(b){b.addEventListener('click',function(){tab=b.dataset.tab;run();});});
q.addEventListener('input',run);
if(location.hash==='#yesil'){p='y';pbtn.forEach(function(x){x.setAttribute('aria-pressed',x.dataset.p==='y'?'true':'false');});}
run();
})();
</script>
</body>
</html>
`;

mkdirSync(path.join(ROOT, 'vize-tablosu'), { recursive: true });
writeFileSync(path.join(ROOT, 'vize-tablosu', 'index.html'), html, 'utf-8');
console.log(`vize-tablosu: ${ROWS.length} ülke satırı yazıldı.`);
