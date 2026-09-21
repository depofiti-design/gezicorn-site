// Tüm sayfaların paylaştığı parçalar: altbilgi (yasal bağlantılar dahil) ve çerez onay betiği.
// build-static.js ve build-legal.js buradan alır. Değiştirince: node scripts/build-legal.js && node scripts/build-static.js
export const CSS_V = '20260921b';
export const CONSENT_TAG = `<script src="/assets/consent.js?v=${CSS_V}" defer></script>`;

export const FOOT_HTML = `<footer class="gz-foot"><div class="row">
<p>© Gezicorn. Vize ve seyahat kuralları değişebilir, başvurudan önce mutlaka resmi kaynağı kontrol et.</p>
<div class="foot-links"><a href="/">Ana sayfa</a><a href="/yazi/">Tüm yazılar</a><a href="/danismanlik.html">Danışmanlık</a><a href="/hakkimizda/">Hakkımızda</a><a href="/iletisim/">İletişim</a></div>
<div class="foot-links"><a href="/gizlilik/">Gizlilik</a><a href="/cerez-politikasi/">Çerezler</a><a href="/kullanim-kosullari/">Koşullar</a><button type="button" data-open-consent>Çerez tercihleri</button></div>
<div class="foot-links"><a href="https://www.youtube.com/@gezikorn" rel="noopener">YouTube</a><a href="https://www.instagram.com/gezicorn/" rel="noopener">Instagram</a><a href="https://www.facebook.com/profile.php?id=144062395450039" rel="noopener">Facebook</a></div>
</div></footer>
${CONSENT_TAG}`;
