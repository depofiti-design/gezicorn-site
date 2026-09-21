/* Gezicorn çerez tercihi: gerekli depolama her zaman açık, üçüncü taraf ortak içerik (uçak bileti kutusu) sadece izinle yüklenir.
   Tercih tarayıcıda (localStorage "gz_consent") 12 ay saklanır. Analiz ve reklam çerezi kullanılmıyor. */
(function () {
  var KEY = 'gz_consent', VER = 1, DAYS = 365, banner = null, partnersLoaded = false;

  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && v.v === VER && v.exp > Date.now()) return v; } catch (e) {}
    return null;
  }
  function write(partners) {
    var v = { v: VER, partners: !!partners, exp: Date.now() + DAYS * 864e5 };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    return v;
  }
  function loadPartners() {
    if (partnersLoaded) return;
    partnersLoaded = true;
    var boxes = document.querySelectorAll('[data-consent-script]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i], s = document.createElement('script');
      s.async = true; s.charset = 'utf-8'; s.src = box.getAttribute('data-consent-script');
      box.innerHTML = ''; box.appendChild(s);
    }
  }
  function apply(v) { if (v && v.partners) loadPartners(); }
  function close() { if (banner) { banner.remove(); banner = null; } }

  function choose(partners) {
    var before = read(), wasOn = before && before.partners;
    var v = write(partners);
    close();
    if (wasOn && !partners) { location.reload(); return; }   // izin geri alındı: yüklenmiş üçüncü taraf betiği temizlensin
    apply(v);
  }

  function open() {
    if (banner) return;
    var cur = read();
    banner = document.createElement('div');
    banner.className = 'gz-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Çerez tercihleri');
    banner.innerHTML =
      '<div class="cc-txt"><b>Çerez tercihleri</b>' +
      '<p>Site, çalışması için gerekli tarayıcı depolamasını kullanır. Analiz ya da reklam çerezi kullanmıyoruz. ' +
      'Uçak bileti arama kutusu (Travelpayouts) üçüncü taraf çerezi bırakabilir ve yalnızca izin verirsen yüklenir. ' +
      '<a href="/cerez-politikasi/">Ayrıntılar</a></p></div>' +
      '<div class="cc-opts"><label><input type="checkbox" checked disabled> Gerekli</label>' +
      '<label><input type="checkbox" id="ccPartners"' + (cur && cur.partners ? ' checked' : '') + '> Ortak içerik: uçak bileti kutusu</label></div>' +
      '<div class="cc-btns"><button type="button" class="btn yl" data-cc="all">Tümünü kabul et</button>' +
      '<button type="button" class="btn alt" data-cc="save">Seçimi kaydet</button>' +
      '<button type="button" class="btn alt" data-cc="none">Sadece gerekli</button></div>';
    banner.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cc]') : null;
      if (!t) return;
      var a = t.getAttribute('data-cc');
      if (a === 'all') choose(true);
      else if (a === 'none') choose(false);
      else choose(document.getElementById('ccPartners').checked);
    });
    document.body.appendChild(banner);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target : null;
    if (!el) return;
    if (el.closest('[data-open-consent]')) { e.preventDefault(); open(); }
    else if (el.closest('[data-accept-partners]')) { e.preventDefault(); choose(true); }
  });

  window.gzConsent = { open: open, get: read };
  var saved = read();
  if (saved) apply(saved); else open();
})();
