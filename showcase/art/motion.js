/* XXVIII motion artboards: ONE source for the footage stories, reels and video ads.
   - window.MOTION.plan[id]: the edit (segments, crop pan, overlay timing), read by showcase/tools/reels.py
   - MOTION.build(id): draws the artboard. Query: ?part=a,b (only those parts) &n=14 (day counter) &seg=0 &ov=1 (transparent, no footage)
     &still=1 (export frame) &fmt=f|s (video ads: 4:5 feed or 9:16 story).
   Footage: assets/video/<slug>-hd.mp4 (1920x1080). Each format crops a slice (cw) and drops it below a dark band (vt). */
(function () {
  var Q = new URLSearchParams(location.search);
  var LOGO = '../../assets/logo/xxviii-horizontal-bone.svg', MARK = '../../assets/logo/xxviii-primary-brass.svg';
  var FMT = {
    s: { w: 1080, h: 1920, vt: 385, vh: 1535 },   /* story / reel 9:16: crop 760 px of 1920, keep text in y 250..1520 */
    f: { w: 1080, h: 1350, vt: 300, vh: 1050 }    /* feed 4:5: crop 1111 px of 1920 */
  };
  for (var k in FMT) FMT[k].cw = Math.round(1080 * 1080 / FMT[k].vh);
  var LINK = '<svg viewBox="0 0 40 40" fill="none" stroke="#141110" stroke-width="3.2" stroke-linecap="round"><path d="M17 23l6-6"/><path d="M19 12l3-3a6 6 0 0 1 9 9l-3 3"/><path d="M21 28l-3 3a6 6 0 0 1-9-9l3-3"/></svg>';

  function segs(n) { var h = ''; for (var i = 1; i <= 28; i++) h += '<i class="' + (i <= n ? 'f' : '') + '"></i>'; return h; }
  function dots(n, last) { var h = ''; for (var i = 1; i <= 28; i++) h += '<i class="' + (i === 28 && last ? 'x' : i <= n ? 'f' : '') + '"></i>'; return h; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function head(F, label) {
    if (F === 'f') return '<img class="m-logo" style="right:64px;top:62px;width:170px" src="' + LOGO + '" alt="XXVIII">';
    return '<img class="m-logo" style="left:72px;top:272px" src="' + LOGO + '" alt="XXVIII">' + (label ? '<div class="m-lbl" style="right:72px;top:276px">' + label + '</div>' : '');
  }
  function end(F, h, l, sub) {
    var f = F === 'f';
    return '<div class="end">' +
      '<img class="mk" src="' + MARK + '" alt="XXVIII Twenty-Eight Steakhouse" style="top:' + (f ? 300 : 500) + 'px;width:' + (f ? 420 : 520) + 'px">' +
      '<div class="rule" style="top:' + (f ? 520 : 760) + 'px"></div>' +
      '<h1 class="eh" style="top:' + (f ? 570 : 820) + 'px;font-size:' + (f ? 104 : 116) + 'px">' + h + '</h1>' +
      '<div class="el" style="top:' + (f ? 830 : 1110) + 'px">' + l + '</div>' +
      (sub ? '<div class="es" style="top:' + (f ? 880 : 1166) + 'px">' + sub + '</div>' : '') + '</div>';
  }
  /* headline helpers per format */
  function H(F, html, size, top) { return '<h1 class="m-h" style="left:' + (F === 'f' ? 64 : 72) + 'px;top:' + top + 'px;font-size:' + size + 'px">' + html + '</h1>'; }
  function T(F, html, top, w) { return '<p class="m-sub" style="left:' + (F === 'f' ? 64 : 72) + 'px;top:' + top + 'px;width:' + (w || 900) + 'px">' + html + '</p>'; }
  function N(F, html, top) { return '<div class="m-num" style="left:' + (F === 'f' ? 64 : 72) + 'px;top:' + top + 'px">' + html + '</div>'; }
  function tag(n, left, top) { return '<div class="mtag" style="left:' + left + 'px;top:' + top + 'px"><i class="hole"></i><div class="k">AGED</div><div class="n">' + n + '</div><div class="d">DAYS</div></div>'; }

  /* ----- the plan ----- (ss = source start s, d = duration s, p0..p1 = pan across the slice, 0 = left, 1 = right) */
  var plan = {
    'story-01': { fmt: 's', out: 'stories/story-01', segs: [{ v: 'cowboy-cut', ss: .2, d: 7, p0: .36, p1: .48,
      ov: [{ part: 'base', at: .2 }, { part: 'n', from: 1, to: 14, at: .6, step: .17 }, { part: 'sub', at: 3.4 }] }],
      still: { parts: ['base', 'n', 'sub'], n: 14 } },
    'story-02': { fmt: 's', out: 'stories/story-02', segs: [{ still: 'base', d: 7, zoom: .04,
      ov: [{ part: 'poll', at: 1 }] }], still: { parts: ['base', 'poll'] } },
    'story-03': { fmt: 's', out: 'stories/story-03', segs: [{ v: 'new-york-strip', ss: .2, d: 7, p0: .44, p1: .56,
      ov: [{ part: 'base', at: .2 }, { part: 'n', from: 19, to: 25, at: .6, step: .3 }, { part: 'sub', at: 3.2 }] }], still: { parts: ['base', 'n', 'sub'], n: 25 } },
    'story-04': { fmt: 's', out: 'stories/story-04', segs: [{ v: 'chateaubriand-for-two', ss: .2, d: 7, p0: .38, p1: .6,
      ov: [{ part: 'base', at: .2 }, { part: 'head', at: .6 }, { part: 'link', at: 2 }] }], still: { parts: ['base', 'head', 'link'] } },

    'reel-a': { fmt: 's', out: 'reels/reel-a-worth-the-wait', segs: [
      { v: 'sovereign-tomahawk', ss: .2, d: 7, p0: .28, p1: .56, vt: 640, ov: [{ part: 'base', at: .3 }, { part: 't1', at: .9, out: 6.2 }] },
      { v: 'cowboy-cut', ss: .3, d: 7, p0: .36, p1: .5, ov: [{ part: 'base', at: 0 }, { part: 't2', at: .8, out: 6.3 }] },
      { end: 'end', d: 4.5 }] },
    'reel-b': { fmt: 's', out: 'reels/reel-b-every-steak-lists-its-age', segs: [
      { v: 'filet-mignon', ss: .3, d: 4.6, p0: .40, p1: .52, ov: [{ part: 'base', at: .2 }, { part: 'c1', at: .5, out: 4.2 }] },
      { v: 'new-york-strip', ss: .3, d: 4.6, p0: .42, p1: .55, ov: [{ part: 'base', at: 0 }, { part: 'c2', at: .5, out: 4.2 }] },
      { v: 'prime-ribeye', ss: .3, d: 4.6, p0: .44, p1: .56, ov: [{ part: 'base', at: 0 }, { part: 'c3', at: .5, out: 4.2 }] },
      { v: 'porterhouse-for-two', ss: .3, d: 4.8, p0: .38, p1: .56, vt: 700, ov: [{ part: 'base', at: 0 }, { part: 'c4', at: .5, out: 4.4 }] },
      { end: 'end', d: 3.6 }] },
    'reel-c': { fmt: 's', out: 'reels/reel-c-the-long-wait', segs: [
      { v: 'chateaubriand-for-two', ss: .2, d: 5.5, p0: .34, p1: .62, ov: [{ part: 'base', at: .3 }, { part: 'e1', at: .8, out: 5.1 }] },
      { v: 'porterhouse-for-two', ss: .3, d: 5, p0: .40, p1: .56, vt: 720, ov: [{ part: 'base', at: 0 }, { part: 'e2', at: .6, out: 4.6 }] },
      { v: 'black-truffle-shavings', ss: 1, d: 2.8, p0: .44, p1: .52, ov: [{ part: 'base', at: 0 }, { part: 'x1', at: .3, out: 2.5 }] },
      { v: 'bone-marrow-crust', ss: 1, d: 2.8, p0: .50, p1: .56, ov: [{ part: 'base', at: 0 }, { part: 'x2', at: .3, out: 2.5 }] },
      { v: 'foie-gras-crown', ss: 1, d: 2.8, p0: .44, p1: .52, ov: [{ part: 'base', at: 0 }, { part: 'x3', at: .3, out: 2.5 }] },
      { v: 'oscar-enhancement', ss: 1, d: 2.8, p0: .46, p1: .54, ov: [{ part: 'base', at: 0 }, { part: 'x4', at: .3, out: 2.5 }] },
      { end: 'end', d: 3.6 }] }
  };
  ['f', 's'].forEach(function (F) {
    var suf = F === 'f' ? 'feed' : 'story';
    plan['vad-1-' + F] = { fmt: F, id: 'vad-1', out: 'ads/video/meta-video-1-' + suf, segs: [
      { v: 'cowboy-cut', ss: .3, d: 6, p0: .36, p1: .5, ov: [{ part: 'base', at: 0 }, { part: 'h', at: .4 }, { part: 'sub', at: 1.6 }] }, { end: 'end', d: 2.6 }] };
    plan['vad-2-' + F] = { fmt: F, id: 'vad-2', out: 'ads/video/meta-video-2-' + suf, segs: [
      { v: 'porterhouse-for-two', ss: .3, d: 6, p0: .38, p1: .56, vt: F === 's' ? 720 : 0, ov: [{ part: 'base', at: 0 }, { part: 'h', at: .4 }, { part: 'sub', at: 1.6 }] }, { end: 'end', d: 2.6 }] };
    plan['vad-3-' + F] = { fmt: F, id: 'vad-3', out: 'ads/video/meta-video-3-' + suf, segs: [
      { v: 'prime-ribeye', ss: .3, d: 6, p0: .44, p1: .56, ov: [{ part: 'base', at: 0 }, { part: 'h', at: .4 }, { part: 'sub', at: 1.6 }] }, { end: 'end', d: 2.6 }] };
  });

  /* ----- the parts ----- */
  var P = {
    'story-01': {
      base: function (F) { return head(F, 'The ageing room'); },
      n: function (F, o) { return '<div class="segs" style="left:72px;width:936px;top:340px">' + segs(o.n) + '</div>' +
        '<div class="m-lbl" style="left:72px;top:372px;font-size:20px">Day 01</div><div class="m-lbl" style="right:72px;top:372px;font-size:20px">Day 28 · opening night</div>' +
        H(F, 'Day ' + pad(o.n) + '.', 230, 420); },
      sub: function (F) { return T(F, '<b>Halfway.</b> The first Twenty-Eights come out on Day 28, opening night.', 652, 900); }
    },
    'story-02': {
      base: function (F) { return '<div class="slate"></div>' + head(F, 'Tonight\'s question') + H(F, 'Which<br>butter?', 190, 330) +
        '<div class="cut cut-shadow" style="left:470px;top:600px;width:700px;transform:rotate(-7deg)"><img src="../../assets/img/cutout/cafe-de-paris-butter-lg.webp" alt=""></div>' +
        '<div class="cut cut-shadow" style="left:-150px;top:1390px;width:760px;transform:rotate(9deg)"><img src="../../assets/img/cutout/black-truffle-butter-lg.webp" alt=""></div>'; },
      poll: function () { return '<div class="stk" style="left:72px;top:1080px;width:936px;padding:34px 40px 40px"><div class="k">Poll · tap to vote</div>' +
        '<div class="opt"><span>Café de Paris</span><em>A</em></div><div class="opt"><span>Black truffle</span><em>B</em></div></div>'; }
    },
    'story-03': {
      base: function (F) { return head(F, 'The ageing room'); },
      n: function (F, o) { return '<div class="segs" style="left:72px;width:936px;top:340px">' + segs(o.n) + '</div>' +
        '<div class="m-lbl" style="left:72px;top:372px;font-size:20px">Day 01</div><div class="m-lbl" style="right:72px;top:372px;font-size:20px">Day 28</div>' +
        H(F, 'Day ' + pad(o.n) + ' <span style="font-size:.42em;color:var(--ash);word-spacing:.2em;margin-left:.1em">of 28</span>', 230, 420); },
      sub: function (F) { return T(F, '<b>Still.</b> Twenty-five days in the glass room. They come out on Day 28, opening night.', 652, 900); }
    },
    'story-04': {
      base: function (F) { return head(F, 'Reservations'); },
      head: function (F) { return H(F, 'Tables<br>are <em>open.</em>', 190, 320); },
      link: function (F) { return '<div class="link-chip" style="left:72px;top:696px">' + LINK + 'XXVIII.EXAMPLE/RESERVE</div>'; }
    },
    'reel-a': {
      base: function (F) { return head(F, 'Worth the wait'); },
      t1: function (F) { return H(F, 'Twenty-eight<br>days in the<br>ageing room.', 128, 330); },
      t2: function (F) { return H(F, 'The<br>Twenty-Eight.', 150, 330) + N(F, 'Bone-in ribeye · aged 28 days', 636); },
      end: function (F) { return end(F, 'Worth the wait.', 'Join The Ageing List', 'xxviii.example/list'); }
    },
    'reel-b': {
      base: function (F) { return head(F, 'Every steak lists its age'); },
      c1: function (F) { return tag(21, 72, 340) + '<h1 class="m-h" style="left:420px;top:356px;font-size:104px">Filet<br>mignon.</h1>' + '<div class="m-num" style="left:420px;top:570px">250 g · tenderloin</div>'; },
      c2: function (F) { return tag(28, 72, 340) + '<h1 class="m-h" style="left:420px;top:356px;font-size:104px">New York<br>strip.</h1>' + '<div class="m-num" style="left:420px;top:570px">350 g · firm, beefy</div>'; },
      c3: function (F) { return tag(35, 72, 340) + '<h1 class="m-h" style="left:420px;top:356px;font-size:104px">Prime<br>ribeye.</h1>' + '<div class="m-num" style="left:420px;top:570px">400 g · the richest cut</div>'; },
      c4: function (F) { return tag(45, 72, 340) + '<h1 class="m-h" style="left:420px;top:356px;font-size:104px">Porterhouse<br>for two.</h1>' + '<div class="m-num" style="left:420px;top:570px">1.1 kg · the Long Wait</div>'; },
      end: function (F) { return end(F, 'Every steak<br>lists its age.', 'Twenty-Eight · Bonifacio Global City'); }
    },
    'reel-c': {
      base: function (F) { return head(F, 'The Long Wait'); },
      e1: function (F) { return H(F, 'The Long<br>Wait.', 150, 330) + N(F, 'Châteaubriand for two · aged 45 days', 636); },
      e2: function (F) { return H(F, 'Carved at<br>the table.', 150, 330) + N(F, 'Porterhouse for two · aged 45 days', 636); },
      x1: function (F) { return '<div class="m-lbl br" style="left:72px;top:340px">Enhancements</div>' + H(F, 'Black truffle.', 120, 390) + N(F, 'Shaved at the table · ₱1,400', 540); },
      x2: function (F) { return '<div class="m-lbl br" style="left:72px;top:340px">Enhancements</div>' + H(F, 'Marrow crust.', 120, 390) + N(F, 'Marrow, herbs, crumb, torched · ₱550', 540); },
      x3: function (F) { return '<div class="m-lbl br" style="left:72px;top:340px">Enhancements</div>' + H(F, 'Foie gras crown.', 120, 390) + N(F, 'Seared foie gras on top · ₱1,200', 540); },
      x4: function (F) { return '<div class="m-lbl br" style="left:72px;top:340px">Enhancements</div>' + H(F, 'Oscar.', 120, 390) + N(F, 'Crab, asparagus, béarnaise · ₱950', 540); },
      end: function (F) { return end(F, 'Order early.', 'The Long Wait · 45-day sharing cuts', 'Carved at the table, for two or three.'); }
    },
    'vad-1': {
      base: function (F) { return head(F, F === 's' ? 'The Ageing List' : ''); },
      h: function (F) { return F === 'f' ? H(F, 'Worth<br>the wait.', 100, 58) : H(F, 'Worth<br>the wait.', 160, 330); },
      sub: function (F) { return F === 'f' ? T(F, 'The first Twenty-Eights are in the ageing room.', 1236, 950) : T(F, 'The first Twenty-Eights are in the ageing room.', 650, 900); },
      end: function (F) { return end(F, 'The list<br>books first.', 'Join The Ageing List', 'xxviii.example/list'); }
    },
    'vad-2': {
      base: function (F) { return head(F, F === 's' ? 'The Long Wait' : ''); },
      h: function (F) { return F === 'f' ? H(F, 'Dinner for two<br>takes 45 days.', 92, 62) : H(F, 'Dinner for two<br>takes <em>45 days.</em>', 128, 330); },
      sub: function (F) { return F === 'f' ? T(F, '<b>Porterhouse for Two</b> · ₱9,800', 1236, 950) : T(F, '<b>Porterhouse for Two</b> · strip and tenderloin on the bone · ₱9,800', 600, 900); },
      end: function (F) { return end(F, 'Book a table<br>for two.', 'xxviii.example/reserve'); }
    },
    'vad-3': {
      base: function (F) { return head(F, F === 's' ? 'Never hurried' : ''); },
      h: function (F) { return F === 'f' ? H(F, 'Some things<br>can’t be hurried.', 88, 64) : H(F, 'Some things<br>can’t be<br>hurried.', 140, 330); },
      sub: function (F) { return F === 'f' ? T(F, '<b>Prime ribeye</b> · aged 35 days', 1236, 950) : T(F, '<b>Prime ribeye</b> · aged 35 days', 740, 900); },
      end: function (F) { return end(F, 'Never hurried.', 'Book a table · xxviii.example/reserve'); }
    }
  };

  function build(id) {
    var pl = plan[id] || plan[id + '-' + (Q.get('fmt') || 'f')];
    var key = pl.id || id, F = Q.get('fmt') || pl.fmt, D = FMT[F];
    if (pl.fmt !== F && plan[key + '-' + F]) pl = plan[key + '-' + F];
    var segI = +(Q.get('seg') || (pl.still && pl.still.seg) || 0), seg = pl.segs[segI];
    var ov = Q.get('ov') === '1', still = Q.get('still') === '1';
    var want = Q.get('part') ? Q.get('part').split(',') : (pl.still ? pl.still.parts : Object.keys(P[key]).filter(function (p) { return p !== 'end'; }));
    var n = +(Q.get('n') || (pl.still && pl.still.n) || 1);
    var ab = document.getElementById('ab');
    ab.className = 'ab ' + (F === 'f' ? 'feed' : 'story');
    var h = '';
    if (seg.v) {
      var vt = seg.vt || D.vt, vh = D.h - vt, iw = Math.round(vh * 16 / 9), p = (seg.p0 + seg.p1) / 2;
      h += '<div class="vid" data-bg style="top:' + vt + 'px;height:' + vh + 'px"><img src="../../assets/video/' + seg.v + '-poster.webp" alt="" style="left:' + (-Math.round(p * (iw - 1080))) + 'px;width:' + iw + 'px"></div>';
      h += '<div data-part="frame"><div class="band" style="height:' + (vt + 2) + 'px"></div><div class="fade-top" style="top:' + vt + 'px;height:' + (F === 'f' ? 220 : 300) + 'px"></div><div class="fade-bot"></div></div>';
    }
    want.forEach(function (w) { if (P[key][w]) h += '<div data-part="' + w + '">' + P[key][w](F, { n: n }) + '</div>'; });
    if (!ov && seg.v) h += '<div class="grain-ab" data-bg></div>';
    ab.innerHTML = h;
    if (ov) document.documentElement.classList.add('ov');
    if (Q.get('part') && seg.v && Q.get('part').split(',').indexOf('frame') < 0 && ov) { var fr = ab.querySelector('[data-part=frame]'); if (fr) fr.hidden = true; }
    if (still) document.documentElement.classList.add('still');
  }
  window.MOTION = { plan: plan, fmt: FMT, build: build };
})();
