/* XXVIII · Twenty-Eight Steakhouse — website behaviour, v2 (client video + texture layer).
   Classic script (works over http and file://). Reads window.XXVIII; never retypes names or prices.
   Motion: GSAP 3.13 + ScrollTrigger + SplitText, Lenis smooth scroll. Tempo: slow, weighted, confident.
   Video budget: preload="none"; src set only within one viewport; at most 2 decoding at once; reduced motion = posters only. */
(function () {
  'use strict';
  var X = window.XXVIII;
  var d = document, root = d.documentElement;
  if (!X) { root.classList.remove('intro-on', 'hero-wait'); return; }

  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var TOUCH = matchMedia('(pointer: coarse)').matches;
  var NARROW = matchMedia('(max-width: 899px)');
  var G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText;
  var MOTION = !!(G && ST) && !RM;
  if (G && ST) G.registerPlugin(ST);
  if (G && SPLIT) G.registerPlugin(SPLIT);
  window.__xxviiiIntro = true;

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function el(tag, attrs, html) {
    var n = d.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    if (html) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, X); }
  var img = X.img, peso = X.peso;
  var MEDIA = X.media || { video: {}, block: [] };
  function hasVideo(slug) { return !!(MEDIA.video && MEDIA.video[slug]) && typeof X.video === 'function'; }
  function hasBlock(slug) { return !!(MEDIA.block && MEDIA.block.indexOf(slug) >= 0) && typeof X.block === 'function'; }
  function section(id) { for (var i = 0; i < X.menu.length; i++) if (X.menu[i].id === id) return X.menu[i]; return null; }
  /* names: keep 'for Two' together so a sharing cut never breaks mid-name */
  function nm(t) { return esc(t).replace(/ for (\S+)$/, ' for&nbsp;$1'); }
  var PREVIEW = true; /* preview build: placeholders are marked; set false at launch */
  function cardFor(days) { return (X.brand.steakCardFor ? X.brand.steakCardFor(days) : X.brand.steakCard); }

  /* ───────── Data binding ───────── */
  $$('[data-bind]').forEach(function (n) { var v = get(n.getAttribute('data-bind')); if (typeof v === 'string') n.textContent = v; });
  var C = X.brand.contact;
  var telHref = 'tel:' + C.phone.replace(/[^\d+]/g, '');
  $$('[data-tel]').forEach(function (a) { a.href = telHref; if (!a.querySelector('svg') && !a.hasAttribute('data-call') && !a.classList.contains('btn')) a.textContent = C.phone; });
  $$('[data-mail]').forEach(function (a) { a.href = 'mailto:' + C.email; a.textContent = C.email; });

  /* ───────── Time in Manila + opening hours ───────── */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function toMin(t) { var m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i); if (!m) return null; var h = (+m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + (+m[2]); }
  function fmt(min) { min = min % 1440; var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad(m) + ' ' + ap; }
  var HOURS = {};
  C.hours.forEach(function (row, ri) {
    var parts = row.days.split(/\s*[–-]\s*/), a = DAYS.indexOf(parts[0].trim()), b = parts[1] ? DAYS.indexOf(parts[1].trim()) : a;
    var sessions = [];
    if (!/^closed/i.test(row.time)) row.time.split('·').forEach(function (seg) {
      var m = seg.split(/\s*[–-]\s*/); if (m.length !== 2) return;
      var o = toMin(m[0]), c = toMin(m[1]); if (o == null || c == null) return; if (c <= o) c += 1440;
      sessions.push({ o: o, c: c, label: seg.trim() });
    });
    if (a < 0) return;
    for (var i = a, guard = 0; guard < 7; i = (i + 1) % 7, guard++) { HOURS[i] = { row: row, ri: ri, sessions: sessions }; if (i === b) break; }
  });
  function manilaNow() {
    var o = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    } catch (e) { var n = new Date(); o = { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate(), hour: n.getHours(), minute: n.getMinutes() }; }
    var y = +o.year, mo = +o.month, da = +o.day;
    return { y: y, m: mo, d: da, min: (+o.hour % 24) * 60 + (+o.minute), wd: new Date(Date.UTC(y, mo - 1, da)).getUTCDay(), utc: Date.UTC(y, mo - 1, da) };
  }
  var NOW = manilaNow();
  function dayInfo(utc) { var dt = new Date(utc); return { wd: dt.getUTCDay(), d: dt.getUTCDate(), m: dt.getUTCMonth(), y: dt.getUTCFullYear() }; }
  function longDate(utc) { var i = dayInfo(utc); return DAYS[i.wd] + ' ' + i.d + ' ' + MONTHS[i.m]; }
  function nextOpening(fromWd, fromMin) {
    for (var k = 0; k < 8; k++) {
      var wd = (fromWd + k) % 7, h = HOURS[wd]; if (!h) continue;
      for (var s = 0; s < h.sessions.length; s++) if (k > 0 || h.sessions[s].o > fromMin) return (k === 0 ? 'today' : k === 1 ? 'tomorrow' : DAYS[wd]) + ' ' + fmt(h.sessions[s].o);
    }
    return '';
  }
  function status() {
    var h = HOURS[NOW.wd], prev = HOURS[(NOW.wd + 6) % 7], m = NOW.min;
    if (prev) for (var p = 0; p < prev.sessions.length; p++) if (prev.sessions[p].c > 1440 && m < prev.sessions[p].c - 1440) return { open: true, txt: 'Open now · until ' + fmt(prev.sessions[p].c), short: 'Open now' };
    if (!h || !h.sessions.length) return { open: false, txt: 'Closed today · Opens ' + nextOpening(NOW.wd, 1440), short: 'Closed today' };
    for (var i = 0; i < h.sessions.length; i++) {
      var s = h.sessions[i];
      if (m >= s.o && m < s.c) return { open: true, txt: 'Open now · until ' + fmt(s.c), short: 'Open now' };
      if (m < s.o) {
        var rest = h.sessions.slice(i).map(function (x) { return x.label; }).join(' · ');
        return { open: true, txt: (s.o < 15 * 60 ? 'Open today · ' : 'Open tonight · ') + rest, short: s.o < 15 * 60 ? 'Open today' : 'Open tonight' };
      }
    }
    return { open: false, txt: 'Closed for tonight · Opens ' + nextOpening(NOW.wd, 1440), short: 'Closed for tonight' };
  }
  /* Pre-opening: brand.contact.openingDate ('YYYY-MM-DD', placeholder null). While it is in the future the site says so. */
  var OPEN = null;
  (function () { var od = C.openingDate, m = od && String(od).match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return; var u = Date.UTC(+m[1], +m[2] - 1, +m[3]); if (u > NOW.utc) OPEN = { utc: u, days: Math.round((u - NOW.utc) / 864e5) }; })();
  var ST_NOW = OPEN ? { open: false, txt: 'Opening ' + longDate(OPEN.utc) + ' · Reservations open', short: 'Opening ' + longDate(OPEN.utc) } : status();
  $$('[data-status]').forEach(function (n) { n.textContent = ST_NOW.txt; });
  $$('[data-status-short]').forEach(function (n) { n.textContent = ST_NOW.short; });
  if (!ST_NOW.open) $$('.hero__status').forEach(function (n) { n.classList.add('is-closed'); });
  if (OPEN) { var bd = $('.board__date > span'); if (bd) bd.textContent = 'Day ' + pad(Math.max(1, 28 - OPEN.days)) + ' in the ageing room'; }
  if (!PREVIEW) $$('[data-preview]').forEach(function (n) { n.hidden = true; });
  $$('[data-today]').forEach(function (t) { t.textContent = longDate(NOW.utc); t.setAttribute('datetime', NOW.y + '-' + pad(NOW.m) + '-' + pad(NOW.d)); });

  /* Hours table: static rows in HTML for no-JS; re-rendered from the data here with today marked */
  (function hours() {
    var tb = $('[data-hours] tbody'), todayRow = HOURS[NOW.wd] ? HOURS[NOW.wd].ri : -1;
    tb.innerHTML = C.hours.map(function (h, i) {
      return '<tr' + (i === todayRow ? ' class="is-today" aria-current="date"' : '') + '><th scope="row">' + esc(h.days) + '</th><td>' + h.time.split(' · ').map(esc).join('<br>') + '</td></tr>';
    }).join('');
  })();

  /* JSON-LD: refresh the static block from the data */
  (function () {
    var s = $('#ld-restaurant'); if (!s) return;
    try {
      var j = JSON.parse(s.textContent), spec = [];
      Object.keys(HOURS).forEach(function (wd) {
        HOURS[wd].sessions.forEach(function (x) { spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/' + DAYS[wd], opens: pad(Math.floor(x.o / 60)) + ':' + pad(x.o % 60), closes: pad(Math.floor((x.c % 1440) / 60)) + ':' + pad(x.c % 60) }); });
      });
      j.openingHoursSpecification = spec;
      j.address.streetAddress = C.street; j.telephone = C.phone; j.email = C.email; j.description = X.brand.story[0];
      s.textContent = JSON.stringify(j);
    } catch (e) { }
  })();

  /* ───────── Video manager ───────── */
  var conn = navigator.connection || {};
  var HD_OK = conn.effectiveType === '4g' && !conn.saveData && innerWidth >= 1200, hdReady = false;
  window.addEventListener('load', function () { setTimeout(function () { hdReady = true; }, 1500); });
  var SD = !HD_OK;
  var VIDEO_OK = !RM && typeof X.video === 'function';
  var VIDS = [];
  function vsrc(v) { return X.video(v.getAttribute('data-vid'), HD_OK && hdReady && !v._sdOnly ? 'hd' : 'sd'); }
  function loadV(v) { if (VIDEO_OK && !v.getAttribute('src')) { v.preload = 'auto'; v.src = vsrc(v); } }
  function freeV(v) { try { v.pause(); } catch (e) { } if (v.getAttribute('src')) { v.removeAttribute('src'); try { v.load(); } catch (e) { } } }
  function schedule() {
    var cand = VIDS.filter(function (v) { return v._want && v.isConnected; })
      .sort(function (a, b) { return (b._prio || 0) - (a._prio || 0) || (b._ratio || 0) - (a._ratio || 0); }).slice(0, 2);
    VIDS.forEach(function (v) { if (cand.indexOf(v) < 0 && !v.paused) v.pause(); });
    cand.forEach(function (v) { loadV(v); if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () { }); } });
  }
  function want(v, yes) { if (v._want !== yes) { v._want = yes; schedule(); } }
  var HAS_IO = 'IntersectionObserver' in window;
  var ioNear = HAS_IO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) loadV(e.target); });
  }, { rootMargin: '50% 0px 50% 0px' }) : null;
  var ioSee = HAS_IO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target._ratio = e.intersectionRatio; want(e.target, e.intersectionRatio > .2); });
  }, { threshold: [0, .2, .5, .8] }) : null;
  /* auto: plays while in view. manual: the caller decides with want(). Never more than 2 at once. */
  /* posters load only within one viewport, like the video sources */
  var ioPoster = HAS_IO ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { posterOn(e.target); ioPoster.unobserve(e.target); } }); }, { rootMargin: '100% 0px 100% 0px' }) : null;
  function posterOn(v) { var p = v.getAttribute('data-poster'); if (p && !v.getAttribute('poster')) v.setAttribute('poster', p); }
  function register(v, prio, manual) {
    if (v.getAttribute('data-poster')) { if (ioPoster && !v._eager) ioPoster.observe(v); else posterOn(v); }
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v._prio = prio || 1; VIDS.push(v);
    if (VIDEO_OK && !manual) { if (ioNear) ioNear.observe(v); if (ioSee) ioSee.observe(v); }
    return v;
  }
  function unregister(v) { if (ioPoster) ioPoster.unobserve(v); if (ioNear) ioNear.unobserve(v); if (ioSee) ioSee.unobserve(v); v._want = false; freeV(v); var i = VIDS.indexOf(v); if (i >= 0) VIDS.splice(i, 1); schedule(); }
  function makeVideo(slug, cls) {
    return el('video', { class: cls || '', 'data-vid': slug, 'data-poster': X.video(slug, 'poster'), width: 1920, height: 1080, muted: '', loop: '', playsinline: '', preload: 'none', disablepictureinpicture: '', 'aria-hidden': 'true' });
  }
  d.addEventListener('visibilitychange', function () { if (d.hidden) VIDS.forEach(function (v) { v.pause(); }); else schedule(); });
  /* Hero reel (7 Nov, client request): a random, steak-first rotation through every client film.
     Two stacked layers crossfade; each film plays once (8 s); every 2 steaks one enhancement film. */
  var heroVids = $$('.hero__video'), heroVideo = heroVids[0];
  (function heroReel() {
    if (!heroVideo) return;
    var STEAKS = ['cowboy-cut', 'prime-ribeye', 'new-york-strip', 'filet-mignon', 'picanha', 'sovereign-tomahawk', 'porterhouse-for-two', 'chateaubriand-for-two'].filter(hasVideo);
    var EXTRAS = ['black-truffle-shavings', 'bone-marrow-crust', 'foie-gras-crown', 'oscar-enhancement'].filter(hasVideo);
    if (!STEAKS.length) { register(heroVideo, 3, false); heroVideo.loop = true; return; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function build(prev) {
      var s = shuffle(STEAKS), e = shuffle(EXTRAS), q = [];
      s.forEach(function (x, i) { q.push(x); if (i % 2 === 1 && e.length) q.push(e.shift()); });
      if (q[0] === prev && q.length > 1) q.push(q.shift());
      return q;
    }
    function dish(slug) {
      for (var i = 0; i < X.menu.length; i++) {
        var sct = X.menu[i], all = (sct.items || []).concat(sct.extras ? sct.extras.items : []);
        for (var k = 0; k < all.length; k++) if (all[k].img === slug) return all[k];
      }
      return null;
    }
    var reel = $('.hero__reel'), nowP = $('.hero__now'), nowN = $('[data-now]'), nowA = $('[data-now-age]');
    var prog = $('.hero__prog i'), pauseB = $('.hero__pause');
    var q = ['cowboy-cut'].concat(build(null).filter(function (x) { return x !== 'cowboy-cut'; })), qi = 0, cur = heroVids[0], nxt = heroVids[1] || null, switching = false, userPaused = false, heroSeen = true;
    function label(slug) {
      var dd = dish(slug); if (!dd || !nowN) return;
      var age = dd.age ? dd.age + ' days' : 'To add to any steak';
      if (!MOTION) { nowN.textContent = dd.name; nowA.textContent = age; return; }
      nowP.classList.add('is-swap');
      setTimeout(function () { nowN.textContent = dd.name; nowA.textContent = age; nowP.classList.remove('is-swap'); }, 450);
    }
    function setSlug(v, slug) { v.setAttribute('data-vid', slug); v.setAttribute('poster', X.video(slug, 'poster')); }
    if (reel) reel.hidden = false;
    setSlug(cur, q[0]); label(q[0]);
    if (!VIDEO_OK || !nxt) { if (pauseB) pauseB.hidden = true; if (prog) prog.parentNode.hidden = true; return; }
    heroVids.forEach(function (v) { register(v, 3, true); v.loop = false; });
    cur._sdOnly = true; /* the first film is always the light rendition */
    var heroGo = false;
    window.__heroStart = function () { if (heroGo) return; heroGo = true; want(cur, heroSeen && !userPaused); };
    function step() {
      if (switching || userPaused) return;
      switching = true;
      qi++; if (qi >= q.length) { q = build(q[q.length - 1]); qi = 0; }
      var slug = q[qi], incoming = nxt, outgoing = cur;
      freeV(incoming); incoming._sdOnly = false; setSlug(incoming, slug);
      var go = function () {
        incoming.removeEventListener('playing', go);
        incoming.classList.add('is-on'); outgoing.classList.remove('is-on'); label(slug);
        cur = incoming; nxt = outgoing;
        setTimeout(function () { want(outgoing, false); freeV(outgoing); switching = false; }, 1200);
      };
      incoming.addEventListener('playing', go);
      try { incoming.currentTime = 0; } catch (e) { }
      want(incoming, heroSeen && heroGo);
      if (!heroSeen) go();
    }
    heroVids.forEach(function (v) {
      v.addEventListener('timeupdate', function () {
        if (v !== cur || !v.duration) return;
        if (prog) prog.style.transform = 'scaleX(' + Math.min(1, v.currentTime / v.duration) + ')';
        if (v.currentTime > v.duration - 1.15) step();
      });
      v.addEventListener('ended', function () { if (v === cur) step(); });
    });
    if (pauseB) pauseB.addEventListener('click', function () {
      userPaused = !userPaused;
      pauseB.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      pauseB.setAttribute('aria-label', userPaused ? 'Play the steak films' : 'Pause the steak films');
      want(cur, !userPaused && heroSeen && heroGo); if (userPaused) cur.pause();
    });
    var heroIO = HAS_IO ? new IntersectionObserver(function (es) {
      heroSeen = es[0].isIntersecting; if (heroGo) want(cur, heroSeen && !userPaused);
    }, { threshold: 0.05 }) : null;
    if (heroIO) heroIO.observe($('.hero'));
  })();

  /* Section textures: add .tex-on when the section is within one viewport */
  $$('.patience, .private, .reserve, .sig, .board, .menu, .wait').forEach(function (s) {
    if (!HAS_IO) { s.classList.add('tex-on'); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { s.classList.add('tex-on'); o.disconnect(); } }, { rootMargin: '100% 0px' });
    o.observe(s);
  });

  /* ───────── Smooth scroll (Lenis) ───────── */
  var lenis = null;
  if (MOTION && !TOUCH && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.25, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, prevent: function (n) { return !!(n && n.closest && n.closest('.xxchat, [data-lenis-prevent]')); } });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  function scrollToEl(target, cb) {
    if (lenis) { lenis.scrollTo(target === 'top' ? 0 : target, { duration: 1.5, onComplete: cb }); return; }
    window.scrollTo({ top: target === 'top' ? 0 : target.getBoundingClientRect().top + scrollY, behavior: RM ? 'auto' : 'smooth' });
    if (cb) setTimeout(cb, RM ? 50 : 900);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1); if (!id) return;
    var t = id === 'top' ? 'top' : d.getElementById(id); if (!t) return;
    e.preventDefault();
    if (root.classList.contains('menu-open')) closeOverlay(true);
    scrollToEl(t, function () {
      var f = t === 'top' ? $('#hero-title') : t;
      if (f) { if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
    });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* ───────── Brass foil: the bright band follows the pointer, like the menu cover ───────── */
  if (FINE && !RM) {
    var foils = $$('.foil'), fRaf = 0, fX = .5;
    window.addEventListener('pointermove', function (e) { fX = e.clientX / window.innerWidth; if (!fRaf) fRaf = requestAnimationFrame(function () { fRaf = 0; foils.forEach(function (f) { f.style.setProperty('--fx', (100 - fX * 100).toFixed(1) + '%'); }); }); }, { passive: true });
  }

  /* ───────── Header: hide on scroll down, show on scroll up ───────── */
  var hdr = $('#hdr'), lastY = window.scrollY, acc = 0, hidden = false;
  function showHdr() { if (hidden) { hidden = false; hdr.classList.remove('is-hidden'); } root.classList.add('hdr-shown'); }
  function hideHdr() { if (!hidden && !hdr.contains(d.activeElement)) { hidden = true; hdr.classList.add('is-hidden'); root.classList.remove('hdr-shown'); } }
  function onScroll() {
    var y = window.scrollY, dy = y - lastY; lastY = y;
    hdr.classList.toggle('is-scrolled', y > 30);
    if (y < 140) { acc = 0; showHdr(); return; }
    if ((dy > 0 && acc < 0) || (dy < 0 && acc > 0)) acc = 0;
    acc += dy;
    if (acc > 14) hideHdr(); else if (acc < -10) showHdr();
  }
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }, { passive: true });
  window.addEventListener('wheel', function (e) { if (e.deltaY < -2) showHdr(); }, { passive: true });
  hdr.addEventListener('focusin', showHdr);
  root.classList.add('hdr-shown'); onScroll();

  /* ───────── Mobile overlay (site index) ───────── */
  var overlay = $('#overlay'), burger = $('.hdr__burger');
  function focusables(c) { return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', c).filter(function (n) { return n.offsetParent !== null; }); }
  function openOverlay() {
    overlay.hidden = false; root.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop(); else d.body.style.overflow = 'hidden';
    if (MOTION) {
      G.fromTo(overlay, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: 'expo.out' });
      G.fromTo($$('.overlay__list a span', overlay), { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: .06, delay: .12 });
      G.fromTo($$('.overlay__foot, .overlay__close, .overlay__logo', overlay), { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, delay: .4 });
    }
    var f = $('.overlay__list a', overlay); if (f) f.focus();
  }
  function closeOverlay(instant) {
    function done() { overlay.hidden = true; root.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); if (lenis) lenis.start(); else d.body.style.overflow = ''; }
    if (MOTION && !instant) G.to(overlay, { clipPath: 'inset(0 0 100% 0)', duration: .45, ease: 'power3.in', onComplete: function () { done(); burger.focus(); } });
    else { done(); if (!instant) burger.focus(); }
  }
  burger.addEventListener('click', openOverlay);
  $('.overlay__close').addEventListener('click', function () { closeOverlay(); });
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(overlay); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ───────── Ageing Room board: tabs on desktop, accordion under 900 px ───────── */
  var ageing = section('ageing-room'), longWait = section('long-wait');
  var boardCuts = ageing.items.map(function (x) { return { it: x, group: ageing.name }; }).concat(longWait.items.map(function (x) { return { it: x, group: longWait.name }; }));
  var bList = $('[data-board-list]'), bPanel = $('[data-board-panel]'), bBody = $('.board__body'), bScreen = $('.board__screen', bPanel), bTabs = [];
  var lastGroup = null;
  /* Honesty: the 45-day sharing cuts need notice; only the single cuts are "ready tonight". */
  function statusFor(it) {
    if (OPEN) return it.age >= 45 ? { txt: 'Order for opening', cls: 'brow__st--order' } : { txt: 'Ready on opening night', cls: '' };
    return it.age >= 45 ? { txt: 'Order early', cls: 'brow__st--order' } : { txt: 'Ready tonight', cls: '' };
  }
  boardCuts.forEach(function (c, i) {
    if (c.group !== lastGroup) {
      lastGroup = c.group;
      bList.appendChild(el('div', { class: 'board__group', role: 'presentation', text: c.group === longWait.name ? c.group + ' · to share' : c.group + ' · single cuts' }));
    }
    var stt = statusFor(c.it);
    var b = el('button', { class: 'brow', type: 'button', id: 'brow-' + i, 'aria-controls': 'board-panel' });
    b.style.setProperty('--p', (c.it.age / 45).toFixed(3));
    b.innerHTML = '<span class="brow__name">' + nm(c.it.name) + '</span>' +
      '<span class="brow__w">' + esc(c.it.weight) + '</span>' +
      '<span class="brow__bar" aria-hidden="true"><i></i></span>' +
      '<span class="brow__day"><small>Day</small>' + c.it.age + '</span>' +
      '<span class="brow__st ' + stt.cls + '"><span class="dot" aria-hidden="true"></span>' + stt.txt + '</span>';
    b.setAttribute('aria-label', c.it.name + ', ' + c.it.weight + ', aged ' + c.it.age + ' days, ' + stt.txt.toLowerCase());
    bList.appendChild(b); bTabs.push(b);
  });
  var B0 = Math.max(0, boardCuts.map(function (c) { return c.it.img; }).indexOf('new-york-strip'));
  var bCur = -1, bVid = null, bMode = '', bSeen = false, bOpen = true;
  function bMedia(c) {
    if (hasVideo(c.img)) { var v = makeVideo(c.img); register(v, 2, true); return v; }
    return el('img', { src: hasBlock(c.img) ? X.block(c.img, 'md') : img(c.img, 'plated', 'md'), alt: '', width: 1920, height: 1080, decoding: 'async' });
  }
  function preloadPoster(i) { var c = boardCuts[(i + boardCuts.length) % boardCuts.length]; if (c && hasVideo(c.it.img)) { var im = new Image(); im.src = X.video(c.it.img, 'poster'); } }
  function syncBoardAria() {
    var acc = bMode === 'acc';
    bTabs.forEach(function (t, k) {
      var on = k === bCur;
      if (acc) { t.removeAttribute('role'); t.removeAttribute('aria-selected'); t.setAttribute('aria-expanded', on && bOpen ? 'true' : 'false'); t.tabIndex = 0; }
      else { t.setAttribute('role', 'tab'); t.removeAttribute('aria-expanded'); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; }
    });
    if (acc) { bList.setAttribute('role', 'group'); bList.removeAttribute('aria-orientation'); bPanel.setAttribute('role', 'region'); }
    else { bList.setAttribute('role', 'tablist'); bList.setAttribute('aria-orientation', 'vertical'); bPanel.setAttribute('role', 'tabpanel'); }
    bPanel.setAttribute('aria-labelledby', 'brow-' + bCur);
  }
  function placeAccordion(animate) {
    syncBoardAria();
    if (!bOpen) { bPanel.hidden = true; if (bVid && bVid.tagName === 'VIDEO') want(bVid, false); return; }
    bPanel.hidden = false;
    var row = bTabs[bCur];
    if (row.nextSibling !== bPanel) row.after(bPanel);
    if (MOTION && animate) G.fromTo(bPanel, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .6, ease: 'power3.out', clearProps: 'clipPath' });
  }
  function setBoard(i, animate) {
    if (i === bCur) return;
    bCur = i; bOpen = true;
    var c = boardCuts[i].it;
    var n = bMedia(c), old = bVid; bVid = n;
    n.style.opacity = 0; bScreen.appendChild(n);
    $('[data-b-age] b', bPanel).textContent = c.age;
    $('[data-b-name]', bPanel).innerHTML = nm(c.name);
    $('[data-b-desc]', bPanel).textContent = c.desc;
    $('[data-b-weight]', bPanel).textContent = c.weight;
    $('[data-b-serves]', bPanel).textContent = c.serves ? String(c.serves) : '';
    $('[data-b-serves-row]', bPanel).hidden = !c.serves;
    $('[data-b-price]', bPanel).textContent = peso(c.price);
    $('[data-b-card]', bPanel).textContent = cardFor(c.age).join(' ');
    if (bMode === 'acc') placeAccordion(animate); else syncBoardAria();
    if (n.tagName === 'VIDEO') { n._ratio = 1; if (bSeen) loadV(n); want(n, bSeen); }
    function drop() { if (!old) return; if (old.tagName === 'VIDEO') unregister(old); old.remove(); }
    if (MOTION && animate) {
      G.to(n, { opacity: 1, duration: .9, ease: 'power2.out', onComplete: drop });
      G.fromTo(n, { scale: 1.06 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
      G.fromTo($$('.board__info > *', bPanel), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8, ease: 'expo.out', stagger: .05, overwrite: true });
    } else { n.style.opacity = 1; drop(); }
    if (bSeen) { preloadPoster(i + 1); preloadPoster(i - 1); }
  }
  function setBoardMode() {
    var m = NARROW.matches ? 'acc' : 'tabs';
    if (m === bMode) return; bMode = m;
    if (bCur < 0) return;
    if (m === 'acc') placeAccordion(false);
    else { bOpen = true; bPanel.hidden = false; bBody.appendChild(bPanel); syncBoardAria(); }
  }
  bTabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      if (bMode === 'acc' && i === bCur) { bOpen = !bOpen; placeAccordion(true); if (bOpen && bVid && bVid.tagName === 'VIDEO') want(bVid, bSeen); return; }
      setBoard(i, true);
    });
    t.addEventListener('keydown', function (e) {
      if (bMode === 'acc') return;
      var k = e.key, j = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') j = (i + 1) % bTabs.length;
      else if (k === 'ArrowUp' || k === 'ArrowLeft') j = (i - 1 + bTabs.length) % bTabs.length;
      else if (k === 'Home') j = 0; else if (k === 'End') j = bTabs.length - 1;
      if (j === null) return;
      e.preventDefault(); bTabs[j].focus(); setBoard(j, true);
    });
  });
  bMode = NARROW.matches ? 'acc' : 'tabs';
  setBoard(B0, false);
  if (NARROW.addEventListener) NARROW.addEventListener('change', setBoardMode);
  if (HAS_IO) new IntersectionObserver(function (es) {
    es.forEach(function (e) { var was = bSeen; bSeen = e.intersectionRatio > .2; if (bSeen && !was) { preloadPoster(bCur + 1); preloadPoster(bCur - 1); } if (bVid && bVid.tagName === 'VIDEO') { bVid._ratio = e.intersectionRatio; if (bSeen) loadV(bVid); want(bVid, bSeen); } });
  }, { threshold: [0, .2, .6] }).observe(bScreen);

  /* ───────── Signature ───────── */
  var sigItem = ageing.items.filter(function (x) { return x.signature; })[0] || ageing.items[0];
  $('[data-sig-facts]').innerHTML = '<span class="age-tag">Aged <b>' + sigItem.age + '</b> days</span>' +
    '<dl><div><dt class="label">Weight</dt><dd class="num">' + esc(sigItem.weight) + '</dd></div>' +
    '<div><dt class="label">Price</dt><dd class="price">' + peso(sigItem.price) + '</dd></div></dl>';
  $('[data-card-lines]').innerHTML = cardFor(sigItem.age).map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('');
  $('[data-card-name]').textContent = sigItem.name;
  $('#sig-title').innerHTML = esc(sigItem.name).replace(/(\S+-\S+)/g, '<span class="nw">$1</span>');
  $('[data-card-cut]').textContent = 'Cut ' + NOW.d + ' ' + MONTHS[NOW.m - 1] + ' ' + NOW.y + ' · ' + sigItem.weight;
  var sigVid = $('.sig__video');
  if (sigVid) { register(sigVid, 2, false); sigVid.addEventListener('playing', function () { sigVid.classList.add('is-playing'); }); }
  var cardBtn = $('.card3d__btn');
  cardBtn.addEventListener('click', function () { cardBtn.setAttribute('aria-pressed', cardBtn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });

  /* ───────── Menu ───────── */
  var LINE_OVERRIDE = { 'ageing-room': 'Single cuts, weighed and aged in the glass room.' };
  var M0 = Math.max(0, X.menu.map(function (s) { return s.id; }).indexOf('ageing-room'));
  var tabsBox = $('[data-menu-tabs]'), panelsBox = $('[data-menu-panels]'), mTabs = [], mPanels = [];
  var ink = el('span', { class: 'menu__ink', 'aria-hidden': 'true' });
  function dishRow(it) {
    var r = el('div', { class: 'dish', 'data-img': it.cutout || '' });
    var meta = [];
    if (it.age) meta.push('<span class="age-tag">Aged <b>' + it.age + '</b> days</span>');
    if (it.weight) meta.push('<span class="label">' + esc(it.weight) + '</span>');
    if (it.serves) meta.push('<span class="label">Serves ' + esc(String(it.serves)) + '</span>');
    if (it.note && it.price) meta.push('<span class="label">' + esc(it.note) + '</span>');
    r.innerHTML = (it.img ? '<img class="dish__thumb" src="' + img(it.img, 'plated', 'sm') + '" alt="" width="420" height="420" loading="lazy" decoding="async">' : '') +
      '<div class="dish__top"><span class="dish__name">' + nm(it.name) + '</span><span class="dish__lead" aria-hidden="true"></span><span class="price dish__price' + (it.price ? '' : ' is-free') + '">' + peso(it.price) + '</span></div>' +
      (it.desc ? '<p class="dish__desc">' + esc(it.desc) + '</p>' : '') +
      (meta.length ? '<div class="dish__meta">' + meta.join('') + '</div>' : '');
    return r;
  }
  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  X.menu.forEach(function (s, i) {
    var t = el('button', { class: 'mtab', type: 'button', role: 'tab', id: 'mtab-' + s.id, 'aria-controls': 'mpanel-' + s.id, 'aria-selected': i === M0 ? 'true' : 'false', tabindex: i === M0 ? '0' : '-1' });
    t.textContent = s.name;
    tabsBox.appendChild(t); mTabs.push(t);
    var p = el('div', { class: 'mpanel', role: 'tabpanel', id: 'mpanel-' + s.id, 'aria-labelledby': 'mtab-' + s.id, tabindex: '0' });
    if (i !== M0) p.hidden = true;
    var n = s.items.length;
    /* the default peek is never the signature dish (it fills the screen just above) */
    var first = s.items.filter(function (it) { return it.cutout && it.img !== sigItem.img; })[0] || s.items[0];
    var head = el('div', { class: 'mpanel__head' }, '<h3>' + esc(s.name) + '</h3><p>' + esc(LINE_OVERRIDE[s.id] || s.line) + '</p><p class="label mpanel__count">' + (WORDS[n] || n) + ' ' + (n === 1 ? 'dish' : 'dishes') + '</p>' +
      '<figure class="mpeek" aria-hidden="true" data-peek="' + esc(first.cutout || '') + '"></figure>' +
      '<div class="mpeek__cap" aria-hidden="true"><span class="mpeek__n"></span><span class="mpeek__meta"><span class="mpeek__a"></span><span class="mpeek__p"></span></span></div>');
    var rows = el('div', { class: 'mpanel__rows' });
    s.items.forEach(function (it) { rows.appendChild(dishRow(it)); });
    if (s.extras) {
      var ex = el('div', { class: 'extras' }, '<h4>' + esc(s.extras.name) + '</h4>');
      var gr = el('div', { class: 'extras__grid' });
      s.extras.items.forEach(function (it) { gr.appendChild(dishRow(it)); });
      ex.appendChild(gr); rows.appendChild(ex);
    }
    p.appendChild(head); p.appendChild(rows); panelsBox.appendChild(p); mPanels.push(p);
  });
  tabsBox.appendChild(ink);
  var DESK = matchMedia('(min-width: 900px)');
  /* One plate at a time (8 Nov fix: fast hovering used to stack several half-faded cut-outs).
     Each call gets a token; the new image is added only once decoded and only if it is still the latest;
     every older image is cleared at once except the one on screen, which fades out quickly. */
  function peekShow(panel, slug, animate) {
    var fig = $('.mpeek', panel); if (!fig || !slug || !DESK.matches || fig._slug === slug) return;
    fig._slug = slug;
    peekCap(panel, slug, animate);
    var token = fig._tok = (fig._tok || 0) + 1;
    var im = el('img', { src: img(slug, 'cutout', 'lg'), alt: '', width: 1200, height: 860, decoding: 'async' });
    var done = false;
    var go = function () {
      if (done || fig._tok !== token) return; done = true;
      var olds = $$('img', fig);
      if (G) G.killTweensOf(olds);
      olds.slice(0, -1).forEach(function (o) { o.remove(); });
      var last = olds[olds.length - 1];
      fig.appendChild(im);
      if (MOTION && animate) {
        if (last) { G.to(last, { opacity: 0, duration: .16, ease: 'power1.out', onComplete: function () { last.remove(); } }); setTimeout(function () { last.remove(); }, 260); }
        G.fromTo(im, { opacity: 0, scale: .95, rotation: -3 }, { opacity: 1, scale: 1, rotation: 0, duration: .5, delay: .06, ease: 'expo.out' });
      } else if (last) last.remove();
    };
    if (im.complete && im.naturalWidth) go();
    else { im.addEventListener('load', go); im.addEventListener('error', go); setTimeout(go, 600); }
  }
  /* caption card under the plate: the dish on screen, its age and price (fills the column; 8 Nov) */
  function dishBySlug(slug) {
    for (var i = 0; i < X.menu.length; i++) {
      var s = X.menu[i], all = (s.items || []).concat(s.extras ? s.extras.items : []);
      for (var k = 0; k < all.length; k++) if (all[k].cutout === slug || all[k].img === slug) return all[k];
    }
    return null;
  }
  function peekCap(panel, slug, animate) {
    var cap = $('.mpeek__cap', panel), it = dishBySlug(slug); if (!cap || !it) return;
    $('.mpeek__n', cap).textContent = it.name;
    $('.mpeek__a', cap).innerHTML = it.age ? '<span class="age-tag">Aged <b>' + it.age + '</b> days</span>' : (it.note ? '<span class="label">' + esc(it.note) + '</span>' : '');
    $('.mpeek__p', cap).textContent = it.price ? peso(it.price) : '';
    if (MOTION && animate && G) G.fromTo(cap.children, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'expo.out', stagger: .05, overwrite: true });
  }
  function peekInit(panel) { var f = $('.mpeek', panel); if (f && !f._slug) peekShow(panel, f.getAttribute('data-peek'), false); }
  var mCur = M0;
  function tabsMask() { var b = tabsBox; b.classList.toggle('is-ol', b.scrollLeft > 4); b.classList.toggle('is-or', b.scrollLeft + b.clientWidth < b.scrollWidth - 4); }
  tabsBox.addEventListener('scroll', tabsMask, { passive: true });
  function moveInk(instant) {
    var t = mTabs[mCur]; if (!t) return;
    var x = t.offsetLeft, w = t.offsetWidth;
    if (G && !instant && MOTION) G.to(ink, { x: x, scaleX: w / 100, duration: .7, ease: 'expo.out' });
    else ink.style.transform = 'translateX(' + x + 'px) scaleX(' + (w / 100) + ')';
    var box = tabsBox, l = x - box.clientWidth / 2 + w / 2;
    if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: Math.max(0, l), behavior: instant || RM ? 'auto' : 'smooth' });
    tabsMask(); setTimeout(tabsMask, 600);
  }
  function setMenu(i, focus) {
    if (i === mCur) return;
    var prevP = mPanels[mCur]; mCur = i;
    mTabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
    prevP.hidden = true; mPanels[i].hidden = false;
    peekInit(mPanels[i]);
    if (focus) mTabs[i].focus();
    moveInk();
    if ($('.menu').classList.contains('menu--stuck')) {
      var tw = $('.menu__tabs-wrap'), y = panelsBox.getBoundingClientRect().top + window.scrollY - tw.offsetHeight - (root.classList.contains('hdr-shown') ? hdr.offsetHeight : 0) - 24;
      if (lenis) lenis.scrollTo(y, { duration: .9 }); else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    }
    if (MOTION) {
      G.fromTo($$('.mpanel__head > *', mPanels[i]), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .06 });
      G.fromTo($$('.mpanel__rows > .dish, .extras', mPanels[i]), { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .045, delay: .08 });
    }
    if (ST) ST.refresh();
  }
  mTabs.forEach(function (t, i) {
    t.addEventListener('click', function () { setMenu(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, j = null;
      if (k === 'ArrowRight') j = (i + 1) % mTabs.length; else if (k === 'ArrowLeft') j = (i - 1 + mTabs.length) % mTabs.length;
      else if (k === 'Home') j = 0; else if (k === 'End') j = mTabs.length - 1;
      if (j === null) return; e.preventDefault(); setMenu(j, true);
    });
  });
  function onDish(e) {
    var row = e.target.closest && e.target.closest('.dish'); if (!row) return;
    var slug = row.getAttribute('data-img'), panel = row.closest('.mpanel'); if (!slug || !panel) return;
    $$('.dish.is-peek', panel).forEach(function (r) { r.classList.remove('is-peek'); }); row.classList.add('is-peek');
    /* rows the pointer only skims over (under 70 ms) never load their plate */
    clearTimeout(onDish._t);
    onDish._t = setTimeout(function () { if (row.classList.contains('is-peek')) peekShow(panel, slug, true); }, 70);
  }
  panelsBox.addEventListener('pointerover', onDish);
  /* the cut-out turns with the pointer (max 6 deg), as if lifted off the walnut */
  if (MOTION && FINE) $$('.mpeek').forEach(function (f) {
    var ry = G.quickTo(f, 'rotationY', { duration: 1, ease: 'power3' }), rx = G.quickTo(f, 'rotationX', { duration: 1, ease: 'power3' });
    f.closest('.mpanel').addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); ry(Math.max(-6, Math.min(6, (e.clientX - (r.left + r.width / 2)) / r.width * 8))); rx(Math.max(-6, Math.min(6, -(e.clientY - (r.top + r.height / 2)) / r.height * 8))); });
    f.closest('.mpanel').addEventListener('pointerleave', function () { ry(0); rx(0); });
  });
  if (HAS_IO) {
    var mio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { peekInit(mPanels[mCur]); mio.disconnect(); } }, { rootMargin: '600px 0px' });
    mio.observe(panelsBox);
  } else peekInit(mPanels[mCur]);
  moveInk(true);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { moveInk(true); });
  window.addEventListener('resize', function () { moveInk(true); });

  /* ───────── The Long Wait (videos) + enhancements ───────── */
  var track = $('[data-wait-track]');
  longWait.items.forEach(function (it) {
    var a = el('article', { class: 'wcut', tabindex: '0', 'aria-label': it.name + ', aged ' + it.age + ' days' });
    var frame = el('div', { class: 'wcut__frame', role: 'img', 'aria-label': it.name + ', plated' });
    if (hasVideo(it.img)) { var v = makeVideo(it.img); frame.appendChild(v); register(v, 1, false); }
    else frame.appendChild(el('img', { src: img(it.img, 'plated', 'md'), alt: '', width: 800, height: 800, loading: 'lazy' }));
    a.appendChild(frame);
    a.appendChild(el('div', { class: 'wcut__info' }, '<p class="age-tag">Aged <b>' + it.age + '</b> days</p><h3>' + nm(it.name) + '</h3><p>' + esc(it.desc) + '</p>' +
      '<dl class="wcut__facts"><div><dt class="label">Weight</dt><dd class="num">' + esc(it.weight) + '</dd></div><div><dt class="label">Serves</dt><dd class="num">' + esc(String(it.serves)) + '</dd></div>' +
      '<div><dt class="label">Price</dt><dd class="price">' + peso(it.price) + '</dd></div></dl>'));
    track.appendChild(a);
  });
  var dlg = $('#vdlg'), dlgVid = null, dlgOpener = null;
  function openViewer(it, opener) {
    dlgOpener = opener;
    $('#vdlg-title').textContent = it.name; $('[data-vdlg-desc]').textContent = it.desc || ''; $('[data-vdlg-price]').textContent = peso(it.price);
    var fr = $('.vdlg__frame', dlg); fr.innerHTML = '';
    if (hasVideo(it.img)) {
      dlgVid = makeVideo(it.img); dlgVid._eager = true; dlgVid.removeAttribute('aria-hidden'); dlgVid.setAttribute('aria-label', it.name);
      if (!VIDEO_OK) { dlgVid.setAttribute('controls', ''); dlgVid.src = X.video(it.img, SD ? 'sd' : 'hd'); }
      fr.appendChild(dlgVid); register(dlgVid, 5, true); if (VIDEO_OK) want(dlgVid, true);
    } else fr.appendChild(el('img', { src: hasBlock(it.img) ? X.block(it.img, 'lg') : img(it.img, 'plated', 'lg'), alt: it.name, width: 1920, height: 1080 }));
    if (lenis) lenis.stop();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    $('.vdlg__close', dlg).focus();
  }
  function closeViewer() { if (dlg.open && dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  if (dlg) {
    dlg.addEventListener('close', function () { if (dlgVid) { unregister(dlgVid); dlgVid = null; } if (lenis) lenis.start(); if (dlgOpener) dlgOpener.focus(); });
    $('.vdlg__close', dlg).addEventListener('click', closeViewer);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeViewer(); });
  }
  function stopChip(b) { if (b._v) { unregister(b._v); b._v.remove(); b._v = null; } }
  if (longWait.extras) {
    var exw = el('div', { class: 'wextras' }, '<h3>' + esc(longWait.extras.name) + '</h3><p>Add to any cut. Select one to watch it.</p>');
    var ul = el('ul', { class: 'chips' });
    longWait.extras.items.forEach(function (it) {
      var thumb = hasBlock(it.img) ? X.block(it.img, 'sm') : (hasVideo(it.img) ? X.video(it.img, 'poster') : img(it.img, 'plated', 'sm'));
      var li = el('li');
      var b = el('button', { class: 'chip', type: 'button', 'aria-haspopup': 'dialog', 'aria-label': it.name + ', ' + it.desc + ' ' + peso(it.price) + '. Watch it' },
        '<span class="chip__thumb" aria-hidden="true"><img src="' + thumb + '" alt="" width="640" height="360" loading="lazy" decoding="async"></span>' +
        '<span><b>' + esc(it.name) + '</b><small>' + esc(it.desc) + '</small><span class="price">' + peso(it.price) + '</span></span>');
      li.appendChild(b); ul.appendChild(li);
      b.addEventListener('click', function () { stopChip(b); openViewer(it, b); });
      if (FINE && VIDEO_OK && hasVideo(it.img)) {
        var start = function () { if (b._v || (dlg && dlg.open)) return; var v = makeVideo(it.img); v._eager = true; $('.chip__thumb', b).appendChild(v); register(v, 4, true); b._v = v; v.addEventListener('playing', function () { v.classList.add('is-on'); }, { once: true }); want(v, true); };
        b.addEventListener('pointerenter', start); b.addEventListener('focus', start);
        b.addEventListener('pointerleave', function () { if (d.activeElement !== b) stopChip(b); });
        b.addEventListener('blur', function () { stopChip(b); });
      }
    });
    exw.appendChild(ul); track.appendChild(exw);
  }

  /* ───────── Drinks, values, reel, plan, map ───────── */
  $('[data-cocktail-price]').textContent = peso(X.brand.cocktail.price);
  $('[data-drinks]').innerHTML = X.drinks.filter(function (k) { return !k.house; }).map(function (k) {
    return '<li><b>' + esc(k.name) + (k.house ? ' <em>House</em>' : '') + '</b><span class="price">' + peso(k.price) + '</span><p>' + esc(k.desc) + '</p></li>';
  }).join('');
  var VALUE_LINE = { Honesty: 'The menu tells you how many days each steak has aged.' };
  $('[data-values]').innerHTML = X.brand.values.map(function (v, i) {
    var pic = ''; /* client, 8 Nov: no image on the values; the open kitchen stays in The room */
    return '<li class="value' + (i === 0 ? ' is-open' : '') + '"><span class="value__word"><span class="value__w">' + esc(v.name) + '</span></span><div class="value__aside">' + pic + '<p class="value__line">' + esc(VALUE_LINE[v.name] || v.line) + '</p></div></li>';
  }).join('');
  var valEls = $$('.value');
  valEls.forEach(function (v) { v.addEventListener('pointerenter', function () { valEls.forEach(function (o) { o.classList.toggle('is-open', o === v); }); }); });

  var reelBox = $('[data-reel]');
  function reelItems(ids) { var out = []; ids.forEach(function (id) { var s = section(id); if (s) s.items.forEach(function (it) { if (it.img) out.push(it); }); }); return out; }
  [{ ids: ['first-course', 'garden', 'last-course'], cut: false }, { ids: ['alongside'], cut: true }].forEach(function (cfg, r) {
    var items = reelItems(cfg.ids).filter(function (it) { return !cfg.cut || it.cutout; });
    var row = el('div', { class: 'reel__row reel__row--' + (r ? 'b' : 'a') });
    for (var k = 0; k < 2; k++) {
      var set = el('div', { class: 'reel__set' }); if (k) set.setAttribute('aria-hidden', 'true');
      items.forEach(function (it) {
        var alt = k ? '' : esc(it.name);
        set.appendChild(el('figure', { class: 'reel__item' }, cfg.cut
          ? '<img src="' + img(it.cutout, 'cutout', 'sm') + '" alt="' + alt + '" width="600" height="420" loading="lazy" decoding="async">'
          : '<img src="' + img(it.img, 'plated', 'sm') + '" srcset="' + img(it.img, 'plated', 'sm') + ' 420w, ' + img(it.img, 'plated', 'md') + ' 800w" sizes="(min-width: 900px) 28vw, 260px" width="420" height="420" alt="' + alt + '" loading="lazy" decoding="async">'));
      });
      row.appendChild(set);
    }
    reelBox.appendChild(row);
  });

  (function plan() {
    var seats = $('.plan__seats'), lamps = $('.plan__lamps'), html = '';
    for (var i = 0; i < 6; i++) { var x = 110 + 35 + i * 70 - 16; html += '<rect x="' + x + '" y="116" width="32" height="20" rx="2"/><rect x="' + x + '" y="224" width="32" height="20" rx="2"/>'; }
    html += '<rect x="72" y="164" width="20" height="32" rx="2"/><rect x="548" y="164" width="20" height="32" rx="2"/>';
    seats.innerHTML = html;
    var lh = '<defs><radialGradient id="lampglow"><stop offset="0" stop-color="#e2c48e" stop-opacity=".45"/><stop offset="1" stop-color="#e2c48e" stop-opacity="0"/></radialGradient></defs>';
    [215, 320, 425].forEach(function (x) { lh += '<circle class="g" cx="' + x + '" cy="180" r="70" fill="url(#lampglow)"/><circle class="l" cx="' + x + '" cy="180" r="3.5"/>'; });
    lamps.innerHTML = lh;
  })();

  (function map() {
    var g = $('.map__grid'), h = '', i, cols = [], rows = [];
    for (i = -260; i <= 860; i += 46) cols.push(i);
    for (i = -260; i <= 860; i += 54) rows.push(i);
    var parks = { '12,10': 1, '13,10': 1, '12,11': 1, '7,14': 1, '16,6': 1 };
    for (var c = 0; c < cols.length - 1; c++) for (var r = 0; r < rows.length - 1; r++) {
      var key = c + ',' + r, cls = parks[key] ? 'pk' : ((c * 7 + r * 3) % 5 === 0 ? 'bl' : '');
      if (cls) h += '<rect class="' + cls + '" x="' + (cols[c] + 5) + '" y="' + (rows[r] + 5) + '" width="36" height="44"/>';
    }
    cols.forEach(function (x, k) { h += '<line class="' + (k % 4 === 2 ? 'av' : 'st') + '" x1="' + x + '" y1="-260" x2="' + x + '" y2="860"/>'; });
    rows.forEach(function (y, k) { h += '<line class="' + (k % 4 === 1 ? 'av' : 'st') + '" x1="-260" y1="' + y + '" x2="860" y2="' + y + '"/>'; });
    g.innerHTML = h;
  })();
  var soc = $$('[data-social] span');
  [C.instagram, C.facebook, C.tiktok].forEach(function (hnd, i) { if (soc[i]) soc[i].title = hnd + ' (to be confirmed)'; });

  /* ───────── Booking widget ───────── */
  var form = $('[data-form]'), datesBox = $('[data-dates]'), timesBox = $('[data-times]'), partyOut = $('[data-party]');
  var occ = $('#bk-occasion'), party = 2, chosenUTC = null, submitBtn = $('[data-submit]');
  var SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MSHORT = MONTHS.map(function (m) { return m.slice(0, 3); });
  function isEnquiry() { return occ.value === 'Private dining' || party >= 9; }
  function syncSubmit() { submitBtn.firstChild.nodeValue = isEnquiry() ? 'Send the enquiry ' : 'Hold my table '; }
  function slotsFor(utc) {
    var info = dayInfo(utc), h = HOURS[info.wd], out = [];
    if (!h) return out;
    h.sessions.forEach(function (s) { for (var t = s.o; t <= s.c - 90; t += 30) out.push(t); });
    if (utc === NOW.utc) out = out.filter(function (t) { return t >= NOW.min + 60; });
    return out;
  }
  var firstOpen = null;
  for (var di = 0; di < 30; di++) {
    var utc = (OPEN ? OPEN.utc : NOW.utc) + di * 864e5, inf = dayInfo(utc), sl = slotsFor(utc), closed = !sl.length;
    var lab = el('label', { class: 'chipr' });
    var inp = el('input', { type: 'radio', name: 'date', value: inf.y + '-' + pad(inf.m + 1) + '-' + pad(inf.d), 'aria-label': longDate(utc) + (closed ? (inf.wd === 1 ? ', closed' : ', no tables left') : '') });
    inp.dataset.utc = utc; if (closed) inp.disabled = true;
    lab.appendChild(inp);
    lab.appendChild(el('span', { 'aria-hidden': 'true' }, '<small>' + (di === 0 && !OPEN ? 'Today' : SHORT[inf.wd]) + '</small><b>' + inf.d + '</b><small>' + MSHORT[inf.m] + '</small>'));
    datesBox.appendChild(lab);
    if (!closed && firstOpen === null) firstOpen = inp;
  }
  function timeErr(on) { $('[data-err-time]').hidden = !on; timesBox.classList.toggle('is-err', on); }
  function renderTimes() {
    var sl = slotsFor(chosenUTC);
    $('[data-time-for]').textContent = '· ' + longDate(chosenUTC);
    timesBox.innerHTML = sl.length ? sl.map(function (t) {
      return '<label class="tslot"><input type="radio" name="time" value="' + t + '" aria-describedby="err-time"><span>' + fmt(t) + '</span></label>';
    }).join('') : '<p class="bk-times__none">No tables left on this day.</p>';
    timeErr(false);
    if (MOTION) G.fromTo($$('.tslot', timesBox), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .6, ease: 'expo.out', stagger: .02 });
  }
  datesBox.addEventListener('change', function (e) { if (e.target.name === 'date') { chosenUTC = +e.target.dataset.utc; renderTimes(); } });
  timesBox.addEventListener('change', function () { timeErr(false); });
  if (firstOpen) { firstOpen.checked = true; chosenUTC = +firstOpen.dataset.utc; renderTimes(); }
  var stepBtns = $$('[data-step]');
  function setParty(n) {
    party = Math.max(1, Math.min(14, n)); partyOut.textContent = party;
    stepBtns[0].disabled = party <= 1; stepBtns[1].disabled = party >= 14;
    var note = $('[data-private-note]'), show = party >= 9 && occ.value !== 'Private dining';
    if (show && note.hidden && MOTION) { note.hidden = false; G.fromTo(note, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: .6, ease: 'expo.out' }); }
    else note.hidden = !show;
    syncSubmit();
  }
  stepBtns.forEach(function (b) { b.addEventListener('click', function () { setParty(party + (+b.getAttribute('data-step'))); }); });
  occ.addEventListener('change', function () { setParty(party); });
  $('[data-make-private]').addEventListener('click', function () { occ.value = 'Private dining'; setParty(party); occ.focus(); });
  setParty(2);
  $('[data-private-enquire]').addEventListener('click', function () {
    occ.value = 'Private dining'; setParty(party < 9 ? 10 : party);
    scrollToEl($('#reserve'), function () { occ.focus({ preventScroll: true }); });
  });
  var rules = {
    'bk-name': function (v) { return v.trim().length >= 2 ? '' : 'Please tell us the name for the booking.'; },
    'bk-phone': function (v) { var dg = v.replace(/\D/g, ''); if (!v.trim()) return 'Please add a phone number, in case we need to reach you.'; return /^[+()\d\s.\-]+$/.test(v.trim()) && dg.length >= 7 && dg.length <= 15 ? '' : 'Use digits only, with at least 7 of them.'; },
    'bk-email': function (v) { if (!v.trim()) return 'Please add an email address for the confirmation.'; return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That email address looks incomplete. Check the part after the @.'; }
  };
  function check(id) {
    var inp = d.getElementById(id), msg = rules[id](inp.value), err = d.getElementById('err-' + id.slice(3));
    inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); err.textContent = msg; err.hidden = !msg; return !msg;
  }
  Object.keys(rules).forEach(function (id) {
    var inp = d.getElementById(id);
    inp.addEventListener('blur', function () { if (inp.value || inp.dataset.touched) { inp.dataset.touched = '1'; check(id); } });
    inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid') === 'true') check(id); });
  });
  var booking = null;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = null, t = form.querySelector('input[name=time]:checked');
    if (!t) { timeErr(true); bad = timesBox.querySelector('input'); }
    Object.keys(rules).forEach(function (id) { if (!check(id) && !bad) bad = d.getElementById(id); });
    if (bad) { bad.focus(); return; }
    var enq = isEnquiry();
    booking = { utc: chosenUTC, min: +t.value, party: party, occasion: occ.value, name: $('#bk-name').value.trim(), enquiry: enq };
    funnelSubmit(booking);
    var rows = [['Date', longDate(booking.utc)], ['Time', fmt(booking.min)], [enq ? 'Party' : 'Guests', booking.party + (booking.party === 1 ? ' guest' : ' guests')], ['Name', booking.name]];
    if (booking.occasion !== 'None') rows.splice(3, 0, ['Occasion', booking.occasion]);
    $('[data-summary]').innerHTML = rows.map(function (r) { return '<dt class="label">' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    $('[data-done-title]').textContent = enq ? 'Your enquiry is with us' : 'Your table is held';
    var note = $('[data-done-note]'); note.hidden = !enq; note.textContent = enq ? 'We’ll call you within a day to confirm the room.' : '';
    $('[data-ics]').hidden = enq; $('[data-call]').hidden = !enq;
    $('[data-again]').textContent = enq ? 'Change the enquiry' : 'Change the booking';
    var done = $('[data-done]');
    function swap() { form.hidden = true; done.hidden = false; done.focus(); if (MOTION) G.fromTo($$('.booking__done > :not([hidden])'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .07 }); if (ST) ST.refresh(); }
    if (MOTION) G.to(form, { autoAlpha: 0, y: -12, duration: .35, ease: 'power2.in', onComplete: function () { G.set(form, { clearProps: 'all' }); swap(); } }); else swap();
  });
  $('[data-again]').addEventListener('click', function () { $('[data-done]').hidden = true; form.hidden = false; var c = form.querySelector('input[name=date]:checked'); if (c) c.focus(); if (ST) ST.refresh(); });
  function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n'); }
  function icsTime(ms) { var t = new Date(ms); return t.getUTCFullYear() + pad(t.getUTCMonth() + 1) + pad(t.getUTCDate()) + 'T' + pad(t.getUTCHours()) + pad(t.getUTCMinutes()) + '00Z'; }
  $('[data-ics]').addEventListener('click', function () {
    if (!booking || booking.enquiry) return;
    var start = booking.utc + booking.min * 6e4 - 8 * 36e5, end = start + 150 * 6e4;
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//XXVIII Twenty-Eight Steakhouse//Reservations//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + start + '-' + Math.random().toString(36).slice(2) + '@' + C.web, 'DTSTAMP:' + icsTime(Date.now()), 'DTSTART:' + icsTime(start), 'DTEND:' + icsTime(end),
      'SUMMARY:' + icsEsc('Dinner at Twenty-Eight (XXVIII), table for ' + booking.party),
      'LOCATION:' + icsEsc(C.street + ', ' + C.area),
      'DESCRIPTION:' + icsEsc('Table for ' + booking.party + (booking.occasion !== 'None' ? ' · ' + booking.occasion : '') + '. ' + C.phone + '. Preview build: this booking was not sent.'),
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    var a = el('a', { href: url, download: 'xxviii-table-' + new Date(booking.utc).toISOString().slice(0, 10) + '.ics' });
    d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });

  /* Newsletter */
  $('[data-news]').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('#news-email'), msg = $('#news-msg'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
    inp.setAttribute('aria-invalid', ok ? 'false' : 'true'); msg.classList.toggle('is-err', !ok);
    msg.textContent = ok ? 'You are on the Ageing List. We will write when a cut reaches its day.' : (inp.value.trim() ? 'That email address looks incomplete.' : 'Add your email address to join.');
    if (ok) { inp.value = ''; inp.blur(); } else inp.focus();
  });

  /* ───────── Hooks for the "Ask the host" chat (site/chat.js) ───────── */
  window.XXSite = {
    now: NOW, open: OPEN, hours: HOURS, fmt: fmt, longDate: longDate, slotsFor: slotsFor,
    status: function () { return ST_NOW; },
    go: function (id) { var t = d.getElementById(id); if (t) scrollToEl(t); },
    showSection: function (id) {
      var i = X.menu.map(function (s) { return s.id; }).indexOf(id); if (i < 0) return false;
      setMenu(i); scrollToEl($('#menu')); return true;
    },
    showDish: function (name) {
      var row = $$('.mpanel .dish').filter(function (r) { var n = $('.dish__name', r); return n && n.textContent.replace(/\u00a0/g, ' ') === name; })[0];
      if (!row) return false;
      var pi = mPanels.indexOf(row.closest('.mpanel')); if (pi >= 0) setMenu(pi);
      /* 8 Nov: centre the dish on screen; scrolling it to the top hid it under the header and the sticky course tabs */
      setTimeout(function () {
        var b = row.getBoundingClientRect(), y = Math.max(0, b.top + window.scrollY - (window.innerHeight - b.height) / 2);
        if (lenis) lenis.scrollTo(y, { duration: 1.2, force: true }); else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
        row.classList.add('is-ask'); setTimeout(function () { row.classList.remove('is-ask'); }, 3600);
      }, 80);
      return true;
    },
    book: function (o) {
      o = o || {};
      if (o.occasion) occ.value = o.occasion;
      setParty(o.party || party);
      if (o.utc != null) {
        var di2 = $$('input[name=date]', datesBox).filter(function (x) { return +x.dataset.utc === o.utc && !x.disabled; })[0];
        if (di2) { di2.checked = true; chosenUTC = o.utc; renderTimes(); }
      }
      var tok = null;
      if (o.min != null) { var tm = timesBox.querySelector('input[value="' + o.min + '"]'); if (tm) { tm.checked = true; tok = o.min; } }
      if (o.go !== false) scrollToEl($('#reserve'));
      return { party: party, utc: chosenUTC, min: tok, occasion: occ.value };
    }
  };
  try { d.dispatchEvent(new CustomEvent('xx:site-ready')); } catch (e) { }

  /* ───────── Funnel: contextual CTAs, booking context, measurement (8 Nov) ───────── */
  var dl = window.dataLayer = window.dataLayer || [];
  function fTrack(ev, o) { var p = { event: ev }; for (var k in o) p[k] = o[k]; dl.push(p); }
  var UTM = {};
  try {
    var qs = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (qs.get(k)) UTM[k] = qs.get(k); });
    if (Object.keys(UTM).length) sessionStorage.setItem('xx-utm', JSON.stringify(UTM)); else UTM = JSON.parse(sessionStorage.getItem('xx-utm') || '{}');
  } catch (e) { }
  var FUN = { from: '', note: '' }, notesEl = $('#bk-notes'), ctxBox = $('[data-bk-context]');
  function secOf(n) { var s = n.closest('section, header, footer, .actbar, .xxdock'); return s ? (s.id || s.className.split(' ')[0]) : 'page'; }
  function setContext(from, note) {
    var cur = notesEl.value.trim();
    if (FUN.note && cur.indexOf(FUN.note) === 0) cur = cur.slice(FUN.note.length).trim();
    FUN.from = from; FUN.note = note || '';
    notesEl.value = FUN.note ? (FUN.note + (cur ? '\n' + cur : '')) : cur;
    ctxBox.hidden = !FUN.note;
    if (FUN.note) { $('[data-bk-context-txt]', ctxBox).textContent = FUN.note; fTrack('reserve_context', { from: from, note: FUN.note }); }
  }
  $('[data-bk-context-x]').addEventListener('click', function () { setContext('', ''); notesEl.focus(); });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]');
    if (b) {
      e.preventDefault();
      var note = b.getAttribute('data-note') || '';
      if (b.hasAttribute('data-b-book') && boardCuts[bCur]) { var bc = boardCuts[bCur].it; note = 'Interested in the ' + bc.name + ', aged ' + bc.age + ' days.'; }
      setContext(secOf(b), note);
      scrollToEl($('#reserve'));
    }
    var ms = e.target.closest('[data-menu-sec]');
    if (ms && window.XXSite.showSection(ms.getAttribute('data-menu-sec'))) e.preventDefault();
    var ak = e.target.closest('[data-ask]');
    if (ak && !ak.closest('.xxchat-panel, .xxpanel, [role=dialog]') && window.__xxChat) {
      var q = ak.getAttribute('data-ask'); if (q) window.__xxChat.send(q); else window.__xxChat.open();
    }
    var c = e.target.closest('a.btn, button.btn, .actbar a, .hdr__nav a, .overlay__list a, .ftr__nav a, .booking__next a, .menu__pdf, [data-ask], [data-book]');
    if (c) fTrack('cta_click', { cta_section: secOf(c), cta_label: c.textContent.replace(/\s+/g, ' ').trim(), cta_target: c.getAttribute('href') || c.getAttribute('data-ask') || c.type || '' });
  });
  var started = false;
  form.addEventListener('focusin', function () { if (!started) { started = true; fTrack('reserve_start', { from: FUN.from }); } });
  function funnelSubmit(bk) { var o = { party: bk.party, occasion: bk.occasion, enquiry: bk.enquiry, from: FUN.from }; for (var k in UTM) o[k] = UTM[k]; bk.from = FUN.from; bk.utm = UTM; bk.notes = notesEl.value.trim(); fTrack('reserve_submit', o); }
  if ('IntersectionObserver' in window) {
    var seenSec = {};
    var sio = new IntersectionObserver(function (es) { es.forEach(function (en) { var id = en.target.id; if (en.isIntersecting && !seenSec[id]) { seenSec[id] = 1; fTrack('section_view', { section: id }); sio.unobserve(en.target); } }); }, { threshold: .35 });
    $$('main > section[id]').forEach(function (s) { sio.observe(s); });
  }

  /* ───────── Reduced motion / no GSAP: everything static and visible ───────── */
  if (!MOTION) {
    root.classList.remove('intro-on', 'hero-wait');
    var intro0 = $('#intro'); if (intro0) intro0.remove();
    $('.reel').classList.add('reel--static');
    var tg = $('.reel__toggle'); if (tg) tg.hidden = true;
    return;
  }

  /* ════════════════════════ MOTION ════════════════════════ */
  var mm = G.matchMedia();

  /* Cursor dot (hidden over forms, tab strips and the viewer) */
  if (FINE) {
    var cur = $('.cursor'), cx = G.quickTo(cur, 'x', { duration: .2, ease: 'power3' }), cy = G.quickTo(cur, 'y', { duration: .2, ease: 'power3' });
    var HOV = 'a, button, [role="tab"], label, .value, .dish', OFF = '.booking, .menu__tabs, input, select, textarea, .vdlg';
    d.addEventListener('pointermove', function (e) { cur.classList.add('is-on'); cx(e.clientX); cy(e.clientY); }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var t = e.target && e.target.closest ? e.target : null;
      cur.classList.toggle('is-off', !!(t && t.closest(OFF)));
      cur.classList.toggle('is-hover', !!(t && t.closest(HOV)));
    });
    d.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    d.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    d.documentElement.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
  }

  /* Titles rise from a line mask. The masks carry padding for Gloock's descenders and side bearings (.tl-mask),
     and the split is reverted once the rise ends, so no mask is ever left on a title at rest. */
  var fontsReady = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
  function lineReveal(target, vars) {
    if (!SPLIT || !target) return;
    vars = vars || {};
    G.set(target, { autoAlpha: 0 });
    fontsReady.then(function () {
      var sp = SPLIT.create(target, { type: 'lines', mask: 'lines', linesClass: 'tl' });
      G.set(target, { autoAlpha: 1 });
      G.from(sp.lines, { yPercent: 135, duration: vars.duration || 1.25, ease: 'expo.out', stagger: .08, delay: vars.delay || 0,
        scrollTrigger: vars.now ? null : { trigger: target, start: vars.start || 'top 86%', once: true },
        onComplete: function () { sp.revert(); } });
    });
  }

  /* ───────── Hero ───────── */
  var heroStarted = false;
  G.set(['.hero__sub', '.hero__ctas > *', '.hero__strip > *'], { autoAlpha: 0, y: 24 });
  G.set('.hero__tag', { yPercent: -130 });
  root.classList.remove('hero-wait');
  function heroIn() {
    if (heroStarted) return; heroStarted = true;
    var title = $('.hero__title');
    lineReveal(title, { now: true, duration: 1.3 });
    if (window.__heroStart) window.__heroStart();
    G.timeline()
      .fromTo('.hero__frame', { scale: 1.1, filter: 'brightness(.45)' }, { scale: 1, filter: 'brightness(1)', duration: 2.4, ease: 'expo.out', clearProps: 'filter' }, 0)
      .to('.hero__sub', { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' }, .35)
      .to('.hero__ctas > *', { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .08 }, .5)
      .to('.hero__strip > *', { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .1 }, .75)
      .to('.hero__tag', { yPercent: 0, duration: 1.6, ease: 'expo.out' }, .6)
      .add(function () {
        /* one slow swing of the tag, then it settles: the film is the only thing that keeps moving */
        G.fromTo('.hero__tag', { rotation: -3 }, { rotation: 3, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: 2, onComplete: function () { G.to('.hero__tag', { rotation: 0, duration: 2.4, ease: 'sine.inOut' }); } });
      }, 1.6);
  }

  /* ───────── Intro sting (≤ 2.4 s) ───────── */
  var intro = $('#intro');
  if (root.classList.contains('intro-on') && intro) {
    try { sessionStorage.setItem('xxviii-intro', '1'); } catch (e) { }
    if (lenis) lenis.stop();
    var svg = $('.intro__tally'), ns = 'http://www.w3.org/2000/svg', marks = [], gx = 6, gateW = 4 * 13, gap = 26;
    for (var m = 0; m < 28; m++) {
      var gi = Math.floor(m / 5), k = m % 5, x0 = gx + gi * (gateW + gap), ln = d.createElementNS(ns, 'line');
      if (k < 4) { ln.setAttribute('x1', x0 + k * 13 + 6); ln.setAttribute('x2', x0 + k * 13 + 6); ln.setAttribute('y1', 10); ln.setAttribute('y2', 54); }
      else { ln.setAttribute('x1', x0 - 4); ln.setAttribute('y1', 48); ln.setAttribute('x2', x0 + 4 * 13 + 4); ln.setAttribute('y2', 16); }
      svg.appendChild(ln); marks.push(ln);
    }
    svg.setAttribute('viewBox', '0 0 ' + (gx + 5 * (gateW + gap) + 3 * 13 + 6) + ' 64');
    marks.forEach(function (l) { var len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value); l.style.strokeDasharray = len; l.style.strokeDashoffset = len; });
    var dayEl = $('#intro-day'), cnt = { v: 1 };
    var skip = function (e) { if (e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; itl.progress(1); };
    var endIntro = function () {
      d.removeEventListener('keydown', skip);
      root.classList.remove('intro-on'); intro.remove();
      if (lenis) lenis.start();
      heroIn(); ST.refresh();
    };
    var itl = G.timeline({ onComplete: function () { endIntro(); } });
    itl.to('.intro__line', { scaleX: 1, duration: .4, ease: 'power3.inOut' }, 0)
      .to(marks, { strokeDashoffset: 0, duration: .08, ease: 'power1.out', stagger: .03 }, .25)
      .to(cnt, { v: 28, duration: .89, ease: 'none', onUpdate: function () { dayEl.textContent = pad(Math.round(cnt.v)); } }, .25)
      .to(['.intro__tally', '.intro__day', '.intro__line'], { autoAlpha: 0, y: -10, duration: .26, ease: 'power2.in' }, 1.16)
      .fromTo('.intro__mark', { autoAlpha: 0, scale: .94 }, { autoAlpha: 1, scale: 1, duration: .55, ease: 'expo.out' }, 1.32)
      .to('.intro__mark', { backgroundPosition: '0% 0', duration: .55, ease: 'power2.inOut' }, 1.32)
      .call(heroIn, null, 1.9)
      .to(intro, { yPercent: -100, duration: .48, ease: 'power3.inOut' }, 1.9);
    $('.intro__skip').addEventListener('click', skip);
    intro.addEventListener('pointerdown', skip);
    d.addEventListener('keydown', skip);
  } else { if (intro) intro.remove(); root.classList.remove('intro-on'); heroIn(); }

  G.to('.hero__frame', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.hero__copy', { yPercent: -18, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: 'bottom top', scrub: true } });
  if (FINE) {
    var tagR = G.quickTo('.hero__tag img', 'rotation', { duration: 1.4, ease: 'power3' });
    $('.hero').addEventListener('pointermove', function (e) { tagR((e.clientX / innerWidth - .5) * 10); });
  }

  /* ───────── Board ───────── */
  lineReveal($('#board-title'));
  G.from(['.board__line', '.board__date'], { autoAlpha: 0, y: 18, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.board__head', start: 'top 82%', once: true } });
  G.timeline({ scrollTrigger: { trigger: '.board__glass', start: 'top 80%', once: true } })
    .from('.board__glass', { autoAlpha: 0, y: 40, duration: 1.2, ease: 'expo.out' }, 0)
    .from($$('.brow, .board__group'), { autoAlpha: 0, x: -18, duration: .9, ease: 'expo.out', stagger: .05 }, .15)
    .from($$('.brow__bar i'), { scaleX: 0, duration: 1.4, ease: 'power3.inOut', stagger: .06 }, .3);
  mm.add('(min-width: 900px)', function () {
    G.from('.board__screen', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.board__body', start: 'top 78%', once: true } });
  });
  if (FINE) {
    var glass = $('.board__glass');
    glass.addEventListener('pointermove', function (e) { var r = glass.getBoundingClientRect(); glass.style.setProperty('--sheen', ((e.clientX - r.left) / r.width * 40 - 20) + '%'); });
  }

  /* ───────── Signature ───────── */
  G.timeline({ scrollTrigger: { trigger: '.sig', start: 'top 72%', once: true } })
    .fromTo('.sig__frame', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0)
    .fromTo('.sig__frame img', { scale: 1.5 }, { scale: 1.3, duration: 2.4, ease: 'expo.out' }, .3)
    .from('.sig__line, .sig__facts', { autoAlpha: 0, y: 22, duration: 1.1, ease: 'expo.out', stagger: .1 }, .6)
    .from('.card3d', { autoAlpha: 0, y: 60, rotation: -10, duration: 1.6, ease: 'expo.out' }, .85);
  lineReveal($('#sig-title'), { start: 'top 72%' });
  G.to('.sig__frame img', { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '.sig', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ───────── The room: frames open in turn, photographs drift slowly inside them ───────── */
  lineReveal($('#room-title'));
  G.from('.room__intro', { autoAlpha: 0, y: 18, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.room__head', start: 'top 82%', once: true } });
  $$('.rm').forEach(function (f) {
    G.from($('.rm__frame', f), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: f, start: 'top 86%', once: true } });
    G.from($('figcaption', f), { autoAlpha: 0, y: 14, duration: 1, ease: 'expo.out', delay: .5, scrollTrigger: { trigger: f, start: 'top 86%', once: true } });
  });
  $$('.rm__frame img, .patience__frame img, .private__frame img, .crust__img img').forEach(function (im) {
    G.fromTo(im, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: im.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ───────── Menu ───────── */
  lineReveal($('#menu-title'));
  G.from('.menu__intro', { autoAlpha: 0, y: 18, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.menu__head', start: 'top 82%', once: true } });
  G.from($$('.mtab'), { autoAlpha: 0, y: 14, duration: .9, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.menu__tabs-wrap', start: 'top 88%', once: true } });
  G.from($$('.mpanel:not([hidden]) .mpanel__head > *, .mpanel:not([hidden]) .mpanel__rows > *'), { autoAlpha: 0, y: 24, duration: 1.1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.menu__body', start: 'top 80%', once: true } });
  ST.create({ trigger: '.menu', start: function () { return 'top+=' + ($('.menu__tabs-wrap').offsetTop) + ' top'; }, end: 'bottom top', toggleClass: { targets: '.menu', className: 'menu--stuck' } });

  /* ───────── The Long Wait ───────── */
  var wait = $('.wait');
  mm.add('(min-width: 900px)', function () {
    wait.classList.add('wait--pinned');
    var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
    var tw = G.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: wait, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    G.fromTo('.wait__progress i', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: wait, start: 'top top', end: function () { return '+=' + dist(); }, scrub: true, invalidateOnRefresh: true } });
    $$('.wcut').forEach(function (p) {
      G.from($('.wcut__frame', p), { clipPath: 'inset(0% 0% 0% 100%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 92%', once: true } });
      G.from($$('.wcut__info > *', p), { autoAlpha: 0, y: 26, duration: 1.1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 62%', once: true } });
    });
    G.from($$('.chip'), { autoAlpha: 0, y: 30, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.wextras', containerAnimation: tw, start: 'left 85%', once: true } });
    G.from('.wait__day', { autoAlpha: 0, x: -40, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: wait, start: 'top 70%', once: true } });
    return function () { wait.classList.remove('wait--pinned'); G.set(track, { clearProps: 'transform' }); };
  });
  lineReveal($('#wait-title'), { start: 'top 80%' });
  var swipe = $('.wait__swipe');
  if (swipe) track.addEventListener('scroll', function () { if (track.scrollLeft > 40) G.to(swipe, { autoAlpha: 0, duration: .4 }); }, { passive: true });

  /* ───────── Patience: the stirred glass ───────── */
  var spoons = $$('.glass__spoon'), ang = { a: 0 };
  function placeSpoon() { var a = ang.a, x = 214 + Math.cos(a) * 54, y = 196 + Math.sin(a) * 5; spoons.forEach(function (s) { s.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') rotate(' + (7 + Math.sin(a) * 3).toFixed(2) + ')'); }); }
  placeSpoon();
  var gl = G.timeline({ paused: true });
  gl.to(ang, { a: Math.PI * 2, duration: 9, ease: 'none', repeat: -1, onUpdate: placeSpoon }, 0)
    .to('.glass__ice', { y: 4, rotation: 2.5, svgOrigin: '208 250', duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
    .to('.glass__caustic', { scaleX: 1.1, opacity: .6, svgOrigin: '214 438', duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
    .to('.glass__caust-in', { x: 18, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  ST.create({ trigger: '.patience', start: 'top bottom', end: 'bottom top', onToggle: function (s) { if (s.isActive) gl.play(); else gl.pause(); } });
  G.from('.patience__frame', { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.patience', start: 'top 72%', once: true } });
  lineReveal($('#patience-title'), { start: 'top 78%' });
  G.from(['.patience__line', '.patience__meta', '.drinks__title'], { autoAlpha: 0, y: 20, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.patience__copy', start: 'top 75%', once: true } });
  G.from($$('.drinks li'), { autoAlpha: 0, y: 20, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.drinks', start: 'top 85%', once: true } });

  /* ───────── Photo reel ───────── */
  var rows = $$('.reel__row'), reelTw = [], userPaused = false, hoverPaused = false, onScreen = false;
  rows.forEach(function (r, i) { reelTw.push(i ? G.fromTo(r, { xPercent: -50 }, { xPercent: 0, duration: NARROW.matches ? 60 : 95, ease: 'none', repeat: -1, paused: true }) : G.to(r, { xPercent: -50, duration: NARROW.matches ? 75 : 120, ease: 'none', repeat: -1, paused: true })); });
  function syncReel() { var run = onScreen && !userPaused && !hoverPaused; reelTw.forEach(function (t) { if (run) t.play(); else t.pause(); }); }
  ST.create({ trigger: '.reel', start: 'top bottom', end: 'bottom top', onToggle: function (s) { onScreen = s.isActive; syncReel(); } });
  var rb = $('.reel__rows');
  /* mouse hover pauses; a finger only pauses while it is down (touch never sends a reliable leave) */
  rb.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && FINE) { hoverPaused = true; syncReel(); } });
  rb.addEventListener('pointerleave', function () { hoverPaused = false; syncReel(); });
  rb.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { hoverPaused = true; syncReel(); } });
  ['pointerup', 'pointercancel'].forEach(function (ev) { rb.addEventListener(ev, function (e) { if (e.pointerType !== 'mouse') { hoverPaused = false; syncReel(); } }); });
  rb.addEventListener('focusin', function () { if (FINE) { hoverPaused = true; syncReel(); } });
  rb.addEventListener('focusout', function () { hoverPaused = false; syncReel(); });
  var tgl = $('.reel__toggle');
  tgl.addEventListener('click', function () { userPaused = !userPaused; tgl.setAttribute('aria-pressed', userPaused ? 'true' : 'false'); $('.reel__txt', tgl).textContent = userPaused ? 'Play the photographs' : 'Pause the photographs'; syncReel(); });
  lineReveal($('#reel-title'));
  G.from(rows, { autoAlpha: 0, x: function (i) { return i ? -80 : 80; }, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: rb, start: 'top 85%', once: true } });

  /* ───────── Values ───────── */
  var vals = $('.values');
  G.from($$('.value__w'), { yPercent: 70, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.values__list', start: 'top 80%', once: true } });
  lineReveal($('#values-title'));
  if (FINE) vals.addEventListener('pointermove', function (e) { var r = vals.getBoundingClientRect(); vals.style.setProperty('--mx', (e.clientX - r.left) + 'px'); vals.style.setProperty('--my', (e.clientY - r.top) + 'px'); });

  /* ───────── Private dining plan (draws in ≤ 1.5 s) ───────── */
  lineReveal($('#private-title'));
  G.from(['.private__line', '.private__copy .cta-row'], { autoAlpha: 0, y: 20, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.private__copy', start: 'top 78%', once: true } });
  (function () {
    var room = $('.plan__room'), table = $('.plan__table'), door = $('.plan__door');
    [room, table].forEach(function (r) { var L = r.getTotalLength ? r.getTotalLength() : 2000; r.style.strokeDasharray = L; r.style.strokeDashoffset = L; });
    G.timeline({ scrollTrigger: { trigger: '.private__plan', start: 'top 85%', once: true } })
      .to([room, table], { strokeDashoffset: 0, duration: .6, ease: 'power2.inOut' }, 0)
      .from(door, { autoAlpha: 0, duration: .4 }, .4)
      .from($$('.plan__seats rect'), { autoAlpha: 0, scale: .3, transformOrigin: '50% 50%', duration: .5, ease: 'expo.out', stagger: { each: .04, from: 'center' } }, .45)
      .from($$('.plan__lamps .g, .plan__lamps .l'), { autoAlpha: 0, duration: .5, stagger: .05 }, .9);
    G.to($$('.plan__lamps .g'), { opacity: .7, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: .8, delay: 2 });
  })();
  G.from('.private__frame', { clipPath: 'inset(0% 0% 0% 100%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.private__photo', start: 'top 80%', once: true } });

  /* ───────── Reserve / Visit ───────── */
  lineReveal($('#reserve-title'));
  G.from(['.reserve__line', '.reserve__alt'], { autoAlpha: 0, y: 18, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.reserve__intro', start: 'top 80%', once: true } });
  G.from('.booking', { autoAlpha: 0, y: 50, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.booking', start: 'top 85%', once: true } });
  G.from($$('.chipr'), { autoAlpha: 0, x: 24, duration: .9, ease: 'expo.out', stagger: .025, scrollTrigger: { trigger: '.bk-dates', start: 'top 88%', once: true } });
  lineReveal($('#visit-title'));
  G.from(['.visit__addr', '.hours', '.visit__contact', '.visit__copy > .cta-row'], { autoAlpha: 0, y: 20, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.visit__copy', start: 'top 75%', once: true } });
  G.from('.visit__door', { autoAlpha: 0, y: 40, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.visit__media', start: 'top 80%', once: true } });
  G.from('.reserve__room', { autoAlpha: 0, y: 30, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.reserve__room', start: 'top 90%', once: true } });
  G.timeline({ scrollTrigger: { trigger: '.map', start: 'top 75%', once: true } })
    .from('.map__grid', { autoAlpha: 0, scale: 1.12, svgOrigin: '300 300', duration: 2, ease: 'expo.out' }, 0)
    .from('.map__drop', { y: -60, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, .5)
    .from('.map__label', { autoAlpha: 0, y: 10, duration: .8 }, .9);
  if (FINE) {
    var mapG = $('.map__grid'), mxTo = G.quickTo(mapG, 'x', { duration: 1.4, ease: 'power3' }), myTo = G.quickTo(mapG, 'y', { duration: 1.4, ease: 'power3' });
    $('.map').addEventListener('pointermove', function (e) { var r = e.currentTarget.getBoundingClientRect(); mxTo(-((e.clientX - r.left) / r.width - .5) * 24); myTo(-((e.clientY - r.top) / r.height - .5) * 24); });
  }

  /* ───────── Footer ───────── */
  G.from('.ftr__mark', { autoAlpha: 0, y: 40, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.ftr__base', start: 'top 92%', once: true } });

  ['ageing', 'menu', 'private', 'visit'].forEach(function (id) {
    var link = $('.hdr__nav a[href="#' + id + '"]'), s = d.getElementById(id); if (!link || !s) return;
    ST.create({ trigger: s, start: 'top 50%', end: 'bottom 50%', onToggle: function (t) { link.classList.toggle('is-active', t.isActive); } });
  });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
