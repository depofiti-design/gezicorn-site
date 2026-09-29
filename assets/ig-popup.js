// Kaydırınca sağ kenardan çıkan, rahatsız etmeyen Instagram hatırlatıcısı (29 Eylül 2026).
// Kurallar: sadece bir miktar aşağı kaydırınca çıkar; kapatılınca (ya da bir kez gösterilince) o
// tarayıcı sekmesi/oturumu kapanana kadar bir daha çıkmaz, kullanıcı siteye yeniden girince (yeni
// sekme/oturum) tekrar görünür. Kalıcı (günlerce süren) bir susturma YOK, sessionStorage kullanılıyor.
(function () {
  try {
    if (sessionStorage.getItem('gz_ig_popup_shown')) return;
  } catch (e) { /* depolama kapalıysa sessizce devam et, sorun değil */ }

  var shown = false;

  function build() {
    shown = true;
    try { sessionStorage.setItem('gz_ig_popup_shown', '1'); } catch (e) {}
    var wrap = document.createElement('div');
    wrap.className = 'gz-igpop';
    wrap.innerHTML =
      '<button class="gz-igpop-x" type="button" aria-label="Kapat">×</button>' +
      '<a href="https://www.instagram.com/gezicorn/" target="_blank" rel="noopener">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/>' +
      '</svg>' +
      '<span><b>@gezicorn</b>Gezi anlarımızı takip et</span></a>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('show'); });
    wrap.querySelector('.gz-igpop-x').addEventListener('click', function () {
      wrap.classList.remove('show');
      setTimeout(function () { wrap.remove(); }, 320);
    });
  }

  function onScroll() {
    if (shown) return;
    if (window.scrollY > window.innerHeight * 0.6) {
      window.removeEventListener('scroll', onScroll);
      build();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
