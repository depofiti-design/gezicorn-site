// Yasal ve kurumsal sayfaları üretir: /gizlilik/, /cerez-politikasi/, /kullanim-kosullari/, /hakkimizda/, /iletisim/
// Ayrıca index.html, danismanlik.html, posts.html ve 404.html içindeki altbilgiyi (<!--FOOT_START-->...<!--FOOT_END-->) yeniler.
// Kullanım: node scripts/build-legal.js   (Firestore gerekmez). Metni değiştirince tekrar çalıştır, sonra build-static + push.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { FOOT_HTML, CSS_V } from './site-parts.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.gezicorn.com';
const UPDATED = '21 Eylül 2026';

const NAV = `<header class="gz-nav"><a class="gz-brand" href="/"><img src="/logo-128.png" alt="Gezicorn logo" width="38" height="38"><span>gezicorn</span></a>
<nav aria-label="Ana menü"><ul class="gz-links"><li><a href="/yazi/#vize">Vize</a></li><li><a href="/yazi/#rehber">Rehberler</a></li><li><a href="/yazi/#haber">Haberler</a></li><li><a href="/#bilet">Bilet ara</a></li><li><a class="hl" href="/danismanlik.html">Danışmanlık</a></li></ul></nav></header>`;

const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Nunito+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="/assets/gz.css?v=${CSS_V}">`;

function page({ slug, title, kicker, desc, body, script = '' }) {
  const url = `${BASE}/${slug}/`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | Gezicorn</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Gezicorn"><meta property="og:locale" content="tr_TR"><meta property="og:type" content="website">
<meta property="og:url" content="${url}"><meta property="og:title" content="${title} | Gezicorn"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${BASE}/og-default.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0F766E">
<link rel="icon" type="image/png" href="/logo-256.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
${HEAD_FONTS}
</head>
<body>
${NAV}
<main class="legal">
<span class="kicker">${kicker}</span>
<h1>${title}</h1>
<p class="upd">Son güncelleme: ${UPDATED}</p>
${body}
</main>
${FOOT_HTML}
${script}
</body>
</html>
`;
}

const CONTACT_NOTE = `Bize <a href="/iletisim/">iletişim sayfasındaki</a> kanallardan ulaşabilirsin.`;

const PAGES = [];

