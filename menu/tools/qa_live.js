/* Live menu book regression suite, v4 (food-led pages). Run by tools/run_qa.py, or in the console: await LIVEQA()
   Desktop: the 3D book (turns by key, click, drag, flick; inert faces; the ageing rail; films; furniture).
   Every spread: text inside its page, no clipped titles, no page more than 15 % empty.
   Phones: one scroll of course cards with a picture for every dish, and the rail. */
window.LIVEQA = async function LIVEQA() {
  const { Book: B, Sound, SP } = window.LIVE, X = window.XXVIII;
  const results = [], frames = {};
  const ok = (name, cond, info = '') => results.push({ name, pass: !!cond, info: typeof info === 'string' ? info : JSON.stringify(info) });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = async (cond, ms = 5000) => { const t0 = performance.now(); while (!cond() && performance.now() - t0 < ms) await wait(30); return cond(); };
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const num = n => Number(n).toLocaleString('en-PH');
  const dishes = [];
  X.menu.forEach(s => { s.items.forEach(i => dishes.push(i)); if (s.extras) s.extras.items.forEach(i => dishes.push(i)); });
  const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const norm = s => s.replace(/‑/g, '-').replace(/ /g, ' ');
  // text must stay inside its page's content box (photos may bleed; the page clips them on purpose)
  const outside = root => { const out = []; $$('.pg-in', root).forEach(pin => { const b = pin.getBoundingClientRect(); if (!b.width) return;
    $$('h2, h3, p, dt, dd, .pr, figcaption, a.btn', pin).forEach(e => { const q = e.getBoundingClientRect(); if (!q.width) return;
      if (q.bottom > b.bottom + 1.5 || q.top < b.top - 1.5 || q.right > b.right + 1.5 || q.left < b.left - 1.5) out.push(e.textContent.trim().slice(0, 28)); }); }); return out; };
  const W = innerWidth;
  ok('no horizontal scroll', document.documentElement.scrollWidth <= W, [document.documentElement.scrollWidth, W]);
  ok('pages are live HTML, not page images', !$$('img').some(i => /book\/(pages|md)\//.test(i.src + (i.dataset.src || ''))));
  ok('brand type only', $$('body *').every(e => { const f = getComputedStyle(e).fontFamily; return !e.textContent.trim() || /Gloock|Big Shoulders|Hanken/.test(f); }));
  const root = window.LIVE.mobile ? $('#cards') : $('#sheets');
  const pictured = dishes.filter(d => { const el = root.querySelector(`[data-dish="${slug(d.name)}"], [data-dish-alt="${slug(d.name)}"]`); return el && (el.querySelector('img, video') || el.closest('.pg').querySelector('img, video')); });
  ok('every dish in the data is pictured', pictured.length === dishes.length, dishes.filter(d => !pictured.includes(d)).map(d => d.name));
  const txt = norm(root.textContent);
  ok('every dish name and price from the data is set', [...dishes, ...X.drinks].every(i => txt.includes(i.name) && (!i.price || txt.includes(num(i.price)))), [...dishes, ...X.drinks].filter(i => !txt.includes(i.name)).map(i => i.name));
  ok('the interiors and all five shots of the dry-age room are used', ['interior/main-dining-room', 'interior/bar', 'interior/private-dining-room', 'interior/entrance-host-stand', 'interior/open-kitchen-chefs-counter',
    'dryage/room-wide-feature-wall', 'dryage/room-through-the-glass', 'dryage/room-rack-aisle', 'dryage/rib-crust-close-detail', 'dryage/room-butcher-moment'].every(s => $$('img', root).some(i => (i.src + (i.dataset.src || '')).includes(s))));
  ok('no cabinet: the ageing place is a room', !$$('img', root).some(i => /cabinet/.test(i.src + (i.dataset.src || ''))) && !/cabinet/i.test(root.textContent));
  ok('every menu page carries the currency and allergy line', $$('.pg', root).every(p => /Prices in PHP/.test(p.textContent) && /allergy/i.test(p.textContent)));

  // ---------------------------------------------------------------- phones: course cards
  if (window.LIVE.mobile) {
    ok('phone: course cards, no tiny book', !$('#book') && $$('.card', root).length === SP.length + 2);
    $$('.card img[data-src]').forEach(i => { i.src = i.dataset.src; i.removeAttribute('data-src'); });
    await wait(1500);
    const tiles = $$('.card .t__ph, .card .bt__ph, .card .dt__p, .card .lw__f').filter(e => e.offsetParent);
    const small = tiles.filter(e => e.getBoundingClientRect().width < W * .5);
    ok('phone: a big picture for every dish (no thumbnails)', !small.length, small.length);
    const smallT = [...$$('.bar a, .bar button')].filter(e => e.offsetParent).filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 40; });
    ok('phone: touch targets are at least 44 px', !smallT.length, smallT.map(e => e.id || e.textContent.trim()).slice(0, 5));
    const fs = $$('#cards .t__d').map(e => parseFloat(getComputedStyle(e).fontSize));
    ok('phone: descriptions at 16 px', Math.min(...fs) >= 16, Math.min(...fs));
    ok('phone: no text crosses its card', !outside(root).length, outside(root).slice(0, 6));
    ok('phone: no clipped titles', !window.__clipped(root).length, window.__clipped(root));
    ok('phone: one view only, the scroll (no list, no course strip, no page view)', !$('#btnList') && !$('#list') && !$('#strip') && !$('.bar__classic') && !$('#cards').hidden);
    const c4 = $('#c-4'); c4.scrollIntoView({ block: 'start' }); await until(() => Math.abs(c4.getBoundingClientRect().top) < 140, 4000);
    ok('phone: The Ageing Room card scrolls into view', Math.abs(c4.getBoundingClientRect().top) < 140, Math.round(c4.getBoundingClientRect().top));
    await wait(3000);
    const rail = $('#c-4 .rail'); rail.focus();
    for (let i = 0; i < 7; i++) rail.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    ok('phone: the ageing rail works from the keyboard (Day 21)', rail.getAttribute('aria-valuenow') === '21' && $$('#c-4 .bt.ready').length === 2, rail.getAttribute('aria-valuenow'));
    const f = results.filter(x => !x.pass);
    return { pass: results.length - f.length, fail: f.length, failed: f, results };
  }

  // ---------------------------------------------------------------- desktop: the book
  ok('book: 10 sheets, 20 live faces', B.N === 10 && $$('.sheet .face').length === 20);
  ok('closed: the cover, the book centred on it, no video behind it', B.s === 0 && /translateX\(-/.test($('#book').style.transform) && !$('video.table__video, #tableVideo'));
  ok('closed: only the cover is reachable', $$('.face').filter(f => !f.inert).length === 1);
  const g0 = $('.foilg').getAttribute('gradientTransform') || '';
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 300 }));
  ok('the foil catches the lamp', ($('.foilg').getAttribute('gradientTransform') || '') !== g0);
  const heard = [], realPlay = Sound.play.bind(Sound);
  Sound.play = k => heard.push(k);
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const settle = async s => { await until(() => B.s === s && !B.moving.size, 6000); await wait(80); };
  try {
    const tf = []; let last = performance.now(), on = true; const loop = t => { tf.push(t - last); last = t; if (on) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle(1); on = false; frames.coverOpen = tf.slice(2);
    ok('ArrowRight opens the cover (hard cover, thud)', B.s === 1 && (rm || heard.includes('thud')), heard);
    ok('open: exactly two faces reachable', $$('.face').filter(f => !f.inert).length === 2);
    heard.length = 0;
    await wait(100);
    const tt = []; let last2 = performance.now(), on2 = true; const loop2 = t => { tt.push(t - last2); last2 = t; if (on2) requestAnimationFrame(loop2); }; requestAnimationFrame(loop2);
    B.next(); await settle(2); on2 = false; frames.pageTurn = tt.slice(2);
    ok('next() turns one spread, with a page sound', B.s === 2 && heard[0] === 'turn', heard);
    const host = $('#book'), r = host.getBoundingClientRect(), y = r.top + r.height * .8, edgeR = $('#nextPage'), er = edgeR.getBoundingClientRect();
    const drag = async (id, dist, steps, dt) => {
      edgeR.dispatchEvent(new PointerEvent('pointerdown', { clientX: er.left + er.width / 2, clientY: y, pointerId: id, bubbles: true, button: 0, pointerType: 'mouse' }));
      for (let i = 1; i <= steps; i++) { host.dispatchEvent(new PointerEvent('pointermove', { clientX: er.left - dist * i / steps, clientY: y, pointerId: id, bubbles: true })); await wait(dt); }
      host.dispatchEvent(new PointerEvent('pointerup', { clientX: er.left - dist, clientY: y, pointerId: id, bubbles: true }));
    };
    await drag(7, r.width * .55, 12, 16); await settle(3);
    ok('drag: the release turns the page', B.s === 3, B.s);
    await drag(8, 60, 4, 60); await wait(1500);
    ok('a short, slow drag springs back', B.s === 3 && B.sheets[3].th === 0, { s: B.s, th: B.sheets[3].th });
    await drag(9, r.width * .22, 4, 12); await settle(4);
    ok('a quick flick carries the page over (momentum)', B.s === 4, B.s);

    // ---- the ageing room: the board counts up to Day 28; the rail moves the board
    await wait(2900);
    const rail = $('.rail', B.ctx[4].roots[0]);
    ok('the board counts up to Day 28 after the turn settles', rail.getAttribute('aria-valuenow') === '28', rail.getAttribute('aria-valuenow'));
    ok('opening state: every cut reads Ready (the long cuts hung earlier)', $$('.bt.ready', B.ctx[4].roots[1]).length === 8 && /hung earlier/.test(B.ctx[4].roots[1].textContent) && !/to go|Ready at/.test(B.ctx[4].roots[1].textContent));
    // text lines on the board keep at least 8 px between them
    const gaps = $$('.bt', B.ctx[4].roots[1]).map(bt => { const n = bt.querySelector('.bt__n').getBoundingClientRect(), m = bt.querySelector('.bt__m').getBoundingClientRect(); return Math.round(m.top - n.bottom); });
    ok('board: each name sits on one line, 8 px or more above its weight line', $$('.bt__n', B.ctx[4].roots[1]).every(h => h.getBoundingClientRect().height < parseFloat(getComputedStyle(h).fontSize) * 1.6) && gaps.every(g => g >= 8), gaps);
    const pgR = B.ctx[4].roots[1].getBoundingClientRect(), over = $$('.bt', B.ctx[4].roots[1]).filter(bt => { const c = bt.querySelector('figcaption'); return c.scrollWidth > c.clientWidth + 1 || bt.querySelector('.pr').getBoundingClientRect().right > pgR.right - 4; }).map(bt => bt.querySelector('.bt__n').textContent);
    ok('board: every name and price sits inside its row and the page', over.length === 0, over);
    rail.focus(); for (let i = 0; i < 7; i++) rail.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    ok('rail at Day 21 (moved by the guest): only the 21-day cuts are ready, the rest show their day', rail.getAttribute('aria-valuenow') === '21' && $$('.bt.ready', B.ctx[4].roots[1]).length === 2 && /Ready at 45 days/.test(B.ctx[4].roots[1].textContent));
    const tf2 = []; let last3 = performance.now(), on3 = true; const loop3 = t => { tf2.push(t - last3); last3 = t; if (on3) requestAnimationFrame(loop3); }; requestAnimationFrame(loop3);
    const rb = $('.rail__bar', rail).getBoundingClientRect();
    const down = new PointerEvent('pointerdown', { clientX: rb.left + 2, clientY: rb.top, pointerId: 11, bubbles: true, cancelable: true });
    rail.dispatchEvent(down);
    ok('a rail drag never starts a text selection', down.defaultPrevented && getComputedStyle(rail).userSelect === 'none');
    for (let i = 0; i <= 40; i++) { rail.dispatchEvent(new PointerEvent('pointermove', { clientX: rb.left + rb.width * i / 40, clientY: rb.top, pointerId: 11, bubbles: true })); await wait(16); }
    rail.dispatchEvent(new PointerEvent('pointerup', { clientX: rb.right, clientY: rb.top, pointerId: 11, bubbles: true }));
    await wait(300); on3 = false; frames.railDrag = tf2.slice(2);
    ok('dragging the rail to the end readies every cut (Day 45)', rail.getAttribute('aria-valuenow') === '45' && $$('.bt.ready', B.ctx[4].roots[1]).length === 8);

    // ---- every spread: full, food-led, nothing cut
    const empt = [], outs = [], clips = []; let films = [];
    for (let k = 1; k < B.N; k++) {
      B.goTo(k); await settle(k); await wait(250);
      const faces = B.ctx[k].roots;
      empt.push(...window.__emptiness(faces.map(f => f.querySelector('.pg'))));
      outs.push(...outside(faces[0]), ...outside(faces[1]));
      clips.push(...window.__clipped(faces[0]), ...window.__clipped(faces[1]));
      if (k === 6) {
        await wait(500);
        films = $$('video.film', faces[0]).concat($$('video.film', faces[1]));
        ok('the Long Wait cuts play on film while their spread is open (reduced motion: stills)', films.length === 3 && films.every(v => v.src && (rm ? v.paused : !v.paused)), films.map(v => v.paused));
      }
      if (k === 2) {
        const fs = $$('.t__d', faces[0]).concat($$('.t__d', faces[1])).map(e => parseFloat(getComputedStyle(e).fontSize));
        ok('descriptions on screen are at least 11 px', fs.length >= 6 && Math.min(...fs) >= 11, Math.min(...fs));
        const labs = $$('.rh, .fo__t, .mac figcaption, .sub', faces[0]).concat($$('.rh, .fo__t, .mac figcaption, .sub', faces[1])).map(e => parseFloat(getComputedStyle(e).fontSize));
        ok('labels on screen are at least 11 px', Math.min(...labs) >= 11, Math.min(...labs));
      }
    }
    ok('the films pause once the book moves on', films.length && films.every(v => v.paused));
    ok('no page is more than 15 % empty', empt.every(e => e <= 15), empt);
    ok('no text crosses its page', !outs.length, outs.slice(0, 8));
    ok('no clipped titles', !clips.length, clips);

    const rib = $('#ribbon'); rib.click(); await wait(80);
    ok('the ribbon unrolls the contents', rib.getAttribute('aria-expanded') === 'true' && $$('#ribbonList button').length === 9);
    $('#ribbonList [data-go="3"]').click(); await settle(3);
    ok('a ribbon line opens its course', B.s === 3 && rib.getAttribute('aria-expanded') === 'false');
    $('#btnSearch').click(); const q = $('#q'); q.value = 'chateaubriand'; q.dispatchEvent(new Event('input', { bubbles: true })); await wait(60);
    const hit = $('#results button');
    ok('search finds Châteaubriand', !!hit);
    if (hit) { hit.click(); await settle(6); await wait(900); }
    ok('search goes to the dish\'s home page (The Long Wait)', B.s === 6, B.s);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true })); await wait(1000);
    ok('Z: the camera leans in (no modal)', gsap.getProperty('#camera', 'scale') > 1.1 && !$('dialog[open]'));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(800);
    ok('Escape steps back', Math.abs(gsap.getProperty('#camera', 'scale') - 1) < .01);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); await settle(B.N); await wait(300);
    ok('End closes the book on the back cover', B.s === B.N && /translateX\(\d/.test($('#book').style.transform));
  } finally { Sound.play = realPlay; }
  const stat = a => { if (!a || !a.length) return null; const s = [...a].sort((x, y) => x - y); return { frames: a.length, avgMs: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), p95Ms: +s[Math.floor(s.length * .95)].toFixed(1), maxMs: +s[s.length - 1].toFixed(1) }; };
  const f = results.filter(x => !x.pass);
  return { pass: results.length - f.length, fail: f.length, failed: f, results, frames: { coverOpen: stat(frames.coverOpen), pageTurn: stat(frames.pageTurn), railDrag: stat(frames.railDrag) } };
};
