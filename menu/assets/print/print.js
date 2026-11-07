/* XXVIII printed menu (v2: legibility round) - builds the 24 pages from window.XXVIII (the shared menu data).
   Exposes window.PLAN (page plan -> book/book.json, also drives the reader's List view),
   window.__ready (fonts + images loaded) and window.__overflow() (text-fit check: must return []). */
(function () {
  'use strict';
  var X = window.XXVIII, B = X.brand, C = B.contact;
  var sec = function (id) { return X.menu.filter(function (s) { return s.id === id; })[0]; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  // prices: plain numbers (3,900); the currency is stated once, on the notes page
  var num = function (n) { return Number(n).toLocaleString('en-PH'); };
  var img = function (slug, kind) { return X.img(slug, kind || 'plated', 'lg'); };
  var price = function (it) { return it.price ? '<span class="price">' + num(it.price) + '</span>' : '<span class="price price--note">' + esc(it.note || 'Complimentary') + '</span>'; };
  var age = function (d) { return '<span class="age-tag">Aged <b>' + d + '</b> days</span>'; };
  var diamond = '<div class="rule-diamond" aria-hidden="true"><i></i></div>';
  var diamondW = function (w) { return '<div class="rule-diamond" aria-hidden="true" style="width:' + w + 'mm;margin:0 auto"><i></i></div>'; };

  var S = {
    day: sec('day-one'), first: sec('first-course'), garden: sec('garden'), room: sec('ageing-room'),
    wait: sec('long-wait'), along: sec('alongside'), beyond: sec('beyond'), last: sec('last-course')
  };
  var house = X.drinks.filter(function (d) { return d.house; })[0] || X.drinks[0];

  /* ---------------- page plan: chapters (courses) -> book.json contents + the reader's List view ----------------
     ids = the data sections a chapter lists (List view); photo = its header picture in the List view. */
  var PLAN = {
    pages: 24,
    front: [['Cover', 1], ['Our story', 2], ['Contents', 3]],
    back: [['Back cover', 24]],
    pageLabels: { 1: 'Cover', 2: 'Our story', 3: 'Contents', 24: 'Back cover' },
    chapters: [
      { no: 'I', title: S.day.name, page: 4, ids: ['day-one'], photo: X.img('wagyu-tallow-white', 'plated', 'md'), sections: [[S.day.items[0].name, 4]] },
      { no: 'II', title: S.first.name, page: 5, ids: ['first-course'], photo: X.img('steak-tartare', 'plated', 'md'), sections: [['Raw, cured and seared', 5], ['Marrow, prawns, oysters', 6], [S.first.items[0].name, 7]] },
      { no: 'III', title: S.garden.name, page: 8, ids: ['garden'], photo: X.img('french-onion-soup-gratinee', 'plated', 'md'), sections: [['Soup, leaves, tomatoes', 8]] },
      { no: 'IV', title: S.room.name, page: 9, ids: ['ageing-room'], photo: X.block('cowboy-cut', 'md'), sections: [['The board by the door', 9], [S.room.items[1].name, 10], [S.room.items[0].name, 11], ['Ribeye, strip, filet, picanha', 12]] },
      { no: 'V', title: S.wait.name, page: 13, ids: ['long-wait'], photo: X.block('sovereign-tomahawk', 'md'), sections: [['Sharing cuts, 45 days', 13], [S.wait.extras.name, 14], [S.wait.items[2].name, 15]] },
      { no: 'VI', title: S.along.name, page: 16, ids: ['alongside'], photo: X.img('truffle-pommes-frites', 'plated', 'md'), sections: [['Potatoes and gratin', 16], ['Macaroni and greens', 17], [S.along.extras.name, 18]] },
      { no: 'VII', title: S.beyond.name, page: 19, ids: ['beyond'], photo: X.img('lobster-thermidor', 'plated', 'md'), sections: [['Sea, lamb and risotto', 19]] },
      { no: 'VIII', title: S.last.name, page: 20, ids: ['last-course'], photo: X.img('dark-chocolate-fondant', 'plated', 'md'), sections: [['Desserts', 20]] },
      { no: 'IX', title: 'The Bar', page: 21, ids: ['drinks'], photo: X.texture('dark-slate-counter-smoke', 'md'), sections: [[house.name + ' and the bar', 21]] },
      { no: 'X', title: 'Good to know', page: 22, ids: ['notes'], photo: null, sections: [['How we cook your steak', 22], ['Prices, hours, private dining', 23]] }
    ]
  };
  window.PLAN = PLAN;
  var chOf = function (n) { var c = null; PLAN.chapters.forEach(function (x) { if (x.page <= n) c = x; }); return c; };

  /* ---------------- building blocks ---------------- */
  function page(n, cls, inner, opts) {
    opts = opts || {};
    var ch = chOf(n);
    var folio = opts.folio === false ? '' :
      '<footer class="folio"><span>' + esc(opts.folioText || (ch ? ch.title : 'Twenty-Eight')) + '</span><b>' + String(n).padStart(2, '0') + '</b></footer>';
    var ground = opts.ground ? '<div class="ground"><img src="' + opts.ground + '" alt="" decoding="sync"></div>' : '';
    return '<section class="pg ' + cls + '" id="p' + n + '" data-n="' + n + '">' + ground + inner + folio + '</section>';
  }
  function head(s, no, small, line) {
    return '<header class="sh' + (small ? ' sh--sm' : '') + '"><div class="no">' + no + '</div><h2>' + esc(s.name) + '</h2>' +
      ((line || s.line) ? '<p>' + esc(line || s.line) + '</p>' : '') + diamond + '</header>';
  }
  function dish(it) {
    return '<div class="dish"><h3>' + esc(it.name) + '</h3>' + price(it) +
      (it.desc ? '<p class="desc">' + esc(it.desc) + '</p>' : '') +
      (it.note && it.price ? '<div class="meta">' + esc(it.note) + '</div>' : '') + '</div>';
  }
  function cutImg(slug, cls, alt) { return '<img class="cut ' + (cls || '') + '" src="' + img(slug, 'cutout') + '" alt="' + esc(alt || '') + '" decoding="sync">'; }
  function steak(it) {
    var meta = age(it.age) + '<span class="wt">' + esc(it.weight) + '</span>' + (it.serves ? '<span>Serves ' + esc(it.serves) + '</span>' : '');
    return '<div class="steak"><div class="thumb">' + cutImg(it.cutout, '', it.name) + '</div><div><h3>' + esc(it.name) + '</h3><p class="desc">' + esc(it.desc) + '</p><div class="meta">' + meta + '</div></div>' + price(it) + '</div>';
  }
  function photoPage(n, src, alt, label, line) {
    return page(n, 'p-photo', '<div class="ph bleed"><img src="' + src + '" alt="' + esc(alt) + '" decoding="sync"></div>' +
      '<div class="cap"><div class="lbl">' + esc(label) + '</div><p>' + esc(line) + '</p></div>', { folio: false });
  }
  // tally marks: groups of five (four strokes and a slash), one mark per day in the ageing room
  function tally(days, of) {
    var out = '', x = 3, h = 44, y0 = 8;
    for (var g = 0; g < Math.ceil(of / 5); g++) {
      var gx = x;
      for (var k = 0; k < 4; k++) {
        var d = g * 5 + k + 1; if (d > of) break;
        out += '<line x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + (y0 + h) + '" class="' + (d <= days ? 'on' : 'off') + '"/>';
        x += 8;
      }
      var d5 = g * 5 + 5;
      if (d5 <= of) out += '<line x1="' + (gx - 4) + '" y1="' + (y0 + h - 6) + '" x2="' + (x - 4) + '" y2="' + (y0 + 6) + '" class="' + (d5 <= days ? 'on' : 'off') + '"/>';
      x += 7;
    }
    return '<svg viewBox="0 0 ' + x + ' 60" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><style>.on{stroke:#c29a5b;stroke-width:2.6;stroke-linecap:round}.off{stroke:rgba(239,231,218,.14);stroke-width:2.6;stroke-linecap:round}</style>' + out + '</svg>';
  }
  function gauge() {
    var cx = 120, cy = 112, r = 78, segs = ['Blue', 'Rare', 'Medium rare', 'Medium', 'Medium well'];
    var cols = ['#4a1216', '#7a1e24', '#9b2a31', '#8a6a3a', '#2a2421'];
    var temps = ['46–49°', '50–52°', '55–57°', '60–63°', '65–68°'];
    var pt = function (a, rr) { var t = a * Math.PI / 180; return [(cx + rr * Math.cos(t)).toFixed(2), (cy - rr * Math.sin(t)).toFixed(2)]; };
    var s = '<svg class="gauge" viewBox="0 0 240 132" role="img" aria-label="Doneness gauge: core temperatures in degrees Celsius"><defs>';
    segs.forEach(function (_, i) { var a = pt(180 - i * 36, r), b = pt(180 - (i + 1) * 36, r); s += '<path id="ga' + i + '" d="M' + a + ' A' + r + ' ' + r + ' 0 0 1 ' + b + '"/>'; });
    s += '</defs><g fill="none">';
    segs.forEach(function (_, i) { var a = pt(180 - i * 36 - .9, r), b = pt(180 - (i + 1) * 36 + .9, r); s += '<path d="M' + a + ' A' + r + ' ' + r + ' 0 0 1 ' + b + '" stroke="' + cols[i] + '" stroke-width="19"/>'; });
    s += '<path d="M' + pt(180, r + 12) + ' A' + (r + 12) + ' ' + (r + 12) + ' 0 0 1 ' + pt(0, r + 12) + '" stroke="#c29a5b" stroke-width=".5" opacity=".7"/>';
    for (var t = 0; t <= 40; t++) { var ang = 180 - t * 4.5, major = t % 8 === 0, a1 = pt(ang, r + 12), a2 = pt(ang, r + (major ? 18 : 15)); s += '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + a2[0] + '" y2="' + a2[1] + '" stroke="#c29a5b" stroke-width="' + (major ? .8 : .45) + '"/>'; }
    s += '</g>';
    segs.forEach(function (name, i) {
      s += '<text font-family="Big Shoulders" font-weight="700" font-size="6" letter-spacing=".8" fill="#efe7da" dy="2.1"><textPath href="#ga' + i + '" startOffset="50%" text-anchor="middle">' + name.toUpperCase() + '</textPath></text>';
      var m = pt(180 - i * 36 - 18, r + 27);
      s += '<text x="' + m[0] + '" y="' + m[1] + '" font-family="Big Shoulders" font-weight="700" font-size="9" fill="#c29a5b" text-anchor="middle" dominant-baseline="central">' + temps[i] + '</text>';
    });
    var tip = pt(90, r - 18);
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + tip[0] + '" y2="' + tip[1] + '" stroke="#c29a5b" stroke-width="1.2"/>';
    s += '<rect x="' + (cx - 3.6) + '" y="' + (cy - 3.6) + '" width="7.2" height="7.2" fill="#c29a5b" transform="rotate(45 ' + cx + ' ' + cy + ')"/>';
    s += '<text x="' + cx + '" y="' + (cy + 17) + '" font-family="Big Shoulders" font-weight="600" font-size="6" letter-spacing="1.6" fill="#a39686" text-anchor="middle">CORE TEMPERATURE · °C</text>';
    return s + '</svg>';
  }

  /* ---------------- the 24 pages ---------------- */
  var P = [], leather = X.texture('oxblood-tufted-leather', 'lg');
  // 1 cover: oxblood tufted leather, the mark in brass foil
  P.push(page(1, 'p-leather p-cover', '<div class="cv"><img class="logo foil" src="../assets/logo/xxviii-primary-brass.svg" alt="XXVIII Twenty-Eight Steakhouse">' +
    '<div class="foil">' + diamond + '</div><div class="menu-word foil">Menu</div></div><div class="cv-foot">' + esc(C.area) + '</div>', { folio: false, ground: leather }));

  // 2 story (charcoal slate ground)
  P.push(page(2, 'p-story', '<div class="ct"><div class="lbl">' + esc(B.name) + '</div>' +
    '<div class="story">' + B.story.map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('') + '</div>' +
    '<p class="honest">Every steak lists its age.</p>' +
    '<div class="values">' + B.values.map(function (v) { return '<div><b>' + esc(v.name) + '</b><span>' + esc(v.line) + '</span></div>'; }).join('') + '</div></div>',
    { folioText: 'Our story', ground: X.texture('charcoal-slate-stone', 'lg') }));

  // 3 contents (each line is a PDF link -> a page jump in the reader)
  P.push(page(3, 'p-contents', '<div class="ct"><header class="sh sh--sm"><div class="no">The menu</div><h2>Contents</h2>' + diamond + '</header>' +
    '<nav class="toc" aria-label="Contents"><ol>' + PLAN.chapters.map(function (c) { return '<li><a href="#p' + c.page + '"><i>' + c.no + '</i><span>' + esc(c.title) + '</span><em>' + c.page + '</em></a></li>'; }).join('') + '</ol></nav></div>', { folioText: 'Contents' }));

  // 4 day one
  var t0 = S.day.items[0];
  P.push(page(4, 'p-dayone', '<div class="ct">' + head(S.day, 'I', true) +
    '<div class="frame"><img src="' + img(t0.img) + '" alt="' + esc(t0.name) + '" decoding="sync"></div>' +
    '<div class="solo"><h3>' + esc(t0.name) + '</h3><p>' + esc(t0.desc) + '</p>' + price(t0) + '</div></div>'));

  // 5-6 the first course (three and three), 7 photo
  var fc = S.first.items;
  P.push(page(5, 'p-list', '<div class="ct">' + head(S.first, 'II') + '<div class="list">' + fc.slice(0, 3).map(dish).join('') + '</div>' +
    '<div class="foot-cut">' + cutImg(fc[1].cutout, '', fc[1].name) + '</div></div>'));
  P.push(page(6, 'p-list', '<div class="ct">' + head({ name: S.first.name }, 'II', true, 'Continued.') + '<div class="list">' + fc.slice(3).map(dish).join('') + '</div>' +
    '<div class="foot-cut">' + cutImg(fc[5].cutout, '', fc[5].name) + '</div></div>'));
  P.push(photoPage(7, img(fc[0].img), fc[0].name, fc[0].name + ' · ' + S.first.name, 'Cut by hand, the moment you order.'));

  // 8 from the garden
  P.push(page(8, 'p-list', '<div class="ct">' + head(S.garden, 'III') + '<div class="list">' + S.garden.items.map(dish).join('') + '</div></div>'));

  // 9 the ageing room: the glass board by the door, as type
  var cuts = S.room.items.concat(S.wait.items);
  P.push(page(9, 'p-room', '<div class="ct">' + head(S.room, 'IV', true) +
    '<div class="board"><div class="board__head"><span class="lbl">The board by the door</span><span class="lbl lbl-ash">Day</span></div>' +
    cuts.map(function (c) { return '<div class="brow"><div class="cutname">' + esc(c.name) + '<small>' + esc(c.weight) + (c.serves ? ' · serves ' + esc(c.serves) : '') + '</small></div>' + tally(c.age, 45) + '<div class="day">' + c.age + '</div></div>'; }).join('') +
    '<div class="board__sub">One mark for every day</div></div>' +
    '<p class="board-note">Weighed, aged and cut in the glass room by the entrance.</p></div>'));

  // 10 photo: prime ribeye on the block
  var rib = S.room.items[1];
  P.push(photoPage(10, X.block(rib.img, 'lg'), rib.name, rib.name + ' · ' + S.room.name, 'Thirty-five days in the glass room.'));

  // 11 the twenty-eight (house steak)
  var h28 = S.room.items[0];
  P.push(page(11, 'p-hero', '<div class="ct"><div class="lbl" style="text-align:center">The house steak</div>' +
    cutImg(h28.cutout, 'hero-cut', h28.name) +
    '<div class="hero-txt">' + age(h28.age) + '<h2>' + esc(h28.name) + '</h2><p>' + esc(h28.desc) + '</p>' +
    '<div class="hero-meta"><span>' + esc(h28.weight) + '</span>' + price(h28) + '</div></div>' +
    '<div class="card"><p>' + B.steakCardFor(h28.age).map(esc).join('<br>') + '</p><small>The card on every steak</small></div></div>', { folioText: S.room.name }));

  // 12 the other steaks
  P.push(page(12, 'p-steaks', '<div class="ct">' + head({ name: 'From the room' }, 'IV', true, 'Weight, age and price for every cut.') +
    '<div class="steaks">' + S.room.items.slice(1).map(steak).join('') + '</div></div>'));

  // 13 the long wait, 14 enhancements, 15 photo
  P.push(page(13, 'p-wait', '<div class="ct">' + head(S.wait, 'V', true) + '<div class="steaks">' + S.wait.items.map(steak).join('') + '</div></div>'));
  var ex = S.wait.extras;
  P.push(page(14, 'p-enh', '<div class="ct">' + head({ name: ex.name }, 'V', true, 'For any steak, from the room or the long wait.') +
    '<div class="enh">' + ex.items.map(function (i) { return '<div><div class="thumb">' + cutImg(i.cutout, '', i.name) + '</div><h3>' + esc(i.name) + '</h3><p class="desc">' + esc(i.desc) + '</p>' + price(i) + '</div>'; }).join('') + '</div></div>', { folioText: S.wait.name }));
  var tom = S.wait.items[2];
  P.push(photoPage(15, X.block(tom.img, 'lg'), tom.name, tom.name + ' · ' + S.wait.name, 'Forty-five days on the long bone.'));

  // 16-17 alongside (four and four), 18 sauces & butters
  var al = S.along.items;
  P.push(page(16, 'p-list', '<div class="ct">' + head(S.along, 'VI') + '<div class="list">' + al.slice(0, 4).map(dish).join('') + '</div>' +
    '<div class="foot-cut">' + cutImg(al[0].cutout, '', al[0].name) + '</div></div>'));
  P.push(page(17, 'p-list', '<div class="ct">' + head({ name: S.along.name }, 'VI', true, 'Continued.') + '<div class="list">' + al.slice(4).map(dish).join('') + '</div>' +
    '<div class="foot-cut">' + cutImg(al[4].cutout, '', al[4].name) + '</div></div>'));
  var sx = S.along.extras;
  P.push(page(18, 'p-sauces', '<div class="ct">' + head({ name: sx.name }, 'VI', true, 'One for the steak, one for the table.') + '<div class="list sauces">' +
    sx.items.map(function (i) { return '<div class="dish"><div class="s-img">' + cutImg(i.cutout || i.img, '', i.name) + '</div><h3>' + esc(i.name) + '</h3>' + price(i) + '</div>'; }).join('') +
    '</div></div>', { folioText: S.along.name }));

  // 19 beyond the ageing room, 20 the last course
  P.push(page(19, 'p-list', '<div class="ct">' + head(S.beyond, 'VII') + '<div class="list">' + S.beyond.items.map(dish).join('') + '</div></div>'));
  P.push(page(20, 'p-list', '<div class="ct">' + head(S.last, 'VIII') + '<div class="list">' + S.last.items.map(dish).join('') + '</div></div>'));

  // 21 patience + the bar (dark slate counter with smoke)
  P.push(page(21, 'p-bar', '<div class="ct"><div class="house"><div class="no">IX · The Bar</div><div class="lbl">The house cocktail</div><h2>' + esc(house.name) + '</h2><p>' + esc(B.cocktail.line) + '</p>' + price(house) + '</div>' +
    '<div class="more"><span class="lbl">Also from the bar</span>' + diamondW(50) + '<div class="list" style="margin-top:5mm">' +
    X.drinks.filter(function (d) { return d !== house; }).map(dish).join('') + '</div></div></div>', { folioText: 'The Bar', ground: X.texture('dark-slate-counter-smoke', 'lg') }));

  // 22 doneness + allergens
  var done = [['Blue', 'Seared hard outside, cool and deep red within.', '46–49 °C'], ['Rare', 'Cool red centre.', '50–52 °C'], ['Medium rare', 'Warm red centre. Our suggestion for aged beef.', '55–57 °C'], ['Medium', 'Warm pink centre.', '60–63 °C'], ['Medium well', 'A trace of pink.', '65–68 °C']];
  var dcol = ['#4a1216', '#7a1e24', '#9b2a31', '#8a6a3a', '#5c4a3c'];
  P.push(page(22, 'p-done', '<div class="ct">' + head({ name: 'How we cook your steak' }, 'X', true, 'Every steak rests before it reaches you.') + gauge() +
    '<div class="done-list">' + done.map(function (d, i) { return '<div><i style="background:' + dcol[i] + '"></i><b>' + d[0] + '</b><em>' + d[2] + '</em><span>' + d[1] + '</span></div>'; }).join('') + '</div>' +
    '<div class="note-box"><span class="lbl">Allergies and dietary needs</span><p>Please tell us about any allergy or dietary need before you order. Our kitchen handles nuts, gluten, dairy, eggs, fish and shellfish, so we cannot rule out traces.</p><p>Raw and lightly cooked meat, fish, shellfish and eggs may increase the risk of food-borne illness.</p></div></div>', { folioText: 'Good to know' }));

  // 23 notes
  var priv = (C.capacity.match(/private room for (\d+)/) || [])[1];
  P.push(page(23, 'p-notes', '<div class="ct"><div class="pron"><img src="../assets/logo/xxviii-wordmark-brass.svg" alt="XXVIII"><p>' + esc(B.pronounce) + '</p></div><div class="notes">' +
    /* PLACEHOLDER (confirm with the owner before print): currency, VAT, service-charge and discount wording. */
    '<!-- PLACEHOLDER: confirm VAT + 10% service charge + discount wording with the owner --><section><h3>Prices</h3><div><p>Prices in Philippine peso, inclusive of VAT and subject to a 10% service charge.</p><p class="muted">Senior citizen and PWD discounts as required by law. Weights are before cooking.</p></div></section>' +
    '<section><h3>Reservations</h3><div><dl><dt>Telephone</dt><dd>' + esc(C.phone) + '</dd><dt>Email</dt><dd>' + esc(C.email) + '</dd><dt>Online</dt><dd>' + esc(C.web) + '</dd><dt>Instagram</dt><dd>' + esc(C.instagram) + '</dd></dl></div></section>' +
    '<section><h3>Hours</h3><dl>' + C.hours.map(function (h) { return '<dt>' + esc(h.days) + '</dt><dd>' + esc(h.time) + '</dd>'; }).join('') + '</dl></section>' +
    (priv ? '<section><h3>Private dining</h3><div><p>A private room for up to ' + priv + ' guests, with the same unhurried evening.</p><p class="muted">Ask when you book.</p></div></section>' : '') +
    '<section><h3>Find us</h3><div><p>' + esc(C.street) + '</p><p class="muted">' + esc(C.area) + '</p></div></section>' +
    '</div></div>', { folioText: 'Good to know' }));

  // 24 back cover: leather to match the front
  P.push(page(24, 'p-leather p-back', '<div class="bk"><img class="foil" src="../assets/logo/xxviii-seal-brass.svg" alt="XXVIII seal"><div class="foil">' + diamondW(50) + '</div><p>' + esc(B.taglines[0]) + '</p></div>' +
    '<div class="bk-foot"><span class="lbl">' + esc(C.area) + '</span><span>' + esc(C.street) + '</span><span>' + esc(C.web) + ' · ' + esc(C.instagram) + '</span></div>', { folio: false, ground: leather }));

  document.getElementById('book').innerHTML = P.join('');

  /* ---------------- ready + overflow check ---------------- */
  var imgs = [].slice.call(document.images);
  window.__ready = Promise.all([document.fonts.ready].concat(imgs.map(function (im) {
    return im.complete ? Promise.resolve() : new Promise(function (r) { im.onload = im.onerror = r; });
  }))).then(function () { return document.fonts.ready; }).then(function () {
    window.__readyFlag = true;
    return imgs.filter(function (i) { return !i.naturalWidth; }).map(function (i) { return i.src; });
  });

  // every page: nothing crosses its page box; inside .ct nothing crosses the content box (above the folio);
  // no text box is clipped. Also reports the smallest description size in pt (must be >= 17).
  window.__overflow = function () {
    var r = [], d = function (e) { return (typeof e.className === 'string' ? e.className : e.tagName) + ':' + (e.textContent || '').trim().slice(0, 24); };
    [].forEach.call(document.querySelectorAll('.pg'), function (pg, i) {
      var b = pg.getBoundingClientRect(), n = i + 1, ct = pg.querySelector('.ct'), c = ct && ct.getBoundingClientRect();
      [].forEach.call(pg.querySelectorAll('*'), function (e) {
        if (e.closest('.bleed') || e.closest('.ground')) return;
        var q = e.getBoundingClientRect();
        if (!q.width && !q.height) return;
        if (q.left < b.left - .5 || q.right > b.right + .5 || q.top < b.top - .5 || q.bottom > b.bottom + .5) r.push([n, 'page-box', d(e)]);
        if (c && ct.contains(e) && e !== ct && !e.closest('.card') && (q.bottom > c.bottom + .5 || q.right > c.right + .5 || q.left < c.left - .5 || q.top < c.top - .5)) r.push([n, 'content-box', d(e), Math.round((q.bottom - c.bottom) / 3.78 * 10) / 10]);
        if (!(e instanceof SVGElement) && e.childElementCount === 0 && e.textContent.trim() && (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline')) r.push([n, 'text-clip', d(e)]);
      });
      if (ct && ct.scrollHeight > ct.clientHeight + 1) r.push([n, 'content-scroll', Math.round((ct.scrollHeight - ct.clientHeight) / 3.78 * 10) / 10 + 'mm']);
    });
    return r;
  };
  window.__typeCheck = function () {
    var px = function (sel) { return [].map.call(document.querySelectorAll(sel), function (e) { return parseFloat(getComputedStyle(e).fontSize) * .75; }); };
    var min = function (a) { return a.length ? Math.round(Math.min.apply(null, a) * 10) / 10 : null; };
    return { descPt: min(px('.dish .desc, .steak .desc, .enh .desc')), namePt: min(px('.dish h3, .steak h3, .enh h3')), pricePt: min(px('.price:not(.price--note)')), labelPt: min(px('.lbl, .no, .folio, .age-tag, .meta')) };
  };
})();