// ---------------------------------------------------------------- Gizlilik ve KVKK
PAGES.push({
  slug: 'gizlilik',
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni',
  kicker: 'Gizlilik',
  desc: 'Gezicorn hangi verileri işler, neden işler, kimlerle paylaşır ve KVKK kapsamındaki haklarını nasıl kullanırsın. Kısa ve anlaşılır özet.',
  body: `
<div class="sum">
<p><b>Kısaca:</b></p>
<ul>
<li>Sitede üyelik, yorum ya da form yok. Ad, e-posta veya telefon toplamıyoruz.</li>
<li>Analiz ve reklam çerezi kullanmıyoruz. Uçak bileti arama kutusu yalnızca sen izin verirsen yüklenir.</li>
<li>Danışmanlık için bize yazarsan paylaştığın bilgileri yalnızca o talep için kullanırız.</li>
<li>Verini satmayız.</li>
</ul>
</div>

<h2>1. Veri sorumlusu</h2>
<p>Bu site Gezicorn markası altında yayınlanır. Danışmanlık hizmetinin ve bu kapsamda işlenen kişisel verilerin sorumlusu GEZİCORN TRAVEL LTD'dir (Kamboçya merkezli şirket, bundan sonra "Gezicorn"). Veri sorumlusuyla iletişim: ${CONTACT_NOTE}</p>

<h2>2. Hangi verileri işliyoruz?</h2>
<ul>
<li><b>Site ziyareti:</b> IP adresi, tarayıcı ve cihaz türü, ziyaret zamanı ve istenen sayfa. Bu kayıtlar barındırma sağlayıcısının sunucularında teknik olarak oluşur.</li>
<li><b>Çerez tercihi:</b> Çerez seçimini hatırlamak için tarayıcında saklanan küçük bir kayıt. Ayrıntı için <a href="/cerez-politikasi/">çerez politikası</a>.</li>
<li><b>Üçüncü taraf içerikler:</b> Uçak bileti arama kutusu ya da YouTube videosu gibi içerikleri kullanırsan bu hizmetlerin kendi sağlayıcıları veri işleyebilir (bölüm 5).</li>
<li><b>İletişim ve danışmanlık:</b> WhatsApp, Telegram, e-posta veya sosyal medya üzerinden bize yazarsan paylaştığın ad, iletişim bilgisi, seyahat planı ve talebin için gerekli belgeler (örneğin pasaport bilgileri).</li>
</ul>

<h2>3. Neden işliyoruz, hukuki sebebi ne?</h2>
<table><thead><tr><th>Amaç</th><th>Hukuki sebep (KVKK m.5)</th></tr></thead><tbody>
<tr><td>Sitenin çalışması, güvenliği ve hata giderme</td><td>Meşru menfaat</td></tr>
<tr><td>Çerez tercihini hatırlama</td><td>Meşru menfaat, tercihine saygı</td></tr>
<tr><td>Üçüncü taraf ortak içerikleri yükleme</td><td>Açık rıza (çerez tercihinle verirsin, dilediğin an geri alırsın)</td></tr>
<tr><td>Taleplerine cevap verme, danışmanlık hizmeti</td><td>Sözleşmenin kurulması veya ifası, talebin</td></tr>
<tr><td>Yasal yükümlülükler ve olası uyuşmazlıklarda hakkın korunması</td><td>Hukuki yükümlülük, hakkın tesisi ve korunması</td></tr>
</tbody></table>

<h2>4. Verilerin toplanma yöntemi</h2>
<p>Veriler, siteyi ziyaret ettiğinde otomatik yolla (sunucu kayıtları, tarayıcı depolaması) ve bize kendi isteğinle yazdığında yazışma yoluyla toplanır.</p>

<h2>5. Kimlerle paylaşılır?</h2>
<p>Verini satmayız ve pazarlama amacıyla üçüncü kişilere vermeyiz. Sitenin çalışması için şu hizmet sağlayıcılar kullanılır, bazıları yurt dışında bulunur:</p>
<ul>
<li><b>Vercel:</b> siteyi barındırır, ziyaret kayıtlarını tutar.</li>
<li><b>Google Firebase (Firestore):</b> yazı, fırsat ve site ayarları gibi içerik veritabanı. Ziyaretçiden veri yazmayız.</li>
<li><b>Google Fonts ve Cloudflare (cdnjs):</b> yazı tipleri ve simgeler. Sayfayı açtığında IP adresin bu sağlayıcılara iletilir.</li>
<li><b>YouTube:</b> yalnızca gömülü videoyu oynat düğmesine bastığında yüklenir (youtube-nocookie.com).</li>
<li><b>Travelpayouts / Aviasales:</b> uçak bileti arama kutusu, yalnızca çerez tercihinde izin verirsen yüklenir.</li>
<li><b>Klook ve diğer ortaklık bağlantıları:</b> bağlantıya tıklarsan ilgili sitenin kendi gizlilik ve çerez kuralları geçerli olur.</li>
<li><b>Instagram, Facebook, YouTube ve benzeri platformlar:</b> hesaplarımıza gittiğinde ya da bize oradan yazdığında platformun kendi politikası geçerlidir.</li>
</ul>
<p>Bu sağlayıcıların sunucuları Türkiye dışında olabileceğinden, kişisel veriler KVKK m.9 çerçevesinde yurt dışına aktarılabilir. Yasal olarak zorunlu olduğunda yetkili kurumlarla da paylaşım yapılabilir.</p>

<h2>6. Ne kadar saklıyoruz?</h2>
<p>Sunucu kayıtları barındırma sağlayıcısının belirlediği kısa sürelerle tutulur. Çerez tercihin tarayıcında en fazla 12 ay saklanır. Yazışmaları ve danışmanlık belgelerini talebin sürdüğü kadar ve yasal saklama süreleri gerektirdiği ölçüde tutarız, sonra sileriz ya da anonim hale getiririz.</p>

<h2>7. KVKK kapsamındaki hakların</h2>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11. maddesi gereği şunları isteyebilirsin:</p>
<ul>
<li>Verilerinin işlenip işlenmediğini öğrenmek ve bilgi talep etmek,</li>
<li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenmek,</li>
<li>Yurt içinde ya da yurt dışında aktarıldığı kişileri bilmek,</li>
<li>Eksik veya yanlış işlenmişse düzeltilmesini istemek,</li>
<li>Silinmesini veya yok edilmesini istemek ve bunun aktarılan kişilere bildirilmesini talep etmek,</li>
<li>Otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuca itiraz etmek,</li>
<li>Kanuna aykırı işleme nedeniyle zarara uğrarsan zararın giderilmesini talep etmek.</li>
</ul>
<p>Başvurunu ${CONTACT_NOTE} Talebini kimliğini doğrulayabileceğimiz şekilde ve konu satırına "KVKK" yazarak gönder. En geç 30 gün içinde yanıtlarız. Yanıttan memnun kalmazsan Kişisel Verileri Koruma Kurulu'na şikayet hakkın saklıdır. Avrupa Birliği'nden ziyaret ediyorsan GDPR kapsamındaki benzer haklarını da aynı yolla kullanabilirsin.</p>

<h2>8. Çocuklar</h2>
<p>Site genel bilgi amaçlıdır ve 18 yaş altına özel olarak hedeflenmez. Bilerek çocuklardan veri toplamayız.</p>

<h2>9. Güvenlik</h2>
<p>Site HTTPS ile sunulur. Yine de internette hiçbir aktarımın tamamen risksiz olmadığını hatırlatırız. Pasaport gibi hassas belgeleri yalnızca danışmanlık için gerektiğinde ve tercih ettiğin güvenli kanaldan paylaş.</p>

<h2>10. Değişiklikler</h2>
<p>Bu metni zaman zaman güncelleyebiliriz. Güncel hali her zaman bu sayfadadır, sayfanın üstündeki tarih son değişikliği gösterir.</p>
`,
});

