/* XXVIII · Twenty-Eight Steakhouse — "Ask the host" chat + floating dock (Menu book · Ask the host).
   Offline: a small natural-language engine over window.XXVIII and the page itself. No backend, no keys.
   Never invents facts: anything the data does not hold gets an honest "we'll confirm" answer with Call / Email.
   Only the dock renders at load; the panel is built on first open; media load only when an answer shows them. */
(function () {
  'use strict';
  var X = window.XXVIII, d = document, root = d.documentElement;
  if (!X) return;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHONE = matchMedia('(max-width: 767px)');
  var C = X.brand.contact;
  var TEL = 'tel:' + C.phone.replace(/[^\d+]/g, '');
  var MAIL = 'mailto:' + C.email;
  var MAPS = (window.XXVIII && XXVIII.brand.contact.mapsUrl) || 'https://www.google.com/maps/search/?api=1&query=Bonifacio+Global+City+Taguig';
  var MENU_BOOK = 'menu/index.html', MENU_PDF = 'menu/out/xxviii-menu.pdf';
  function S() { return window.XXSite || null; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nb(t) { return esc(t).replace(/ for (\S+)$/, ' for&nbsp;$1'); }
  function peso(n) { return X.peso(n); }

  /* ════════════════════ 1. KNOWLEDGE: dishes, sections, drinks ════════════════════ */
  var DISHES = [], SECTIONS = [];
  X.menu.forEach(function (s) {
    SECTIONS.push(s);
    s.items.forEach(function (it) { DISHES.push({ it: it, sec: s, extra: false }); });
    if (s.extras) s.extras.items.forEach(function (it) { DISHES.push({ it: it, sec: s, extra: true, group: s.extras.name }); });
  });
  var STEAKS = DISHES.filter(function (x) { return x.it.age; });
  var SIG = STEAKS.filter(function (x) { return x.it.signature; })[0] || STEAKS[0];
  var DRINKS = X.drinks || [];

  /* ════════════════════ 2. NORMALISE + SPELL ════════════════════ */
  var UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    isa: 1, dalawa: 2, tatlo: 3, apat: 4, lima: 5, anim: 6, pito: 7, walo: 8, siyam: 9, sampu: 10 };
  var TENS = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var PHRASES = [
    [/\brib\s*eye\b/g, 'ribeye'], [/\bribay\b|\bribeyes\b|\brib-eye\b/g, 'ribeye'], [/\bfil+et+e?\s*min+i?on\b/g, 'filet mignon'], [/\bminion\b/g, 'mignon'],
    [/\bt\s*bone\b/g, 'porterhouse'], [/\bny\b/g, 'new york'], [/\bdry\s*ag(e|ed|ing|eing)\b/g, 'dryage'], [/\bdryag(e|ed|ing|eing)\b/g, 'dryage'],
    [/\bag(ing|eing)\s*room\b/g, 'ageingroom'], [/\bglass\s*room\b/g, 'ageingroom'], [/\bwell\s*done\b/g, 'welldone'], [/\bmedium\s*rare\b/g, 'mediumrare'],
    [/\bpa\s*reserve\b|\bpareserve\b|\bpa-reserve\b/g, 'reserve'], [/\bhow\s*much\b/g, 'howmuch'], [/\bhow\s*long\b/g, 'howlong'], [/\bilang\s*araw\b/g, 'howlong'],
    [/\bdress\s*code\b/g, 'dresscode'], [/\bgift\s*(cards?|vouchers?|cert\w*)\b/g, 'voucher'], [/\bhappy\s*hours?\b/g, 'happyhour'], [/\boutdoor\s*(seating|seats?|tables?|area)?\b|\bal\s*fresco\b|\bterrace\b/g, 'outdoor'],
    [/\blive\s*music\b|\blive\s*band\b/g, 'livemusic'], [/\bservice\s*charge\b/g, 'servicecharge'], [/\bemail\s*(address|add)\b|\be\s*mail\b/g, 'email'], [/\bzero\s*proof\b|\bnon\s*alcoholic\b|\balcohol\s*free\b|\bmocktails?\b|\bno\s*alcohol\b/g, 'zeroproof'],
    [/\bwhat(s| is)? good( here)?\b|\bfirst (visit|time)\b/g, 'recommend'], [/\bage (your|the) beef\b|\bin\s*house\b/g, 'dryage'], [/\bhow many (people|persons|pax)\b|\bilang tao\b|\bgood for how many\b/g, 'servesq'], [/\bwine\s*list\b/g, 'wine'], [/\bmenu\s*book\b|\bflip\s*book\b/g, 'menubook'],
    [/\bopen\s*kitchen\b/g, 'kitchen'], [/\bpart(y|ies)\s*of\b/g, 'partyof'], [/\btable\s*for\b/g, 'tablefor'], [/\bgroup\s*of\b|\bbarkada\s*of\b/g, 'partyof'],
    [/\bmost\s*expensive\b|\bpinakamahal\b/g, 'priciest'], [/\bless\s*than\b|\bbelow\b|\bunder\b|\bat\s*most\b|\bwithin\b|\bbudget\b/g, 'under'], [/\bmore\s*than\b|\babove\b|\bover\b/g, 'over'],
    [/\bfor\s*the\s*table\b/g, 'forthetable'], [/\bto\s*begin\b/g, 'tobegin'], [/\bfinal\s*act\b/g, 'finalact'], [/\bbutchers?\s*selection\b/g, 'butcherselection'],
    [/\bgood\s*(morning|afternoon|evening|day)\b/g, 'hello'], [/\bwhat\s*is\b|\bwhat's\b|\bwhats\b|\bano\s*ang\b|\bano\s*yung\b|\bexplain\b|\bmeaning\b|\bmean\b/g, ' whatis ']
  ];
  function normalise(q) {
    var s = String(q || '').toLowerCase();
    s = s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s;
    s = s.replace(/[’']/g, '').replace(/₱\s*/g, ' peso ').replace(/\bphp\b/g, ' peso ').replace(/(\d),(\d{3})/g, '$1$2');
    s = s.replace(/(\d+(?:\.\d+)?)\s*k\b/g, function (m, n) { return String(Math.round(parseFloat(n) * 1000)); });
    s = s.replace(/(\d{1,2}):(\d{2})/g, '$1 $2');
    s = s.replace(/[^a-z0-9\s]+/g, ' ');
    PHRASES.forEach(function (p) { s = s.replace(p[0], p[1]); });
    var t = s.split(/\s+/).filter(Boolean), out = [];
    for (var i = 0; i < t.length; i++) {
      if (TENS[t[i]] != null) { var v = TENS[t[i]]; if (UNITS[t[i + 1]] != null && UNITS[t[i + 1]] < 10) { v += UNITS[t[i + 1]]; i++; } out.push(String(v)); }
      else if (UNITS[t[i]] != null) out.push(String(UNITS[t[i]]));
      else out.push(t[i]);
    }
    for (var k2 = 1; k2 < out.length; k2++) {
      if (/^\d+$/.test(out[k2 - 1]) && (out[k2] === 'thousand' || out[k2] === 'hundred')) { out[k2 - 1] = String(+out[k2 - 1] * (out[k2] === 'thousand' ? 1000 : 100)); out.splice(k2, 1); k2--; }
    }
    return out.join(' ');
  }
  function dl(a, b) { /* Damerau-Levenshtein (optimal string alignment) */
    var m = a.length, n = b.length; if (Math.abs(m - n) > 3) return 9;
    var dd = []; for (var i = 0; i <= m; i++) { dd[i] = [i]; } for (var j = 0; j <= n; j++) dd[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      dd[i][j] = Math.min(dd[i - 1][j] + 1, dd[i][j - 1] + 1, dd[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dd[i][j] = Math.min(dd[i][j], dd[i - 2][j - 2] + 1);
    }
    return dd[m][n];
  }
  function tol(w) { return w.length >= 10 ? 3 : w.length >= 7 ? 2 : w.length >= 4 ? 1 : 0; }

  /* concept lexicon: every surface word (English, Filipino, Taglish) -> concept */
  var LEX = {
    PRICE: 'price prices pricing cost costs howmuch magkano presyo expensive pricey cheap cheapest mura murang affordable peso pesos priciest under over spend',
    HOURS: 'open opening hours hour oras bukas sarado closed close closing tonight today ngayon now time times schedule sched',
    WHERE: 'where saan location located address directions direction map maps bgc taguig landmark',
    BOOK: 'reserve reservation reservations book booking table tablefor reserba seat seats slot available availability hold',
    AGE: 'age aged ageing days day howlong old older longest',
    RECO: 'recommend recommendation best signature masarap must try popular favourite favorite special suggest suggestion first',
    DRINK: 'drink drinks inumin cocktail cocktails bar alcohol bourbon gin rum beer wine wines zeroproof mocktail patience',
    DESSERT: 'dessert desserts matamis sweet sweets cake chocolate pudding',
    VEG: 'vegetarian vegan veggie gulay meatless salad salads plant',
    SEA: 'seafood fish isda lobster lobsters oyster oysters prawn prawns shrimp hipon crab sea bass',
    KIDS: 'kids kid child children anak bata toddler baby family',
    GROUP: 'group groups barkada party parties partyof celebration celebrate birthday bday kaarawan anniversary event events company',
    PRIVATE: 'private room function exclusive',
    PARK: 'parking park valet car',
    DRESS: 'dresscode dress attire wear smart casual formal',
    PAY: 'pay payment payments card cards credit debit cash gcash maya visa mastercard amex',
    CORK: 'corkage byob bring own',
    HALAL: 'halal pork kosher',
    GIFT: 'voucher vouchers',
    ALLERGY: 'allergy allergies allergic allergen allergens nut nuts gluten dairy lactose shellfish celiac',
    DONE: 'mediumrare welldone medium rare doneness temperature temp cooked cook bloody pink',
    DRYAGE: 'dryage ageingroom salt hanging hang rack racks butcher',
    NAME: 'name xxviii roman numeral numerals pronounce pronounced 28 called',
    ABOUT: 'about story values value philosophy who concept honesty craft gathering',
    CONTACT: 'contact phone call number email telephone landline',
    MENUBOOK: 'menubook pdf download print printable flipbook brochure',
    MENU: 'menu menus food dishes dish eat order',
    GREET: 'hello hi hey hiya kumusta kamusta musta yo greetings evening morning afternoon',
    THANKS: 'thanks thank salamat thx ty cheers appreciated',
    SAUCE: 'sauce sauces butter butters bearnaise bordelaise chimichurri peppercorn horseradish',
    SIDES: 'side sides alongside accompaniment accompaniments potato potatoes fries mash',
    ENH: 'enhancement enhancements addon addons add topping toppings extra extras',
    STEAKS: 'steak steaks cut cuts beef meat',
    OPENING: 'launch soon',
    COMPARE: 'or vs versus compare difference between better',
    WAIT45: 'share sharing forthetable',
    LIGHT: 'light lighter small smaller lean leaner',
    DATE: 'date dinner'
  };
  var CONCEPT = {}, VOCAB = {}, DOMAIN = {};
  /* common English / Taglish words are never corrected (wife -> wine, suck -> duck, make -> cake, seating -> sharing) */
  var COMMON = ('wife husband partner friend friends family make made making love around quiet help helped people person serve serves served suck sucks seating seat seats outdoor chef cook cooks happy hour email address card cards gift gifts it its '
    + 'next last this coming week weekend celebrating celebrate visit visiting flying fly from singapore manila here there good great nice lovely want wanna gonna gotta yo whats thing things item items cost '
    + 'live music band hiring job jobs service charge included robot bot human real agent talk speak someone vegan zero proof alcoholic free thousand hundred much many long time times '
    + 'tomorrow tmrw tonight today night evening lunch noon morning afternoon early late later soon sure okay ok yes no not none maybe please thank show tell book table tables seats for with '
    + 'name names number numbers address location place places hour hours open close closed sell sells buy offer offers have has get got bring take takes cut cuts aged age same also too both').split(' ');
  COMMON.forEach(function (w) { VOCAB[w] = 1; });
  /* everyday words are protected from spell-correction */
  'show me you your yours the is are was have has do does did what which who how get find see can could would will i my we our us they it its this that there here please po ba kayo ako tayo ang ng sa na lang yung mga and with without want like need give tell about some any all one more less than from at in on to of for by just also really very good nice'.split(' ').forEach(function (w) { VOCAB[w] = 1; });
  Object.keys(LEX).forEach(function (k) { LEX[k].split(' ').forEach(function (w) { (CONCEPT[w] = CONCEPT[w] || []).push(k); VOCAB[w] = 1; DOMAIN[w] = 1; }); });

  /* dish + section index */
  var WEAK = { cocktail: 1, steak: 1, sauce: 1, butter: 1, cream: 1, wild: 1, black: 1 };
  var STOP = { the: 1, for: 1, and: 1, of: 1, on: 1, a: 1, an: 1, with: 1, de: 1, in: 1, to: 1 };
  var DF = {};
  DISHES.forEach(function (x) {
    x.nn = normalise(x.it.name);
    x.toks = x.nn.split(' ').filter(function (w) { return !STOP[w]; });
    x.toks.forEach(function (w) { DF[w] = (DF[w] || 0) + 1; VOCAB[w] = 1; DOMAIN[w] = 1; });
  });
  function idf(w) { return Math.log(1 + DISHES.length / (DF[w] || 1)); }
  var SEC_ALIAS = { 'day-one': ['day 1', 'amuse bouche', 'amuse'], 'first-course': ['first course', 'tobegin', 'starters', 'starter', 'appetiser', 'appetisers', 'appetizer', 'appetizers', 'raw bar'],
    garden: ['from the garden', 'garden', 'soup', 'soups', 'soup and garden'], 'ageing-room': ['ageingroom', 'butcherselection', 'single cuts'], 'long-wait': ['long wait', 'forthetable', 'sharing cuts', 'to share', '45 day'],
    alongside: ['alongside', 'accompaniments'], beyond: ['beyond the ageingroom', 'beyond the fire', 'beyond', 'mains', 'not steak'], 'last-course': ['last course', 'finalact', 'desserts', 'dessert'] };
  Object.keys(SEC_ALIAS).forEach(function (k) { SEC_ALIAS[k].forEach(function (a) { a.split(' ').forEach(function (w) { VOCAB[w] = 1; DOMAIN[w] = 1; }); }); });
  DRINKS.forEach(function (k) { k.nn = normalise(k.name); });
  var VOCAB_LIST = Object.keys(DOMAIN).filter(function (w) { return w.length >= 4 && !/^\d+$/.test(w); });

  var DAY_WORDS = { sunday: 0, sun: 0, linggo: 0, monday: 1, mon: 1, lunes: 1, tuesday: 2, tue: 2, tues: 2, martes: 2, wednesday: 3, wed: 3, miyerkules: 3, thursday: 4, thu: 4, thurs: 4, huwebes: 4, friday: 5, fri: 5, biyernes: 5, saturday: 6, sat: 6, sabado: 6 };
  var MON = { jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11 };
  function correct(w) {
    if (VOCAB[w] || DAY_WORDS[w] != null || MON[w] != null || /\d/.test(w) || w.length < 4) return w;
    var best = null, bd = 9, t = tol(w);
    for (var i = 0; i < VOCAB_LIST.length; i++) {
      var v = VOCAB_LIST[i];
      if (Math.abs(v.length - w.length) > t) continue;
      if (w.length <= 5 && v[0] !== w[0]) continue;
      var dv = dl(w, v); if (dv < bd || (dv === bd && best && v.length > best.length)) { bd = dv; best = v; }
    }
    if (best && bd <= t) return best;
    if (w.length >= 5) for (i = 0; i < VOCAB_LIST.length; i++) if (VOCAB_LIST[i].length > w.length && VOCAB_LIST[i].indexOf(w) === 0) return VOCAB_LIST[i];
    return w;
  }

  /* ════════════════════ 3. PARSE ════════════════════ */
  function parse(q) {
    var n = normalise(q), raw = n.split(' ').filter(Boolean);
    var toks = raw.map(correct);
    var con = {};
    toks.forEach(function (w) { (CONCEPT[w] || []).forEach(function (c) { con[c] = (con[c] || 0) + 1; }); });
    var text = ' ' + toks.join(' ') + ' ';
    return { q: q, n: n, toks: toks, text: text, con: con, has: function (c) { return !!con[c]; } };
  }
  function slots(P) {
    var t = P.text, o = {}, m;
    if ((m = t.match(/ (?:partyof|tablefor|for|of) (\d{1,2})(?! (?:am|pm|days?|nov|dec|jan|oct))\b/)) || (m = t.match(/ (\d{1,2}) (?:people|persons|person|pax|guests|guest|tao|adults|of us|katao)\b/))) o.party = +m[1];
    if (!o.party && P.has('BOOK') && (m = t.match(/ 4 (\d{1,2}) (?=tmrw|tomorrow|tonight|today|on|at|this|next|$)/))) o.party = +m[1];
    var nowS = S() && S().now, base = nowS ? nowS.utc : Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    var wd0 = new Date(base).getUTCDay();
    if (/ (tonight|today|ngayon|ngayong gabi) /.test(t)) o.utc = base;
    else if (/ (tomorrow|tmrw|bukas) /.test(t) && P.has('BOOK') || / (tomorrow|tmrw) /.test(t)) o.utc = base + 864e5;
    else {
      for (var w in DAY_WORDS) if (t.indexOf(' ' + w + ' ') >= 0 && !/^(sun|mon|sat|wed|tue|thu|fri)$/.test(w) || (t.indexOf(' ' + w + ' ') >= 0 && /^(sat|sun|mon|tue|wed|thu|fri)$/.test(w))) {
        var k = (DAY_WORDS[w] - wd0 + 7) % 7; if (k === 0 && / next /.test(t)) k = 7; o.utc = base + k * 864e5; o.dayWord = w; break;
      }
      if ((m = t.match(/ (\d{1,2}) (jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*) /)) || (m = t.match(/ (jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*) (\d{1,2}) /))) {
        var day = /^\d/.test(m[1]) ? +m[1] : +m[2], mo = MON[/^\d/.test(m[1]) ? m[2] : m[1]];
        if (mo != null && day >= 1 && day <= 31) { var y = new Date(base).getUTCFullYear(), u = Date.UTC(y, mo, day); if (u < base) u = Date.UTC(y + 1, mo, day); o.utc = u; }
      }
    }
    if ((m = t.match(/ (\d{1,2})(?: (\d{2}))? ?(am|pm) /)) || (m = t.match(/ (\d{1,2})(am|pm) /))) {
      var hh = +m[1] % 12, mm = m[3] ? +(m[2] || 0) : 0, ap = m[3] || m[2]; if (ap === 'pm') hh += 12; o.min = hh * 60 + mm;
    } else if ((m = t.match(/ (?:at|around|by) (\d{1,2})(?: (\d{2}))? /)) && +m[1] >= 1 && +m[1] <= 11) o.min = (+m[1] + 12) * 60 + (+m[2] || 0);
    if (/ (birthday|bday|kaarawan) /.test(t)) o.occasion = 'Birthday';
    else if (/ anniversary /.test(t)) o.occasion = 'Anniversary';
    else if (/ (business|meeting|client|clients|corporate) /.test(t)) o.occasion = 'Business';
    else if (/ private /.test(t)) o.occasion = 'Private dining';
    return o;
  }
  function matchDishes(P) {
    var qset = {}; P.toks.forEach(function (w) { if (!STOP[w]) qset[w] = 1; });
    var res = [];
    DISHES.forEach(function (x) {
      var tot = 0, got = 0, rare = false, hits = 0;
      x.toks.forEach(function (w) { var wt = /^\d+$/.test(w) ? .3 : WEAK[w] ? .15 : idf(w); tot += wt; if (qset[w]) { got += wt; hits++; if (DF[w] === 1 && w.length >= 4 && !WEAK[w]) rare = true; } });
      if (!hits) return;
      var sc = got / tot;
      if (x.it.signature && / the 28 |xxviii|signature|house steak/.test(P.text)) sc = 1;
      if (sc >= .5 || rare) res.push({ x: x, sc: sc + (rare ? .2 : 0) });
    });
    if (/ (the 28|signature) /.test(P.text) && !res.some(function (r) { return r.x === SIG; })) res.push({ x: SIG, sc: 1.1 });
    res.sort(function (a, b) { return b.sc - a.sc; });
    if (res.length > 1 && res[0].sc - res[1].sc > .35 && res[1].sc < .65) res = res.slice(0, 1);
    return res.map(function (r) { return r.x; });
  }
  function matchSection(P) {
    var best = null;
    SECTIONS.forEach(function (s) {
      var al = [normalise(s.name)].concat(SEC_ALIAS[s.id] || []);
      al.forEach(function (a) { if (P.text.indexOf(' ' + a + ' ') >= 0 && (!best || a.length > best.len)) best = { s: s, len: a.length }; });
    });
    return best && best.s;
  }
  function matchDrink(P) {
    if (/ zeroproof /.test(P.text)) { for (var z = 0; z < DRINKS.length; z++) if (/zero-proof/i.test(DRINKS[z].desc)) return DRINKS[z]; }
    if (!P.has('DRINK') && !/ patience /.test(P.text)) return null;
    for (var i = 0; i < DRINKS.length; i++) if (P.text.indexOf(' ' + DRINKS[i].nn + ' ') >= 0) return DRINKS[i];
    return null;
  }
  function nearest(P, k) {
    var sc = DISHES.map(function (x) {
      var b = 9; P.toks.forEach(function (w) { if (w.length < 4) return; x.toks.forEach(function (v) { if (v.length >= 4) b = Math.min(b, dl(w, v) / Math.max(w.length, v.length)); }); });
      return { x: x, b: b };
    }).filter(function (r) { return r.b < .5; }).sort(function (a, b) { return a.b - b.b; });
    return sc.slice(0, k || 3).map(function (r) { return r.x; });
  }

  /* ════════════════════ 4. ANSWERS ════════════════════ */
  var CTX = { dish: null, section: null, party: null, intent: null };
  function btn(label, act, arg, kind) { return { label: label, act: act, arg: arg, kind: kind || '' }; }
  function bReserve(o) { return btn('Reserve a table', 'book', o || {}, 'solid'); }
  function bCall() { return btn('Call ' + C.phone, 'href', TEL); }
  function bEmail() { return btn('Email the team', 'href', MAIL); }
  function bMenuBook() { return btn('Open the menu book', 'href', MENU_BOOK); }
  function img(slug, kind, size) { return X.img(slug, kind || 'plated', size || 'md'); }
  function interior(slug, size) { return X.interior ? X.interior(slug, size || 'md') : ''; }
  function dryage(slug, size) { return X.dryage ? X.dryage(slug, size || 'md') : ''; }
  function hasVid(slug) { return !!(X.media && X.media.video && X.media.video[slug]) && typeof X.video === 'function'; }
  function ageTxt(it) { return it.age ? 'Aged ' + it.age + ' days' : ''; }
  function dishCard(x, opts) {
    opts = opts || {};
    var it = x.it, useVid = opts.video !== false && hasVid(it.img);
    return { type: 'dish', name: it.name, img: it.img ? img(it.img) : '', video: useVid ? it.img : null, age: it.age || null, weight: it.weight || '', serves: it.serves || '',
      price: peso(it.price), desc: it.desc || '', section: x.sec.name, note: it.note || '',
      buttons: [btn('See it on the menu', 'dish', it.name), it.age ? bReserve() : btn('Reserve a table', 'book', {})] };
  }
  function carousel(list, title) {
    return { type: 'carousel', title: title || '', items: list.slice(0, 8).map(function (x) { return { name: x.it.name, img: x.it.img ? img(x.it.img, 'plated', 'sm') : (x.it.cutout ? img(x.it.cutout, 'cutout', 'sm') : ''), meta: (x.it.age ? x.it.age + ' days · ' : '') + peso(x.it.price), ask: x.it.name }; }) };
  }
  function buttons(arr) { return { type: 'buttons', buttons: arr }; }
  function imageCard(src, alt, cap) { return { type: 'image', src: src, alt: alt || '', cap: cap || '' }; }
  function gallery(arr) { return { type: 'gallery', items: arr }; }
  function hoursCard() {
    var wd = S() && S().now ? S().now.wd : new Date().getDay();
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return { type: 'hours', rows: C.hours.map(function (h) {
      var parts = h.days.split(/\s*[–-]\s*/), a = DAYS.indexOf(parts[0]), b = parts[1] ? DAYS.indexOf(parts[1]) : a, on = false;
      for (var i = a, g = 0; g < 7 && a >= 0; i = (i + 1) % 7, g++) { if (i === wd) on = true; if (i === b) break; }
      return { days: h.days, time: h.time, today: on };
    }) };
  }
  function mapCard() { return { type: 'map', img: interior('entrance-host-stand', 'sm'), street: C.street, area: C.area, buttons: [btn('Get directions', 'href', MAPS, 'solid'), bCall()] }; }
  function numWord(n) { return ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  /* earliest and latest seating each day, from the hours in the data */
  function seatRange() {
    var site = S(); if (!site || !site.hours) return '';
    var DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], seen = {}, out = [];
    for (var wd = 0; wd < 7; wd++) { var h = site.hours[wd]; if (!h || !h.sessions.length) continue; var s = []; h.sessions.forEach(function (x) { for (var q = x.o; q <= x.c - 90; q += 30) s.push(q); }); if (!s.length) continue;
      var k = site.fmt(s[0]) + ' to ' + site.fmt(s[s.length - 1]); if (h.sessions.length > 1) k = h.sessions.map(function (x) { return site.fmt(x.o) + ' to ' + site.fmt(x.c - 90); }).join(' and '); (seen[k] = seen[k] || []).push(DN[wd]); }
    Object.keys(seen).forEach(function (k) { var d = seen[k]; out.push((d.length > 2 ? d[0] + ' to ' + d[d.length - 1] : d.join(' and ')) + ' ' + k); });
    return out.length ? ': ' + out.join('; ') : '';
  }
  function statusTxt() { var st = S() && S().status(); return st ? st.txt : ''; }
  function list(names) { return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]; }
  function unknown(topic, extra) {
    return { intent: 'unknown', text: 'I don’t have ' + topic + ' on record yet, and I would rather not guess. The team will confirm it for you.' + (extra ? ' ' + extra : ''),
      cards: [imageCard(interior('entrance-host-stand', 'sm'), 'The entrance and host stand'), buttons([bCall(), bEmail()])], chips: ['Are you open tonight?', 'Book a table', 'See the steaks'] };
  }
  var MAIN_CHIPS = ['See the steaks', 'Book a table', 'What is dry-ageing?', 'Are you open tonight?', 'The Twenty-Eight', 'Private room for 14', 'House cocktail', 'Where are you?'];

  function aDish(x, mode) {
    var it = x.it; CTX.dish = x; CTX.section = x.sec;
    var t;
    if (mode === 'serves') t = it.serves ? it.name + ' serves ' + it.serves + ' (' + it.weight + ').' : it.name + (it.weight ? ' is a ' + it.weight + ' cut for one' : ' is for one') + '; the cuts to share are on The Long Wait.';
    else if (mode === 'price') t = it.name + ' is ' + peso(it.price) + (it.weight ? ' for ' + it.weight : '') + (it.serves ? ', for ' + it.serves + ' to share' : '') + (it.note && it.price ? ' (' + it.note.toLowerCase() + ')' : '') + '.';
    else if (mode === 'age') t = it.age ? it.name + ' is dry-aged for ' + it.age + ' days' + (it.age >= 45 ? ', so please order early.' : '.') : it.name + ' is not one of our aged steaks; only the steaks carry an age. It is on ' + x.sec.name + '.';
    else t = it.name + (it.age ? ', aged ' + it.age + ' days' : '') + '. ' + (it.desc || '') + (it.price ? ' ' + peso(it.price) + (it.weight ? ' · ' + it.weight : '') + '.' : ' ' + peso(it.price) + '.');
    var chips = it.age ? ['How much is it?', 'Which sauces go with it?', 'Book a table', 'Compare with the ' + (it.img === 'prime-ribeye' ? 'strip' : 'ribeye')] : ['See the steaks', 'What else is on ' + x.sec.name + '?', 'Book a table'];
    if (mode === 'age') chips[0] = 'How much is it?';
    return { intent: mode === 'price' ? 'price' : mode === 'age' ? 'age' : mode === 'serves' ? 'serves' : 'dish', text: t, cards: [dishCard(x)], chips: chips };
  }
  function aSection(sec) {
    CTX.section = sec;
    var items = DISHES.filter(function (x) { return x.sec === sec && !x.extra; });
    var t = sec.name + ': ' + sec.line + ' ' + (items.length === 1 ? 'One dish' : items.length + ' dishes') + ' on it' + (sec.extras ? ', plus ' + sec.extras.name.toLowerCase() : '') + '.';
    return { intent: 'section', text: t, cards: [carousel(items, sec.name), buttons([btn('See it on the menu', 'section', sec.id, 'solid'), bMenuBook()])],
      chips: [sec.id === 'ageing-room' ? 'The Twenty-Eight' : 'See the steaks', 'Book a table', 'Download the menu'] };
  }
  function aSteaks() {
    var ages = STEAKS.map(function (x) { return x.it.age; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    return { intent: 'steaks', text: 'Every steak lists its age: ' + list(ages.map(String)) + ' days. ' + cap(numWord(STEAKS.filter(function (x) { return x.it.age < 45; }).length)) + ' single cuts in the ageing room, and ' + numWord(STEAKS.filter(function (x) { return x.it.age >= 45; }).length) + ' ' + ages[ages.length - 1] + '-day cuts to share.',
      cards: [carousel(STEAKS, 'The steaks')], chips: ['The Twenty-Eight', 'Which steaks are 45 days?', 'Cheapest steak', 'Ribeye or strip?', 'Book a table'] };
  }
  function aCompare(a, b) {
    CTX.dish = b;
    function line(x) { var it = x.it; return it.name + (it.age ? ' (' + it.age + ' days' + (it.weight ? ', ' + it.weight : '') + ')' : '') + ' at ' + peso(it.price) + (it.desc ? ': ' + it.desc.replace(/\.$/, '') : ''); }
    return { intent: 'compare', text: line(a) + '. ' + line(b) + '.', cards: [carousel([a, b], 'Side by side'), buttons([btn('See ' + a.it.name, 'ask', a.it.name), btn('See ' + b.it.name, 'ask', b.it.name)])],
      chips: ['How much is the ' + a.it.name.replace(/^The /, '') + '?', 'Book a table', 'See the steaks'] };
  }
  function aHours() {
    var st = statusTxt(), open = S() && S().open;
    var t = (st ? st + '. ' : '') + 'We are closed on Mondays. Times are Manila time.';
    return { intent: 'hours', text: t, cards: [hoursCard(), buttons([bReserve(), bCall()])], chips: ['Book a table', 'Where are you?', 'Are you open on Sunday?'] };
  }
  function aWhere() {
    return { intent: 'location', text: 'We are in ' + C.area + '. The street address is still a placeholder, so please call before you come: ' + C.phone + '.', cards: [mapCard()], chips: ['Are you open tonight?', 'Book a table', 'Is there parking?'] };
  }
  function aContact() {
    return { intent: 'contact', text: 'Phone ' + C.phone + ', email ' + C.email + '. These are preview placeholders until the owner confirms them.', cards: [buttons([bCall(), bEmail(), bReserve()])], chips: ['Are you open tonight?', 'Where are you?'] };
  }
  function aDryage() {
    var ages = STEAKS.map(function (x) { return x.it.age; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    var cap = (X.media && X.media.dryage) || {};
    return { intent: 'dryage', text: X.brand.story[0] + ' Our beef hangs in the glass ageing room beside the dining room, each cut tagged with its day. On the menu you will see ' + list(ages.map(String)) + ' days.',
      cards: [gallery([{ src: dryage('room-wide-feature-wall'), alt: cap['room-wide-feature-wall'] || 'The ageing room' }, { src: dryage('room-rack-aisle'), alt: cap['room-rack-aisle'] || 'Inside the ageing room' }]), buttons([btn('See the ageing board', 'go', 'ageing', 'solid'), btn('See the steaks', 'ask', 'See the steaks')])],
      chips: ['Which steaks are 45 days?', 'The Twenty-Eight', 'Why the name XXVIII?'] };
  }
  function aName() {
    return { intent: 'name', text: 'XXVIII is twenty-eight in Roman numerals: the days good beef needs. We write XXVIII on the sign and say Twenty-Eight. ' + X.brand.pronounce + '.',
      cards: [imageCard('assets/logo/xxviii-wordmark-brass.svg', 'The XXVIII wordmark'), buttons([btn('The Twenty-Eight steak', 'ask', 'The Twenty-Eight'), btn('What is dry-ageing?', 'ask', 'What is dry-ageing?')])], chips: ['What is dry-ageing?', 'See the steaks'] };
  }
  function aAbout() {
    var v = X.brand.values;
    return { intent: 'about', text: X.brand.story[1] + ' What we keep to: ' + v.map(function (x) { return x.name + ': ' + x.line; }).join(' '),
      cards: [imageCard(interior('main-dining-room'), 'The dining room'), buttons([btn('See the room', 'go', 'room', 'solid'), bReserve()])], chips: ['What is dry-ageing?', 'The Twenty-Eight', 'Book a table'] };
  }
  function aCocktail(drink) {
    var ck = X.brand.cocktail;
    if (drink && !drink.house) return { intent: 'drinks', text: drink.name + ': ' + drink.desc + ' ' + peso(drink.price) + '.', cards: [imageCard(interior('bar'), 'The bar'), buttons([btn('The house cocktail', 'ask', 'House cocktail'), bReserve()])], chips: ['House cocktail', 'What drinks do you have?'] };
    return { intent: 'drinks', text: ck.name + ', the house cocktail: ' + ck.line + ' ' + peso(ck.price) + '. Also at the bar: ' + DRINKS.filter(function (k) { return !k.house; }).map(function (k) { return k.name + ' (' + peso(k.price) + ')'; }).join(', ') + '.',
      cards: [imageCard(interior('bar'), 'The bar, where Patience is stirred'), buttons([btn('See it on the page', 'go', 'patience', 'solid'), bReserve()])], chips: ['Do you have a wine list?', 'Desserts', 'Book a table'] };
  }
  function aDessert() { return aSection(SECTIONS.filter(function (s) { return s.id === 'last-course'; })[0]); }
  function aSauces() {
    var sec = SECTIONS.filter(function (s) { return s.extras && /sauce/i.test(s.extras.name); })[0];
    var items = DISHES.filter(function (x) { return x.extra && x.sec === sec; });
    return { intent: 'sauces', text: sec.extras.name + ', to go with any steak: ' + items.map(function (x) { return x.it.name + ' ' + peso(x.it.price); }).join(', ') + '.', cards: [carousel(items, sec.extras.name), buttons([btn('See it on the menu', 'section', sec.id, 'solid')])], chips: ['Sides', 'Enhancements', 'See the steaks'] };
  }
  function aSides() {
    var sec = SECTIONS.filter(function (s) { return s.id === 'alongside'; })[0], items = DISHES.filter(function (x) { return x.sec === sec && !x.extra; });
    return { intent: 'sides', text: sec.line + ' ' + items.map(function (x) { return x.it.name + ' ' + peso(x.it.price); }).join(', ') + '.', cards: [carousel(items, 'Alongside'), buttons([btn('See it on the menu', 'section', sec.id, 'solid')])], chips: ['Sauces and butters', 'See the steaks'] };
  }
  function aEnh() {
    var lw = SECTIONS.filter(function (s) { return s.id === 'long-wait'; })[0], items = DISHES.filter(function (x) { return x.extra && x.sec === lw; });
    var first = items.filter(function (x) { return hasVid(x.it.img); })[0];
    var cards = [carousel(items, lw.extras.name)]; if (first) cards.unshift({ type: 'video', slug: first.it.img, title: first.it.name, cap: first.it.desc || '' });
    return { intent: 'enhancements', text: lw.extras.name + ', added to any steak: ' + items.map(function (x) { return x.it.name + ' ' + peso(x.it.price); }).join(', ') + '.', cards: cards.concat([buttons([btn('See them on the page', 'go', 'long-wait', 'solid')])]), chips: ['Sauces and butters', 'The Long Wait'] };
  }
  function aVeg(P) {
    var meaty = /beef|bacon|anchovy|lobster|tallow|wagyu|foie|marrow|crab|prawn|oyster|lamb|bass|steak|tenderloin|duck|lard|gelatin|chicken|pork|ham/i;
    var vegan = / vegan /.test(P ? P.text : '');
    var items = DISHES.filter(function (x) { return !x.it.age && !x.extra && /garden|alongside|beyond|last-course/.test(x.sec.id) && !meaty.test(x.it.name + ' ' + (x.it.desc || '')); });
    return { intent: 'vegetarian', text: (vegan ? 'Nothing on the menu is marked vegan, and many dishes use butter, cream or cheese, so please call before you come. ' : 'The menu does not mark dishes as vegetarian, so please check with your server. ') + 'Dishes whose description lists no meat or fish: ' + list(items.map(function (x) { return x.it.name; })) + '.',
      cards: [carousel(items, 'No meat or fish listed'), buttons([bCall()])], chips: ['Seafood', 'Allergies', 'Book a table'] };
  }
  function aSea() {
    var sea = /lobster|oyster|prawn|crab|sea bass|fish/i, items = DISHES.filter(function (x) { return sea.test(x.it.name + ' ' + (x.it.desc || '')); });
    return { intent: 'seafood', text: 'From the sea: ' + list(items.map(function (x) { return x.it.name + ' (' + peso(x.it.price) + ')'; })) + '.', cards: [carousel(items, 'From the sea')], chips: ['Something without beef', 'See the steaks', 'Book a table'] };
  }
  function aNoBeef() {
    var items = DISHES.filter(function (x) { return x.sec.id === 'beyond'; });
    return { intent: 'no-beef', text: 'Beyond the ageing room, for the table that wants something else: ' + list(items.map(function (x) { return x.it.name; })) + '.', cards: [carousel(items, 'Beyond the Ageing Room')], chips: ['Seafood', 'Vegetarian options'] };
  }
  function aAllergy() {
    return { intent: 'allergens', text: 'Please tell your server about any allergies before you order; the kitchen will guide you. You can also add them to the notes when you book. The menu does not list allergens yet, so for anything serious, call us first.',
      cards: [buttons([bCall(), btn('Book and add a note', 'book', {}, 'solid')])], chips: ['Vegetarian options', 'Seafood'] };
  }
  function aDone() {
    return { intent: 'doneness', text: 'We do not publish cooking temperatures here. Tell your server how you like your steak, or write it in the booking notes, and the kitchen will cook it that way.',
      cards: [imageCard(interior('open-kitchen-chefs-counter'), 'The open kitchen'), buttons([bReserve()])], chips: ['The Twenty-Eight', 'Which sauces go with steak?'] };
  }
  function aPrivate(P, o) {
    var party = (o && o.party) || CTX.party || 10;
    return { intent: 'private', text: 'The private room seats fourteen at one long table. ' + (party > 14 ? 'For more than fourteen, please call us.' : 'Send an enquiry and the team will confirm the room with you.'),
      cards: [imageCard(interior('private-dining-room'), 'The private room: one long table for fourteen'), buttons([party > 14 ? bCall() : btn('Enquire about the private room', 'book', { occasion: 'Private dining', party: Math.max(9, Math.min(14, party)) }, 'solid'), bCall()])],
      prefill: null, chips: ['Book a table', 'See the steaks', 'House cocktail'] };
  }
  function aMenu() {
    return { intent: 'menu', text: cap(numWord(SECTIONS.length)) + ' sections, from ' + SECTIONS[0].name + ' to ' + SECTIONS[SECTIONS.length - 1].name + '. Prices in Philippine pesos.', cards: [buttons(SECTIONS.map(function (s) { return btn(s.name, 'ask', s.name); })), buttons([bMenuBook(), btn('Download the menu (PDF)', 'href', MENU_PDF)])],
      chips: ['See the steaks', 'Desserts', 'House cocktail'] };
  }
  function aMenuBook() { return { intent: 'menubook', text: 'The menu book turns like the printed menu, and there is a PDF to keep.', cards: [imageCard(img('cowboy-cut', 'plated', 'sm'), 'The Twenty-Eight'), buttons([btn('Open the menu book', 'href', MENU_BOOK, 'solid'), btn('Download the menu (PDF)', 'href', MENU_PDF)])], chips: ['See the steaks', 'Book a table'] }; }
  function aOpening() {
    var op = S() && S().open;
    if (op) return { intent: 'opening', text: 'We open on ' + S().longDate(op.utc) + ', and reservations are open now. The first Twenty-Eights come out on opening night.', cards: [buttons([bReserve({ utc: op.utc })])], chips: ['See the steaks', 'Where are you?'] };
    if (S() && S().pending) return { intent: 'opening', text: 'Our opening date is still to be confirmed. Planned hours are below; the team will confirm before you book.', cards: [hoursCard(), buttons([bReserve()])], chips: ['See the steaks', 'Where are you?'] };
    return { intent: 'opening', text: 'We are open. ' + statusTxt() + '.', cards: [hoursCard(), buttons([bReserve()])], chips: ['Book a table', 'See the steaks'] };
  }
  function aGroup(P, o) {
    var p = o.party || CTX.party;
    if (p && p > 14) return { intent: 'group', text: 'For more than fourteen, please call us and we will plan it with you.', cards: [buttons([bCall(), bEmail()])], chips: ['Private room for 14'] };
    var r = aPrivate(P, o); r.intent = 'group';
    r.text = 'For a party of nine or more we take an enquiry rather than an instant booking. ' + r.text;
    return r;
  }
  function aBook(P, o, apply) {
    var site = S();
    if (o.party) CTX.party = o.party;
    var p = o.party || CTX.party;
    if (p && p > 14) return aGroup(P, o);
    var parts = [], warn = '';
    var allSlots = function (wd) { var h = site && site.hours && site.hours[wd], out = []; if (h) h.sessions.forEach(function (x) { for (var q = x.o; q <= x.c - 90; q += 30) out.push(q); }); return out; };
    var tomorrowBtn = null;
    if (o.utc != null && site) {
      var sl = site.slotsFor(o.utc), wd = new Date(o.utc).getUTCDay(), full = allSlots(wd);
      if (!full.length) { warn = 'We are closed on ' + ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][wd] + ', so I have left the date for you to choose. '; o.utc = null; o.min = null; }
      else if (!sl.length && o.utc === site.now.utc) { warn = 'Tonight’s last seating (' + site.fmt(full[full.length - 1]) + ') has passed, so please choose another day. '; o.utc = null; o.min = null; tomorrowBtn = btn('Tomorrow instead', 'ask', 'table for ' + (p || 2) + ' tomorrow'); }
      else if (o.min != null && sl.indexOf(o.min) < 0) { warn = (sl.length ? 'Seatings that day run from ' + site.fmt(sl[0]) + ' to ' + site.fmt(sl[sl.length - 1]) : 'There are no more seatings that day') + ', so I have left the time for you to pick. '; o.min = null; }
    } else if (o.min != null && site) {
      var ok = false; for (var dd = 0; dd < 7; dd++) if (allSlots(dd).indexOf(o.min) >= 0) ok = true;
      if (!ok) { warn = site.fmt(o.min) + ' is outside our seatings' + seatRange() + '. I have left the time for you to pick. '; o.min = null; }
    }
    if (p) parts.push(p + (p === 1 ? ' guest' : ' guests'));
    if (o.utc != null && site) parts.push(site.longDate(o.utc));
    if (o.min != null && site) parts.push(site.fmt(o.min));
    if (o.occasion) parts.push(o.occasion.toLowerCase());
    var pre = { party: p || null, utc: o.utc, min: o.min, occasion: o.occasion || null };
    var t = warn + (parts.length ? 'I have filled in the booking form: ' + parts.join(', ') + '. Add your name and number to hold it.' : 'Choose a date and time in the booking form; it takes a minute.') + (p >= 9 ? ' For nine or more it becomes a private-room enquiry.' : '');
    var res = { intent: 'reservation', text: t, cards: [imageCard(interior('main-dining-room', 'sm'), 'Where you will sit'), buttons([btn(parts.length ? 'Go to the booking form' : 'Reserve a table', 'book', pre, 'solid')].concat(tomorrowBtn ? [tomorrowBtn] : []).concat([bCall()]))],
      prefill: pre, chips: ['Table for 2 tonight', 'Table for 4 on Friday at 8pm', 'Private room for 14'].filter(function (c) { return c.toLowerCase() !== String(P.q).toLowerCase().trim(); }) };
    if (apply && site && parts.length) site.book({ party: pre.party, utc: pre.utc, min: pre.min, occasion: pre.occasion, go: false });
    return res;
  }
  function aPriceFilter(P) {
    var pool = P.has('STEAKS') || CTX.intent === 'steaks' ? STEAKS : DISHES.filter(function (x) { return x.it.price > 0; });
    var nums = (P.text.match(/ \d{3,6} /g) || []).map(function (x) { return +x; });
    if (/ (cheapest|mura|murang|cheap|affordable) /.test(P.text)) { var srt = pool.slice().sort(function (a, b) { return a.it.price - b.it.price; }), c = srt[0], ties = srt.filter(function (x) { return x.it.price === c.it.price; }); var noun = pool === STEAKS ? 'steak' : 'item';
      if (ties.length > 1) return { intent: 'price', text: 'The most affordable ' + noun + 's are ' + list(ties.map(function (x) { return x.it.name; })) + ', at ' + peso(c.it.price) + ' each.', cards: [carousel(ties, 'From ' + peso(c.it.price))], chips: ['Cheapest steak', 'See the steaks'] };
      var r = aDish(c, 'price'); r.intent = 'price'; r.text = 'The most affordable ' + noun + ' is ' + c.it.name + ', at ' + peso(c.it.price) + (c.it.weight ? ' for ' + c.it.weight : '') + '.'; return r; }
    if (/ priciest /.test(P.text) || / expensive /.test(P.text)) { var e = pool.slice().sort(function (a, b) { return b.it.price - a.it.price; })[0]; var r2 = aDish(e, 'price'); r2.text = 'The top of the menu: ' + r2.text; return r2; }
    if (nums.length && / under /.test(P.text) && / (for 2|2 people|couple) /.test(P.text)) { var lim2 = nums[0], side = DISHES.filter(function (x) { return x.sec.id === 'alongside' && !x.extra; }).sort(function (a, b) { return a.it.price - b.it.price; })[0], sauce = DISHES.filter(function (x) { return x.sec.id === 'alongside' && x.extra; }).sort(function (a, b) { return a.it.price - b.it.price; })[0];
      var fit = STEAKS.filter(function (x) { return x.it.price + side.it.price + sauce.it.price <= lim2; }).sort(function (a, b) { return b.it.price - a.it.price; });
      if (fit.length) return { intent: 'price', text: 'For two within ' + peso(lim2) + ': ' + fit[0].it.name + ' (' + peso(fit[0].it.price) + '), ' + side.it.name + ' (' + peso(side.it.price) + ') and ' + sauce.it.name + ' (' + peso(sauce.it.price) + '), ' + peso(fit[0].it.price + side.it.price + sauce.it.price) + ' before drinks.', cards: [carousel([fit[0], side, sauce], 'Within ' + peso(lim2))], chips: ['Cheapest steak', 'See the steaks'] }; }
    if (nums.length && / under /.test(P.text)) { var lim = nums[0], f = pool.filter(function (x) { return x.it.price <= lim; }).sort(function (a, b) { return b.it.price - a.it.price; });
      var nounS = pool === STEAKS ? (f.length === 1 ? 'steak' : 'steaks') : (f.length === 1 ? 'dish' : 'dishes'), cnt = f.length === 1 ? 'One' : String(f.length);
      return { intent: 'price', text: f.length ? cnt + ' ' + nounS + ' at ' + peso(lim) + ' or less' + (f.length <= 4 ? ': ' + list(f.map(function (x) { return x.it.name + ' (' + peso(x.it.price) + ')'; })) : '') + '.' : 'Nothing on the ' + (pool === STEAKS ? 'steak list' : 'menu') + ' at ' + peso(lim) + ' or less.', cards: [f.length ? carousel(f, 'Up to ' + peso(lim)) : carousel(pool.slice().sort(function (a, b) { return a.it.price - b.it.price; }), 'From the lowest price')], chips: ['Cheapest steak', 'See the steaks'] }; }
    if (nums.length && / over /.test(P.text)) { var lo = nums[0], g = pool.filter(function (x) { return x.it.price >= lo; });
      return { intent: 'price', text: g.length + ' ' + (pool === STEAKS ? 'steaks' : 'dishes') + ' at ' + peso(lo) + ' or more.', cards: [carousel(g, 'From ' + peso(lo))], chips: ['Cheapest steak', 'See the steaks'] }; }
    return null;
  }
  function aAgeFilter(P) {
    var m = P.text.match(/ (\d{2}) (?:days?|day) /) || P.text.match(/ (21|28|35|45) /);
    if (m) { var n = +m[1], f = STEAKS.filter(function (x) { return x.it.age === n; });
      if (f.length) return { intent: 'age', text: f.length === 1 ? f[0].it.name + ' is the ' + n + '-day steak.' : 'Aged ' + n + ' days: ' + list(f.map(function (x) { return x.it.name; })) + '.', cards: [f.length === 1 ? dishCard(f[0]) : carousel(f, 'Aged ' + n + ' days')], chips: ['How much are they?', 'Book a table', 'See the steaks'] }; }
    if (/ longest /.test(P.text) || / oldest /.test(P.text)) { var mx = Math.max.apply(null, STEAKS.map(function (x) { return x.it.age; })), g = STEAKS.filter(function (x) { return x.it.age === mx; });
      return { intent: 'age', text: 'The longest wait is ' + mx + ' days: ' + list(g.map(function (x) { return x.it.name; })) + ', cuts to share.', cards: [carousel(g, mx + ' days')], chips: ['The Long Wait', 'Book a table'] }; }
    return null;
  }
  function aReco(P) {
    if (P.has('WAIT45') || / 2 /.test(P.text) && / (share|sharing|couple|date) /.test(P.text)) { var lw = SECTIONS.filter(function (s) { return s.id === 'long-wait'; })[0]; var r = aSection(lw); r.intent = 'recommend'; r.text = 'To share: ' + r.text; return r; }
    if (P.has('LIGHT')) { var fl = DISHES.filter(function (x) { return /filet|sea bass/i.test(x.it.name); }); return { intent: 'recommend', text: 'Something lighter: ' + list(fl.map(function (x) { return x.it.name + ' (' + peso(x.it.price) + ')'; })) + '.', cards: [carousel(fl, 'Lighter')], chips: ['Seafood', 'Desserts'] }; }
    if (P.has('DESSERT')) return aDessert();
    var r2 = aDish(SIG); r2.intent = 'recommend';
    r2.text = 'The house steak: ' + SIG.it.name + ', ' + X.brand.signature.line.charAt(0).toLowerCase() + X.brand.signature.line.slice(1) + ' ' + peso(SIG.it.price) + '. With it, ' + X.brand.cocktail.name + ', the house cocktail.';
    r2.chips = ['House cocktail', 'Something to share', 'Book a table'];
    return r2;
  }
  function greet() {
    var h = S() && S().now ? Math.floor(S().now.min / 60) : new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    return { intent: 'greeting', text: g + '. I am the website’s host assistant for Twenty-Eight. Ask me about the steaks and their ages, the hours, or a table. ' + statusTxt() + '.',
      cards: [buttons([btn('See the steaks', 'ask', 'See the steaks', 'solid'), bReserve(), bMenuBook()])], chips: MAIN_CHIPS };
  }
  function fallback(P) {
    var near = nearest(P, 3), bs = near.map(function (x) { return btn(x.it.name, 'ask', x.it.name); });
    var lines = ['I am not sure I caught that.', 'I did not quite follow that one.', 'That one is beyond what this page holds.'];
    var lead = lines[(String(P.q).length) % lines.length];
    if (!bs.length) bs = [btn('See the steaks', 'ask', 'See the steaks', 'solid'), btn('Book a table', 'ask', 'Book a table'), bMenuBook()];
    return { intent: 'fallback', confidence: .2, text: lead + (near.length ? ' Did you mean one of these?' : ' Here is what I can help with, or call the team.'),
      cards: [buttons(bs.concat([bCall()]))], chips: MAIN_CHIPS.slice(0, 5) };
  }

  /* ════════════════════ 5. ROUTER ════════════════════ */
  function answer(q, apply) {
    var P = parse(q), o = slots(P), t = P.text, r = null, conf = .9;
    if (!P.toks.length) return fallback(P);
    var dishes = matchDishes(P), sec = matchSection(P), drink = matchDrink(P);
    var pronoun = / (it|that|this|them|those|its|yan|iyan|ito) /.test(t);
    var only = function (c) { return Object.keys(P.con).length === 1 && P.has(c); };
    var nconcepts = Object.keys(P.con).length;

    if (/ (suck|sucks|stupid|useless|idiot|dumb|bobo|tanga|wtf|shit|fuck|crap) /.test(t)) r = { intent: 'fallback', confidence: .3, text: 'I am sorry this has not helped. The team can answer anything I cannot, on ' + C.phone + '.', cards: [buttons([bCall(), bEmail(), btn('See the steaks', 'ask', 'See the steaks')])], chips: MAIN_CHIPS.slice(0, 4) };
    else if (/ (robot|bot|human|real person|agent|ai|someone|talk to|speak to) /.test(t)) r = { intent: 'assistant', text: 'I am the website’s host assistant, and I answer from what this page holds. For a person, call ' + C.phone + ' or email ' + C.email + '.', cards: [buttons([bCall(), bEmail()])], chips: MAIN_CHIPS.slice(0, 4) };
    else if ((P.has('GREET') && nconcepts === 1 && !dishes.length) || / start over /.test(t)) r = greet();
    else if (P.has('THANKS') && !dishes.length && nconcepts <= 2) r = { intent: 'thanks', text: 'You are welcome. Take your time; the table is yours.', cards: [buttons([bReserve(), bMenuBook()])], chips: MAIN_CHIPS.slice(0, 4) };
    else if (P.has('PRIVATE') && !P.has('PARK')) r = aPrivate(P, o);
    else if (P.has('ALLERGY')) r = aAllergy();
    else if (P.has('PARK')) r = unknown('parking details');
    else if (P.has('DRESS')) r = unknown('a dress code');
    else if (P.has('PAY')) r = unknown('the payment methods');
    else if (P.has('CORK')) r = unknown('a corkage policy');
    else if (P.has('HALAL')) r = unknown('halal certification');
    else if (P.has('GIFT')) r = unknown('gift vouchers');
    else if (/ wine /.test(t)) r = unknown('a wine list', 'At the bar today: Patience and three more drinks.');
    else if (P.has('KIDS') && !P.has('BOOK')) r = unknown('a children’s menu', 'The menu does not list one.');
    else if (/ happyhour /.test(t)) r = unknown('a happy hour');
    else if (/ chef /.test(t) && !dishes.length) r = unknown('the chef’s name', 'The kitchen is open to the room, so you will see the team at work.');
    else if (/ outdoor /.test(t)) r = unknown('outdoor seating');
    else if (/ livemusic /.test(t)) r = unknown('live music');
    else if (/ servicecharge /.test(t)) r = unknown('the service charge and VAT wording');
    else if (/ (hiring|job|jobs|career|careers|vacancy|apply) /.test(t)) r = unknown('vacancies');
    else if (/ (delivery|deliver|takeout|take out|takeaway|grab|foodpanda|wifi|pet|pets|dog|wheelchair|accessible) /.test(t)) r = unknown('that detail');
    else if (P.has('DONE')) r = aDone();
    else if ((P.has('BOOK') || (o.party && (P.has('GROUP') || CTX.intent === 'reservation' || / table /.test(t)))) && !(dishes.length && !P.has('BOOK'))) r = (o.party > 14 ? aGroup(P, o) : aBook(P, o, apply));
    else if ((o.party || o.utc != null || o.min != null) && (CTX.intent === 'reservation' || CTX.intent === 'private' || CTX.intent === 'group') && !dishes.length) r = aBook(P, o, apply);
    else if (P.has('GROUP') && !dishes.length && !P.has('MENU')) r = o.party && o.party < 9 ? aBook(P, o, apply) : aGroup(P, o);
    else if (P.has('OPENING') || / (when|kailan) (do|will)? ?(you)? ?open /.test(t) && / (when|kailan) /.test(t) && !P.has('BOOK')) r = aOpening();
    else if (P.has('HOURS') && !dishes.length && !P.has('MENU')) r = aHours();
    else if (/ ageingroom /.test(t) && !/ (menu|list|steaks) /.test(t)) r = aDryage();
    else if (P.has('NAME') && / (xxviii|roman|pronounce) /.test(t)) r = aName();
    else if (/ (email|phone|number|contact|telephone) /.test(t) && !dishes.length) r = aContact();
    else if (P.has('WHERE') && !dishes.length) r = aWhere();
    else if (P.has('CONTACT') && !dishes.length) r = aContact();
    else if (P.has('NAME') && !dishes.filter(function (x) { return x !== SIG; }).length && !P.has('PRICE') && / (name|xxviii|roman|pronounce|called|whatis 28|why 28) /.test(t)) r = aName();
    else if (P.has('RECO') && !dishes.length && !sec && (!/ whatis /.test(t) || / (best|recommend|must|favourite|favorite) /.test(t)) && !P.has('DRINK') && !P.has('DESSERT')) r = aReco(P);
    else if (P.has('DRYAGE') && !dishes.length && !(sec && !/ whatis /.test(t) && !/ (room|salt|hanging|rack|photo|see|where) /.test(t) && / ageingroom /.test(t) && / (menu|list|steaks) /.test(t))) r = aDryage();
    else if (P.has('MENUBOOK')) r = aMenuBook();
    else if (drink || (P.has('DRINK') && !dishes.length) || / patience /.test(t) && !/ (value|values) /.test(t)) r = aCocktail(drink);
    else if (/ servesq /.test(t) && !dishes.length && CTX.dish) r = aDish(CTX.dish, 'serves');
    else if (dishes.length === 1 && P.has('COMPARE') && CTX.dish && CTX.dish !== dishes[0]) r = aCompare(CTX.dish, dishes[0]);
    else if (dishes.length >= 2 && (P.has('COMPARE') || dishes.length === 2 && / (or|vs|versus) /.test(t))) r = aCompare(dishes[0], dishes[1]);
    else if (dishes.length === 1 || (dishes.length > 1 && dishes[0] === SIG && / (the 28|signature) /.test(t))) {
      var mode = P.has('PRICE') ? 'price' : (P.has('AGE') && !P.has('PRICE')) ? 'age' : (/^ and /.test(t) && (CTX.intent === 'price' || CTX.intent === 'age') ? CTX.intent : null);
      r = aDish(dishes[0], mode);
    }
    else if (dishes.length > 1 && !P.has('STEAKS') && !sec) { r = { intent: 'dish', text: 'A few dishes match that. Which one?', cards: [carousel(dishes.map(function (x) { return x; }), 'Did you mean')], chips: ['See the steaks', 'Book a table'] }; conf = .6; }
    else if ((P.has('PRICE') || P.has('AGE')) && !dishes.length && (pronoun || nconcepts <= 2) && CTX.dish && !/ (steaks|steak|cut|cuts|dish|dishes|menu) /.test(t) && !/ \d{3,} /.test(t) && !/ (cheapest|priciest|expensive|longest|cheap) /.test(t) && !(P.has('AGE') && / \d{2} /.test(t))) r = aDish(CTX.dish, P.has('PRICE') ? 'price' : 'age');
    else if (P.has('PRICE') && (r = aPriceFilter(P))) { }
    else if (P.has('AGE') && (r = aAgeFilter(P))) { }
    else if (P.has('SAUCE')) r = aSauces();
    else if (P.has('ENH')) r = aEnh();
    else if (P.has('SIDES') && !sec) r = aSides();
    else if (P.has('VEG')) r = aVeg(P);
    else if (/ (no beef|without beef|not beef|dont eat beef|walang beef|not steak|no steak) /.test(t)) r = aNoBeef();
    else if (P.has('SEA')) r = aSea();
    else if (sec) r = aSection(sec);
    else if (P.has('RECO') || P.has('WAIT45') || P.has('LIGHT') || P.has('DATE')) r = aReco(P);
    else if (P.has('DESSERT')) r = aDessert();
    else if (P.has('STEAKS')) r = aSteaks();
    else if (P.has('ABOUT') || / patience /.test(t)) r = aAbout();
    else if (P.has('MENU')) r = aMenu();
    else if (P.has('PRICE')) { r = aSteaks(); r.intent = 'price'; r.text = 'Steaks run from ' + peso(Math.min.apply(null, STEAKS.map(function (x) { return x.it.price; }))) + ' to ' + peso(Math.max.apply(null, STEAKS.map(function (x) { return x.it.price; }))) + '. ' + r.text; }
    else if (P.has('HOURS')) r = aHours();
    else if (P.has('GREET')) r = greet();
    else { r = fallback(P); conf = .2; }
    if (/ (and|also|plus|tsaka|at saka|as well) /.test(t) && r.intent !== 'fallback') {
      var extra = [], xtxt = [];
      if (P.has('HOURS') && r.intent !== 'hours' && r.intent !== 'opening' && r.intent !== 'reservation') { extra.push(hoursCard()); xtxt.push(statusTxt() + '.'); }
      if (P.has('WHERE') && r.intent !== 'location') { extra.push(mapCard()); xtxt.push('We are in ' + C.area + '.'); }
      if (P.has('PARK') && !/parking/.test(r.text)) xtxt.push('Parking details are still to be confirmed by the team.');
      if (P.has('DESSERT') && r.intent !== 'section') { var ds = SECTIONS.filter(function (x) { return x.id === 'last-course'; })[0]; extra.push(carousel(DISHES.filter(function (x) { return x.sec === ds; }), ds.name)); xtxt.push('For afters: ' + ds.name + '.'); }
      if (P.has('DRINK') && r.intent !== 'drinks') { xtxt.push(X.brand.cocktail.name + ', the house cocktail, is ' + peso(X.brand.cocktail.price) + '.'); extra.push(buttons([btn('The house cocktail', 'ask', 'House cocktail')])); }
      if (P.has('STEAKS') && r.intent !== 'steaks' && r.intent !== 'dish' && r.intent !== 'price' && r.intent !== 'age' && r.intent !== 'compare') { extra.push(carousel(STEAKS, 'The steaks')); xtxt.push('And the steaks, each with its age.'); }
      if (extra.length || xtxt.length) { r.text += ' ' + xtxt.join(' '); r.cards = (r.cards || []).concat(extra); }
    }
    if (r.confidence == null) r.confidence = conf;
    CTX.intent = r.intent;
    if (r.intent === 'section' && sec) CTX.section = sec;
    if (o.party) CTX.party = o.party;
    if (!r.cards || !r.cards.length) r.cards = [buttons([bReserve(), bMenuBook()])];
    return r;
  }
  window.__xxAsk = function (q, apply) {
    var r = answer(q, !!apply);
    return { intent: r.intent, confidence: r.confidence, text: r.text, cards: r.cards, chips: r.chips, prefill: r.prefill || null };
  };
  window.__xxReset = function () { CTX = { dish: null, section: null, party: null, intent: null }; };

  /* ════════════════════ 6. UI: dock (at load) ════════════════════ */
  var ICON_BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5c3-1 5.8-.7 8.5 1 2.7-1.7 5.5-2 8.5-1v13c-3-1-5.8-.7-8.5 1-2.7-1.7-5.5-2-8.5-1Z"/><path d="M12 6.5v13"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6"/></svg>';
  var dock = d.createElement('div');
  dock.className = 'xxdock';
  dock.innerHTML = '<a class="xxdock__book" href="' + MENU_BOOK + '" aria-label="Open the menu book">' + ICON_BOOK + '<span class="xxdock__book-txt">Menu book</span><span class="xxdock__tip" role="tooltip">The full menu, page by page</span></a>' +
    '<button class="xxdock__ask" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="xxchat" aria-label="Ask the host"><img src="assets/logo/xxviii-monogram-char.svg" alt="" width="512" height="512"><span class="xxdock__ask-txt">Ask the host</span></button>';
  d.body.appendChild(dock);
  var launcher = dock.querySelector('.xxdock__ask');
  try { if (!sessionStorage.getItem('xx-chat-cue')) setTimeout(function () { if (!panel || panel.hidden) { launcher.classList.add('is-cue'); try { sessionStorage.setItem('xx-chat-cue', '1'); } catch (e) { } setTimeout(function () { launcher.classList.remove('is-cue'); }, 2600); } }, 8000); } catch (e) { }
  /* 8 Nov mobile audit: tuck the dock away whenever it would sit on a button, a form field or a date/time chip */
  var tucking = false, HIT = 'a.btn, button.btn, input, select, textarea, label.chipr, label.tslot, .stepper, .bk-context, .booking__next a, .chip, .reel__toggle';
  (function () {
    var hero = document.querySelector('.hero'); if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) { es.forEach(function (e) { var dk = document.querySelector('.xxdock'); if (dk) dk.classList.toggle('is-hero', e.intersectionRatio > .45); }); }, { threshold: [0, .45, 1] }).observe(hero);
  })();
  function tuckCheck() {
    tucking = false;
    if (panel && !panel.hidden) { dock.classList.remove('is-tuck'); return; }
    var hit = false;
    Array.prototype.forEach.call(dock.querySelectorAll('.xxdock__ask, .xxdock__book'), function (el) {
      var r = el.getBoundingClientRect(); if (!r.width || hit) return;
      [[.5, .5], [.15, .2], [.85, .2], [.15, .8], [.85, .8]].forEach(function (f) {
        if (hit) return;
        var st = d.elementsFromPoint(r.left + r.width * f[0], r.top + r.height * f[1]);
        for (var i = 0; i < st.length; i++) { if (dock.contains(st[i])) continue; if (st[i].closest && st[i].closest(HIT)) hit = true; break; }
      });
    });
    dock.classList.toggle('is-tuck', hit);
  }
  function qTuck() { if (!tucking) { tucking = true; requestAnimationFrame(tuckCheck); } }
  window.addEventListener('scroll', qTuck, { passive: true });
  window.addEventListener('resize', qTuck);
  d.addEventListener('focusin', qTuck);
  setInterval(function () { if (!d.hidden) tuckCheck(); }, 350); /* reveals and swipes move buttons without a page scroll */

  /* ════════════════════ 7. UI: panel (built on first open) ════════════════════ */
  var panel = null, log, chipsBox, input, typing = null, HIST = [], videoIO = null, say, pill, lastBot = null, lockY = 0;
  function nearBottom() { return log.scrollTop + log.clientHeight >= log.scrollHeight - 60; }
  function scrollToMsg(m) { log.scrollTop = Math.max(0, m.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop - 12); }
  function lockPage() {
    lockY = window.scrollY || root.scrollTop;
    root.classList.add('xxchat-lock'); root.style.overflow = 'hidden';
    d.body.style.position = 'fixed'; d.body.style.top = (-lockY) + 'px'; d.body.style.left = '0'; d.body.style.right = '0'; d.body.style.width = '100%'; d.body.style.overflow = 'hidden';
  }
  function unlockPage() {
    if (!root.classList.contains('xxchat-lock')) return;
    root.classList.remove('xxchat-lock'); root.style.overflow = '';
    ['position', 'top', 'left', 'right', 'width', 'overflow'].forEach(function (k) { d.body.style[k] = ''; });
    var sb = root.style.scrollBehavior; root.style.scrollBehavior = 'auto'; window.scrollTo(0, lockY); root.style.scrollBehavior = sb;
  }
  function build() {
    panel = d.createElement('section');
    panel.className = 'xxchat'; panel.id = 'xxchat'; panel.hidden = true; panel.setAttribute('data-lenis-prevent', '');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'xxchat-title');
    panel.innerHTML = '<header class="xxchat__head"><img class="xxchat__mono" src="assets/logo/xxviii-monogram-brass.svg" alt="" width="512" height="512">' +
      '<div><h2 class="xxchat__title" id="xxchat-title">Ask the host</h2><p class="xxchat__sub">Answers from this website · bookings go through the form</p></div>' +
      '<button class="xxchat__close" type="button" aria-label="Close the chat"><span aria-hidden="true"></span></button></header>' +
      '<div class="xxchat__logwrap"><div class="xxchat__log" role="log" aria-live="off" tabindex="0" aria-label="Conversation"></div><button class="xxchat__new" type="button" hidden>New reply <span aria-hidden="true">↓</span></button></div>' +
      '<p class="sr-only" aria-live="polite" data-xx-say></p>' +
      '<div class="xxchat__chips" role="group" aria-label="Suggestions"></div>' +
      '<form class="xxchat__form" autocomplete="off"><label class="sr-only" for="xxchat-in">Ask a question</label><input id="xxchat-in" class="xxchat__in" type="text" maxlength="200" placeholder="Ask about steaks, hours or a table">' +
      '<button class="xxchat__send" type="submit" aria-label="Send">' + ICON_SEND + '</button></form>' +
      '<p class="xxchat__foot">Preview build: answers come from this website. For anything else, call ' + esc(C.phone) + '.</p>';
    d.body.appendChild(panel);
    log = panel.querySelector('.xxchat__log'); chipsBox = panel.querySelector('.xxchat__chips'); input = panel.querySelector('.xxchat__in');
    say = panel.querySelector('[data-xx-say]'); pill = panel.querySelector('.xxchat__new');
    pill.addEventListener('click', function () { pill.hidden = true; if (lastBot) scrollToMsg(lastBot); log.focus({ preventScroll: true }); });
    log.addEventListener('scroll', function () { if (nearBottom()) pill.hidden = true; }, { passive: true });
    /* wheel: never scroll the page behind; the log takes vertical wheel input, chip/carousel rows take horizontal */
    panel.addEventListener('wheel', function (e) {
      var tg = e.target, row = tg.closest('.xxcar__row, .xxchat__chips');
      if (row && (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY))) { if (row.scrollWidth <= row.clientWidth) e.preventDefault(); return; }
      if (tg.closest('.xxchat__chips') && !e.shiftKey) { e.preventDefault(); chipsBox.scrollLeft += e.deltaY; return; }
      if (!tg.closest('.xxchat__log')) { e.preventDefault(); log.scrollTop += e.deltaY; return; }
      if ((e.deltaY < 0 && log.scrollTop <= 0) || (e.deltaY > 0 && log.scrollTop + log.clientHeight >= log.scrollHeight - 1)) e.preventDefault();
    }, { passive: false });
    /* touch: the sheet never chains a swipe to the page */
    var ty = 0;
    panel.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchmove', function (e) {
      var tg = e.target; if (tg.closest('.xxcar__row, .xxchat__chips')) return;
      if (!tg.closest('.xxchat__log')) { e.preventDefault(); return; }
      var dy = ty - e.touches[0].clientY;
      if ((dy < 0 && log.scrollTop <= 0) || (dy > 0 && log.scrollTop + log.clientHeight >= log.scrollHeight - 1)) e.preventDefault();
    }, { passive: false });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); log.scrollTop += (e.key === 'PageUp' ? -1 : 1) * log.clientHeight * .85; }
    });
    panel.querySelector('.xxchat__close').addEventListener('click', function () { closeChat(); });
    panel.querySelector('.xxchat__form').addEventListener('submit', function (e) { e.preventDefault(); var v = input.value.trim(); if (v) { input.value = ''; send(v); } });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeChat(); return; }
      if (e.key === 'Tab' && PHONE.matches) {
        var f = Array.prototype.slice.call(panel.querySelectorAll('a[href], button:not([disabled]), input')).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    panel.addEventListener('click', onAction);
    if ('IntersectionObserver' in window) videoIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) { var v = en.target; if (RM) { if (en.isIntersecting && !v.getAttribute('src')) { v.preload = 'metadata'; v.src = X.video(v.getAttribute('data-vid'), 'sd'); } return; } if (en.isIntersecting && !panel.hidden) { if (!v.getAttribute('src')) v.src = X.video(v.getAttribute('data-vid'), 'sd'); var p = v.play(); if (p && p.catch) p.catch(function () { }); } else v.pause(); });
    }, { root: log, threshold: .4 });
    var restored = false;
    try { var h = JSON.parse(sessionStorage.getItem('xx-chat') || '[]'); if (h.length) { h.forEach(function (q) { renderUser(q); renderBot(answer(q, false), true); }); HIST = h; restored = true; } } catch (e) { }
    if (!restored) renderBot(greet(), true);
  }
  function openChat() {
    if (!panel) build();
    panel.hidden = false; panel.setAttribute('aria-modal', PHONE.matches ? 'true' : 'false');
    root.classList.add('xxchat-open'); launcher.setAttribute('aria-expanded', 'true');
    if (PHONE.matches) lockPage();
    requestAnimationFrame(function () { panel.classList.add('is-in'); });
    log.scrollTop = log.scrollHeight;
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function closeChat(noFocus) {
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-in'); panel.hidden = true; root.classList.remove('xxchat-open'); launcher.setAttribute('aria-expanded', 'false'); unlockPage();
    Array.prototype.forEach.call(panel.querySelectorAll('video'), function (v) { v.pause(); });
    if (!noFocus) launcher.focus();
  }
  launcher.addEventListener('click', function () { if (panel && !panel.hidden) closeChat(); else openChat(); });

  function renderUser(q) { var m = d.createElement('div'); m.className = 'xxmsg xxmsg--you'; m.innerHTML = '<p>' + esc(q) + '</p>'; log.appendChild(m); }
  function renderBot(r, instant) {
    var m = d.createElement('div'); m.className = 'xxmsg xxmsg--host';
    m.innerHTML = '<p>' + esc(r.text) + '</p>' + (r.cards || []).map(cardHTML).join('');
    lastBot = m;
    if (!instant && say) say.textContent = r.text;
    log.appendChild(m);
    Array.prototype.forEach.call(m.querySelectorAll('video'), function (v) { if (videoIO) videoIO.observe(v); });
    setChips(r.chips || MAIN_CHIPS, r._asked);
    Array.prototype.forEach.call(m.querySelectorAll('video'), function (v) { v.addEventListener('play', function () { if (!v.getAttribute('src')) { v.src = X.video(v.getAttribute('data-vid'), 'sd'); var pp = v.play(); if (pp && pp.catch) pp.catch(function () { }); } }); });
    if (instant) log.scrollTop = log.scrollHeight;
    return m;
  }
  function setChips(list, asked) {
    chipsBox.scrollLeft = 0;
    chipsBox.innerHTML = (list || []).filter(function (c) { return !asked || c.toLowerCase() !== String(asked).toLowerCase(); }).slice(0, PHONE.matches ? 3 : 4).map(function (c) { return '<button type="button" class="xxchip" data-ask="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
  }
  function send(q) {
    var wasBottom = nearBottom();
    renderUser(q);
    HIST.push(q); if (HIST.length > 30) HIST = HIST.slice(-30);
    try { sessionStorage.setItem('xx-chat', JSON.stringify(HIST)); } catch (e) { }
    var r = answer(q, true); r._asked = q;
    if (typing) typing.remove();
    typing = d.createElement('div'); typing.className = 'xxmsg xxmsg--host xxtyping'; typing.setAttribute('role', 'status'); typing.innerHTML = '<i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i><span class="sr-only">The host is typing</span>';
    log.appendChild(typing); if (wasBottom) log.scrollTop = log.scrollHeight;
    var delay = RM ? 150 : Math.max(400, Math.min(900, 300 + r.text.length * 3));
    setTimeout(function () { if (typing) { typing.remove(); typing = null; } var m = renderBot(r); if (wasBottom) { scrollToMsg(m); pill.hidden = true; } else pill.hidden = false; }, delay);
    return r;
  }
  window.__xxChat = { open: openChat, close: closeChat, send: function (q) { if (!panel || panel.hidden) openChat(); return send(q); } };

  function bHTML(b) {
    var cls = 'xxbtn' + (b.kind === 'solid' ? ' xxbtn--solid' : '');
    if (b.act === 'href') { var ext = /^https?:/.test(b.arg); return '<a class="' + cls + '" href="' + esc(b.arg) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + (/\.pdf$/.test(b.arg) ? ' download' : '') + '>' + esc(b.label) + '</a>'; }
    return '<button type="button" class="' + cls + '" data-act="' + b.act + '" data-arg="' + esc(typeof b.arg === 'object' ? JSON.stringify(b.arg) : b.arg) + '">' + esc(b.label) + '</button>';
  }
  function vidHTML(slug, title) {
    var poster = X.video(slug, 'poster');
    return '<div class="xxvid"><video data-vid="' + esc(slug) + '" poster="' + poster + '" muted loop playsinline preload="none" width="1920" height="1080" aria-label="' + esc(title) + ', a short film"' + (RM ? ' controls' : '') + '></video></div>';
  }
  function cardHTML(c) {
    if (c.type === 'buttons') return '<div class="xxbtns">' + c.buttons.map(bHTML).join('') + '</div>';
    if (c.type === 'dish') return '<article class="xxcard xxdish">' + (c.video ? vidHTML(c.video, c.name) : (c.img ? '<div class="xximg"><img src="' + c.img + '" alt="' + esc(c.name) + ', plated" width="800" height="800" loading="lazy" decoding="async"></div>' : '')) +
      '<div class="xxdish__body"><p class="xxdish__sec">' + esc(c.section) + '</p><h3 class="xxdish__name">' + nb(c.name) + '</h3>' +
      '<p class="xxdish__meta">' + (c.age ? '<span class="age-tag">Aged <b>' + c.age + '</b> days</span>' : '') + (c.weight ? '<span>' + esc(c.weight) + '</span>' : '') + (c.serves ? '<span>Serves ' + esc(String(c.serves)) + '</span>' : '') + '<span class="price">' + esc(c.price) + '</span></p>' +
      (c.desc ? '<p class="xxdish__desc">' + esc(c.desc) + '</p>' : '') + '<div class="xxbtns">' + c.buttons.map(bHTML).join('') + '</div></div></article>';
    if (c.type === 'carousel') return '<div class="xxcar">' + (c.title ? '<p class="xxcar__title">' + esc(c.title) + '</p>' : '') + '<ul class="xxcar__row">' + c.items.map(function (i) {
      return '<li><button type="button" class="xxcar__item" data-act="ask" data-arg="' + esc(i.ask) + '"><span class="xxcar__img">' + (i.img ? '<img src="' + i.img + '" alt="" width="420" height="420" loading="lazy" decoding="async">' : '') + '</span><span class="xxcar__name">' + nb(i.name) + '</span><span class="xxcar__meta">' + esc(i.meta) + '</span></button></li>';
    }).join('') + '</ul></div>';
    if (c.type === 'video') return '<figure class="xxcard xxvidcard">' + vidHTML(c.slug, c.title) + '<figcaption><b>' + esc(c.title) + '</b>' + (c.cap ? ' ' + esc(c.cap) : '') + '</figcaption></figure>';
    if (c.type === 'image') return '<figure class="xxcard xximgcard"><div class="xximg xximg--wide"><img src="' + c.src + '" alt="' + esc(c.alt) + '" loading="lazy" decoding="async"></div>' + (c.cap ? '<figcaption>' + esc(c.cap) + '</figcaption>' : '') + '</figure>';
    if (c.type === 'gallery') return '<div class="xxgal">' + c.items.map(function (i) { return '<div class="xximg xximg--wide"><img src="' + i.src + '" alt="' + esc(i.alt) + '" loading="lazy" decoding="async"></div>'; }).join('') + '</div>';
    if (c.type === 'hours') return '<table class="xxhours"><caption class="sr-only">Opening hours</caption><tbody>' + c.rows.map(function (r) { return '<tr' + (r.today ? ' class="is-today"' : '') + '><th scope="row">' + esc(r.days) + '</th><td>' + esc(r.time).replace(/ · /g, '<br>') + '</td></tr>'; }).join('') + '</tbody></table>';
    if (c.type === 'map') return '<article class="xxcard xxmap"><div class="xximg xximg--wide"><img src="' + c.img + '" alt="The entrance and host stand" loading="lazy" decoding="async"></div><div class="xxdish__body"><p class="xxmap__addr">' + esc(c.street) + '<br>' + esc(c.area) + '</p><div class="xxbtns">' + c.buttons.map(bHTML).join('') + '</div></div></article>';
    return '';
  }
  function onAction(e) {
    var b = e.target.closest('[data-ask], [data-act]'); if (!b) return;
    if (b.hasAttribute('data-ask')) { send(b.getAttribute('data-ask')); return; }
    var act = b.getAttribute('data-act'), arg = b.getAttribute('data-arg'), site = S();
    if (act === 'ask') { send(arg); return; }
    if (act === 'dish' && site) { if (PHONE.matches) closeChat(true); site.showDish(arg); return; }
    if (act === 'section' && site) { if (PHONE.matches) closeChat(true); site.showSection(arg); return; }
    if (act === 'go' && site) { if (PHONE.matches) closeChat(true); site.go(arg); return; }
    if (act === 'book' && site) { var o = {}; try { o = JSON.parse(arg || '{}'); } catch (x) { } if (PHONE.matches) closeChat(true); site.book(o); return; }
  }

  /* hide the dock during the intro sting and while the site index is open */
  function syncDock() { dock.classList.toggle('is-hidden', root.classList.contains('intro-on') || root.classList.contains('menu-open')); }
  if ('MutationObserver' in window) new MutationObserver(syncDock).observe(root, { attributes: true, attributeFilter: ['class'] });
  syncDock();
})();
