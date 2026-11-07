/* XXVIII showcase page. Classic script; reads window.XXVIII + window.SHOWCASE. */
(function () {
  'use strict';
  var X = window.XXVIII, S = window.SHOWCASE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAS_G = !!window.gsap;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight'];
  var lenis = null;

  /* ---------- toast + copy ---------- */
  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2000); }
  function copy(text, btn) {
    function ok() { toast('Copied'); if (btn) { var l = btn.textContent; btn.classList.add('done'); btn.textContent = 'Copied'; setTimeout(function () { btn.classList.remove('done'); btn.textContent = l; }, 1600); } }
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'; (btn && btn.closest('dialog') || document.body).appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Select the text to copy it'); } ta.remove(); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy-from]'); if (!b) return;
    copy($('#' + b.getAttribute('data-copy-from')).textContent, b);
  });

  /* ---------- odometer (hero) ---------- */
  var odo = $('#heroOdo'), tensS, unitsS;
  (function buildOdo() {
    var cols = $$('.odo-strip', odo); tensS = cols[0]; unitsS = cols[1];
    var h = ''; for (var i = 0; i < 30; i++) h += (i % 10) + (i < 29 ? '<br>' : ''); unitsS.innerHTML = h;
  })();
  function setDay(v) { /* v: 1..28 float */
    var tens = Math.floor(v / 10) + Math.max(0, (v % 10) - 9);
    tensS.style.setProperty('--y', (-tens) + 'em');
    unitsS.style.setProperty('--y', (-v) + 'em');
    var d = Math.round(v);
    $('#heroDayWord').textContent = WORDS[d] || d;
    $('#heroBar').style.transform = 'scaleX(' + (v / 28) + ')';
  }
  odo.setAttribute('aria-hidden', 'true');
  setDay(28);

  /* ---------- 2 · calendar ---------- */
  var CHS = Object.keys(S.CH);
  $('#calKey').innerHTML = CHS.map(function (k) { return '<li><span class="mk" data-ch="' + k + '"></span>' + S.CH[k].name + '</li>'; }).join('');
  $('#calGrid').innerHTML = S.days.map(function (d, i) {
    return '<li class="cal-tile' + (d.day === 28 ? ' last' : '') + '"><button class="cal-btn" type="button" data-i="' + i + '" aria-haspopup="dialog" aria-label="Day ' + pad(d.day) + ', ' + S.CH[d.ch].name + ': ' + esc(d.hook) + '">' +
      '<span class="cal-day"><b>' + pad(d.day) + '</b><span class="label">' + (d.day === 28 ? 'Opening night' : 'Day') + '</span></span>' +
      '<span class="cal-ch"><span class="mk" data-ch="' + d.ch + '"></span>' + esc(d.fmt) + '</span>' +
      '<span class="cal-hook">' + esc(d.hook) + '</span></button></li>';
  }).join('');

  var dlg = $('#dayPanel'), dlgI = 0;
  function webImg(id, cls) { return '<img class="' + (cls || '') + '" src="exports/web/' + id + '.webp" alt="" decoding="async">'; }
  function miniPreview(key) {
    if (/^(post|story|ad-feed|ad-story)/.test(key)) return webImg(key, /story/.test(key) ? 'tall' : '');
    if (/^email/.test(key)) return '<div style="width:100%;max-width:380px;height:62vh;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.5)">' + webImg(key) + '</div>';
    if (key === 'reel') return '<div class="mini"><span class="label">Reel storyboard · 6 frames · 20 s</span><p class="mini-h">The first cuts go in today.</p>' + S.reel.map(function (r, i) { return '<p class="small muted">' + (i + 1) + ' · ' + r.t + ' · ' + esc(r.text) + '</p>'; }).join('') + '</div>';
    if (key === 'pr') return '<div class="mini" style="background:var(--bone);color:var(--char)"><img src="../assets/logo/xxviii-seal-char.svg" alt="" width="70" height="70" style="margin:0 auto 14px"><p class="mini-h" style="text-align:center">Before the doors open, taste the first cuts.</p><p class="small" style="text-align:center">For [Name] · [Publication]<br>Day 26 · 7:00 PM</p></div>';
    if (key === 'gbp') return '<div class="mini"><span class="label">Business Profile post</span><img src="exports/web/post-01.webp" alt="" style="margin-bottom:12px"><p class="mini-h">Opening soon. Every steak lists its age.</p><p class="small muted">Button: Reserve</p></div>';
    if (key === 'search') return '<div class="mini" style="background:var(--bone);color:#2b2523"><p class="small" style="font-weight:700">Sponsored</p><p class="small">xxviii.example › reserve</p><p class="mini-h" style="color:var(--ox-deep);font-family:var(--f-body);font-size:1.15rem">' + esc(S.search.headlines[0] + ' | ' + S.search.headlines[2] + ' | ' + S.search.headlines[4]) + '</p><p class="small">' + esc(S.search.descriptions[0]) + '</p></div>';
    if (key === 'sms') return '<div class="mini"><span class="label">SMS · The Ageing List</span><p class="bubble">' + esc(S.sms[2].text) + '</p></div>';
    return '';
  }
  function openDay(i) {
    dlgI = (i + 28) % 28; var d = S.days[dlgI];
    $('#dpDay').textContent = 'Day ' + pad(d.day) + (d.day === 28 ? ' · Opening night' : '');
    $('#dpCh').textContent = S.CH[d.ch].name;
    $('#dp-title').textContent = d.hook;
    $('#dpFmt').textContent = d.fmt;
    $('#dpCap').textContent = d.cap || '';
    $('#dpPrev').innerHTML = miniPreview(d.prev);
    if (!dlg.open) { dlg.showModal(); if (lenis) lenis.stop(); }
  }
  $('#calGrid').addEventListener('click', function (e) { var b = e.target.closest('.cal-btn'); if (b) openDay(+b.dataset.i); });
  $('#dpBack').onclick = function () { openDay(dlgI - 1); };
  $('#dpNext').onclick = function () { openDay(dlgI + 1); };
  $('#dpClose').onclick = function () { dlg.close(); };
  dlg.addEventListener('close', function () { if (lenis) lenis.start(); var b = $('.cal-btn[data-i="' + dlgI + '"]'); if (b) b.focus(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.target.closest('.cap-text')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); openDay(dlgI + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); openDay(dlgI - 1); }
  });

  /* ---------- 3 · posts ---------- */
  var cur = 0, plat = 'ig';
  $('#pfGrid').innerHTML = S.posts.map(function (p, i) {
    return '<button class="pf-cell" type="button" role="listitem" data-i="' + i + '" aria-label="Post ' + pad(i + 1) + ': ' + esc(p.title) + '"><img src="exports/web/' + p.id + '.webp" alt="" width="600" height="750" loading="lazy" decoding="async"></button>';
  }).join('');
  function capFor(p) { return p[plat]; }
  function setCaption() {
    var p = S.posts[cur], t = capFor(p);
    $('#capText').textContent = t;
    var lim = { ig: 2200, fb: 63206, tt: 2200 }[plat];
    $('#capCount').textContent = t.length + ' characters' + (plat !== 'fb' ? ' · limit ' + lim.toLocaleString('en-GB') : '');
  }
  function showPost(i, dir) {
    cur = (i + 12) % 12; var p = S.posts[cur];
    var img = $('#stageImg');
    var swap = function () { img.src = 'exports/web/' + p.id + '.webp'; img.alt = 'Post ' + pad(cur + 1) + ', ' + p.title; };
    if (HAS_G && !RM && dir !== undefined) {
      gsap.timeline().to(img, { opacity: 0, x: -24 * (dir || 1), duration: .28, ease: 'power2.in', onComplete: swap })
        .fromTo(img, { opacity: 0, x: 24 * (dir || 1), scale: 1.03 }, { opacity: 1, x: 0, scale: 1, duration: .9, ease: 'expo.out' });
    } else swap();
    $('#stNum').textContent = pad(cur + 1); $('#stIdea').textContent = p.idea; $('#stTitle').textContent = p.title;
    $('#stDl').href = 'exports/posts/' + p.id + '.png';
    $$('.pf-cell').forEach(function (c, k) { c.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
    setCaption();
    if (lb.open) { $('#lbImg').src = 'exports/posts/' + p.id + '.png'; $('#lbImg').alt = 'Post ' + pad(cur + 1) + ', ' + p.title; }
  }
  $('#pfGrid').addEventListener('click', function (e) { var c = e.target.closest('.pf-cell'); if (c) showPost(+c.dataset.i, +c.dataset.i > cur ? 1 : -1); });
  $('#stPrev').onclick = function () { showPost(cur - 1, -1); };
  $('#stNext').onclick = function () { showPost(cur + 1, 1); };
  /* tabs (roving tabindex, arrows) */
  function wireTabs(list, onSel) {
    var tabs = $$('[role=tab]', list);
    function sel(t, focus) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; }); if (focus) t.focus(); onSel(t); }
    list.addEventListener('click', function (e) { var t = e.target.closest('[role=tab]'); if (t) sel(t); });
    list.addEventListener('keydown', function (e) {
      var k = tabs.indexOf(document.activeElement); if (k < 0) return;
      var n = { ArrowRight: k + 1, ArrowDown: k + 1, ArrowLeft: k - 1, ArrowUp: k - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n === undefined) return; e.preventDefault(); sel(tabs[(n + tabs.length) % tabs.length], true);
    });
  }
  wireTabs($('#capTabs'), function (t) { plat = t.dataset.pl; $('#capPanel').setAttribute('aria-labelledby', t.id); setCaption(); });
  /* lightbox */
  var lb = $('#lightbox');
  $('#stageOpen').onclick = function () { lb.showModal(); if (lenis) lenis.stop(); showPost(cur); };
  $('#lbClose').onclick = function () { lb.close(); };
  $('#lbPrev').onclick = function () { showPost(cur - 1, -1); };
  $('#lbNext').onclick = function () { showPost(cur + 1, 1); };
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', function () { if (lenis) lenis.start(); $('#stageOpen').focus(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') showPost(cur + 1, 1); if (e.key === 'ArrowLeft') showPost(cur - 1, -1); });
  showPost(0);

  /* ---------- 4 · stories (live iframes, loaded only on screen) ---------- */
  $('#storyRow').innerHTML = S.stories.map(function (s) {
    return '<article class="story-card"><div class="phone phone-story"><div class="phone-screen"><div class="story-frame" data-src="art/' + s.id + '.html">' +
      '<img src="exports/web/' + s.id + '.webp" alt="" loading="lazy" decoding="async" width="600" height="1067"></div></div></div>' +
      '<h3>' + esc(s.title) + '</h3><p>' + esc(s.line) + '</p><a class="dl-link label" href="exports/stories/' + s.id + '.png" download>Still frame PNG</a></article>';
  }).join('');
  function fitFrames() { $$('.story-frame').forEach(function (f) { var ifr = f.querySelector('iframe'); if (ifr) ifr.style.transform = 'scale(' + (f.clientWidth / 1080) + ')'; }); }
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var f = en.target, ifr = f.querySelector('iframe');
        if (en.isIntersecting && !ifr) {
          ifr = document.createElement('iframe'); ifr.src = f.dataset.src; ifr.title = 'Animated story'; ifr.tabIndex = -1; ifr.setAttribute('aria-hidden', 'true');
          ifr.style.opacity = 0; ifr.onload = function () { ifr.style.transition = 'opacity .6s'; ifr.style.opacity = 1; };
          f.appendChild(ifr); fitFrames();
        } else if (!en.isIntersecting && ifr) { ifr.remove(); }
      });
    }, { rootMargin: '120px 0px' });
    $$('.story-frame').forEach(function (f) { sio.observe(f); });
  }
  window.addEventListener('resize', fitFrames);

  /* reel storyboard */
  var ticks = ''; for (var t = 0; t <= 20; t++) ticks += '<span class="' + (t % 5 === 0 ? 'major' : '') + '">' + (t % 5 === 0 ? '<b>' + pad(t) + 's</b>' : '') + '</span>';
  $('#reelTicks').innerHTML = ticks;
  function reelVis(v, text) {
    var inner = v === 'tag' ? '<div class="rf-tag"><b>DAY<br>01</b></div>' : v === 'board' ? '<div class="rf-board"><span>AGEING ROOM</span><b>DAY 01</b><span>PRIME RIBEYE · IN</span></div>' :
      v === 'mark' ? '<div class="rf-mark"></div>' : '<img class="' + (v === 'prime-ribeye' ? 'cut' : '') + '" src="' + (v === 'prime-ribeye' ? X.img(v, 'cutout', 'sm') : X.img(v, 'plated', 'sm')) + '" alt="" loading="lazy" decoding="async">';
    return '<div class="rf-vis">' + inner + '<p class="rf-text">' + esc(text) + '</p></div>';
  }
  $('#reelFrames').innerHTML = S.reel.map(function (r, i) {
    return '<li class="rf" data-i="' + i + '">' + reelVis(r.vis, r.text) + '<p class="rf-t">' + r.t + '</p><dl><dt>Shot</dt><dd>' + esc(r.shot) + '</dd><dt>Sound</dt><dd>' + esc(r.sound) + '</dd></dl></li>';
  }).join('');
  var reelBounds = [0, 3, 6, 10, 13, 17, 20], reelTw = null, reelTimer = null;
  function reelAt(sec) {
    var k = 0; for (var j = 0; j < 6; j++) if (sec >= reelBounds[j]) k = j;
    $$('.rf').forEach(function (f, j) { f.classList.toggle('on', j === k); });
    var w = $('.reel-time').clientWidth; $('#reelHead').style.transform = 'translateX(' + (sec / 20 * (w - 2)) + 'px)';
  }
  function reelStop() { $('.reel').classList.remove('playing'); $('#reelPlay').setAttribute('aria-pressed', 'false'); $('#reelPlay').textContent = 'Play the timing'; if (reelTw) reelTw.kill(); clearInterval(reelTimer); }
  $('#reelPlay').onclick = function () {
    if ($('.reel').classList.contains('playing')) { reelStop(); return; }
    $('.reel').classList.add('playing'); this.setAttribute('aria-pressed', 'true'); this.textContent = 'Stop';
    if (HAS_G && !RM) { var o = { s: 0 }; reelTw = gsap.to(o, { s: 20, duration: 20, ease: 'none', onUpdate: function () { reelAt(o.s); }, onComplete: reelStop }); }
    else { var s = 0; reelAt(0); reelTimer = setInterval(function () { s += 1; if (s > 20) return reelStop(); reelAt(s); }, 1000); }
  };

  /* ---------- 5 · ads ---------- */
  $('#adTabs').innerHTML = S.adsFeed.map(function (a, i) {
    return '<button role="tab" type="button" id="adt' + i + '" aria-controls="adPanel" aria-selected="' + (i === 0) + '" tabindex="' + (i ? -1 : 0) + '" data-i="' + i + '">Variant ' + (i + 1) + ' · ' + esc(a.name) + '</button>';
  }).join('');
  var adShown = false;
  function showAd(i) {
    var a = S.adsFeed[i], n = i + 1;
    $('#mfPrimary').textContent = a.primary; $('#mfHead').textContent = a.headline; $('#mfDesc').textContent = a.desc;
    $('#mfImg').src = 'exports/web/' + a.id + '.webp'; $('#msImg').src = 'exports/web/' + a.story + '.webp';
    $('#adKv').innerHTML = '<dt>Primary text</dt><dd>' + esc(a.primary) + '<span class="cnt">' + a.primary.length + ' / 125 shown</span></dd>' +
      '<dt>Headline</dt><dd>' + esc(a.headline) + '<span class="cnt">' + a.headline.length + ' / 40</span></dd>' +
      '<dt>Description</dt><dd>' + esc(a.desc) + '</dd><dt>Call to action</dt><dd>' + a.cta + '</dd><dt>Link</dt><dd>xxviii.example/reserve?utm_source=meta&amp;utm_campaign=worth-the-wait&amp;utm_content=v' + n + '</dd>';
    $('#adDlF').href = 'exports/ads/meta-feed-' + n + '.png'; $('#adDlS').href = 'exports/ads/meta-story-' + n + '.png';
    $('#adPanel').setAttribute('aria-labelledby', 'adt' + i);
    if (HAS_G && !RM && adShown) gsap.fromTo(['.mf-img', '#msImg', '.mf-primary'], { opacity: 0 }, { opacity: 1, duration: .8, stagger: .06, ease: 'power2.out' });
    adShown = true;
  }
  wireTabs($('#adTabs'), function (t) { showAd(+t.dataset.i); });
  showAd(0);

  /* search RSA with live counters */
  function rsaList(el, arr, max, kind) {
    el.innerHTML = arr.map(function (v, i) {
      var id = kind + i;
      return '<li><label class="sr-only" for="' + id + '">' + (kind === 'h' ? 'Headline ' : 'Description ') + (i + 1) + '</label>' +
        (kind === 'h' ? '<input id="' + id + '" value="' + esc(v) + '" data-max="' + max + '" spellcheck="true">' : '<textarea id="' + id + '" rows="2" data-max="' + max + '">' + esc(v) + '</textarea>') +
        '<span class="c" aria-live="polite"></span></li>';
    }).join('');
  }
  rsaList($('#rsaH'), S.search.headlines, 30, 'h'); rsaList($('#rsaD'), S.search.descriptions, 90, 'd');
  function count(inp) { var c = inp.nextElementSibling, n = inp.value.length, m = +inp.dataset.max; c.textContent = n + '/' + m; c.classList.toggle('over', n > m); c.setAttribute('aria-label', n + ' of ' + m + ' characters' + (n > m ? ', over the limit' : '')); }
  var combo = [0, 2, 4], dcombo = [0, 1];
  function serp() {
    var H = $$('#rsaH input').map(function (x) { return x.value; }), D = $$('#rsaD textarea').map(function (x) { return x.value; });
    $('#serpH').textContent = combo.map(function (k) { return H[k]; }).join(' | ');
    $('#serpD').textContent = dcombo.map(function (k) { return D[k]; }).join(' ');
  }
  $$('#rsaH input, #rsaD textarea').forEach(function (x) { count(x); x.addEventListener('input', function () { count(x); serp(); }); });
  $('#rsaShuffle').onclick = function () {
    var pool = S.search.headlines.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; });
    combo = pool.slice(0, 3); dcombo = [Math.floor(Math.random() * 4)]; dcombo.push((dcombo[0] + 1 + Math.floor(Math.random() * 3)) % 4);
    serp(); if (HAS_G && !RM) gsap.fromTo('.serp-h, .serp-d', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: 'power3.out' });
  };
  serp();
  /* GBP hours */
  (function () {
    var dow = new Date().getDay(); /* 0 Sun */
    var rowFor = dow === 1 ? 3 : dow === 0 ? 2 : (dow >= 5 ? 1 : 0);
    $('#gbpHours').innerHTML = X.brand.contact.hours.map(function (h, i) { return '<li class="' + (i === rowFor ? 'today' : '') + '"><span>' + h.days + '</span><span>' + h.time + '</span></li>'; }).join('');
  })();

  /* ---------- 6 · email + SMS ---------- */
  $('#mailTabs').innerHTML = S.emails.map(function (m, i) {
    return '<button role="tab" type="button" id="mt' + i + '" aria-controls="mailStage" aria-selected="' + (i === 0) + '" tabindex="' + (i ? -1 : 0) + '" data-i="' + i + '">' + esc(m.name) + '<small>' + esc(m.when) + '</small></button>';
  }).join('');
  function showMail(i) {
    var m = S.emails[i]; $('#mailFrame').src = 'art/' + m.id + '.html'; $('#mailSubj').textContent = m.subject;
    $('#mailKv').innerHTML = '<dt>Subject</dt><dd>' + esc(m.subject) + '</dd><dt>Preheader</dt><dd>' + esc(m.pre) + '</dd><dt>Sent</dt><dd>' + esc(m.when) + '</dd><dt>File</dt><dd><a class="link" href="exports/email/' + m.id + '.png">PNG, full length</a></dd>';
    $('#mailStage').setAttribute('aria-labelledby', 'mt' + i);
  }
  wireTabs($('#mailTabs'), function (t) { showMail(+t.dataset.i); });
  $$('.seg button').forEach(function (b) {
    b.onclick = function () { $$('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#mailStage').classList.toggle('mobile', b.dataset.w === '375'); };
  });
  var mailIO = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { if ($('#mailFrame').getAttribute('src') === 'about:blank') showMail(0); mailIO.disconnect(); } }, { rootMargin: '300px 0px' });
  mailIO.observe($('#mailStage'));
  var GSM = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-.\/:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\\[~\]|€]*$/;
  $('#smsList').innerHTML = S.sms.map(function (m) {
    var n = m.text.length, info;
    if (m.ch === 'Viber') info = '<b>' + n + '</b> characters · Viber allows 1,000';
    else { var g = GSM.test(m.text), seg = g ? (n <= 160 ? 1 : Math.ceil(n / 153)) : (n <= 70 ? 1 : Math.ceil(n / 67)); info = '<b>' + n + '</b> characters · ' + (g ? 'GSM-7' : 'Unicode') + ' · <b>' + seg + '</b> segment' + (seg > 1 ? 's' : ''); }
    return '<li class="sms"><div class="sms-h"><b>' + esc(m.name) + '</b><span class="label">' + m.ch + '</span></div><p class="bubble">' + esc(m.text) + (m.button ? '<span class="bubble-btn">' + esc(m.button) + '</span>' : '') + '</p><p class="sms-c">' + info + '</p></li>';
  }).join('');

  /* ---------- 7 · club ---------- */
  var cc = { day: 0 }, ccT = $('#ccTicks');
  ccT.innerHTML = new Array(29).join('<i></i>');
  var MSG = { 0: 'A new card. Your first visit takes it to Day 07.', 7: 'Day 07. Your next Patience is on the house.', 14: 'Day 14. A sauce flight for the table, next time.', 21: 'Day 21. First call on The Long Wait cuts.', 28: 'Day 28. Fully aged: two seats at the Chef\'s table.' };
  function paintClub(v) {
    $('#ccDay').textContent = pad(Math.round(v));
    $$('i', ccT).forEach(function (t, k) { t.classList.toggle('on', k < Math.round(v)); });
  }
  function setClub(to) {
    var from = cc.day; cc.day = to;
    $$('#tiers li').forEach(function (li) { li.classList.toggle('on', to >= +li.dataset.at); });
    $('#ccNext').textContent = to >= 28 ? 'Fully aged' : 'Next: Day ' + pad(to + 7);
    $('#ccMsg').textContent = MSG[to];
    $('#ccAdd').disabled = to >= 28; $('#ccAdd').style.opacity = to >= 28 ? .45 : 1;
    if (HAS_G && !RM && to > from) {
      var o = { v: from }; gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: function () { paintClub(o.v); } });
      var card = $('#clubCard'); card.classList.remove('shine'); void card.offsetWidth; card.classList.add('shine');
    } else paintClub(to);
  }
  $('#ccAdd').onclick = function () { if (cc.day < 28) setClub(cc.day + 7); };
  $('#ccReset').onclick = function () { setClub(0); };
  setClub(0);

  /* ---------- 9 · press ---------- */
  $('#invite').onclick = function () { this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') !== 'true'); };
  $('#prHead').textContent = S.press.headline; $('#prSf').textContent = S.press.standfirst;
  $('#prBody').innerHTML = S.press.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  $('#prBp').textContent = S.press.boilerplate;
  $('#prCopy').onclick = function () { copy([S.press.headline, S.press.standfirst].concat(S.press.body, [S.press.boilerplate]).join('\n\n'), this); };
  $('#kitList').innerHTML = S.press.kit.map(function (k) { return '<li><b>' + esc(k[0]) + '</b>' + esc(k[1]) + '</li>'; }).join('');

  /* ---------- 10 · month ---------- */
  var M = S.month, DOW = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var mo = $('#monthGrid'), html = DOW.map(function (d) { return '<div class="mo-dow" role="columnheader">' + d.slice(0, 3) + '</div>'; }).join('');
  for (var b = 0; b < M.start; b++) html += '<div class="mo-cell blank" aria-hidden="true"></div>';
  for (var d = 1; d <= M.length; d++) {
    var pos = M.start + d - 1, dw = pos % 7, wk = Math.floor(pos / 7), items = [];
    if (dw === 0) { html += '<div class="mo-cell closed"><span class="mo-n">' + pad(d) + '</span><span class="mo-closed">Closed. The beef rests.</span></div>'; continue; }
    M.rules.forEach(function (r) { if (r.dow === dw && (!r.every || wk % r.every === (r.off || 0))) items.push({ ch: r.ch, t: r.t[wk % r.t.length] }); });
    M.extra.forEach(function (x) { if (x.d === d) items.push(x); });
    html += '<div class="mo-cell" role="gridcell"><span class="mo-n">' + pad(d) + '</span>' + items.map(function (it) { return '<span class="mo-it" data-ch="' + it.ch + '"><span class="mk" data-ch="' + it.ch + '"></span>' + esc(it.t) + '</span>'; }).join('') + '</div>';
  }
  var tail = (7 - ((M.start + M.length) % 7)) % 7; for (var z = 0; z < tail; z++) html += '<div class="mo-cell blank" aria-hidden="true"></div>';
  mo.innerHTML = html; mo.setAttribute('role', 'group');
  $('#monthFilters').innerHTML = '<button type="button" data-ch="all" aria-pressed="true">All channels</button>' + CHS.map(function (k) { return '<button type="button" data-ch="' + k + '" aria-pressed="true"><span class="mk" data-ch="' + k + '"></span>' + S.CH[k].short + '</button>'; }).join('');
  $('#monthFilters').addEventListener('click', function (e) {
    var bt = e.target.closest('button'); if (!bt) return;
    var all = $$('#monthFilters button[data-ch]:not([data-ch=all])');
    if (bt.dataset.ch === 'all') all.forEach(function (x) { x.setAttribute('aria-pressed', 'true'); });
    else {
      var allOn = all.every(function (x) { return x.getAttribute('aria-pressed') === 'true'; });
      if (allOn) all.forEach(function (x) { x.setAttribute('aria-pressed', x === bt); });  /* first click isolates a channel */
      else bt.setAttribute('aria-pressed', bt.getAttribute('aria-pressed') !== 'true');
      if (!all.some(function (x) { return x.getAttribute('aria-pressed') === 'true'; })) all.forEach(function (x) { x.setAttribute('aria-pressed', 'true'); });
    }
    var on = {}; all.forEach(function (x) { on[x.dataset.ch] = x.getAttribute('aria-pressed') === 'true'; });
    $('#monthFilters [data-ch=all]').setAttribute('aria-pressed', all.every(function (x) { return on[x.dataset.ch]; }));
    $$('.mo-it').forEach(function (it) { it.classList.toggle('off', !on[it.dataset.ch]); });
  });

  /* ---------- 11 · metrics, 12 · downloads ---------- */
  $('#metrics').innerHTML = S.metrics.map(function (m) { return '<li class="metric"><h3>' + esc(m.name) + '</h3><p>' + esc(m.where) + '</p><p>' + esc(m.why) + '</p><span class="m-when">' + esc(m.when) + '</span></li>'; }).join('');
  function li(href, name, meta) { return '<li><a href="' + href + '" download>' + name + '<span>' + meta + '</span></a></li>'; }
  $('#dlPosts').innerHTML = S.posts.map(function (p, i) { return li('exports/posts/' + p.id + '.png', pad(i + 1) + ' · ' + esc(p.title), 'PNG'); }).join('');
  $('#dlStories').innerHTML = S.stories.map(function (s, i) { return li('exports/stories/' + s.id + '.png', pad(i + 1) + ' · ' + esc(s.title), 'PNG'); }).join('');
  $('#dlAds').innerHTML = [1, 2, 3].map(function (n) { return li('exports/ads/meta-feed-' + n + '.png', 'Feed ' + n + ' · ' + esc(S.adsFeed[n - 1].name), '4:5'); }).join('') + [1, 2, 3].map(function (n) { return li('exports/ads/meta-story-' + n + '.png', 'Story ' + n + ' · ' + esc(S.adsFeed[n - 1].name), '9:16'); }).join('');
  $('#dlMail').innerHTML = S.emails.map(function (m) { return li('exports/email/' + m.id + '.png', esc(m.name), 'PNG'); }).join('');

  /* ---------- nav state + scroll day ---------- */
  var navLinks = $$('.top-nav a');
  var nio = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); }); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(function (s) { nio.observe(s); });
  function onScrollDay() {
    var h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
    $('#topDay').textContent = pad(1 + Math.round(p * 27));
    $('#progressBar').style.transform = 'scaleX(' + p + ')';
  }
  window.addEventListener('scroll', onScrollDay, { passive: true }); onScrollDay();

  /* ---------- motion ---------- */
  if (!HAS_G || RM) {
    $$('.cal-tile').forEach(function (t) { t.classList.add('aged'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, anchors: { offset: -64 }, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* hero: one authored moment — the day counter ages to opening night */
  var heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  heroTl.from('.hero-h .ln', { yPercent: 110, opacity: 0, duration: 1.4, stagger: .12, clipPath: 'inset(0 0 100% 0)' })
    .from('.hero-line, .hero-cta', { y: 24, opacity: 0, duration: 1.1, stagger: .1 }, '-=1')
    .from('.hero-plate', { opacity: 0, scale: 1.08, rotation: -16, duration: 2.2, ease: 'power3.out' }, 0.1)
    .from('.hero-tag', { yPercent: -60, rotation: 8, opacity: 0, duration: 1.8, ease: 'power3.out' }, 0.3)
    .from('.hero-foot', { opacity: 0, duration: 1 }, '-=.6');
  var dayO = { v: 1 }; setDay(1);
  heroTl.to(dayO, { v: 28, duration: 3.6, ease: 'power2.inOut', onUpdate: function () { setDay(dayO.v); } }, 0.9);
  heroTl.to('.tag-mark', { backgroundPosition: '0% 0', duration: 2.4, ease: 'power2.inOut' }, 2.6);
  gsap.to('.hero-tag', { rotation: 2.4, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 0' });
  gsap.to('.hero-plate img', { y: -12, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  var mm = gsap.matchMedia();
  mm.add('(pointer: fine)', function () {
    var hero = $('#hero'), qx = gsap.quickTo('.hero-plate', 'rotationY', { duration: 1.2, ease: 'power3.out' }), qy = gsap.quickTo('.hero-plate', 'rotationX', { duration: 1.2, ease: 'power3.out' });
    var qtx = gsap.quickTo('.hero-tag', 'x', { duration: 1.4, ease: 'power3.out' });
    gsap.set('.hero-plate', { transformPerspective: 1200 });
    function mv(e) { var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5; qx(nx * 8); qy(-ny * 8); qtx(nx * 14); }
    hero.addEventListener('pointermove', mv);
    return function () { hero.removeEventListener('pointermove', mv); };
  });
  gsap.to('.hero-plate', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* section headings: SplitText line reveals */
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    $$('.sec-head h2, .club-copy h2').forEach(function (h) {
      if (!window.SplitText) return;
      var sp = new SplitText(h, { type: 'lines', mask: 'lines', linesClass: 'ln' });
      gsap.from(sp.lines, { yPercent: 105, duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
    });
    ScrollTrigger.refresh();
  });
  gsap.utils.toArray('.sec-intro').forEach(function (p) { gsap.from(p, { opacity: 0, y: 18, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } }); });

  /* calendar: tiles age in sequence as the grid passes */
  var tiles = $$('.cal-tile');
  ScrollTrigger.create({ trigger: '#calGrid', start: 'top 75%', end: 'bottom 55%', scrub: true,
    onUpdate: function (st) { var n = Math.round(st.progress * 28); tiles.forEach(function (t, k) { t.classList.toggle('aged', k < n); }); } });
  gsap.from('.cal-tile', { opacity: 0, y: 26, duration: .9, ease: 'power3.out', stagger: { each: .025, from: 'start' }, scrollTrigger: { trigger: '#calGrid', start: 'top 85%', once: true } });

  /* clip-path wipes with scale settle */
  ['.stage-frame', '.gbp-cover', '.club-card', '.invite-wrap', '.mail-stage'].forEach(function (s) {
    $$(s).forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(8% 8% 8% 8%)', scale: 1.04, opacity: .2 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, opacity: 1, duration: 1.4, ease: 'expo.out', clearProps: 'clipPath,transform', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
  });
  gsap.utils.toArray('.phone-profile, .story-card, .rf, .is-item, .sms, .metric, .dl-col, .release, .kit, .ad-pair, .rsa, .gbp').forEach(function (el, i) {
    gsap.from(el, { opacity: 0, y: 30, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  /* in-store objects drift gently with scroll */
  gsap.utils.toArray('.tent, .stand-block, .receipt').forEach(function (el, i) {
    gsap.fromTo(el, { y: 30 }, { y: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); fitFrames(); });
})();