// ---------------------------------------------------------------- Çerez politikası
PAGES.push({
  slug: 'cerez-politikasi',
  title: 'Çerez Politikası',
  kicker: 'Çerezler',
  desc: 'Gezicorn hangi çerez ve tarayıcı depolamasını kullanır, hangileri izne bağlıdır ve tercihini nasıl değiştirirsin.',
  body: `
<div class="sum">
<p><b>Kısaca:</b> Analiz, reklam ya da profil çıkaran çerez kullanmıyoruz. Yalnızca çerez tercihini hatırlayan küçük bir kayıt tutuyoruz. Uçak bileti arama kutusu gibi üçüncü taraf içerikler ancak sen izin verirsen yüklenir.</p>
</div>

<h2>Çerez nedir?</h2>
<p>Çerezler ve benzeri tarayıcı depolama alanları (localStorage gibi), bir siteyi ziyaret ettiğinde cihazına kaydedilen küçük veri parçalarıdır. Siteyi çalıştırmak, tercihleri hatırlamak ya da ölçüm yapmak için kullanılır.</p>

<h2>Neler kullanıyoruz?</h2>
<div class="tbl"><table><thead><tr><th>Ad ve kaynak</th><th>Tür</th><th>Amaç</th><th>Süre</th></tr></thead><tbody>
<tr><td><code>gz_consent</code> (tarayıcı depolaması, gezicorn.com)</td><td>Gerekli</td><td>Çerez tercihini hatırlar, banner'ı her sayfada tekrar göstermez</td><td>12 ay</td></tr>
<tr><td>Firestore istemcisi (Google Firebase)</td><td>Gerekli</td><td>İçerik veritabanına bağlanmak için teknik depolama gerekirse kullanılır</td><td>Teknik, oturum bazlı</td></tr>
<tr><td>Uçak bileti arama kutusu (Travelpayouts / Aviasales)</td><td>Üçüncü taraf, izne bağlı</td><td>Kutuyu çalıştırmak ve ortaklık komisyonunu takip etmek</td><td>Sağlayıcının politikasına göre</td></tr>
<tr><td>Gömülü YouTube videosu (youtube-nocookie.com)</td><td>Üçüncü taraf, oynat düğmesine basınca</td><td>Videoyu oynatmak</td><td>Sağlayıcının politikasına göre</td></tr>
<tr><td>Klook ve diğer ortaklık bağlantıları</td><td>Üçüncü taraf, bağlantıya tıklayınca</td><td>Satın alma yönlendirmesini ve komisyonu takip etmek</td><td>Hedef sitenin politikasına göre</td></tr>
</tbody></table></div>
<p>Yazı tipleri (Google Fonts) ve simgeler (Cloudflare cdnjs) çerez bırakmaz ancak sayfayı açtığında IP adresin bu sağlayıcılara iletilir. Ayrıntı için <a href="/gizlilik/">gizlilik politikası</a>.</p>

<h2>İzin nasıl çalışır?</h2>
<ul>
<li><b>Gerekli</b> depolama her zaman açıktır, kapatılamaz.</li>
<li><b>Ortak içerik</b> (uçak bileti kutusu) varsayılan olarak kapalıdır. İzin vermeden yüklenmez, yerinde bir bilgi kutusu görürsün.</li>
<li>Kabul etmek ya da reddetmek özgür tercihindir. Reddedersen site yine tamamen kullanılabilir, yalnızca bilet kutusu görünmez.</li>
</ul>

<h2>Tercihini değiştir</h2>
<p>İstediğin an tercihini değiştirebilir ya da geri alabilirsin:</p>
<button type="button" class="btn yl" data-open-consent>Çerez tercihlerini aç</button>
<p>Tarayıcı ayarlarından da çerezleri silebilir veya engelleyebilirsin. Bunu yaparsan tercihin unutulur ve banner yeniden görünür.</p>

<h2>Değişiklikler</h2>
<p>Yeni bir araç eklersek (örneğin analiz) bu sayfayı güncelleriz ve izin sormadan yüklemeyiz.</p>
`,
});

