/* XXVIII · The Menu, live edition: "the book on the table".
   A CSS-3D book of live HTML pages (no page images) built from window.XXVIII (assets/data/xxviii.js).
   Desktop: sheets with front/back faces, a hard leather cover, drag-to-turn with momentum and a spring,
   one lit thing per spread once the turn settles. Phones (< 760 px, or a portrait tablet): course cards.
   Needs gsap (assets/vendor/gsap.min.js). Classic script: works over http and from file://. */
(() => {
  'use strict';
  const X = window.XXVIII, B = X.brand, C = B.contact;
  const gsap = window.gsap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Number(n).toLocaleString('en-PH');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !!window.LIVE_PRINT;
  const mobile = matchMedia('(max-width: 760px), (max-width: 1023px) and (orientation: portrait)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sec = id => X.menu.find(s => s.id === id);
  const M = {
    day: sec('day-one'), first: sec('first-course'), garden: sec('garden'), room: sec('ageing-room'),
    wait: sec('long-wait'), along: sec('alongside'), beyond: sec('beyond'), last: sec('last-course'),
  };
  const house = X.drinks.find(d => d.house) || X.drinks[0];
  // measured eases (motionmaxxing runtime): land decelerates, leave accelerates
  const expoOut = k => { const d = 1 - Math.exp(-k); return t => (1 - Math.exp(-k * t)) / d; };
  const EASE = {
    softLand: expoOut(3.41),
    snapSettle: (() => { const w = .942, tau = .118, n = w * (1 - Math.exp(-1 / tau)) + (1 - w); return t => (w * (1 - Math.exp(-t / tau)) + (1 - w) * t) / n; })(),
    glide: t => 1 - Math.pow(1 - t, 1.7),
    accelExit: t => Math.pow(t, 2.6),
    popOver: (() => { const c = 2.67, om = 4.36, f = t => 1 - Math.exp(-c * t) * (Math.cos(om * t) + (c / om) * Math.sin(om * t)), n = f(1); return t => (t <= 0 ? 0 : t >= 1 ? 1 : f(t) / n); })(),
  };
  const cap = (el, id) => { try { el.setPointerCapture(id); } catch (e) { /* synthetic or released pointer */ } };
  const tw = (el, vars) => (reduced ? gsap.set(el, Object.fromEntries(Object.entries(vars).filter(([k]) => !['duration', 'ease', 'delay', 'onComplete'].includes(k)))) : gsap.to(el, vars));

  /* ------------------------------------------------------------------ images (decoded only near the open spread) */
  const cut = (s, size = 'lg') => X.img(s, 'cutout', size);
  const pic = (src, cls, alt = '', extra = '') => `<img class="${cls}" data-src="${src}" alt="${esc(alt)}" draggable="false" decoding="async"${extra}>`;
  function hydrate(root) {
    $$('img[data-src]', root).forEach(im => { im.src = im.dataset.src; im.removeAttribute('data-src'); if (im.decode) im.decode().catch(() => {}); });
    $$('video[data-src]', root).forEach(v => { v.src = v.dataset.src; v.removeAttribute('data-src'); });
  }

  /* ------------------------------------------------------------------ sound: soft paper, a leather thud, a sugar tick (synthesised) */
  const Sound = {
    ctx: null, noise: null, last: 0, on: (() => { try { return localStorage.getItem('xxviii-live-sound') !== '0'; } catch (e) { return true; } })(),
    unlock() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !this.on) return;
      try { if (!this.ctx) this.ctx = new AC(); if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { /* no audio */ }
    },
    buf() {
      if (this.noise) return this.noise;
      const ctx = this.ctx, len = Math.floor(ctx.sampleRate * .8), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      let lp = 0; for (let i = 0; i < len; i++) { lp = lp * .62 + (Math.random() * 2 - 1) * .38; d[i] = lp; }
      return (this.noise = b);
    },
    play(kind = 'turn') {
      if (!this.on) return;
      this.unlock();
      const ctx = this.ctx; if (!ctx || ctx.state !== 'running') return;
      const t = performance.now(); if (t - this.last < 40 && kind !== 'thud') return; this.last = t;
      try {
        const now = ctx.currentTime;
        if (kind === 'thud') { this.thud(now); return; }
        if (kind === 'tick') { this.tick(now); return; }
        if (kind === 'riffle') { for (let i = 0; i < 4; i++) this.swish(now + i * .055, .17, .15 - i * .025, 3800); return; }
        const dur = kind === 'quick' ? .24 : kind === 'back' ? .3 : .42;
        this.swish(now, dur, kind === 'back' ? .1 : kind === 'quick' ? .16 : .22, kind === 'quick' ? 3900 : 3100);
        if (kind !== 'back') this.flap(now + dur * .8, .085);
      } catch (e) { /* no audio */ }
    },
    swish(at, dur, gain, top) {
      const ctx = this.ctx, src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = this.buf(); src.playbackRate.value = .92 + Math.random() * .16;
      hp.type = 'highpass'; hp.frequency.value = 260; bp.type = 'bandpass'; bp.Q.value = .7;
      bp.frequency.setValueAtTime(top, at); bp.frequency.exponentialRampToValueAtTime(700, at + dur);
      g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + dur * .2); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
      src.connect(hp).connect(bp).connect(g).connect(ctx.destination); src.start(at, Math.random() * .2, dur + .05);
    },
    flap(at, gain) {
      const ctx = this.ctx, src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = this.buf(); lp.type = 'lowpass'; lp.frequency.value = 360;
      g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + .012); g.gain.exponentialRampToValueAtTime(.0001, at + .12);
      src.connect(lp).connect(g).connect(ctx.destination); src.start(at, .35, .15);
    },
    thud(at) {   // a hard cover meeting the table: low body + a soft leather slap
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(92, at); o.frequency.exponentialRampToValueAtTime(48, at + .18);
      g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(.32, at + .008); g.gain.exponentialRampToValueAtTime(.0001, at + .26);
      o.connect(g).connect(ctx.destination); o.start(at); o.stop(at + .3);
      this.flap(at, .16);
    },
    tick(at) {   // a sugar crust giving way
      const ctx = this.ctx, src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = this.buf(); hp.type = 'highpass'; hp.frequency.value = 2600;
      g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(.3, at + .003); g.gain.exponentialRampToValueAtTime(.0001, at + .05);
      src.connect(hp).connect(g).connect(ctx.destination); src.start(at, Math.random() * .5, .06);
      setTimeout(() => { try { const t2 = ctx.currentTime; const s2 = ctx.createBufferSource(), g2 = ctx.createGain(), h2 = ctx.createBiquadFilter(); s2.buffer = this.buf(); h2.type = 'highpass'; h2.frequency.value = 3400; g2.gain.setValueAtTime(.0001, t2); g2.gain.exponentialRampToValueAtTime(.16, t2 + .002); g2.gain.exponentialRampToValueAtTime(.0001, t2 + .035); s2.connect(h2).connect(g2).connect(ctx.destination); s2.start(t2, .1, .04); } catch (e) { /* */ } }, 70);
    },
  };

  /* ------------------------------------------------------------------ shared bits of page markup (v4: full, food-led pages) */
  const PRINT = !!window.LIVE_PRINT;
  const price = it => (it.price ? `<span class="pr">${num(it.price)}</span>` : `<span class="pr pr--note">${esc(it.note || 'Complimentary')}</span>`);
  const ageTag = d => `<span class="age-tag">Aged <b>${d}</b> days</span>`;
  // dietary marks: PLACEHOLDER judgement until the kitchen confirms (V vegetarian, GF gluten-free); the key is on "Good to know"
  const MARKS = {
    'Burrata & Heirloom Tomato': 'V GF', 'The Classic Wedge': 'GF', 'French Onion Soup Gratinée': '',
    'Pommes Purée': 'V GF', 'Truffle Pommes Frites': 'V', 'Gratin Dauphinois': 'V GF', 'Creamed Spinach': 'V GF', 'Charred Broccolini': 'V GF', 'Wild Mushroom Fricassée': 'V GF',
    'Wild Mushroom Risotto': 'V GF', 'Oysters on the Half Shell': 'GF', 'Steak Tartare': '', 'Wagyu Carpaccio': 'GF',
    'The Twenty-Eight': 'GF', 'Prime Ribeye': 'GF', 'New York Strip': 'GF', 'Filet Mignon': 'GF', 'Picanha': 'GF',
    'Crème Brûlée': 'V GF', 'Dark Chocolate Fondant': 'V', 'Sticky Toffee Pudding': 'V', 'Bananas Foster': 'V', 'Petit Fours': 'V',
  };
  const marks = it => { const m = MARKS[it.name]; return m ? ` <span class="mk" title="Dietary marks, to be confirmed">${m.split(' ').map(x => `<i>${x}</i>`).join('')}</span>` : ''; };
  const cutSrc = (it, size = 'lg') => cut(it.cutout || it.img, size);
  // running head + folio: the furniture of a printed menu
  const RH = (l, r) => `<div class="rh" aria-hidden="true"><span>${esc(l)}</span><span>${esc(r)}</span></div>`;
  // PLACEHOLDER wording (VAT / service charge) to be confirmed by the owner, as on "Good to know"
  const FO = n => `<div class="fo"><span class="fo__t">Prices in PHP · VAT inclusive · 10% service charge · Tell us about any allergy</span><b aria-hidden="true">${String(n).padStart(2, '0')}</b></div>`;
  const HD = (no, name, line, cls = '') => `<header class="hd ${cls}"><h2 class="hd__t">${no ? `<span class="hd__no">${no}</span>` : ''}${esc(name)}</h2>${line ? `<p class="hd__l">${esc(line)}</p>` : ''}</header>`;
  // a dish: its picture first, then a place card (name, price, line)
  // names never break badly: a non-breaking hyphen in "Twenty-Eight", and short names (<= 14 letters) kept on one line
  const nm = s => { s = String(s).replace(/Twenty-Eight/g, 'Twenty\u2011Eight'); return esc(s.length <= 14 ? s.replace(/ /g, '\u00a0') : s); };
  const tile = (it, o = {}) => `<figure class="t ${o.cls || ''}" data-dish="${slug(it.name)}"${o.style ? ` style="${o.style}"` : ''}>
      <div class="t__ph">${o.ph || pic(cutSrc(it, o.size || 'sm'), 't__im', it.name)}</div>
      <figcaption class="t__c"><div class="t__row"><h3 class="t__n">${nm(it.name)}${marks(it)}</h3>${price(it)}</div>${it.desc && !o.nodesc ? `<p class="t__d">${esc(it.desc)}</p>` : ''}${o.meta || ''}</figcaption></figure>`;
  // a macro: a tight crop of a real photograph (the crust, the marbling, the bone); never type over it
  const mac = (src, x, y, s, label, cls = '') => `<figure class="mac ${cls}"><div class="mac__w">${pic(src, 'mac__im', label || '', ` style="object-position:${x}% ${y}%;transform-origin:${x}% ${y}%;transform:scale(${s})"`)}</div>${label ? `<figcaption>${esc(label)}</figcaption>` : ''}</figure>`;
  // a moving photograph on screen (muted loop, only while its spread is open); its still in print
  const film = (slug, cls, alt, pos = '50% 55%') => PRINT
    ? `<img class="${cls}" src="${X.block(slug, 'lg')}" alt="${esc(alt)}" style="object-position:${pos}">`
    : `<video class="${cls} film" muted loop playsinline preload="none" poster="${X.video(slug, 'poster')}" data-src="${X.video(slug, 'sd')}" aria-label="${esc(alt)}" style="object-position:${pos}"></video>`;
  const ground = (src, pos = '50% 50%', cls = '') => `<div class="bg ${cls}" aria-hidden="true">${pic(src, 'bg__im', '', ` style="object-position:${pos}"`)}</div>`;
  const tagSvg = n => `<svg viewBox="0 0 36 60" aria-hidden="true"><path class="tag__f" d="M4 0H32L36 4V60H0V4Z"/><circle cx="18" cy="8" r="2.6" class="tag__h"/><text x="18" y="42" text-anchor="middle" class="tag__n">${n}</text></svg>`;
  const playFilms = (c, on) => c.qa('video.film').forEach(v => { if (on && !reduced) { hydrate(v.parentElement); const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); });

  /* ------------------------------------------------------------------ THE SPREADS. Page numbers: cover 1, spread k = pages 2k and 2k+1, back cover last. */
  const roomCuts = M.room.items, waitCuts = M.wait.items, allCuts = roomCuts.concat(waitCuts);
  const SP = [];

  // 1 · the dining room and the story | Day One
  SP.push({
    id: 'day-one', title: M.day.name, course: 'I',
    L: n => `${ground(X.interior('main-dining-room', 'lg'), '30% 50%')}<i class="veil veil--top"></i><i class="veil veil--bottom veil--deep"></i><div class="pg-in story">${RH('Twenty-Eight', 'The dining room')}
      <div class="story__t"><p class="story__lead">${esc(B.story[0])}</p><p class="story__body">${esc(B.story[1])} ${esc(B.story[2])}</p><p class="story__honest">Every steak lists its age.</p></div>
      <dl class="values">${B.values.map(v => `<div><dt>${esc(v.name)}</dt><dd>${esc(v.line)}</dd></div>`).join('')}</dl>${FO(n)}</div>`,
    R: n => { const t = M.day.items[0], P = X.img('wagyu-tallow-white', 'plated', 'lg'); return `<div class="pg-in dayone">${RH('The Menu', 'I · Day One')}${HD('I', M.day.name, M.day.line)}
      <div class="dayone__hero"><i class="shadow"></i>${pic(cutSrc(t, 'lg'), 'dayone__im lit', t.name)}</div>
      <div class="dayone__foot"><div class="dayone__txt" data-dish="${slug(t.name)}"><h3 class="t__n">${esc(t.name)}</h3><p class="t__d">${esc(t.desc)}</p>${price(t)}</div>
        <div class="dayone__macs">${mac(P, 50, 55, 2.3, 'The tallow')}${mac(P, 34, 64, 2.4, 'The crust')}</div></div>${FO(n)}</div>`; },
    prepare(c) { if (!reduced) gsap.set(c.q('.dayone__im'), { yPercent: -18, opacity: 0 }); },
    enter(c) { if (!reduced) gsap.to(c.q('.dayone__im'), { yPercent: 0, opacity: 1, duration: .9, ease: EASE.softLand, delay: .2 }); },
  });

  // 2 · The First Course: one table across the spread, every plate with its place card
  const fc = M.first.items;
  SP.push({
    id: 'first-course', title: M.first.name, course: 'II',
    L: n => `<div class="pg-in table-pg">${RH('The Menu', 'II · ' + M.first.name)}${HD('II', M.first.name, M.first.line)}
      <div class="tbl tbl--a">${tile(fc[0], { cls: 't--wide', size: 'lg' })}${tile(fc[1])}${tile(fc[2])}</div>${FO(n)}</div>`,
    R: n => `<div class="pg-in table-pg">${RH('The First Course', 'Raw, cured and seared')}
      <div class="tbl tbl--b">${tile(fc[3])}${tile(fc[4])}${tile(fc[5], { cls: 't--wide t--flip', size: 'lg' })}</div>
      ${mac(X.img(fc[0].img, 'plated', 'lg'), 47, 52, 2.2, 'Hand-cut, the moment you order', 'mac--band')}${FO(n)}</div>`,
  });

  // 3 · From the Garden (photographs at the table) | the open kitchen: a craft line, the crust up close
  SP.push({
    id: 'garden', title: M.garden.name, course: 'III',
    L: n => `<div class="pg-in">${RH('The Menu', 'III · ' + M.garden.name)}${HD('III', M.garden.name, M.garden.line)}
      <div class="g4">${M.garden.items.map(it => tile(it, { cls: 't--photo', ph: pic(X.img(it.img, 'plated', 'md'), 't__photo', it.name) })).join('')}</div>${FO(n)}</div>`,
    R: n => { const cb = X.block('cowboy-cut', 'lg'), pr = X.block('prime-ribeye', 'lg'), tm = X.block('sovereign-tomahawk', 'lg'); return `<div class="pg-in kitchen">${RH('The kitchen', 'Seared by hand')}
      <figure class="kitchen__ph">${pic(X.interior('open-kitchen-chefs-counter', 'lg'), 'kitchen__im', 'The open kitchen and the chef’s counter')}</figure>
      <p class="kitchen__line">${esc(B.values[1].line)}</p>
      <div class="kitchen__macs">${mac(cb, 31, 60, 3, 'The crust')}${mac(pr, 46, 60, 2.8, 'The marbling')}${mac(tm, 74, 40, 2.6, 'The bone')}${mac(X.dryage('rib-crust-close-detail', 'lg'), 62, 52, 1.6, 'On the hook')}</div>${FO(n)}</div>`; },
  });

  // 4 · The Ageing Room: the glass room by the door (hero) | the board, every cut on its tag
  SP.push({
    id: 'ageing-room', title: M.room.name, course: 'IV',
    L: n => `<div class="pg-in room-hero">${RH('The Menu', 'IV · ' + M.room.name)}
      ${HD('IV', M.room.name, 'The glass room by the door: a salt-brick wall lit warm, ribs on hooks, every cut tagged with its day.')}
      <figure class="room__ph">${pic(X.dryage('room-wide-feature-wall', 'lg'), 'room__im', 'The glass ageing room, seen from the dining room', ' style="object-position:44% 40%"')}</figure>
      <div class="room__ctl"><div class="odo" aria-hidden="true"><span class="odo__l">Day</span><span class="odo__d"><span class="odo__c">${[0, 1, 2, 3, 4].map(x => `<i>${x}</i>`).join('')}</span><span class="odo__c">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => `<i>${x}</i>`).join('')}</span></span></div>
        <div class="rail" role="slider" tabindex="0" aria-label="Days in the ageing room" aria-valuemin="1" aria-valuemax="45" aria-valuenow="28" aria-valuetext="Day 28">
          <div class="rail__bar"><i class="rail__fill"></i>${[1, 14, 21, 28, 35, 45].map(d => `<span class="rail__tick" style="left:${(d - 1) / 44 * 100}%">${d}</span>`).join('')}</div><span class="rail__knob"></span></div>
        <p class="room__hint">${PRINT ? 'Each cut is ready on its own day: 21, 28, 35 and 45 days.' : 'Drag the rail: each cut is ready on its own day.'} ${esc(B.launch ? B.launch.note : '')}</p></div>${FO(n)}</div>`,
    R: n => `<div class="pg-in board">${RH(M.room.name, 'The board by the door')}
      <div class="room__strip">${pic(X.dryage('room-through-the-glass', 'md'), 'room__s', 'Ribs hanging behind the glass')}${pic(X.dryage('room-rack-aisle', 'md'), 'room__s', 'Inside the ageing room: the rack aisle, every cut tagged')}${pic(X.dryage('room-butcher-moment', 'md'), 'room__s', 'The butcher checking a tagged rib')}</div>
      <div class="b8">${allCuts.map(c => `<figure class="bt" data-age="${c.age}" data-dish-alt="${slug(c.name)}"><span class="bt__tag">${tagSvg(c.age)}</span>
        <div class="bt__ph">${pic(cutSrc(c, 'sm'), 'bt__im', c.name)}</div>
        <figcaption><div class="t__row"><h3 class="bt__n">${esc(c.name)}</h3>${price(c)}</div><p class="bt__m"><span>${esc(c.weight)}${c.serves ? ' · serves ' + esc(c.serves) : ''}</span><span class="bt__s"></span></p></figcaption></figure>`).join('')}</div>${FO(n)}</div>`,
    bind(c) {
      const rail = c.q('.rail'), knob = c.q('.rail__knob'), fill = c.q('.rail__fill'), cols = c.qa('.odo__c'), tiles = c.qa('.bt');
      const tags = tiles.map(t => ({ el: t.querySelector('.bt__tag'), a: 0, v: 0, age: +t.dataset.age, t, st: t.querySelector('.bt__s') }));
      let day = 28, last = 28, raf = 0, lastT = 0;
      const render = () => {
        const p = (day - 1) / 44, d = Math.round(day);
        knob.style.left = (p * 100) + '%'; fill.style.transform = `scaleX(${p})`;
        cols[0].style.transform = `translateY(${-Math.floor(d / 10)}em)`; cols[1].style.transform = `translateY(${-(d % 10)}em)`;
        rail.setAttribute('aria-valuenow', d); rail.setAttribute('aria-valuetext', `Day ${d}`);
        tags.forEach(t => { const r = d >= t.age; t.t.classList.toggle('ready', r); t.st.textContent = r ? 'Ready' : `Ready at ${t.age} days`; });
      };
      const swing = now => {
        const dt = Math.min(.033, (now - (lastT || now)) / 1000 || .016); lastT = now; let moving = false;
        tags.forEach(t => { t.v += (-t.a * 140 - t.v * 7) * dt; t.a += t.v * dt; if (Math.abs(t.a) > .05 || Math.abs(t.v) > .05) moving = true; t.el.style.transform = `rotate(${t.a.toFixed(2)}deg)`; });
        raf = moving ? requestAnimationFrame(swing) : 0; if (!moving) lastT = 0;
      };
      const setDay = (v, push = true) => {
        v = clamp(v, 1, 45); const dv = v - last; last = v; day = v; render();
        if (push && !reduced && !PRINT && Math.abs(dv) > .01) { tags.forEach((t, i) => { t.v += clamp(dv * (9 + i % 3 * 2), -60, 60); }); if (!raf) raf = requestAnimationFrame(swing); }
      };
      c.setDay = setDay; c.getDay = () => day;
      const fromX = x => { const r = rail.querySelector('.rail__bar').getBoundingClientRect(); return 1 + clamp((x - r.left) / r.width, 0, 1) * 44; };
      rail.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); cap(rail, e.pointerId); rail.classList.add('drag'); if (c.sweep) c.sweep.kill(); setDay(fromX(e.clientX)); });
      rail.addEventListener('pointermove', e => { if (rail.classList.contains('drag')) setDay(fromX(e.clientX)); });
      const end = () => { rail.classList.remove('drag'); setDay(Math.round(day)); };
      rail.addEventListener('pointerup', end); rail.addEventListener('pointercancel', end);
      rail.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 7, PageDown: -7 }[e.key];
        if (k) { e.preventDefault(); e.stopPropagation(); setDay(Math.round(day) + k); }
        if (e.key === 'Home') { e.preventDefault(); e.stopPropagation(); setDay(1); }
        if (e.key === 'End') { e.preventDefault(); e.stopPropagation(); setDay(45); }
      });
      render();
    },
    enter(c) {   // the lit thing: the board counts up from Day 1 to the house steak's 28, the tags swinging
      if (reduced || c.swept) return; c.swept = true;
      const o = { d: 1 }; c.setDay(1, false); c.sweep = gsap.to(o, { d: 28, duration: 2.4, ease: EASE.softLand, delay: .35, onUpdate: () => c.setDay(o.d) });
    },
  });

  // 5 · The Twenty-Eight: the plate bleeds off the page, the crust and the butter up close | sauces and butters around their steak
  const sx = M.along.extras.items;
  const RING = [[17, 0], [50, 0], [83, 0], [13, 35], [87, 35], [30, 70], [70, 70]];
  SP.push({
    id: 'twenty-eight', title: roomCuts[0].name, course: 'IV',
    L: n => { const t = roomCuts[0], cb = X.block('cowboy-cut', 'lg'); return `<div class="pg-in t28">${RH('IV · ' + M.room.name, 'The house steak')}
      <div class="t28__hero"><i class="shadow"></i>${pic(cutSrc(t, 'lg'), 't28__im lit', t.name)}</div>
      <div class="t28__foot"><div class="t28__txt" data-dish="${slug(t.name)}">${ageTag(t.age)}<h2 class="t28__n">${nm(t.name)}</h2><p class="t__d">${esc(t.desc)}</p><p class="t28__m"><span>${esc(t.weight)}</span>${price(t)}</p>
        <button type="button" class="card28" aria-pressed="false" aria-label="Turn the steak card over"><span class="card28__in"><span class="card28__f">${B.steakCardFor(t.age).map(esc).join('<br>')}<small>The card on every steak</small></span><span class="card28__b">Into the room<b>Day 01</b>Out of the room<b>Day ${t.age}</b></span></span></button></div>
        <div class="t28__macs">${mac(cb, 31, 60, 3, 'The crust')}${mac(cb, 42, 45, 3.3, 'The butter')}${mac(cb, 64, 33, 2.8, 'The bone')}</div></div>${FO(n)}</div>`; },
    R: n => `<div class="pg-in sauces">${RH('Alongside', 'Sauces & Butters')}${HD('', M.along.extras.name, 'One for the steak, one for the table.')}
      <div class="ring"><div class="ring__c"><i class="shadow"></i>${pic(cutSrc(roomCuts[3], 'lg'), 'ring__im', roomCuts[3].name)}</div>
        ${sx.map((s, i) => `<figure class="rg" data-dish="${slug(s.name)}" style="left:${RING[i][0]}%;top:${RING[i][1]}%"><div class="rg__ph">${pic(cutSrc(s, 'sm'), 'rg__im', s.name)}</div><figcaption><h3 class="rg__n">${esc(s.name)}</h3>${price(s)}</figcaption></figure>`).join('')}</div>${FO(n)}</div>`,
    bind(c) { const card = c.q('.card28'); card.addEventListener('click', () => { const on = card.getAttribute('aria-pressed') !== 'true'; card.setAttribute('aria-pressed', String(on)); tw(card.querySelector('.card28__in'), { rotationY: on ? 180 : 0, duration: .9, ease: EASE.softLand }); }); },
    prepare(c) { if (!reduced) gsap.set(c.q('.t28__im'), { xPercent: -8, opacity: 0 }); },
    enter(c) { if (!reduced) gsap.to(c.q('.t28__im'), { xPercent: 0, opacity: 1, duration: 1, ease: EASE.softLand, delay: .2 }); },
  });

  // 6 · The Long Wait: three sharing cuts, each on film, carving notes and serves | the tomahawk and the enhancements
  const band = (w, notes) => `<figure class="lw" data-dish="${slug(w.name)}"><div class="lw__f">${film(w.img, 'lw__v', w.name + ', filmed on the block')}</div>
      <figcaption class="lw__c"><div class="t__row"><h3 class="t__n">${esc(w.name)}</h3>${price(w)}</div><p class="t__d">${esc(w.desc)}</p>
      <p class="lw__m">${ageTag(w.age)}<span class="unit">${esc(w.weight)}</span><span>Serves ${esc(w.serves)}</span><span>${esc(notes)}</span></p></figcaption></figure>`;
  SP.push({
    id: 'long-wait', title: M.wait.name, course: 'V',
    L: n => `<div class="pg-in lwp">${RH('The Menu', 'V · ' + M.wait.name)}${HD('V', M.wait.name, M.wait.line)}${band(waitCuts[0], 'Carved at the table')}${band(waitCuts[1], 'Sliced to share')}${FO(n)}</div>`,
    R: n => `<div class="pg-in lwp">${RH(M.wait.name, 'Forty-five days')}${band(waitCuts[2], 'Dressed with chimichurri')}
      <h3 class="sub">${esc(M.wait.extras.name)}<span>For any steak, from the room or the long wait</span></h3>
      <div class="e4">${M.wait.extras.items.map(e => tile(e)).join('')}</div>${FO(n)}</div>`,
    enter(c) { playFilms(c, true); }, leave(c) { playFilms(c, false); },
  });

  // 7 · Alongside: eight bowls, a grid with names and prices under each | Beyond: the lobster bleeds off the page, three plates beside it
  const bz = M.beyond.items;
  SP.push({
    id: 'alongside', title: M.along.name, course: 'VI',
    L: n => `<div class="pg-in">${RH('The Menu', 'VI · ' + M.along.name)}${HD('VI', M.along.name, 'Sides to share.')}<div class="s8">${M.along.items.map(s => tile(s, { cls: 't--bowl' })).join('')}</div>${FO(n)}</div>`,
    R: n => `<div class="pg-in beyond">${RH('The Menu', 'VII · ' + M.beyond.name)}
      <div class="beyond__top">${HD('VII', M.beyond.name, M.beyond.line)}<div class="beyond__hero"><i class="shadow"></i>${pic(cutSrc(bz[1], 'lg'), 'beyond__im', bz[1].name)}</div></div>
      <div class="beyond__lead">${tile(bz[1], { cls: 't--text', ph: '' })}</div>
      <div class="b3">${[bz[0], bz[2], bz[3]].map(b => tile(b)).join('')}</div>${FO(n)}</div>`,
  });

  // 8 · How we cook your steak: the scale beside real slices | The Last Course: a dessert table
  const BANDS = [['Blue', '46–49', 'Seared hard outside, cool and deep red within.', '#5a0f1b'], ['Rare', '50–52', 'Cool red centre.', '#8a1c28'], ['Medium rare', '55–57', 'Warm red centre. Our suggestion for aged beef.', '#b03a43'], ['Medium', '60–63', 'Warm pink centre.', '#b8665c'], ['Medium well', '65–68', 'A trace of pink.', '#9c7766']];
  const lc = M.last.items;
  const DESS = [[0, 0, 39, 'r'], [61, 19, 39, 'l'], [0, 38.5, 39, 'r'], [61, 57.5, 39, 'l'], [0, 76.5, 38, 'r']];
  SP.push({
    id: 'last-course', title: M.last.name, course: 'VIII',
    L: n => `<div class="pg-in done">${RH('Good to know', 'How we cook your steak')}${HD('', 'How we cook your steak', 'Every steak rests before it reaches you. Tell us how you like it.')}
      <div class="done__g"><ol class="scale">${BANDS.map((b, i) => `<li class="${i === 2 ? 'pick' : ''}"><i style="background:${b[3]}"></i><div><p class="scale__n">${b[0]}<span>${b[1]} °C</span></p><p class="scale__d">${esc(b[2])}</p></div></li>`).join('')}</ol>
        <div class="slices">${mac(X.block('new-york-strip', 'lg'), 66, 56, 2.6, 'New York Strip')}${mac(X.block('chateaubriand-for-two', 'lg'), 58, 58, 2.6, 'Châteaubriand')}${mac(X.block('picanha', 'lg'), 54, 60, 2.6, 'Picanha')}${mac(X.block('porterhouse-for-two', 'lg'), 34, 58, 2.6, 'Porterhouse')}</div></div>
      <p class="done__note">Every slice here is medium rare, 55–57 °C: our suggestion for aged beef.</p>${FO(n)}</div>`,
    R: n => `<div class="pg-in dess">${RH('The Menu', 'VIII · ' + M.last.name)}${HD('VIII', M.last.name, M.last.line)}
      <div class="dt">${lc.map((d, i) => `<figure class="dt__p dt__p--${DESS[i][3]}" data-dish="${slug(d.name)}" style="left:${DESS[i][0]}%;top:${DESS[i][1]}%;width:${DESS[i][2]}%"><i class="shadow"></i>${pic(cutSrc(d, 'lg'), 'dt__im', d.name)}
        <figcaption class="dt__c"><h3 class="t__n">${esc(d.name)}${marks(d)}</h3><p class="t__d">${esc(d.desc)}</p>${price(d)}</figcaption></figure>`).join('')}</div>${FO(n)}</div>`,
  });

  // 9 · Patience at the bar | Good to know: the door, private dining, hours, the allergen key
  SP.push({
    id: 'bar', title: 'The bar', course: '',
    L: n => `${ground(X.interior('bar', 'lg'), '42% 50%')}<i class="veil veil--top"></i><i class="veil veil--bottom veil--deep"></i><div class="pg-in barp">${RH('The bar', 'Stirred slowly')}
      <div class="barp__house"><h2 class="barp__n">${esc(house.name)}</h2><p class="barp__d">${esc(B.cocktail.line)}</p>${price(house)}</div>
      <div class="barp__list"><h3 class="sub sub--light">From the bar</h3>${X.drinks.filter(d => d !== house).map(d => `<div class="dr"><div class="t__row"><h3 class="t__n">${esc(d.name)}</h3>${price(d)}</div><p class="t__d">${esc(d.desc)}</p></div>`).join('')}</div>${FO(n)}</div>`,
    R: n => { const priv = (C.capacity.match(/private room for (\d+)/) || [])[1]; return `<div class="pg-in know">${RH('Good to know', 'Twenty-Eight')}
      <figure class="know__door">${pic(X.interior('entrance-host-stand', 'lg'), 'know__im', 'The host stand by the door')}</figure>
      <div class="know__g">
        <section><h3 class="sub">Prices</h3><!-- PLACEHOLDER: VAT, service-charge and discount wording to be confirmed by the owner --><p>Prices in Philippine peso, inclusive of VAT and subject to a 10% service charge. Senior citizen and PWD discounts as required by law.</p></section>
        <section><h3 class="sub">Allergies</h3><p>Tell us about any allergy before you order. Our kitchen handles nuts, gluten, dairy, eggs, fish and shellfish. Raw and lightly cooked dishes may increase the risk of food-borne illness.</p>
          <p class="key"><span class="mk"><i>V</i></span> Vegetarian <span class="mk"><i>GF</i></span> Gluten-free <em>(marks to be confirmed by the kitchen)</em></p></section>
        <section class="know__priv"><figure>${pic(X.interior('private-dining-room', 'md'), 'know__pim', 'The private dining room')}</figure><div><h3 class="sub">Private dining</h3><p>${priv ? `A private room for up to ${priv} guests, with the same unhurried evening.` : 'A private room for a long table.'} Ask when you book.</p></div></section>
        <section><h3 class="sub">Hours</h3><dl class="hours">${C.hours.map(h => `<dt>${esc(h.days)}</dt><dd>${esc(h.time)}</dd>`).join('')}</dl></section>
        <section class="know__res"><h3 class="sub">Reservations</h3><p>${esc(C.phone)} · ${esc(C.email)}<br>${esc(C.street)}, ${esc(C.area)}</p>
          ${PRINT ? '' : `<p class="know__go"><a class="btn btn-solid" href="../index.html#reserve">Reserve a table <span class="arr"></span></a></p>`}</section>
      </div>${FO(n)}</div>`; },
  });

  /* ------------------------------------------------------------------ covers */
  const LOGO = () => (document.getElementById('tpl-logo') || {}).innerHTML || `<img src="../assets/logo/xxviii-primary-brass.svg" alt="XXVIII Twenty-Eight Steakhouse">`;
  const coverHTML = () => `<div class="cover"><div class="cover__leather" aria-hidden="true"></div><div class="cover__foil">${LOGO()}</div><p class="cover__word">Menu</p>${PRINT ? '' : '<p class="cover__hint" aria-hidden="true">Lift the cover</p>'}</div>`;
  const backHTML = () => `<div class="cover cover--back"><div class="cover__leather" aria-hidden="true"></div><img class="cover__seal" src="../assets/logo/xxviii-seal-brass.svg" alt="XXVIII seal: aged twenty-eight days, cut today, yours tonight" draggable="false"><p class="cover__tag">${esc(B.taglines[0])}</p><p class="cover__area">${esc(C.area)}</p></div>`;

  /* ------------------------------------------------------------------ context: query across a spread's two faces (or one card) */
  const ctxOf = (roots, spec) => {
    const c = { roots, root: roots[0], spec };
    c.q = s => { for (const r of roots) { const e = r.querySelector(s); if (e) return e; } return null; };
    c.qa = s => { const out = []; roots.forEach(r => r.querySelectorAll(s).forEach(e => { if (!out.includes(e)) out.push(e); })); return out; };
    return c;
  };

  /* ================================================================== DESKTOP: the book */
  const Book = {
    sheets: [], N: 0, s: 0, ctx: [], raf: 0, moving: new Set(), pw: 0, ph: 0, dragging: null, zoom: 0,

    build() {
      const book = $('#book');
      const faces = [coverHTML()];
      SP.forEach((sp, j) => { const k = j + 1; faces.push(`<div class="pg pg--l" data-sp="${sp.id}">${sp.L(2 * k)}</div>`); faces.push(`<div class="pg pg--r" data-sp="${sp.id}">${sp.R(2 * k + 1)}</div>`); });
      faces.push(backHTML());
      this.N = faces.length / 2;
      const html = [];
      for (let i = 0; i < this.N; i++) {
        const hard = i === 0 || i === this.N - 1;
        html.push(`<div class="sheet${hard ? ' sheet--hard' : ''}" data-i="${i}"><div class="face face--f">${faces[2 * i]}<i class="face__sh"></i></div><div class="face face--b">${faces[2 * i + 1]}<i class="face__sh"></i></div></div>`);
      }
      $('#sheets').innerHTML = html.join('');
      this.sheets = $$('.sheet', book).map((el, i) => ({ el, i, th: 0, v: 0, tgt: 0, hard: el.classList.contains('sheet--hard'), f: el.querySelector('.face--f'), b: el.querySelector('.face--b'), hit: false }));
      // a context per spread (k = 1..N-1): left = back of sheet k-1, right = front of sheet k
      this.ctx = [null];
      SP.forEach((sp, j) => { const k = j + 1, c = ctxOf([this.sheets[k - 1].b, this.sheets[k].f], sp); this.ctx[k] = c; if (sp.bind) sp.bind(c); });
      this.layout(); this.apply(); this.setSpread(0, true);
      addEventListener('resize', () => { this.layout(); this.apply(); });
    },
    layout() {
      const vw = innerWidth, vh = innerHeight, top = 78, bottom = 40;
      const ph = Math.round(Math.min(vh - top - bottom, (vw - 140) / 2 / .697));
      this.ph = ph; this.pw = Math.round(ph * .697);
      const book = $('#book');
      book.style.setProperty('--pw', this.pw + 'px'); book.style.setProperty('--ph', this.ph + 'px');
    },
    // spring per sheet (degrees). Paper: critically damped. Hard covers: heavier, bounce once off the table, thud.
    step(dt) {
      let any = false;
      this.sheets.forEach(sh => {
        if (!this.moving.has(sh)) return;
        if (sh === (this.dragging && this.dragging.sh)) { any = true; return; }
        const k = sh.hard ? 70 : sh.quick ? 210 : 120, zeta = sh.hard ? .62 : 1, c = 2 * Math.sqrt(k) * zeta;
        const n = 4, h = dt / n;
        for (let s = 0; s < n; s++) {
          const a = -k * (sh.th - sh.tgt) - c * sh.v; sh.v += a * h; sh.th += sh.v * h;
          if (sh.th < -180) { sh.th = -180 - (sh.th + 180) * .3; sh.v = -sh.v * .3; if (sh.hard && !sh.hit) { sh.hit = true; Sound.play('thud'); } }
          if (sh.th > 0) { sh.th = -sh.th * .3; sh.v = -sh.v * .3; if (sh.hard && !sh.hit) { sh.hit = true; Sound.play('thud'); } }
        }
        if (Math.abs(sh.th - sh.tgt) < .15 && Math.abs(sh.v) < 6) { sh.th = sh.tgt; sh.v = 0; this.moving.delete(sh); sh.quick = false; this.settled(); }
        else any = true;
      });
      return any;
    },
    loop() {
      if (this.raf) return;
      let last = performance.now();
      const tick = now => {
        const dt = Math.min(.034, (now - last) / 1000); last = now;
        const any = this.step(dt); this.apply();
        this.raf = any || this.dragging ? requestAnimationFrame(tick) : 0;
      };
      this.raf = requestAnimationFrame(tick);
    },
    apply() {
      const N = this.N, pw = this.pw;
      let cast = null;
      this.sheets.forEach(sh => {
        const onLeft = sh.th < -90, z = (onLeft ? sh.i : N - sh.i) * .9 + (this.moving.has(sh) ? 6 : 0);
        sh.el.style.transform = `translateZ(${z.toFixed(1)}px) rotateY(${sh.th.toFixed(3)}deg)`;
        const r = -sh.th / 180;                                   // 0 flat right .. 1 flat left
        sh.f.style.setProperty('--sh', (Math.sin(Math.PI * Math.min(r, .5)) * .55).toFixed(3));
        sh.b.style.setProperty('--sh', (Math.sin(Math.PI * Math.min(1 - r, .5)) * .55).toFixed(3));
        if (this.moving.has(sh) && sh.th < -.5 && sh.th > -179.5) cast = sh;
      });
      // the book slides to keep a closed cover centred (front closed: shift left; back closed: shift right)
      const p0 = -this.sheets[0].th / 180, pN = -this.sheets[N - 1].th / 180;
      $('#book').style.transform = `translateX(${((-.5 * (1 - p0) + .5 * pN) * pw).toFixed(2)}px) rotateX(7deg)`;   // lying on the table
      const cr = $('#castR'), cl = $('#castL');
      if (cast) {
        const t = cast.th * Math.PI / 180, w = Math.abs(Math.cos(t)), o = Math.sin(-t) * .55;
        // the shadow falls on the page beneath the lifting sheet: just above that page, just below the sheet
        if (cast.th > -90) { cr.style.opacity = o.toFixed(3); cr.style.transform = `translateZ(${((N - cast.i - 1) * .9 + .45).toFixed(2)}px) scaleX(${w.toFixed(3)})`; cl.style.opacity = 0; }
        else { cl.style.opacity = o.toFixed(3); cl.style.transform = `translateZ(${((cast.i - 1) * .9 + .45).toFixed(2)}px) scaleX(${w.toFixed(3)})`; cr.style.opacity = 0; }
      } else { cr.style.opacity = 0; cl.style.opacity = 0; }
      // page-edge thickness on each side
      const turned = this.sheets.filter(s => s.th < -90).length;
      $('#book').style.setProperty('--nl', turned); $('#book').style.setProperty('--nr', N - turned);
      this.visibility();
    },
    visibility() {
      const s = this.s;
      this.sheets.forEach(sh => { const near = (sh.i >= s - 2 && sh.i <= s + 1) || this.moving.has(sh); sh.el.style.visibility = near ? 'visible' : 'hidden'; });
    },
    // turn the sheet at index i toward target angle; velocity optional (deg/s)
    go(sh, tgt, v = 0, quick = false) {
      sh.tgt = tgt; sh.v = v; sh.quick = quick; sh.hit = false;
      if (reduced) { sh.th = tgt; sh.v = 0; this.moving.delete(sh); this.apply(); this.settled(); return; }
      this.moving.add(sh); this.loop();
    },
    spreadIndex() { return this.sheets.filter(sh => sh.tgt <= -90).length; },
    next() { const s = this.spreadIndex(); if (s >= this.N) return; this.prepare(s + 1); Sound.play(this.sheets[s].hard ? 'quick' : 'turn'); this.go(this.sheets[s], -180, -40); },
    prev() { const s = this.spreadIndex(); if (s <= 0) return; this.prepare(s - 1); Sound.play(this.sheets[s - 1].hard ? 'quick' : 'turn'); this.go(this.sheets[s - 1], 0, 40); },
    goTo(t) {
      t = clamp(t, 0, this.N); const s = this.spreadIndex(); if (t === s) { this.settled(); return; }
      if (Math.abs(t - s) === 1) { if (t > s) this.next(); else this.prev(); return; }
      this.prepare(t); Sound.play('riffle');
      const list = t > s ? this.sheets.slice(s, t) : this.sheets.slice(t, s).reverse();
      list.forEach((sh, j) => setTimeout(() => this.go(sh, t > s ? -180 : 0, 0, true), reduced ? 0 : j * 70));
    },
    prepare(k) { const c = this.ctx[k]; if (k >= 1 && k < this.N && c) { hydrate(c.roots[0]); hydrate(c.roots[1]); if (c.spec.prepare && !c.entered) c.spec.prepare(c); } },
    settled() {
      if (this.moving.size) return;
      const s = this.spreadIndex();
      if (s !== this.s || !this.inited) this.setSpread(s);
    },
    setSpread(s, first) {
      const prev = this.s; this.s = s; this.inited = true;
      const pc = this.ctx[prev]; if (pc && pc.spec.leave && prev !== s) pc.spec.leave(pc);
      // only the open spread's two faces are reachable (keyboard, screen readers, pointer)
      this.sheets.forEach(sh => { sh.f.inert = true; sh.b.inert = true; sh.f.setAttribute('aria-hidden', 'true'); sh.b.setAttribute('aria-hidden', 'true'); });
      const open = s === 0 ? [this.sheets[0].f] : s === this.N ? [this.sheets[this.N - 1].b] : [this.sheets[s - 1].b, this.sheets[s].f];
      open.forEach(f => { f.inert = false; f.removeAttribute('aria-hidden'); });
      [s - 1, s, s + 1].forEach(k => { const c = this.ctx[k]; if (c) { hydrate(c.roots[0]); hydrate(c.roots[1]); } });
      document.body.dataset.spread = s; document.body.classList.toggle('is-front', s === 0); document.body.classList.toggle('is-back', s === this.N);
      $('#book').classList.toggle('closed', s === 0 || s === this.N);
      UI.onSpread(s);
      this.visibility();
      const c = this.ctx[s];
      if (c && c.spec.enter) { clearTimeout(this.enterT); this.enterT = setTimeout(() => { if (this.s === s && !this.moving.size) { c.spec.enter(c); c.entered = true; } }, first ? 0 : 60); }
    },

    /* ---- drag: grab a page edge (or the cover anywhere) and turn it; momentum on release; interruptible */
    bindDrag() {
      const host = $('#book');
      const geo = () => { const r = host.getBoundingClientRect(); return { spine: r.left + r.width / 2, pw: r.width / 2 }; };
      const pick = (x, target) => {
        const g = geo(), side = x >= g.spine ? 'r' : 'l';
        // a sheet still turning can be caught mid-air
        const mv = [...this.moving].sort((a, b) => Math.abs(b.th + 90) - Math.abs(a.th + 90))[0];
        if (mv && Math.abs((g.spine + g.pw * Math.cos(mv.th * Math.PI / 180)) - x) < g.pw * .35) return mv;
        const s = this.spreadIndex();
        if (side === 'r' && s < this.N) return this.sheets[s];
        if (side === 'l' && s > 0) return this.sheets[s - 1];
        return null;
      };
      host.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        const edge = e.target.closest('.edge'), coverHit = e.target.closest('.cover') && (this.s === 0 || this.s === this.N);
        if (!edge && !coverHit) return;
        const sh = pick(e.clientX); if (!sh) return;
        e.preventDefault(); Sound.unlock();
        const k = sh.th > -90 ? sh.i + 1 : sh.i; this.prepare(k);
        this.dragging = { sh, x0: e.clientX, t0: performance.now(), samples: [[performance.now(), sh.th]], moved: false, id: e.pointerId, from: sh.th };
        this.moving.add(sh); cap(host, e.pointerId); host.classList.add('grabbing'); this.loop();
      });
      host.addEventListener('pointermove', e => {
        const d = this.dragging; if (!d || e.pointerId !== d.id) return;
        if (Math.abs(e.clientX - d.x0) > 4) d.moved = true;
        if (!d.moved) return;
        const g = geo(), th = -Math.acos(clamp((e.clientX - g.spine) / g.pw, -1, 1)) * 180 / Math.PI;
        d.sh.th = th; const now = performance.now(); d.samples.push([now, th]); while (d.samples.length > 2 && now - d.samples[0][0] > 90) d.samples.shift();
      });
      const up = e => {
        const d = this.dragging; if (!d || e.pointerId !== d.id) return;
        this.dragging = null; host.classList.remove('grabbing');
        const sh = d.sh;
        if (!d.moved) {   // a click on an edge or the cover turns the page
          const goingLeft = sh.th > -90;
          if (goingLeft) { this.prepare(sh.i + 1); Sound.play(sh.hard ? 'quick' : 'turn'); this.go(sh, -180, -60); } else { this.prepare(sh.i); Sound.play(sh.hard ? 'quick' : 'turn'); this.go(sh, 0, 60); }
          return;
        }
        const [t0, a0] = d.samples[0], [t1, a1] = d.samples[d.samples.length - 1];
        const v = (a1 - a0) / Math.max(.016, (t1 - t0) / 1000);
        const proj = sh.th + v * .18, tgt = proj < -90 ? -180 : 0;
        Sound.play(tgt === (d.from < -90 ? -180 : 0) ? 'back' : 'turn');
        this.go(sh, tgt, clamp(v, -900, 900));
      };
      host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    },
  };

  /* ================================================================== PHONES: course cards */
  const Cards = {
    build() {
      const wrap = $('#cards');
      const cards = [`<section class="card card--cover" data-k="0" aria-label="Cover">${coverHTML()}<a class="card__open" href="#c-1">Open the menu</a></section>`];
      SP.forEach((sp, j) => cards.push(`<section class="card" id="c-${j + 1}" data-k="${j + 1}" aria-labelledby="ct-${j + 1}"><h2 class="sr-only" id="ct-${j + 1}">${esc(sp.title)}</h2><div class="pg pg--l" data-sp="${sp.id}">${sp.L(2 * (j + 1))}</div><div class="pg pg--r" data-sp="${sp.id}">${sp.R(2 * (j + 1) + 1)}</div></section>`));
      cards.push(`<section class="card card--cover card--back" data-k="${SP.length + 1}" aria-label="Back cover">${backHTML()}</section>`);
      wrap.innerHTML = cards.join('');
      this.ctx = $$('.card', wrap).map((el, i) => { const sp = SP[i - 1]; if (!sp) return null; const c = ctxOf([el], sp); if (sp.bind) sp.bind(c); return c; });
      // decode images just ahead of the reader; run loops and videos only on the card in view
      const near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) hydrate(e.target); }), { rootMargin: '120% 0px' });
      let current = null;
      const seen = new IntersectionObserver(es => es.forEach(e => {
        const c = this.ctx[+e.target.dataset.k];
        if (e.isIntersecting && e.intersectionRatio > .35) {
          if (current && current !== c && current && current.spec.leave) current.spec.leave(current);
          current = c; UI.onSpread(+e.target.dataset.k);
          if (c && c.spec.enter && !c.entered) { if (c.spec.prepare) c.spec.prepare(c); c.spec.enter(c); c.entered = true; } else if (c && c.spec.enter && c.spec.id === 'long-wait') c.spec.enter(c);
        }
      }), { threshold: [0, .35, .6] });
      $$('.card', wrap).forEach(el => { near.observe(el); seen.observe(el); });
    },
    // images above the target load while we travel and push it down: decode everything on the way first,
    // then glide, then correct once the layout has settled
    goTo(k) {
      const el = $(`.card[data-k="${k}"]`); if (!el) return;
      $$('.card').slice(0, k + 1).forEach(hydrate);
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      clearTimeout(this.fixT);
      const fix = n => { this.fixT = setTimeout(() => { if (Math.abs(el.getBoundingClientRect().top) > 6) el.scrollIntoView({ behavior: 'auto', block: 'start' }); if (n) fix(n - 1); }, 650); };
      fix(2);
    },
  };

  /* ================================================================== UI: top bar, ribbon contents, search, zoom, lamp */
  const UI = {
    courses: [[1, M.day.name], [2, M.first.name], [3, M.garden.name], [4, M.room.name], [5, 'The Twenty-Eight · Sauces'], [6, M.wait.name], [7, M.along.name + ' · ' + M.beyond.name], [8, M.last.name], [9, 'The bar · Good to know']],
    goTo(k) { if (mobile) Cards.goTo(k); else Book.goTo(k); },
    onSpread(s) {
      const live = $('#live');
      const name = s === 0 ? 'Cover' : s >= SP.length + 1 ? 'Back cover' : SP[s - 1].title;
      if (live) live.textContent = name;
      $$('#ribbonList [data-go], #strip [data-go]').forEach(b => { const on = +b.dataset.go === s; b.setAttribute('aria-current', String(on)); if (on && mobile) { const st = $('#strip'); st.scrollTo({ left: b.parentElement.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' }); } });
      const v = $('#tableVideo');
      if (v) { const on = s === 0 && !mobile; v.classList.toggle('on', on); if (on && !reduced) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); }
      document.documentElement.style.setProperty('--open', s > 0 && s < SP.length + 1 ? 1 : 0);
    },
    bind() {
      // ribbon: a cloth bookmark that unrolls into the contents (phones: the same courses as a strip under the bar)
      const rib = mobile ? null : $('#ribbon'), list = mobile ? $('#strip') : $('#ribbonList');
      list.innerHTML = this.courses.map(([k, n]) => `<li><button type="button" data-go="${k}">${esc(n)}</button></li>`).join('');
      const setRib = on => { if (!rib) return; rib.setAttribute('aria-expanded', String(on)); document.body.classList.toggle('rib-open', on); if (on) { const f = list.querySelector('button'); if (f) setTimeout(() => f.focus(), 60); } };
      if (rib) rib.addEventListener('click', () => setRib(rib.getAttribute('aria-expanded') !== 'true'));
      list.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (!b) return; setRib(false); this.goTo(+b.dataset.go); if (rib) rib.focus(); });
      // search the dishes (accents ignored); a hit turns to its spread and lights the dish
      const all = [];
      X.menu.forEach(s => { s.items.forEach(it => all.push({ it, s: s.name })); if (s.extras) s.extras.items.forEach(it => all.push({ it, s: s.extras.name })); });
      X.drinks.forEach(it => all.push({ it, s: 'The bar' }));
      const where = name => { const d = slug(name); const el = $(`${mobile ? '#cards' : '#sheets'} [data-dish="${d}"]`) || $(`${mobile ? '#cards' : '#sheets'} [data-dish-alt="${d}"]`); if (!el) return null; const host = el.closest('[data-k]') || el.closest('.sheet'); if (mobile) return { k: +host.dataset.k, el }; const sh = +host.dataset.i, back = !!el.closest('.face--b'); return { k: back ? sh + 1 : sh, el }; };
      const q = $('#q'), res = $('#results'), panel = $('#search'), sb = $('#btnSearch'), count = $('#resultsCount');
      const openSearch = on => { panel.hidden = !on; sb.setAttribute('aria-expanded', String(on)); if (on) setTimeout(() => q.focus(), 30); else sb.focus(); };
      sb.addEventListener('click', () => openSearch(panel.hidden));
      q.addEventListener('input', () => {
        const t = fold(q.value.trim());
        const hits = t.length < 2 ? [] : all.filter(a => fold(a.it.name + ' ' + (a.it.desc || '')).includes(t)).slice(0, 12);
        res.innerHTML = hits.map(h => `<li><button type="button" data-name="${esc(h.it.name)}"><span class="r__n">${esc(h.it.name)}</span><span class="r__s">${esc(h.s)}</span>${h.it.price ? `<span class="pr">${num(h.it.price)}</span>` : ''}</button></li>`).join('');
        count.textContent = t.length < 2 ? '' : hits.length ? `${hits.length} dish${hits.length > 1 ? 'es' : ''} match` : 'No dish matches';
      });
      res.addEventListener('click', e => {
        const b = e.target.closest('[data-name]'); if (!b) return; const w = where(b.dataset.name); openSearch(false); if (!w) return;
        this.goTo(w.k); setTimeout(() => { w.el.classList.remove('found'); void w.el.offsetWidth; w.el.classList.add('found'); }, mobile ? 500 : 900);
      });
      panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); openSearch(false); } });
      // sound
      const snd = $('#btnSound');
      const paintSnd = () => { snd.setAttribute('aria-pressed', String(Sound.on)); snd.setAttribute('aria-label', Sound.on ? 'Page sounds on' : 'Page sounds off'); snd.title = snd.getAttribute('aria-label'); };
      snd.addEventListener('click', () => { Sound.on = !Sound.on; try { localStorage.setItem('xxviii-live-sound', Sound.on ? '1' : '0'); } catch (e) { /* */ } paintSnd(); if (Sound.on) Sound.play('turn'); });
      paintSnd();
      ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => Sound.unlock(), { capture: true, passive: true }));
      if (window.MENU_PDF_MB) $$('[data-pdf]').forEach(a => { a.setAttribute('aria-label', `Download the printed menu (PDF, ${window.MENU_PDF_MB} MB)`); });
      // list view (phones): the whole menu as plain text
      const lb = $('#btnList');
      if (lb) lb.addEventListener('click', () => { const on = lb.getAttribute('aria-pressed') !== 'true'; lb.setAttribute('aria-pressed', String(on)); $('#list').hidden = !on; $('#cards').hidden = on; if (on && !$('#list').childElementCount) $('#list').innerHTML = listHTML(); });
      if (mobile) return;
      // keyboard: arrows turn pages unless a slider, a radio group or a text field has them
      addEventListener('keydown', e => {
        if (e.target.closest('input, textarea, [role="slider"], [role="tab"], .glass__w') || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === 'Escape') { if (document.body.classList.contains('rib-open')) { setRib(false); rib.focus(); return; } if (Book.zoom) { this.zoom(false); return; } }
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); Book.next(); }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); Book.prev(); }
        if (e.key === 'Home') { e.preventDefault(); Book.goTo(0); }
        if (e.key === 'End') { e.preventDefault(); Book.goTo(Book.N); }
        if (e.key === 'z' || e.key === 'Z') this.zoom(!Book.zoom);
      });
      // the page edges are buttons: a pointer press is a grab (handled by the drag), Enter / Space turns the page
      $('#prevPage').addEventListener('click', e => { if (e.detail === 0) Book.prev(); });
      $('#nextPage').addEventListener('click', e => { if (e.detail === 0) Book.next(); });
      $('#btnZoom').addEventListener('click', () => this.zoom(!Book.zoom));
      // the lamp: a warm pool of light that follows the pointer; the foil catches it
      const lamp = $('#lamp');
      const lx = gsap.quickTo(lamp, 'x', { duration: .9, ease: 'power3' }), ly = gsap.quickTo(lamp, 'y', { duration: .9, ease: 'power3' });
      const foil = $$('.foilg');
      addEventListener('pointermove', e => {
        lx(e.clientX); ly(e.clientY);
        const fx = (e.clientX / innerWidth - .5) * 900;
        foil.forEach(g => g.setAttribute('gradientTransform', `translate(${fx.toFixed(0)} 0) rotate(18 362 150)`));
        if (Book.zoom) { const cam = $('#camera'); gsap.to(cam, { yPercent: clamp(-(e.clientY / innerHeight - .5) * 46, -23, 23), duration: .8, ease: 'power3' }); }
      }, { passive: true });
      lx(innerWidth / 2); ly(innerHeight * .45);
      // hover lifts the cover's corner a few degrees: the book invites you to open it
      const cov = Book.sheets[0];
      $('#book').addEventListener('pointerover', e => { if (Book.s === 0 && e.target.closest('.cover') && !Book.moving.size && !Book.dragging) { cov.tgt = -9; Book.moving.add(cov); Book.loop(); } });
      $('#book').addEventListener('pointerout', e => { if (Book.s === 0 && e.target.closest('.cover') && !e.relatedTarget?.closest?.('.cover') && cov.tgt === -9) { cov.tgt = 0; Book.moving.add(cov); Book.loop(); } });
    },
    zoom(on) {   // the camera leans in over the book (no modal); the pointer pans
      Book.zoom = on ? 1 : 0;
      const cam = $('#camera'), b = $('#btnZoom');
      b.setAttribute('aria-pressed', String(!!on)); b.setAttribute('aria-label', on ? 'Step back from the book' : 'Lean in closer');
      document.body.classList.toggle('zoomed', !!on);
      const sc = on ? clamp((innerHeight * 1.5) / (Book.ph + 120), 1.2, 1.7) : 1;
      tw(cam, { scale: sc, yPercent: on ? 12 : 0, duration: on ? .9 : .6, ease: on ? EASE.softLand : EASE.glide });
    },
  };

  // plain-text list (phones: "List")
  const dish = (it, extra = '') => `<div class="d"><div class="d__row"><h3 class="d__n">${esc(it.name)}</h3>${price(it)}</div>${it.desc ? `<p class="d__desc">${esc(it.desc)}</p>` : ''}${extra}</div>`;
  const listHTML = () => X.menu.map(s => `<section class="ls"><h2>${esc(s.name)}</h2>${s.line ? `<p class="ls__l">${esc(s.line)}</p>` : ''}${s.items.map(it => dish(it, it.age ? `<p class="d__meta">${ageTag(it.age)}<span>${esc(it.weight)}</span></p>` : '')).join('')}${s.extras ? `<h3>${esc(s.extras.name)}</h3>${s.extras.items.map(it => dish(it)).join('')}` : ''}</section>`).join('') +
    `<section class="ls"><h2>The bar</h2>${X.drinks.map(d => dish(d)).join('')}</section>`;

  /* ================================================================== boot */
  function boot() {
    if (PRINT) {   // the printed menu: every page at 230 x 330 mm, final states, no motion
      document.documentElement.classList.add('is-print', 'rm');
      Print.build();
      const imgs = $$('img');
      window.__ready = Promise.all([document.fonts.ready].concat(imgs.map(im => (im.complete ? Promise.resolve() : new Promise(r => { im.onload = im.onerror = r; })))))
        .then(() => document.fonts.ready).then(() => { window.__readyFlag = true; return imgs.filter(i => !i.naturalWidth).map(i => i.src); });
      return;
    }
    document.documentElement.classList.add(mobile ? 'is-cards' : 'is-book');
    if (reduced) document.documentElement.classList.add('rm');
    if (mobile) { Cards.build(); $('#bookStage').remove(); }
    else { Book.build(); Book.bindDrag(); $('#cards').remove(); }
    UI.bind(); UI.onSpread(0);
    const v = $('#tableVideo');
    if (v && !mobile && !(navigator.connection && navigator.connection.saveData)) { v.poster = X.video('cowboy-cut', 'poster'); if (!reduced) { v.src = X.video('cowboy-cut', 'sd'); const p = v.play(); if (p && p.catch) p.catch(() => {}); } }
    else if (v) v.remove();
    document.documentElement.classList.add('ready');
  }
  /* ================================================================== PRINT: the same pages, 230 x 330 mm, for the PDF (print.html sets LIVE_PRINT) */
  const Print = {
    build() {
      const host = $('#book');
      const pages = [coverHTML()];
      SP.forEach((sp, j) => { const k = j + 1; pages.push(`<div class="pg pg--l" data-sp="${sp.id}">${sp.L(2 * k)}</div>`); pages.push(`<div class="pg pg--r" data-sp="${sp.id}">${sp.R(2 * k + 1)}</div>`); });
      pages.push(backHTML());
      host.innerHTML = pages.map((p, i) => `<section class="pp" id="p${i + 1}" data-n="${i + 1}">${p}</section>`).join('');
      hydrate(host);
      SP.forEach((sp, j) => { const c = ctxOf([host.children[2 * j + 1], host.children[2 * j + 2]], sp); if (sp.bind) sp.bind(c); });
      const n = pages.length;
      window.PLAN = {
        pages: n, front: [['Cover', 1], ['The dining room', 2]], back: [['Back cover', n]], pageLabels: { 1: 'Cover', 2: 'The dining room', [n]: 'Back cover' },
        chapters: [
          { no: 'I', title: M.day.name, page: 3, ids: ['day-one'], photo: X.img('wagyu-tallow-white', 'plated', 'md'), sections: [[M.day.items[0].name, 3]] },
          { no: 'II', title: M.first.name, page: 4, ids: ['first-course'], photo: X.img('steak-tartare', 'plated', 'md'), sections: [['Raw, cured and seared', 4], ['Marrow, prawns, oysters', 5]] },
          { no: 'III', title: M.garden.name, page: 6, ids: ['garden'], photo: X.interior('open-kitchen-chefs-counter', 'md'), sections: [['Soup, leaves, tomatoes', 6], ['The open kitchen', 7]] },
          { no: 'IV', title: M.room.name, page: 8, ids: ['ageing-room'], photo: X.dryage('room-rack-aisle', 'md'), sections: [['The glass room', 8], ['The board by the door', 9], [roomCuts[0].name, 10], [M.along.extras.name, 11]] },
          { no: 'V', title: M.wait.name, page: 12, ids: ['long-wait'], photo: X.block('sovereign-tomahawk', 'md'), sections: [['Châteaubriand and porterhouse', 12], ['Tomahawk and enhancements', 13]] },
          { no: 'VI', title: M.along.name, page: 14, ids: ['alongside'], photo: X.img('truffle-pommes-frites', 'plated', 'md'), sections: [['Sides', 14]] },
          { no: 'VII', title: M.beyond.name, page: 15, ids: ['beyond'], photo: X.img('lobster-thermidor', 'plated', 'md'), sections: [['Sea, lamb and risotto', 15]] },
          { no: 'VIII', title: 'How we cook your steak', page: 16, ids: [], photo: X.block('new-york-strip', 'md'), sections: [['Doneness', 16]] },
          { no: 'IX', title: M.last.name, page: 17, ids: ['last-course'], photo: X.img('dark-chocolate-fondant', 'plated', 'md'), sections: [['Desserts', 17]] },
          { no: 'X', title: 'The Bar', page: 18, ids: ['drinks'], photo: X.interior('bar', 'md'), sections: [[house.name + ' and the bar', 18]] },
          { no: 'XI', title: 'Good to know', page: 19, ids: ['notes'], photo: X.interior('entrance-host-stand', 'md'), sections: [['Prices, hours, private dining', 19]] },
        ],
      };
    },
  };
  // emptiness of each page: share of the content box (inside the margins) with nothing on it; photo grounds count as full
  window.__emptiness = pages => pages.map(pg => {
    if (pg.querySelector('.bg, .cover')) return 0;
    const inner = pg.querySelector('.pg-in') || pg, ir = inner.getBoundingClientRect(), pr = pg.getBoundingClientRect();
    const rects = $$('img, video, svg, h2, h3, p, dt, dd, li, .pr, .age-tag, .rail, .odo, .mac__w, .lw__f', pg).map(e => e.getBoundingClientRect()).filter(q => q.width > 0 && q.height > 0);
    const pad = pr.width * .025; let empty = 0, tot = 0;
    for (let y = ir.top + ir.height / 80; y < ir.bottom; y += ir.height / 40) for (let x = ir.left + ir.width / 56; x < ir.right; x += ir.width / 28) {
      tot++; if (!rects.some(q => x >= q.left - pad && x <= q.right + pad && y >= q.top - pad && y <= q.bottom + pad)) empty++;
    }
    return Math.round(empty / tot * 100);
  });
  // headings and names must never be clipped (ascenders, descenders) by a container
  window.__clipped = root => $$('h2, h3, .t__n, .bt__n, .barp__n, .t28__n, .hd__t', root).filter(e => !e.classList.contains('sr-only')).filter(e => {
    const r = e.getBoundingClientRect(); if (!r.width) return false;
    if (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2) return true;
    for (let p = e.parentElement; p && !p.classList.contains('pg') && !p.classList.contains('pp'); p = p.parentElement) {
      const cs = getComputedStyle(p); if (cs.overflow === 'visible' && cs.overflowY === 'visible') continue;
      const q = p.getBoundingClientRect(); if (r.top < q.top - 1 || r.bottom > q.bottom + 1 || r.left < q.left - 1 || r.right > q.right + 1) return true;
    }
    return false;
  }).map(e => e.textContent.trim().slice(0, 30));
  window.LIVE = { Book, Cards, UI, SP, Sound, Print, get mobile() { return mobile; } };   // for QA (tools/qa_live.js)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
