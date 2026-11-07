/* XXVIII brand guidelines book: renders data-driven chapters from window.XXVIII and runs the motion.
   Classic script, works from file://. Content never depends on motion: start states are set by GSAP only. */
(function () {
  'use strict';
  var X = window.XXVIII;
  if (!X) return;
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  var MOTION = HAS_GSAP && !RM;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, X); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var B = X.brand;

  /* ---------- toast + copy ---------- */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 1900);
  }
  function copy(text, label) {
    var done = function () { toast('Copied ' + (label || text)); };
    var fallback = function () {
      var ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand('copy'); done(); } catch (e) { toast('Copy not available here'); }
      ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain' });
    var a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Saved ' + name);
  }

  /* ---------- simple data bindings ---------- */
  $$('[data-x]').forEach(function (el) { var v = get(el.getAttribute('data-x')); if (v != null) el.textContent = v; });

  /* ---------- odometer ---------- */
  function Odo(el) {
    this.strips = $$('.odo-strip', el);
    this.strips.forEach(function (s) { var h = ''; for (var i = 0; i <= 10; i++) h += '<span>' + (i % 10) + '</span>'; s.innerHTML = h; });
    this.v = 0;
  }
  Odo.prototype.set = function (v) {
    this.v = v;
    var ones = v % 10, tens = Math.floor(v / 10) + Math.max(0, ones - 9);
    if (this.strips[0]) this.strips[0].style.transform = 'translateY(' + (-tens) + 'em)';
    if (this.strips[1]) this.strips[1].style.transform = 'translateY(' + (-ones) + 'em)';
  };
  Odo.prototype.to = function (v, dur) {
    var self = this;
    if (!MOTION) { self.set(v); return; }
    var o = { v: self.v };
    gsap.to(o, { v: v, duration: dur || 1.4, ease: 'power3.inOut', onUpdate: function () { self.set(o.v); } });
  };

  /* ---------- II · story ---------- */
  $('#storyLines').innerHTML = B.story.map(function (s) { return '<p class="story-line">' + esc(s) + '</p>'; }).join('');
  var beatLines = {
    Still: 'The beef hangs untouched on the rail.',
    Cold: 'Kept cold and steady, day and night.',
    Quiet: 'Slow air. Nobody hurries the room.',
    Patient: 'Day twenty-eight. Now it is ready.'
  };
  $('#beatsList').innerHTML = B.storyBeats.map(function (b, i) {
    return '<li><b>' + esc(b) + '</b><span class="label">Days ' + pad(i * 7 + 1) + '–' + pad(i * 7 + 7) + '</span><p>' + esc(beatLines[b] || '') + '</p></li>';
  }).join('');
  var beatOdo = new Odo($('#beatOdo'));
  beatOdo.set(28);
  var beatItems = $$('#beatsList li');
  function setBeat(v) {
    var idx = Math.min(3, Math.floor((v - 1) / 7));
    beatItems.forEach(function (li, i) { li.classList.toggle('on', i === idx); });
  }

  /* ---------- III · clearance checklist ---------- */
  (function () {
    var KEY = 'xxviii-name-clearance';
    var state = {};
    try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }
    var boxes = $$('#clearList input');
    $('#clearTotal').textContent = boxes.length;
    function count() { $('#clearCount').textContent = boxes.filter(function (b) { return b.checked; }).length; }
    boxes.forEach(function (b) {
      b.checked = !!state[b.dataset.k];
      b.addEventListener('change', function () {
        state[b.dataset.k] = b.checked;
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
        count();
      });
    });
    count();
  })();

  /* ---------- IV · values ---------- */
  $('#values').innerHTML = B.values.map(function (v) { return '<li><span class="v-name">' + esc(v.name) + '</span><p>' + esc(v.line) + '</p></li>'; }).join('');

  /* ---------- V · taglines ---------- */
  var TL_USE = [
    { role: 'Primary', use: 'The line under the mark. Use it where the brand speaks first.', where: ['Signage', 'Ads', 'Website hero', 'Menu cover'] },
    { role: 'Sign-off', use: 'For the moment after a decision: a booking, an order of a Long Wait cut.', where: ['Confirmations', 'Social sign-off', 'Gift vouchers'] },
    { role: 'Story line', use: 'For explaining the ageing room. Never as a headline on an ad.', where: ['Ageing room', 'Press kit', 'Packaging'] }
  ];
  $('#tlCopy').innerHTML = B.taglines.map(function (t, i) {
    var u = TL_USE[i] || TL_USE[0];
    return '<div class="tl-item" id="tl-' + i + '" role="tabpanel" aria-labelledby="tlt-' + i + '"' + (i ? ' hidden' : '') + '>' +
      '<p class="tl-line">' + esc(t) + '</p><p class="label tl-role">' + esc(u.role) + '</p><p class="tl-use">' + esc(u.use) + '</p>' +
      '<ul class="tl-uses">' + u.where.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div>';
  }).join('');
  $('#tlTabs').innerHTML = B.taglines.map(function (t, i) {
    return '<button type="button" role="tab" id="tlt-' + i + '" aria-controls="tl-' + i + '" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + '><i></i>' + ['I', 'II', 'III'][i] + '<span class="sr-only">: ' + esc(t) + '</span></button>';
  }).join('');
  var tlIdx = 0, tlTimer = null, tlTween = null, tlPaused = false, tlVisible = false;
  var tlPhotos = $$('.tl-photos img'), tlTabs = $$('#tlTabs button'), tlItems = $$('.tl-item');
  tlPhotos[0].classList.add('on');
  function showTagline(i, user) {
    tlIdx = (i + tlItems.length) % tlItems.length;
    tlItems.forEach(function (el, k) { el.hidden = k !== tlIdx; });
    tlTabs.forEach(function (b, k) { b.setAttribute('aria-selected', k === tlIdx); b.tabIndex = k === tlIdx ? 0 : -1; });
    tlPhotos.forEach(function (p, k) { p.classList.toggle('on', k === tlIdx); });
    if (MOTION) {
      var line = $('.tl-line', tlItems[tlIdx]);
      gsap.fromTo(line, { opacity: 0, y: 30, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out' });
      gsap.fromTo($$('.tl-role, .tl-use, .tl-uses', tlItems[tlIdx]), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .9, stagger: .08, delay: .2, ease: 'power3.out' });
    }
    runTl();
  }
  function runTl() {
    if (!MOTION) return;
    if (tlTween) tlTween.kill();
    $$('#tlTabs i').forEach(function (i) { gsap.set(i, { scaleX: 0 }); });
    if (tlPaused || !tlVisible) return;
    tlTween = gsap.fromTo(tlTabs[tlIdx].querySelector('i'), { scaleX: 0 }, { scaleX: 1, duration: 6.5, ease: 'none', onComplete: function () { showTagline(tlIdx + 1); } });
  }
  tlTabs.forEach(function (b, i) {
    b.addEventListener('click', function () { showTagline(i, true); });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tlTabs.length) % tlTabs.length; showTagline(n, true); tlTabs[n].focus(); }
    });
  });
  var tlStage = $('#tlStage');
  ['mouseenter', 'focusin'].forEach(function (ev) { tlStage.addEventListener(ev, function () { tlPaused = true; if (tlTween) tlTween.pause(); }); });
  ['mouseleave', 'focusout'].forEach(function (ev) { tlStage.addEventListener(ev, function () { tlPaused = false; if (tlTween) tlTween.resume(); else runTl(); }); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    es.forEach(function (e) { tlVisible = e.isIntersecting; if (tlVisible) { if (!tlTween) runTl(); else if (!tlPaused) tlTween.resume(); } else if (tlTween) tlTween.pause(); });
  }, { threshold: .3 }).observe(tlStage);

  /* ---------- VI · colourway switcher ---------- */
  var CW_NOTE = {
    brass: 'Brass on charcoal: the house colourway. Use it whenever the ground is dark.',
    bone: 'Bone on oxblood: for leather, booth tags, the envelope. Brass would sink on this red.',
    char: 'Charcoal on bone: letterhead, menus on paper, receipts.',
    ox: 'Oxblood on bone: stamps, wax seals, the back of the steak card.'
  };
  var cwStage = $('.cw-stage');
  $$('.cw-switch button').forEach(function (btn, i, all) {
    btn.addEventListener('click', function () {
      var cw = btn.dataset.cw;
      all.forEach(function (b) { b.setAttribute('aria-checked', b === btn); b.tabIndex = b === btn ? 0 : -1; });
      var imgs = $$('img', cwStage);
      var swap = function () {
        cwStage.dataset.cw = cw;
        imgs.forEach(function (im) { im.src = '../assets/logo/xxviii-' + im.dataset.lk + '-' + cw + '.svg'; im.alt = im.alt.replace(/, \w+$/, ', ' + cw); });
        $('#cwNote').textContent = CW_NOTE[cw];
      };
      if (MOTION) gsap.to(imgs, { opacity: 0, duration: .25, onComplete: function () { swap(); gsap.to(imgs, { opacity: 1, duration: .6, delay: .15 }); } });
      else swap();
    });
    btn.tabIndex = i ? -1 : 0;
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]; n.focus(); n.click(); }
    });
  });
  // show monogram + seal pair in the colourway stage
  (function () {
    var pair = doc.createElement('div'); pair.className = 'cw-pair';
    $$('[data-lk="monogram"], [data-lk="seal"]', cwStage).forEach(function (im) { im.style.display = 'block'; im.style.width = '120px'; pair.appendChild(im); });
    cwStage.appendChild(pair);
  })();

  /* min-size dimension lines match the image widths */
  $$('.ms-art').forEach(function (a) { var im = $('img', a); a.querySelector('.ms-dim').style.setProperty('--w', im.getAttribute('width') + 'px'); });

  /* ---------- VII · colour ---------- */
  function hexRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function lum(rgb) { var a = rgb.map(function (v) { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; }
  function ratio(a, b) { var l1 = lum(hexRgb(a)), l2 = lum(hexRgb(b)); var hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + .05) / (lo + .05); }
  function cmyk(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, k = 1 - Math.max(r, g, b);
    if (k >= 1) return [0, 0, 0, 100];
    return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(function (v) { return Math.round(v * 100); });
  }
  $('#swatches').innerHTML = B.palette.map(function (p) {
    var rgb = hexRgb(p.hex), c = cmyk(rgb);
    var on = ratio(p.hex, '#EFE7DA') > ratio(p.hex, '#141110') ? '#EFE7DA' : '#141110';
    var vals = [['HEX', p.hex], ['RGB', rgb.join(', ')], ['CMYK', c.join(' / ')]];
    return '<li class="sw"><div class="sw-chip" style="--c:' + p.hex + ';--on:' + on + '"><span>' + esc(p.name) + '</span></div><div class="sw-body"><p class="sw-role">' + esc(p.role) + '</p><div class="sw-vals">' +
      vals.map(function (v) { return '<button type="button" data-copy="' + esc(v[1]) + '" aria-label="Copy ' + esc(p.name) + ' ' + v[0] + ' ' + esc(v[1]) + '"><span class="label">' + v[0] + '</span><span>' + esc(v[1]) + '</span></button>'; }).join('') +
      '</div></div></li>';
  }).join('');
  $('#swatches').addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy); });
  (function () {
    var fg = ['bone', 'ash', 'brass', 'brass-hi', 'ox', 'char'], bg = ['char', 'char-2', 'ox', 'ox-deep', 'bone'];
    var P = {}; B.palette.forEach(function (p) { P[p.id] = p; });
    var html = '<caption class="sr-only">Contrast ratio of each brand text colour on each brand ground</caption><thead><tr><th scope="col">Text on ground</th>' +
      bg.map(function (g) { return '<th scope="col">' + esc(P[g].name) + '<small>' + P[g].hex + '</small></th>'; }).join('') + '</tr></thead><tbody>';
    fg.forEach(function (f) {
      html += '<tr><th scope="row">' + esc(P[f].name) + '<small>' + P[f].hex + '</small></th>';
      bg.forEach(function (g) {
        var r = ratio(P[f].hex, P[g].hex), badge = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA Large' : 'Fail';
        html += '<td><div class="ct-cell' + (r < 3 ? ' ct-fail' : '') + '" style="background:' + P[g].hex + ';color:' + P[f].hex + '"><span class="ct-aa" aria-hidden="true">Aa</span><span class="ct-ratio">' + r.toFixed(2) + ':1</span><span class="ct-badge">' + badge + '</span></div></td>';
      });
      html += '</tr>';
    });
    $('#contrast').innerHTML = html + '</tbody>';
  })();

  /* ---------- VIII · type ---------- */
  function scaleMeta() {
    $$('#scaleList li').forEach(function (li) {
      var s = $('.sc-s', li), px = Math.round(parseFloat(getComputedStyle(s).fontSize));
      $('.sc-meta', li).innerHTML = '<span>' + li.dataset.t.replace('--t-', '') + '</span><b>' + px + ' px</b>';
    });
  }
  scaleMeta(); window.addEventListener('resize', scaleMeta);
  (function () {
    var out = $('#ttOut'), txt = $('#ttText'), size = $('#ttSize'), so = $('#ttSizeOut');
    var apply = function () { out.textContent = txt.value || ' '; out.style.fontSize = 'min(' + size.value + 'px, 19vw)'; so.textContent = size.value; };
    txt.addEventListener('input', apply); size.addEventListener('input', apply);
    $$('.tester-faces button').forEach(function (b, i, all) {
      b.tabIndex = i ? -1 : 0;
      b.addEventListener('click', function () {
        all.forEach(function (x) { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });
        out.className = 'tester-out' + (b.dataset.f === 'display' ? '' : ' f-' + b.dataset.f);
      });
      b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]; n.focus(); n.click(); } });
    });
    apply();
  })();

  /* ---------- IX · elements ---------- */
  (function () {
    var svg = $('#tally28'), h = '', x = 6;
    for (var g = 0; g < 6; g++) {
      var n = g < 5 ? 4 : 3;
      for (var k = 0; k < n; k++) h += '<line x1="' + (x + k * 11) + '" y1="10" x2="' + (x + k * 11) + '" y2="50"/>';
      if (g < 5) h += '<line x1="' + (x - 6) + '" y1="44" x2="' + (x + 3 * 11 + 6) + '" y2="16"/>';
      x += 58;
    }
    svg.innerHTML = h;
  })();
  var elOdo = new Odo($('#elOdo')); elOdo.set(21);
  $('#elOdoBtn').addEventListener('click', function () { var n = Math.round(elOdo.v) + 1; if (n > 28) n = 1; elOdo.to(n, .9); });
  $('#grainDemo').addEventListener('click', function () { var off = this.classList.toggle('off'); $('#grainState').textContent = off ? 'off' : 'on'; });
  $('#grainDemo').setAttribute('role', 'button'); $('#grainDemo').tabIndex = 0;
  $('#grainDemo').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } });
  (function () {
    var pool = $('#poolDemo');
    pool.addEventListener('pointermove', function (e) {
      var r = pool.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      pool.style.setProperty('--x', x + 'px'); pool.style.setProperty('--y', y + 'px');
      var d = Math.hypot(x - r.width / 2, y - r.height / 2) / (r.width / 2);
      pool.style.setProperty('--b', (1.05 - Math.min(1, d) * .55).toFixed(2));
    });
    pool.addEventListener('pointerleave', function () { pool.style.removeProperty('--x'); pool.style.removeProperty('--y'); pool.style.setProperty('--b', 1); });
    pool.style.setProperty('--b', 1);
  })();

  /* patterns */
  var monoInner = ($('#m-mono') || {}).innerHTML || '';
  function tallyTile(stroke, ground) {
    var gate = function (x, y) {
      var s = ''; for (var k = 0; k < 4; k++) s += '<line x1="' + (x + k * 9) + '" y1="' + y + '" x2="' + (x + k * 9) + '" y2="' + (y + 30) + '"/>';
      return s + '<line x1="' + (x - 5) + '" y1="' + (y + 26) + '" x2="' + (x + 32) + '" y2="' + (y + 4) + '"/>';
    };
    return '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect width="160" height="120" fill="' + ground + '"/><g stroke="' + stroke + '" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".85">' + gate(18, 14) + gate(98, 74) + '</g></svg>';
  }
  function latticeTile(stroke, ground) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="' + ground + '"/><g stroke="' + stroke + '" stroke-width=".8" fill="none" opacity=".45"><path d="M0 60 L60 0 L120 60 L60 120 Z"/></g>' +
      '<svg x="44" y="44" width="32" height="32" viewBox="0 0 512 512" fill="' + stroke + '">' + monoInner + '</svg>' +
      '<g fill="' + stroke + '"><rect x="-3" y="-3" width="6" height="6" transform="rotate(45)"/><rect x="117" y="-3" width="6" height="6" transform="rotate(45 120 0)"/><rect x="-3" y="117" width="6" height="6" transform="rotate(45 0 120)"/><rect x="117" y="117" width="6" height="6" transform="rotate(45 120 120)"/></g></svg>';
  }
  var dataUrl = function (svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; };
  $('#patTally').style.backgroundImage = dataUrl(tallyTile('#C29A5B', '#141110'));
  $('#patLattice').style.backgroundImage = dataUrl(latticeTile('#C29A5B', '#141110'));
  $('#patLattice').style.backgroundSize = '120px';
  $('#patTally').style.backgroundSize = '160px';
  $('.gb-tally').style.backgroundImage = dataUrl(tallyTile('#EFE7DA', 'transparent').replace('<rect width="160" height="120" fill="transparent"/>', ''));
  function fullPattern(kind) {
    var tile = kind === 'tally' ? tallyTile('#C29A5B', '#141110') : latticeTile('#C29A5B', '#141110');
    var w = kind === 'tally' ? 160 : 120, h = kind === 'tally' ? 120 : 120;
    var inner = tile.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><title>XXVIII ' + kind + ' pattern</title><defs><pattern id="p" width="' + w + '" height="' + h + '" patternUnits="userSpaceOnUse">' + inner + '</pattern></defs><rect width="1200" height="1200" fill="url(#p)"/></svg>';
  }
  $$('[data-dl-pattern]').forEach(function (b) { b.addEventListener('click', function () { download('xxviii-pattern-' + b.dataset.dlPattern + '.svg', fullPattern(b.dataset.dlPattern), 'image/svg+xml'); }); });

  /* ---------- X · photography library: three series ---------- */
  var SRC = {
    plated: [['sm', 420], ['md', 800], ['lg', 1600]],
    cutout: [['sm', 600], ['lg', 1200]],
    block: [['sm', 640], ['md', 1200], ['lg', 1920]]
  };
  function srcset(kind, slug) {
    return SRC[kind].map(function (s) { return (kind === 'block' ? X.block(slug, s[0]) : X.img(slug, kind, s[0])) + ' ' + s[1] + 'w'; }).join(', ');
  }
  var EXTRA_CUT = { 'black-truffle-butter': 'black-truffle-butter' };   // clean cut-out arrived in media batch 2; the data still lists none
  var dishes = [];
  X.menu.forEach(function (sec) {
    var add = function (it) { dishes.push({ name: it.name, desc: it.desc || '', price: it.price, note: it.note, age: it.age, weight: it.weight, serves: it.serves, sec: sec.name, secId: sec.id, img: it.img, cut: it.cutout || EXTRA_CUT[it.img] || null }); };
    sec.items.forEach(add);
    if (sec.extras) sec.extras.items.forEach(function (it) { add(it); dishes[dishes.length - 1].extra = sec.extras.name; });
    if (sec.id === 'first-course') dishes.push({ name: 'Roasted Bone Marrow', desc: 'Alternate shot on a white plate.', price: 980, sec: sec.name, secId: sec.id, img: 'bone-marrow-white', cut: 'bone-marrow', alt: true });
  });
  var dishOf = function (slug) { return dishes.filter(function (d) { return d.img === slug || d.cut === slug; })[0] || { name: slug, sec: '' }; };
  var blockItems = (X.media && X.media.block || []).map(function (slug) { var d = dishOf(slug); return Object.assign({}, d, { slug: slug }); });
  $('#libFilters').innerHTML = '<button type="button" aria-pressed="true" data-f="all">All</button>' + X.menu.map(function (s) { return '<button type="button" aria-pressed="false" data-f="' + s.id + '">' + esc(s.name) + '</button>'; }).join('');
  var grid = $('#libGrid'), bgrid = $('#blockGrid'), more = $('#libMore');
  grid.innerHTML = dishes.map(function (d, i) {
    return '<li data-sec="' + d.secId + '"><button type="button" class="lib-tile" data-i="' + i + '" aria-label="' + esc(d.name + (d.alt ? ', alternate shot' : '') + ', ' + d.sec) + '">' +
      '<span class="lib-img"><img class="pl" src="' + X.img(d.img, 'plated', 'sm') + '" srcset="' + srcset('plated', d.img) + '" sizes="(max-width: 760px) 45vw, 18vw" alt="" width="420" height="420" loading="lazy" decoding="async">' +
      (d.cut ? '<img class="cut" data-src="' + X.img(d.cut, 'cutout', 'sm') + '" data-srcset="' + srcset('cutout', d.cut) + '" sizes="(max-width: 760px) 45vw, 18vw" alt="" width="600" height="420" decoding="async">' : '<span class="lib-nocut label">Plated only</span>') +
      '</span><span class="lib-name">' + esc(d.name) + (d.alt ? ' · alternate' : '') + '</span><span class="lib-sec label">' + esc(d.extra || d.sec) + '</span></button></li>';
  }).join('');
  bgrid.innerHTML = blockItems.map(function (d, i) {
    return '<li><button type="button" class="lib-tile" data-b="' + i + '" aria-label="' + esc(d.name) + ', on the butcher block">' +
      '<span class="lib-img lib-img-wide"><img src="' + X.block(d.slug, 'sm') + '" srcset="' + srcset('block', d.slug) + '" sizes="(max-width: 760px) 92vw, 30vw" alt="" width="640" height="360" loading="lazy" decoding="async"></span>' +
      '<span class="lib-name">' + esc(d.name) + '</span><span class="lib-sec label">' + esc(d.extra || d.sec) + '</span></button></li>';
  }).join('');
  var SERIES_NOTE = {
    dining: '<b>I · The dining room.</b> 48 plates on the walnut table, oxblood booths behind, one lamp. For the menu, the website and anything that should feel like sitting down. The backdrop repeats on purpose, so outside this library show no more than three side by side.',
    block: '<b>II · The butcher block.</b> Twelve cuts on scorched oak, with garlic, salt and herbs kept to the frame edge. For the butcher’s story, the ageing room and the steak pages. The dark top third stays empty for type.',
    cutout: '<b>III · Cut-outs.</b> Every plate on transparency. For the background kit, the menu book and motion. Always add a soft contact shadow and one pool of light. Never set two at the same scale side by side.'
  };
  var series = 'dining', cutsLoaded = false, capped = true, NARROW = window.matchMedia('(max-width: 760px)');
  function cap() {
    var g = series === 'block' ? bgrid : grid;
    $$('li', grid).concat($$('li', bgrid)).forEach(function (li) { li.classList.remove('over'); });
    var vis = $$('li', g).filter(function (li) { return !li.hidden; });
    var on = capped && NARROW.matches && vis.length > 12;
    if (on) vis.slice(12).forEach(function (li) { li.classList.add('over'); });
    more.hidden = !on; $('#libMoreN').textContent = vis.length;
    more.setAttribute('aria-expanded', !on);
  }
  function setSeries(s) {
    series = s;
    var isB = s === 'block';
    $('#seriesNote').innerHTML = SERIES_NOTE[s];
    grid.hidden = isB; bgrid.hidden = !isB; $('#libFilters').hidden = isB;
    more.setAttribute('aria-controls', isB ? 'blockGrid' : 'libGrid');
    if (s === 'cutout' && !cutsLoaded) { cutsLoaded = true; $$('img.cut', grid).forEach(function (im) { im.loading = 'lazy'; im.srcset = im.dataset.srcset; im.src = im.dataset.src; }); }
    grid.dataset.view = s === 'cutout' ? 'cutout' : 'plated';
    $('#libCount').textContent = isB ? blockItems.length : dishes.length;
    cap();
    if (window.__stReady) ScrollTrigger.refresh();
  }
  $$('.lib-view button').forEach(function (b, i, all) {
    b.tabIndex = i ? -1 : 0;
    b.addEventListener('click', function () {
      all.forEach(function (x) { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });
      setSeries(b.dataset.series);
    });
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]; n.focus(); n.click(); } });
  });
  more.addEventListener('click', function () {
    var g = series === 'block' ? bgrid : grid, first = $('li.over .lib-tile', g);
    capped = false; cap(); if (first) first.focus();
  });
  if (NARROW.addEventListener) NARROW.addEventListener('change', cap);
  $('#libFilters').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    $$('#libFilters button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    var f = b.dataset.f, items = $$('li', grid);
    var state = MOTION && window.Flip ? Flip.getState(items) : null;
    items.forEach(function (li) { li.hidden = !(f === 'all' || li.dataset.sec === f); });
    cap();
    if (state) Flip.from(state, { duration: .7, ease: 'power3.inOut', absolute: true, stagger: .012,
      onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out' }); },
      onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .92, duration: .3 }); },
      onComplete: function () { ScrollTrigger.refresh(); } });
  });
  setSeries('dining');

  /* lightbox (dining room, cut-outs and butcher block) */
  var lb = $('#lightbox'), lbI = 0, lbMode = 'dish', lbOpener = null;
  function visibleIdx() {
    if (lbMode === 'block') return blockItems.map(function (d, i) { return i; });
    return $$('li:not([hidden]) .lib-tile', grid).map(function (b) { return +b.dataset.i; });
  }
  function fillLb(i) {
    lbI = i;
    var isB = lbMode === 'block', d = isB ? blockItems[i] : dishes[i], first = $('#lbPlated');
    $('.lb-figs').classList.toggle('is-block', isB);
    if (isB) { first.srcset = srcset('block', d.slug); first.src = X.block(d.slug, 'lg'); first.alt = d.name + ', on the butcher block'; $('#lbFirstCap').textContent = 'Butcher block'; }
    else { first.srcset = srcset('plated', d.img); first.src = X.img(d.img, 'plated', 'lg'); first.alt = d.name + ', plated'; $('#lbFirstCap').textContent = 'Plated'; }
    var cutFig = $('.lb-cut');
    if (!isB && d.cut) { cutFig.hidden = false; $('#lbCut').srcset = srcset('cutout', d.cut); $('#lbCut').src = X.img(d.cut, 'cutout', 'lg'); $('#lbCut').alt = d.name + ', cut-out'; }
    else cutFig.hidden = true;
    $('#lbSec').textContent = d.extra ? d.sec + ' · ' + d.extra : d.sec;
    $('#lbName').textContent = d.name;
    $('#lbDesc').textContent = d.desc || '';
    $('#lbAge').innerHTML = d.age ? '<span class="age-tag">Aged <b>' + d.age + '</b> days</span>' + (d.weight ? ' <span class="label muted">' + esc(d.weight) + '</span>' : '') : '';
    $('#lbPrice').textContent = d.note && !d.price ? d.note : X.peso(d.price);
    $('#lbFiles').textContent = isB ? 'block/' + d.slug + '-lg.webp · video/' + d.slug + '-hd.mp4' : 'plated/' + d.img + '-lg.webp' + (d.cut ? ' · cutout/' + d.cut + '-lg.webp' : '');
    var vis = visibleIdx(), p = vis.indexOf(i);
    $('#lbPos').textContent = pad(p + 1) + ' / ' + pad(vis.length);
    if (MOTION) gsap.fromTo('.lb-figs img', { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: .8, ease: 'expo.out' });
  }
  function stepLb(dir) { var vis = visibleIdx(), p = vis.indexOf(lbI); fillLb(vis[(p + dir + vis.length) % vis.length]); }
  function openLb(t, mode, i) {
    lbOpener = t; lbMode = mode; fillLb(i);
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    if (window.__lenis) window.__lenis.stop();
    $('#lbClose').focus();
  }
  grid.addEventListener('click', function (e) { var t = e.target.closest('.lib-tile'); if (t) openLb(t, 'dish', +t.dataset.i); });
  bgrid.addEventListener('click', function (e) { var t = e.target.closest('.lib-tile'); if (t) openLb(t, 'block', +t.dataset.b); });
  $('#lbPrev').addEventListener('click', function () { stepLb(-1); });
  $('#lbNext').addEventListener('click', function () { stepLb(1); });
  $('#lbClose').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); stepLb(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); stepLb(-1); } });
  lb.addEventListener('close', function () { if (window.__lenis) window.__lenis.start(); if (lbOpener) lbOpener.focus(); });

  /* ---------- XI · motion library ---------- */
  var MOVES = { 'glide-left': 'Glide left', 'glide-right': 'Glide right', 'tilt-down': 'Tilt down', 'dolly-rise': 'Dolly and rise', 'orbit': 'Orbit', 'arc': 'Arc', 'push-in': 'Push in', 'overhead-descend': 'Overhead descend', 'crane': 'Crane' };
  var VID = (X.media && X.media.video) || {};
  var moveOf = function (s) { return MOVES[VID[s].move] || VID[s].move; };
  var lowData = !!(navigator.connection && navigator.connection.saveData) || window.matchMedia('(max-width: 767px)').matches;
  $('#moGrid').innerHTML = Object.keys(VID).map(function (s) {
    var d = dishOf(s);
    return '<li><button type="button" class="mo-tile" data-slug="' + s + '" aria-label="' + esc(d.name + ', ' + moveOf(s).toLowerCase() + '. Open in the player') + '">' +
      '<span class="mo-media"><img src="' + X.block(s, 'sm') + '" srcset="' + srcset('block', s) + '" sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 28vw" alt="" width="640" height="360" loading="lazy" decoding="async">' +
      '<video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" disablepictureinpicture></video>' +
      '<span class="mo-badge label" aria-hidden="true">' + esc(moveOf(s)) + '</span></span>' +
      '<span class="mo-cap"><span class="mo-name">' + esc(d.name) + '</span><span class="label mo-move">8 s loop · silent</span></span></button></li>';
  }).join('');
  var playingTiles = [];
  function stopTile(tile) {
    var v = $('video', tile); if (!v) return;
    v.pause(); tile.classList.remove('is-playing');
    playingTiles = playingTiles.filter(function (x) { return x !== tile; });
  }
  function playTile(tile) {
    if (RM) return;
    var v = $('video', tile);
    if (!v.getAttribute('src')) v.src = X.video(tile.dataset.slug, 'sd');
    playingTiles = playingTiles.filter(function (x) { return x !== tile; }); playingTiles.push(tile);
    while (playingTiles.length > 2) stopTile(playingTiles[0]);   // never more than two at once
    var pr = v.play();
    var on = function () { if (playingTiles.indexOf(tile) > -1) tile.classList.add('is-playing'); };
    if (pr && pr.then) pr.then(on, function () {}); else on();
  }
  $$('.mo-tile').forEach(function (t) {
    t.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') playTile(t); });
    t.addEventListener('pointerleave', function () { stopTile(t); });
    t.addEventListener('focus', function () { playTile(t); });
    t.addEventListener('blur', function () { stopTile(t); });
    t.addEventListener('click', function () { openPlayer(t.dataset.slug, t); });
  });
  if ('IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) stopTile(e.target); }); });
    $$('.mo-tile').forEach(function (t) { mio.observe(t); });
  }
  var player = $('#player'), plV = $('#plVideo'), plStage = $('#plStage'), plOpener = null;
  var CROPS = { 'off': '', '16x9': '16:9 · website, YouTube, email header', '4x5': '4:5 · Instagram and Facebook feed', '1x1': '1:1 · square post, Business Profile', '9x16': '9:16 · Stories and Reels, crop to the plate' };
  function syncToggle() { var p = !plV.paused; $('#plToggle').setAttribute('aria-label', p ? 'Pause' : 'Play'); $('#plToggle').classList.toggle('is-playing', p); }
  function openPlayer(slug, opener) {
    playingTiles.slice().forEach(stopTile);
    plOpener = opener;
    plV.poster = X.video(slug, 'poster');
    plV.src = X.video(slug, lowData ? 'sd' : 'hd');
    $('#plName').textContent = dishOf(slug).name;
    $('#plMove').textContent = moveOf(slug) + ' · 8 s loop · silent · ' + (lowData ? '1280 × 720' : '1920 × 1080');
    if (player.showModal) player.showModal(); else player.setAttribute('open', '');
    if (window.__lenis) window.__lenis.stop();
    if (!RM) { var pr = plV.play(); if (pr && pr.catch) pr.catch(function () {}); }
    syncToggle();
    $('#plClose').focus();
  }
  plV.addEventListener('play', syncToggle); plV.addEventListener('pause', syncToggle);
  $('#plToggle').addEventListener('click', function () { if (plV.paused) { var pr = plV.play(); if (pr && pr.catch) pr.catch(function () {}); } else plV.pause(); });
  $('#plClose').addEventListener('click', function () { player.close(); });
  player.addEventListener('click', function (e) { if (e.target === player) player.close(); });
  player.addEventListener('close', function () {
    plV.pause(); plV.removeAttribute('src'); plV.load();
    if (window.__lenis) window.__lenis.start();
    if (plOpener) plOpener.focus();
  });
  $$('.pl-crops button').forEach(function (b, i, all) {
    b.tabIndex = i ? -1 : 0;
    b.addEventListener('click', function () {
      all.forEach(function (x) { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });
      plStage.dataset.crop = b.dataset.crop; $('#plCropLbl').textContent = CROPS[b.dataset.crop];
    });
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]; n.focus(); n.click(); } });
  });

  /* ---------- XII · background kit ---------- */
  var GROUNDS = [
    ['oxblood-tufted-leather', 'Oxblood leather', 'Private dining, menu covers and the gift voucher.', 55, 'bone'],
    ['charcoal-slate-stone', 'Charcoal slate', 'The bar and the cocktails. The table tent.', 35, 'bone'],
    ['dark-polished-walnut-grain', 'Polished walnut', 'Reservations and the dining room.', 45, 'bone'],
    ['scorched-oak-butcher-block', 'Scorched oak block', 'The butcher, the ageing room, the menu’s steak pages.', 50, 'bone'],
    ['brushed-antique-brass', 'Brushed brass', 'Foil accents only: card backs, badges, plates.', 0, 'char'],
    ['dark-slate-herb-scatter-frame', 'Slate herb frame', 'Social still-life. Type in the empty centre.', 25, 'bone'],
    ['butcher-block-slate-wall-empty', 'Block and slate wall', 'Empty scene for a cut-out: product posts, menu headers.', 40, 'bone'],
    ['walnut-table-steakhouse-dining-room', 'Walnut table, dining room', 'Empty scene for reservations and the booking flow.', 45, 'bone'],
    ['overhead-butcher-block-herb-frame', 'Overhead block, herb frame', 'Flat-lay scene for a cut-out seen from above.', 40, 'bone'],
    ['dark-slate-counter-smoke', 'Slate counter, smoke', 'Empty scene for bar launches and Patience.', 30, 'bone']
  ];
  var TW = { texture: { sm: 800, lg: 1600 }, scene: { sm: 640, md: 1280, lg: 2400 } };
  var TEX = (X.media && X.media.texture) || {};
  function tset(slug) { var k = (TEX[slug] || {}).kind || 'texture'; return Object.keys(TW[k]).map(function (s) { return X.texture(slug, s) + ' ' + TW[k][s] + 'w'; }).join(', '); }
  $('#bgGrid').innerHTML = GROUNDS.map(function (g) {
    var k = (TEX[g[0]] || {}).kind || 'texture';
    return '<li class="bg-tile bg-' + k + '"><span class="bg-sw"><img src="' + X.texture(g[0], 'sm') + '" srcset="' + tset(g[0]) + '" sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 18vw" alt="" width="' + TW[k].sm + '" height="' + (k === 'scene' ? 360 : 800) + '" loading="lazy" decoding="async"></span>' +
      '<span class="bg-meta"><b>' + esc(g[1]) + '</b><span>' + esc(g[2]) + '</span><span class="label">' + (k === 'scene' ? 'Scene · 2400 × 1350' : 'Texture · 1600 × 1600') + '</span>' +
      '<a class="link label" href="' + X.texture(g[0], 'lg') + '" download="xxviii-' + g[0] + '.webp">Download</a></span></li>';
  }).join('');
  (function () {
    var img = $('#bgdImg'), veil = $('#bgdVeil'), stage = $('#bgdStage'), range = $('#bgdRange'), out = $('#bgdOut'), rec = $('#bgdRec'), cur = 0;
    var btns = GROUNDS.map(function (g, i) { return '<button type="button" role="radio" aria-checked="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + ' data-i="' + i + '"><i style="background-image:url(\'' + X.texture(g[0], 'sm') + '\')"></i>' + esc(g[1]) + '</button>'; });
    $('#bgdGrounds').innerHTML = btns.join('');
    function setVeil(v) { veil.style.opacity = v / 100; out.textContent = v; range.value = v; }
    function say(v) {
      var g = GROUNDS[cur];
      rec.innerHTML = g[4] === 'char' ? '<b>' + esc(g[1]) + ':</b> no overlay, charcoal type, card sizes only.' :
        '<b>' + esc(g[1]) + ':</b> house setting ' + g[3] + '%. ' + (v < g[3] - 10 ? 'Too light here: the headline starts to sink into the ground.' : v > g[3] + 25 ? 'Heavier than needed: the material disappears.' : 'Legible, and the material still shows.');
    }
    function setGround(i) {
      cur = i; var g = GROUNDS[i], k = (TEX[g[0]] || {}).kind || 'texture';
      img.srcset = tset(g[0]); img.src = X.texture(g[0], k === 'scene' ? 'md' : 'lg');
      stage.dataset.ink = g[4]; stage.dataset.kind = k;
      setVeil(g[3]); say(g[3]);
      $$('#bgdGrounds button').forEach(function (b, j) { b.setAttribute('aria-checked', j === i); b.tabIndex = j === i ? 0 : -1; });
    }
    $('#bgdGrounds').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setGround(+b.dataset.i); });
    $('#bgdGrounds').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault(); var n = (cur + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + GROUNDS.length) % GROUNDS.length;
      setGround(n); $$('#bgdGrounds button')[n].focus();
    });
    range.addEventListener('input', function () { setVeil(+range.value); say(+range.value); });
    $('#bgdAuto').addEventListener('click', function () { setVeil(GROUNDS[cur][3]); say(GROUNDS[cur][3]); });
    setGround(0);
  })();

  /* ---------- XIII · icons ---------- */
  var ICONS = {
    'Steak': '<path d="M4.4 10.2C5.3 6.7 8.7 4.6 12.8 4.8c4.3.2 7.2 2.8 6.8 6.4-.4 3.9-3.9 7.6-8.7 8.1-4.2.4-7.2-1.8-7.4-5-.1-1.5.4-2.8.9-4.1Z"/><path d="M8 11.4c1.7-1.6 4.5-2.1 6.9-1"/><path d="M9.4 14.9c1.6.6 3.4.4 4.9-.5"/>',
    'Bone-in steak': '<path d="M3.6 14c.5-3.4 3.4-5.8 6.8-5.7 3.3.1 5.6 2.4 5.4 5.4-.3 3.4-3.4 6.2-7 6.3-3.4.1-5.7-2.4-5.2-6Z"/><circle cx="9.6" cy="14.2" r="1.8"/><path d="M13.6 9.4l4.8-4.8"/><path d="M15.6 11.3l4.6-4.6"/><path d="M18.4 4.6a1.5 1.5 0 1 1 1.8 2.1"/>',
    'Knife': '<path d="M20.6 3.4c-1 6.4-4.4 11-9.6 14.2l-2.6-2.6Z"/><path d="M8.4 15 3.6 19.8a1.7 1.7 0 0 0 2.4 2.4L11 17.6"/><path d="M6.5 18.3h.01"/>',
    'Fork and knife': '<path d="M6 3v5a2.2 2.2 0 0 0 4.4 0V3"/><path d="M8.2 3v18"/><path d="M17.5 21V3c-2.2 1.6-3.4 4.6-3.4 8.6 0 1.5 1 2.6 3.4 2.6"/>',
    'Rocks glass': '<path d="M5 6.5h14l-1.5 12.7a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3Z"/><path d="M5.6 11.4h12.8"/><rect x="9" y="12.6" width="5.6" height="5.6" rx=".6" transform="rotate(-9 11.8 15.4)"/>',
    'Ice cube': '<path d="M12 3.5 19.5 7.6v8.8L12 20.5l-7.5-4.1V7.6Z"/><path d="M4.5 7.6 12 11.7l7.5-4.1M12 11.7v8.8"/><path d="M7.2 10.6v2.6"/>',
    'Clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.4 2.1"/>',
    'Calendar': '<rect x="3.5" y="5" width="17" height="15.5" rx="1"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>',
    'Ageing tag': '<path d="M8.6 5.5h6.8l2.6 2.6v12.4H6V8.1Z"/><circle cx="12" cy="8.6" r="1.2"/><path d="M12 7.4C12 4.4 14.2 2.8 17 3.4"/><path d="M9 13h6M9 16h6"/>',
    'Flame': '<path d="M12 21c-3.6 0-6.2-2.6-6.2-6 0-3.2 2.1-5.1 3.4-7.3.6 1.6 1.4 2.6 2.4 3.1C11.5 7.6 12.6 4.8 15 3c-.3 3 1.2 4.6 2.4 6.4.9 1.4 1.4 3 1.4 5.2 0 3.6-2.9 6.4-6.8 6.4Z"/><path d="M12 21c-1.6 0-2.8-1.2-2.8-2.8 0-1.8 1.4-2.6 2.3-4 .9 1.3 3.3 2.2 3.3 4.2 0 1.5-1.2 2.6-2.8 2.6Z"/>',
    'Thermometer': '<circle cx="9" cy="9" r="5.6"/><path d="M9 9l2.6-2.6"/><path d="M13 13l7.5 7.5"/><path d="M9 4.6v1.2M4.6 9h1.2M13.4 9h-1.2"/>',
    'Salt': '<path d="M4 12.5h16c0 4-3.6 7-8 7s-8-3-8-7Z"/><path d="M9 21h6"/><path d="M9.2 6.6l1.3-1.3 1.3 1.3-1.3 1.3Z"/><path d="M13.6 8.8l1.2-1.2 1.2 1.2-1.2 1.2Z"/><path d="M11.8 3.3l1-1 1 1-1 1Z"/>',
    'Pin': '<path d="M12 21s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.8" r="2.4"/>',
    'Phone': '<path d="M6.6 3.5h2.9l1.5 4.2-2.1 1.4a11 11 0 0 0 6 6l1.4-2.1 4.2 1.5v2.9a2 2 0 0 1-2.1 2C10.6 19 5 13.4 4.5 5.6a2 2 0 0 1 2.1-2.1Z"/>',
    'Gift': '<rect x="3.5" y="8" width="17" height="4" rx=".5"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8c-1.5-3.5-5-4-5-1.8C7 7.6 9.5 8 12 8Zm0 0c1.5-3.5 5-4 5-1.8 0 1.4-2.5 1.8-5 1.8Z"/>',
    'Wine glass': '<path d="M7.4 3h9.2l.3 4.6A4.9 4.9 0 0 1 12 12.8a4.9 4.9 0 0 1-4.9-5.2Z"/><path d="M12 12.8V20.5M8.5 20.5h7"/><path d="M7.3 7.2h9.4"/>',
    'People': '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2"/><circle cx="16.8" cy="9" r="2.6"/><path d="M15.6 14.1c.4-.1.8-.2 1.2-.2 2.6 0 4.7 2.2 4.7 5.3"/>',
    'Honesty': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r=".8"/>'
  };
  var withLen = function (s) { return s.replace(/<(path|circle|rect|line)/g, '<$1 pathLength="1"'); };
  $('#iconGrid').innerHTML = Object.keys(ICONS).map(function (k) {
    return '<li><button type="button" class="ic-btn" data-ic="' + esc(k) + '" aria-label="Copy the ' + esc(k.toLowerCase()) + ' icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + withLen(ICONS[k]) + '</svg><span>' + esc(k) + '</span></button></li>';
  }).join('');
  $('#iconGrid').addEventListener('click', function (e) {
    var b = e.target.closest('.ic-btn'); if (!b) return;
    copy('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#C29A5B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS[b.dataset.ic] + '</svg>', b.dataset.ic + ' icon');
  });
  (function () {
    var g = '';
    for (var i = 0; i <= 24; i++) g += '<line class="g" x1="' + i + '" y1="0" x2="' + i + '" y2="24"/><line class="g" x1="0" y1="' + i + '" x2="24" y2="' + i + '"/>';
    $('#icAnatomy').innerHTML = g + '<rect class="g-safe" x="2" y="2" width="20" height="20"/><g class="ic-p">' + ICONS['Rocks glass'] + '</g>';
  })();

  /* ---------- XII · ageing room ---------- */
  var cuts = [];
  X.menu.forEach(function (s) { if (s.id === 'ageing-room' || s.id === 'long-wait') s.items.forEach(function (it) { cuts.push(it); }); });
  var doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  cuts.forEach(function (c, i) { c._day = ((doy + i * 6) % c.age) + 1; });
  $('#arBody').innerHTML = cuts.map(function (c) {
    return '<tr><td class="ar-cut">' + esc(c.name) + '<small>' + esc(c.weight) + '</small></td><td><span class="ar-day" data-day="' + c._day + '">' + pad(c._day) + '</span><span class="ar-prog"><i style="transform:scaleX(' + (c._day / c.age).toFixed(3) + ')"></i></span></td><td class="ar-ready">Day ' + c.age + '</td></tr>';
  }).join('');
  $('#arTags').innerHTML = cuts.slice(0, 5).map(function (c, i) {
    var short = c.name.replace(/^The /, '').replace(' for Two', '');
    return '<div class="ar-hang" style="--len:' + (50 + (i % 3) * 26) + 'px"><div class="ar-tag"><b>' + pad(c._day) + '</b><small>' + esc(short) + '</small></div></div>';
  }).join('');
  (function clock() {
    var el = $('#arClock');
    var f = function () {
      try { el.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Manila' }).format(new Date()) + ' · Manila'; }
      catch (e) { el.textContent = new Date().toTimeString().slice(0, 8); }
    };
    f(); setInterval(f, 1000);
  })();

  /* steak card */
  var cardFor = function (d) { return (B.steakCardFor ? B.steakCardFor(d) : B.steakCard).map(function (l) { return '<span>' + esc(l) + '</span>'; }).join(''); };
  $$('.sc-lines').forEach(function (el) { el.innerHTML = cardFor(el.classList.contains('sc-lines-b') ? 35 : 28); });
  (function () {
    var byAge = {};
    cuts.forEach(function (c) { (byAge[c.age] = byAge[c.age] || []).push(c.name); });
    $('#scAges').innerHTML = [21, 28, 45].filter(function (d) { return byAge[d]; }).map(function (d) {
      return '<li><div class="mini-steakcard sc-age"><img src="../assets/logo/xxviii-monogram-brass.svg" alt="" width="512" height="512"><p class="sc-lines">' + cardFor(d) + '</p></div>' +
        '<p class="label">Day ' + d + ' card</p><p class="sc-for">' + esc(byAge[d].join(', ')) + '</p></li>';
    }).join('');
  })();
  var sc = $('#steakCard'), scBtn = $('#scFlip');
  function flipSc() { var f = sc.classList.toggle('is-flipped'); scBtn.setAttribute('aria-pressed', f); }
  sc.addEventListener('click', flipSc); scBtn.addEventListener('click', flipSc);
  sc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipSc(); } });
  $$('.bc').forEach(function (c) {
    c.addEventListener('click', function () { c.classList.toggle('is-flipped'); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('is-flipped'); } });
  });

  /* tables */
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  $('#tablesRow').innerHTML = ROMAN.map(function (r) { return '<li><span class="t-strap" aria-hidden="true"></span><span class="t-tag">' + r + '</span></li>'; }).join('');

  /* ---------- XIII · menu ---------- */
  $('#wasNow').innerHTML = X.menu.map(function (s) {
    return '<li><span class="wn-was">' + esc(s.was) + '</span><span class="wn-arrow" aria-hidden="true"></span><span class="wn-now">' + esc(s.name) + (s.added ? '<span class="wn-new">Added</span>' : '') + '</span></li>';
  }).join('');
  (function () {
    var s = X.menu.filter(function (m) { return m.id === 'ageing-room'; })[0];
    $('#menuPage').innerHTML = '<header class="mp-head"><img src="../assets/logo/xxviii-monogram-brass.svg" alt="" width="512" height="512"><div class="rule-diamond" aria-hidden="true"><i></i></div><h4>' + esc(s.name) + '</h4><p>' + esc(s.line) + '</p></header>' +
      s.items.map(function (it) {
        return '<div class="mp-item"><div class="mp-row"><span class="mp-name">' + esc(it.name) + '</span><span class="price">' + X.peso(it.price) + '</span></div><p class="mp-desc">' + esc(it.desc) + '</p><div class="mp-meta"><span class="age-tag">Aged <b>' + it.age + '</b> days</span><span class="label">' + esc(it.weight) + '</span>' + (it.signature ? '<span class="label mp-sig">House signature</span>' : '') + '</div></div>';
      }).join('');
  })();

  /* receipt */
  (function () {
    var find = function (sec, i) { return X.menu.filter(function (m) { return m.id === sec; })[0].items[i]; };
    var lines = [[find('ageing-room', 0).name, find('ageing-room', 0).price], [X.drinks[0].name, X.drinks[0].price], [find('alongside', 0).name, find('alongside', 0).price], [find('last-course', 1).name, find('last-course', 1).price]];
    var total = lines.reduce(function (a, l) { return a + l[1]; }, 0);
    $('#receipt').innerHTML = '<div class="rc-row"><span>Table XII</span><span>2 guests</span></div><div class="rc-rule"></div>' +
      lines.map(function (l) { return '<div class="rc-row"><span>' + esc(l[0]) + '</span><span>' + X.peso(l[1]) + '</span></div>'; }).join('') +
      '<div class="rc-rule"></div><div class="rc-row rc-tot"><span>Total</span><span>' + X.peso(total) + '</span></div>' +
      '<div class="rc-row rc-ph"><span>VAT incl.</span><span>[to confirm]</span></div><div class="rc-row rc-ph"><span>Service charge</span><span>[to confirm]</span></div><div class="rc-row rc-ph"><span>OR no.</span><span>[0000]</span></div><div class="rc-rule"></div>' +
      '<div class="rc-foot"><img src="../assets/logo/xxviii-monogram-char.svg" alt="" width="512" height="512"><p>Thank you for taking your time.</p><p class="rc-small">Worth the wait.</p><p class="rc-small">' + esc(B.contact.web) + '</p></div>';
  })();

  /* host board */
  $('#hostList').innerHTML = cuts.slice(0, 6).map(function (c) { return '<li><b>' + esc(c.name) + '</b><span>' + c.age + ' days</span></li>'; }).join('');

  /* IG grid */
  (function () {
    var t = function (cls, html) { return '<li class="' + cls + '">' + html + '</li>'; };
    var ph = function (slug) { return '<li><img src="' + X.img(slug, 'plated', 'sm') + '" srcset="' + srcset('plated', slug) + '" sizes="96px" alt="" width="420" height="420" loading="lazy" decoding="async"></li>'; };
    $('#igGrid').innerHTML = [ph('cowboy-cut'), t('igt igt-ox', esc(B.taglines[0])), ph('oysters-half-shell'),
      t('igt igt-day', '<span>Day</span><b>21</b><span>The ageing room</span>'), ph('creme-brulee'), t('igt igt-seal', '<img src="../assets/logo/xxviii-seal-brass.svg" alt="" width="600" height="600">'),
      ph('steak-tartare'), t('igt', esc(B.taglines[1])), ph('french-onion-soup-gratinee')].join('');
  })();

  /* FB safe zones */
  $('#fbSafe').addEventListener('change', function () { $('#fbFrame').classList.toggle('safe-on', this.checked); });

  /* ---------- XVII · downloads ---------- */
  var LOGOS = [];
  ['primary', 'horizontal', 'wordmark', 'monogram', 'seal'].forEach(function (k) { ['brass', 'bone', 'char', 'ox'].forEach(function (c) { LOGOS.push('xxviii-' + k + '-' + c + '.svg'); }); });
  LOGOS.push('xxviii-primary-current.svg', 'xxviii-monogram-avatar.svg', 'xxviii-seal-avatar.svg', 'xxviii-tag-brass.svg', 'xxviii-tag-ox.svg', 'favicon.svg');
  var groundFor = function (f) { return /-(char|ox|current)\.svg$/.test(f) ? '#efe7da' : /-bone\.svg$/.test(f) ? '#4a1216' : '#141110'; };
  $('#logoCount').textContent = LOGOS.length;
  $('#dlLogos').innerHTML = LOGOS.map(function (f) {
    return '<li><a class="dl-logo" href="../assets/logo/' + f + '" download="' + f + '"><span class="dl-th" style="--g:' + groundFor(f) + '"><img src="../assets/logo/' + f + '" alt="" loading="lazy" width="120" height="60"' + (/current/.test(f) ? ' style="color:#141110"' : '') + '></span><span>' + f + '</span></a></li>';
  }).join('');
  function tokens() {
    var T = {
      colour: {}, font: { display: B.fonts.display.family, label: B.fonts.label.family, body: B.fonts.body.family },
      type: { hero: 'clamp(3.4rem, 1.2rem + 8.4vw, 9.5rem)', h1: 'clamp(2.8rem, 1.4rem + 5vw, 6rem)', h2: 'clamp(2.2rem, 1.3rem + 3.2vw, 4.2rem)', h3: 'clamp(1.45rem, 1.1rem + 1.1vw, 2rem)', body: '1.0625rem', small: '.875rem', label: '.8125rem', labelTracking: '.26em' },
      shape: { radius: '2px' }, motion: { easeOut: 'cubic-bezier(.16, 1, .3, 1)', easeInOut: 'cubic-bezier(.65, 0, .35, 1)', reveal: '0.8s to 1.4s', ambient: '2s to 4s' },
      brassGradient: 'linear-gradient(100deg, #8a6a3a 0%, #c29a5b 28%, #ecd3a2 50%, #c29a5b 72%, #8a6a3a 100%)',
      proportion: { charcoal: 70, smoke: 10, oxblood: 8, brass: 7, bone: 5 }
    };
    B.palette.forEach(function (p) { T.colour[p.id] = { name: p.name, hex: p.hex, rgb: hexRgb(p.hex), cmyk: cmyk(hexRgb(p.hex)), role: p.role }; });
    return T;
  }
  $$('[data-blob]').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = b.dataset.blob, T = tokens();
      if (n === 'tokens.json') return download(n, JSON.stringify(T, null, 2), 'application/json');
      if (n === 'brand-facts.json') return download(n, JSON.stringify(X, function (k, v) { return typeof v === 'function' ? undefined : v; }, 2), 'application/json');
      var css = '/* XXVIII · Twenty-Eight Steakhouse design tokens, Edition I */\n:root {\n';
      Object.keys(T.colour).forEach(function (k) { css += '  --' + k + ': ' + T.colour[k].hex + ';  /* ' + T.colour[k].name + ' */\n'; });
      css += '  --brass-grad: ' + T.brassGradient + ';\n';
      css += "  --f-display: '" + T.font.display + "', 'Times New Roman', serif;\n  --f-label: '" + T.font.label + "', 'Arial Narrow', sans-serif;\n  --f-body: '" + T.font.body + "', system-ui, sans-serif;\n";
      Object.keys(T.type).forEach(function (k) { css += '  --t-' + k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }) + ': ' + T.type[k] + ';\n'; });
      css += '  --r: 2px;\n  --ease-out: ' + T.motion.easeOut + ';\n  --ease-io: ' + T.motion.easeInOut + ';\n}\n';
      download(n, css, 'text/css');
    });
  });
  $('#placeholders').innerHTML = B.placeholders.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');

  /* ---------- rail: scroll-spy + reading day ---------- */
  var railLinks = $$('#railList a'), railDay = $('#railDay'), railList = $('#railList');
  var secs = railLinks.map(function (a) { return doc.getElementById(a.getAttribute('href').slice(1)); });
  function setActive(id) {
    railLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (on && railList.scrollWidth > railList.clientWidth + 4) {
        var left = a.offsetLeft - railList.clientWidth / 2 + a.offsetWidth / 2;
        railList.scrollTo({ left: left, behavior: RM ? 'auto' : 'smooth' });
      }
    });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); }); }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(function (s) { if (s) spy.observe(s); });
  }
  var lastDay = -1;
  function onScroll() {
    var max = doc.documentElement.scrollHeight - innerHeight;
    var d = Math.max(1, Math.min(28, Math.round(1 + 27 * (scrollY / Math.max(1, max)))));
    if (d !== lastDay) { lastDay = d; railDay.textContent = pad(d); }
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- facade: the sign lights once ---------- */
  var facade = $('#facade');
  if (MOTION && 'IntersectionObserver' in window) {
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { facade.classList.add('lit', 'flicker'); fio.disconnect(); } });
    }, { threshold: .45 });
    fio.observe(facade);
  } else facade.classList.add('lit');

  /* ---------- motion ---------- */
  if (!MOTION) {
    beatOdo.set(28); setBeat(28);
    $$('.ar-day').forEach(function (d) { d.textContent = pad(+d.dataset.day); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger); window.__stReady = true;
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.Flip) gsap.registerPlugin(Flip);

  /* smooth scroll */
  if (window.Lenis) {
    var lenis = new Lenis({ lerp: .09, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = doc.querySelector(id); if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: innerWidth <= 1024 ? -56 : 0, duration: 1.6 });
      history.replaceState(null, '', id);
    });
  }

  /* cover */
  (function () {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.cover-top > *', { opacity: 0, y: 12, duration: 1, stagger: .06 })
      .from('.cover-mark svg', { opacity: 0, y: 40, filter: 'blur(14px)', duration: 1.8 }, .1)
      .from('.cover-rule', { scaleX: 0, duration: 1.6, ease: 'power3.inOut' }, .5)
      .from('.cover-plate', { opacity: 0, y: 80, duration: 1.8 }, .7)
      .from('.cover-name, .cover-day', { opacity: 0, y: 16, duration: 1, stagger: .1 }, 1.1)
      .from('.cover-cue', { opacity: 0, duration: 1 }, 1.4);
    gsap.to('#sweep', { attr: { x1: 700, x2: 2100 }, duration: 3.2, ease: 'power2.inOut', repeat: -1, repeatDelay: 2.4, delay: .9 });
    var floatT = gsap.to('.cover-plate .float', { y: -12, rotation: 1.2, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    ScrollTrigger.create({ trigger: '#cover', start: 'top top', end: 'bottom top', onToggle: function (s) { s.isActive ? floatT.play() : floatT.pause(); } });
    if (matchMedia('(pointer: fine)').matches) {
      var plate = $('.cover-plate');
      gsap.set(plate, { transformPerspective: 900 });
      var rx = gsap.quickTo(plate, 'rotationX', { duration: 1.2, ease: 'power3.out' }), ry = gsap.quickTo(plate, 'rotationY', { duration: 1.2, ease: 'power3.out' });
      $('#cover').addEventListener('pointermove', function (e) { rx((e.clientY / innerHeight - .5) * -8); ry((e.clientX / innerWidth - .5) * 8); });
    }
    gsap.to('.cover-mark', { yPercent: -18, opacity: .35, ease: 'none', scrollTrigger: { trigger: '#cover', start: 'top top', end: 'bottom top', scrub: true } });
  })();

  /* chapter heads: numeral settles, title lines rise from a mask */
  $$('.ch-head').forEach(function (h) {
    var title = $('h2', h);
    var st = { trigger: h, start: 'top 86%', once: true };
    gsap.from($('.ch-num', h), { opacity: 0, x: -24, duration: 1.4, ease: 'expo.out', scrollTrigger: st });
    if (window.SplitText) {
      SplitText.create(title, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: function (self) {
        return gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
      } });
    }
    gsap.from($('.ch-intro', h), { opacity: 0, y: 14, duration: 1, delay: .25, ease: 'power3.out', scrollTrigger: st });
  });

  /* story lines */
  if (window.SplitText) $$('.story-line').forEach(function (p) {
    SplitText.create(p, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: function (self) {
      return gsap.from(self.lines, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: p, start: 'top 82%', once: true } });
    } });
  });

  /* beats: pinned day counter on desktop, a single count on smaller screens */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 1025px)', function () {
    var beats = $('#beats'); beats.classList.add('is-live');
    beatOdo.set(1); setBeat(1); gsap.set('#beatBar', { scaleX: 0 });
    ScrollTrigger.create({
      trigger: beats, start: 'top top', end: '+=170%', pin: true, scrub: .6,
      onUpdate: function (s) { var v = 1 + 27 * s.progress; beatOdo.set(v); setBeat(v); gsap.set('#beatBar', { scaleX: s.progress }); }
    });
    return function () { beats.classList.remove('is-live'); beatOdo.set(28); };
  });
  mm.add('(max-width: 1024px)', function () {
    beatOdo.set(1); gsap.set('#beatBar', { scaleX: 0 });
    ScrollTrigger.create({ trigger: '#beats', start: 'top 75%', once: true, onEnter: function () { beatOdo.to(28, 3.2); gsap.to('#beatBar', { scaleX: 1, duration: 3.2, ease: 'power3.inOut' }); } });
    return function () { beatOdo.set(28); };
  });

  /* image wipes */
  $$('.ph-hero img, .op > img, .sm-social img, .pd img').forEach(function (img) {
    gsap.fromTo(img, { clipPath: 'inset(14% 10% 14% 10%)', scale: 1.06 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: img, start: 'top 88%', once: true } });
  });

  /* batched rises (different groups, different weights) */
  function batch(sel, from, opts) {
    var els = $$(sel); if (!els.length) return;
    gsap.set(els, from);
    ScrollTrigger.batch(els, { start: 'top 90%', once: true, onEnter: function (b) {
      var o = Object.assign({ opacity: 1, y: 0, x: 0, rotation: 0, scale: 1, duration: 1.1, ease: 'power3.out', stagger: .08, overwrite: true }, opts || {});
      o.stagger = Math.min(o.stagger, .6 / b.length);   // a long jump can queue dozens of items: keep the whole batch under ~0.6 s
      gsap.to(b, o);
    } });
  }
  batch('.mo-grid li, .bg-tile, .mo-list li, .sc-ages li, .lk, .sw, .misuse-grid li, .dd, .el, .pair, .sample, .pat, .sg, .ph-rules li, .tone-words li, .say-list li, .clear-list li, .wasnow-list li, .mr-list li, .dl-list li, .dl-logos li, .minsize figure', { opacity: 0, y: 36 });
  batch('.spec', { opacity: 0, y: 60 }, { duration: 1.3 });
  batch('.values li', { opacity: 0, x: -40 }, { duration: 1.3, ease: 'expo.out' });
  batch('.ic-grid-list li', { opacity: 0, scale: .9 }, { stagger: .035, duration: .8 });
  /* the desk: mock-ups keep their CSS pose (3D flips use CSS transforms), so the stage itself rises */
  batch('.pr-art', { opacity: 0, y: 70 }, { duration: 1.4, ease: 'expo.out', stagger: .1 });

  /* proportion bar + banned words strike */
  gsap.from('#propbar span', { scaleX: 0, duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '#propbar', start: 'top 85%', once: true } });
  gsap.from('.banned-list li', { '--s': 0, opacity: 0, y: 10, duration: .8, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '.banned-list', start: 'top 85%', once: true } });
  gsap.from('.contrast-table tbody tr', { opacity: 0, y: 20, duration: .9, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '#contrast', start: 'top 85%', once: true } });

  /* diamond rules + tally draw */
  $$('.rule-diamond.draw, .cover-rule').forEach(function (r) {
    if (r.classList.contains('cover-rule')) return;
    gsap.from(r, { scaleX: 0, duration: 1.6, ease: 'power3.inOut', scrollTrigger: { trigger: r, start: 'top 90%', once: true } });
  });
  var tallyLines = $$('#tally28 line');
  tallyLines.forEach(function (l) { l.setAttribute('pathLength', 1); });
  gsap.fromTo(tallyLines, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .35, ease: 'power2.out', stagger: .09, scrollTrigger: { trigger: '#tally28', start: 'top 85%', once: true } });

  /* swinging tags (paused off-screen) */
  function swing(els, deg, dur) {
    $$(els).forEach(function (el, i) {
      gsap.set(el, { rotation: -deg });
      var t = gsap.to(el, { rotation: deg, duration: dur + (i % 3) * .4, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true, delay: i * .15 });
      ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? t.play() : t.pause(); } });
    });
  }
  swing('.swing', 3, 2.8);
  swing('.ar-hang', 2.2, 3.2);
  swing('.t-tag', 4, 2.6);

  /* ageing board: days count up when the board comes into view */
  ScrollTrigger.create({ trigger: '.ar-board', start: 'top 80%', once: true, onEnter: function () {
    $$('.ar-day').forEach(function (d, i) {
      var o = { v: 1 }, target = +d.dataset.day;
      gsap.to(o, { v: target, duration: 2.2, delay: i * .08, ease: 'power3.out', onUpdate: function () { d.textContent = pad(Math.round(o.v)); } });
    });
    gsap.from('.ar-prog i', { scaleX: 0, duration: 2.2, ease: 'power3.out', stagger: .08 });
  } });
  $$('.ar-day').forEach(function (d) { d.textContent = '01'; });

  /* taglines start rotating once visible */
  runTl();

  /* refresh once images settle */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); scaleMeta(); });
})();