// ---------------------------------------------------------------- Kullanım koşulları
PAGES.push({
  slug: 'kullanim-kosullari',
  title: 'Kullanım Koşulları ve Sorumluluk Reddi',
  kicker: 'Koşullar',
  desc: 'Gezicorn içeriğinin kapsamı, resmi kaynak uyarısı, ortaklık bağlantıları ve danışmanlık hizmetiyle ilgili sorumluluk sınırları.',
  body: `
<div class="sum">
<p><b>Kısaca:</b> Buradaki yazılar genel bilgi verir, resmi belge ya da hukuki tavsiye yerine geçmez. Vize kuralları değişir, başvurudan önce mutlaka resmi kaynağı kontrol et. Ortaklık bağlantıları işaretlidir.</p>
</div>

<h2>1. Kapsam</h2>
<p>Siteyi kullanarak bu koşulları kabul etmiş olursun. Kabul etmiyorsan siteyi kullanmayabilirsin.</p>

<h2>2. Bilgilendirme amaçlı içerik</h2>
<p>Yazılar Türk pasaportu sahiplerine yönelik genel bilgi ve deneyim paylaşımıdır. Vize, giriş, sağlık, sigorta ve ödeme kuralları ülkelere göre ve zamanla değişir. Bilgileri yayınlarken doğru olmasına özen gösteririz ve yazılarda güncelleme tarihi belirtiriz, ancak eksiksiz veya güncel olduğunu garanti edemeyiz. Karar vermeden önce T.C. Dışişleri Bakanlığı'nın ve ilgili ülkenin resmi kaynaklarını kontrol etmek senin sorumluluğundadır.</p>

<h2>3. Danışmanlık hizmeti</h2>
<p>Danışmanlık hizmeti site içeriğinden ayrıdır ve GEZİCORN TRAVEL LTD tarafından verilir. Hizmetin kapsamı ve ücreti işe başlamadan önce yazılı olarak netleştirilir. Hiçbir danışmanlık vize onayını garanti edemez, karar her zaman ilgili konsolosluğa veya göçmenlik makamına aittir. Detaylar için <a href="/danismanlik.html">danışmanlık sayfası</a>.</p>

<h2>4. Ortaklık bağlantıları ve reklamlar</h2>
<ul>
<li>Bazı bağlantılar ortaklık (affiliate) bağlantısıdır. Bunlar "ortaklık bağlantısı" notuyla belirtilir ve <code>sponsored</code> olarak işaretlenir.</li>
<li>Bu bağlantılardan alışveriş yaparsan Gezicorn komisyon kazanabilir. Ödediğin fiyat değişmez.</li>
<li>Bir ürün ya da hizmeti komisyon aldığımız için değil, işe yaradığını düşündüğümüz için öneririz. Vize bilgisi ve rota önerileri ortaklıklardan bağımsız yazılır.</li>
<li>Sitedeki reklam alanları "Reklam" etiketiyle gösterilir.</li>
</ul>

<h2>5. Üçüncü taraf içerik ve bağlantılar</h2>
<p>Uçak bileti arama kutusu, YouTube videoları ve dış bağlantılar üçüncü tarafların hizmetidir. Fiyat, müsaitlik ve içerik onlara aittir. Bu hizmetlerin doğruluğundan, kesintisinden ve gizlilik uygulamalarından Gezicorn sorumlu değildir.</p>

<h2>6. Fikri mülkiyet</h2>
<p>Yazılar, görseller, tasarım ve logo Gezicorn'a aittir veya kullanım izni vardır. Kaynak göstererek ve bağlantı vererek kısa alıntı yapabilirsin. İzinsiz kopyalama, yeniden yayınlama ve ticari kullanım yasaktır.</p>

<h2>7. Sorumluluğun sınırı</h2>
<p>Yasaların izin verdiği ölçüde, sitedeki bilgilere dayanarak yaptığın seyahat, başvuru ve harcamalardan doğan zarardan Gezicorn sorumlu tutulamaz. Bu madde, kanunen sınırlanamayacak sorumlulukları etkilemez.</p>

<h2>8. Hata bildirimi</h2>
<p>Yanlış ya da eski bir bilgi görürsen lütfen bize haber ver, kontrol edip düzeltiriz. ${CONTACT_NOTE}</p>

<h2>9. Değişiklikler</h2>
<p>Bu koşulları güncelleyebiliriz. Güncel hali bu sayfadadır, sitenin kullanımına devam etmek güncel koşulları kabul ettiğin anlamına gelir.</p>
`,
});

// ---------------------------------------------------------------- Hakkımızda
PAGES.push({
  slug: 'hakkimizda',
  title: 'Hakkımızda',
  kicker: 'Gezicorn',
  desc: 'Gezicorn, Türk pasaportuyla seyahat edenler için gerçek rotalardan yazılan vize ve gezi rehberi. Nasıl yazıyoruz, nasıl finanse ediyoruz.',
  body: `
<div class="sum">
<p><b>Gezicorn</b>, Türk pasaportuyla seyahat edenler için vize ve gezi rehberidir. Kırgızistan'dan Kamboçya'ya, gerçekten gittiğimiz rotalardan yazıyoruz. Site, <a href="https://www.youtube.com/@gezikorn" rel="noopener">YouTube kanalımız</a> ve <a href="https://www.instagram.com/gezicorn/" rel="noopener">Instagram hesabımızla</a> birlikte büyüyor.</p>
</div>

<h2>Ne yayınlıyoruz?</h2>
<ul>
<li>Hangi pasaportla nereye vizesiz, e-vizeyle ya da konsolosluk vizesiyle gidilir.</li>
<li>Vize başvurusu, red sonrası yapılacaklar, sigorta, eSIM ve para konularında pratik rehberler.</li>
<li>Gezi rotaları, ülkelerde işe yarayan uygulamalar ve gönüllülük fırsatları.</li>
</ul>

<h2>Yazı ilkelerimiz</h2>
<ul>
<li><b>Gerçek deneyim:</b> Kanalda ve sahada anlattığımız konulara odaklanırız, uydurma bilgi yazmayız.</li>
<li><b>Resmi kaynak:</b> Süre ve kural gibi rakamları yazmadan önce resmi kaynaklardan doğrulamaya çalışırız, yazının altına da kontrol uyarısı koyarız.</li>
<li><b>Güncellik:</b> Yazılarda güncelleme tarihi bulunur, kural değişince yazıyı ve vize damgalarını birlikte güncelleriz.</li>
<li><b>Tahminler tahmindir:</b> Bütçe rakamları garanti fiyat değildir, öyle belirtiriz.</li>
<li><b>Hata düzeltme:</b> Yanlış bir şey görürsen <a href="/iletisim/">bize yaz</a>, kontrol edip düzeltiriz.</li>
</ul>

<h2>Gittiğimiz ülkeler</h2>
<p>Kırgızistan, Kazakistan, Özbekistan, Rusya, Tayland, Malezya, Hong Kong, Kamboçya ve Vietnam. Rehberlerin çoğu bu rotalardan geliyor. Yeni bir ülkeye gittikçe listeye ekliyoruz.</p>

<h2>Siteyi nasıl finanse ediyoruz?</h2>
<ul>
<li><b>Ortaklık bağlantıları:</b> Klook gibi ortaklarımızın ve uçak bileti arama kutusunun (Travelpayouts) bağlantılarından yapılan alışverişlerde komisyon alabiliriz. Fiyatın değişmez.</li>
<li><b>Danışmanlık:</b> GEZİCORN TRAVEL LTD, vize ve rota danışmanlığı verir.</li>
<li><b>Reklam alanları:</b> Sitede "Reklam" etiketiyle gösterilen alanlar olabilir.</li>
</ul>
<p>Bunların hiçbiri vize bilgisini ya da rota önerisini belirlemez. Ayrıntı için <a href="/kullanim-kosullari/">kullanım koşulları</a>.</p>

<h2>Şirket</h2>
<p>GEZİCORN TRAVEL LTD, Kamboçya merkezli resmi seyahat danışmanlığı şirketidir. Hizmetler için <a href="/danismanlik.html">danışmanlık sayfasına</a>, diğer konular için <a href="/iletisim/">iletişim sayfasına</a> bak.</p>
`,
});

// ---------------------------------------------------------------- İletişim
PAGES.push({
  slug: 'iletisim',
  title: 'İletişim',
  kicker: 'Bize ulaş',
  desc: 'Gezicorn ile iletişim: hata bildirimi, öneri, işbirliği, danışmanlık talebi ve KVKK başvurusu için kanallar.',
  body: `
<div class="sum">
<p><b>Kısaca:</b> Hata bildirimi, öneri, işbirliği ve KVKK başvurusu için aşağıdaki kanalları kullanabilirsin. Vize danışmanlığı için <a href="/danismanlik.html">danışmanlık sayfasına</a> bak.</p>
</div>

<h2>Kanallar</h2>
<div class="btns" id="contactBtns">
<a href="https://www.instagram.com/gezicorn/" target="_blank" rel="noopener">Instagram @gezicorn</a>
<a href="https://www.youtube.com/@gezikorn" target="_blank" rel="noopener">YouTube @gezikorn</a>
<a href="https://www.facebook.com/profile.php?id=144062395450039" target="_blank" rel="noopener">Facebook</a>
</div>

<h2>Ne için yazabilirsin?</h2>
<ul>
<li><b>Hata bildirimi:</b> Yanlış ya da eski bir bilgi gördüysen yazının adresiyle birlikte yaz, kontrol edip düzeltiriz.</li>
<li><b>Öneri ve konu isteği:</b> Merak ettiğin bir ülke ya da vize konusunu bize söyle.</li>
<li><b>İşbirliği ve reklam:</b> Konunu ve ne düşündüğünü kısaca anlat.</li>
<li><b>Danışmanlık:</b> Vize, bilet ve rota planlama için <a href="/danismanlik.html">danışmanlık sayfası</a>.</li>
<li><b>KVKK başvurusu:</b> Konu satırına "KVKK" yaz. Ayrıntı için <a href="/gizlilik/">gizlilik politikası</a>.</li>
</ul>

<h2>Yanıt süresi</h2>
<p>Mesajlara genellikle birkaç gün içinde dönüyoruz. KVKK başvurularını en geç 30 gün içinde yanıtlarız.</p>
`,
  script: `<script>
(function(){
  var box=document.getElementById('contactBtns');
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  fetch('https://firestore.googleapis.com/v1/projects/gezicorn/databases/(default)/documents/settings/consultancy')
    .then(function(r){return r.ok?r.json():null}).then(function(d){
      var f=(d&&d.fields)||{}, out='';
      function v(k){return f[k]&&f[k].stringValue?f[k].stringValue.trim():''}
      if(v('email'))out+='<a href="mailto:'+esc(v('email'))+'">E-posta: '+esc(v('email'))+'</a>';
      if(v('whatsapp_url'))out+='<a href="'+esc(v('whatsapp_url'))+'" target="_blank" rel="noopener">WhatsApp</a>';
      if(v('telegram_url'))out+='<a href="'+esc(v('telegram_url'))+'" target="_blank" rel="noopener">Telegram</a>';
      if(v('tiktok_url'))out+='<a href="'+esc(v('tiktok_url'))+'" target="_blank" rel="noopener">TikTok</a>';
      if(v('x_url'))out+='<a href="'+esc(v('x_url'))+'" target="_blank" rel="noopener">X</a>';
      if(out)box.insertAdjacentHTML('afterbegin',out);
    }).catch(function(){});
})();
</script>`,
});

// ---------------------------------------------------------------- yaz
for (const p of PAGES) {
  const dir = path.join(ROOT, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), page(p), 'utf-8');
}

// ---------------------------------------------------------------- statik sayfaların altbilgisi (işaretçi arasını yeniler)
const wrap = `<!--FOOT_START-->${FOOT_HTML}<!--FOOT_END-->`;
for (const f of ['index.html', 'danismanlik.html', 'posts.html', '404.html']) {
  const fp = path.join(ROOT, f);
  let h = readFileSync(fp, 'utf-8');
  if (h.includes('<!--FOOT_START-->')) {
    h = h.replace(/<!--FOOT_START-->[\s\S]*?<!--FOOT_END-->/, () => wrap);
  } else if (/<footer class="gz-foot">[\s\S]*?<\/footer>/.test(h)) {
    h = h.replace(/<footer class="gz-foot">[\s\S]*?<\/footer>/, () => wrap);
  } else {
    h = h.replace('</body>', () => `${wrap}\n</body>`);
  }
  writeFileSync(fp, h, 'utf-8');
}
console.log(`build-legal: ${PAGES.length} sayfa (${PAGES.map(p => p.slug).join(', ')}) + 4 statik sayfanın altbilgisi güncellendi.`);
