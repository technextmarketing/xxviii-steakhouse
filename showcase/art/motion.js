/* XXVIII motion artboards: ONE source for the footage stories, reels and video ads.
   - window.MOTION.plan[id]: the edit (segments, crop pan, overlay timing), read by showcase/tools/reels.py
   - MOTION.build(id): draws the artboard. Query: ?part=a,b (only those parts) &n=14 (day counter) &seg=0 &ov=1 (transparent, no footage)
     &still=1 (export frame) &fmt=f|s (video ads: 4:5 feed or 9:16 story) &sw=0..1 (brass sweep position on end cards).
   Segment kinds: v = footage (assets/video, cropped slice + slow pan, dropped below a dark band);
                  img/still = a still (interior / block keyframe) drawn by the 'bg' part, slow push-in in ffmpeg;
                  end = end card. Stories/reels carry no header chrome (the platform shows the profile). */
(function () {
  var Q = new URLSearchParams(location.search);
  var A = '../../assets/', LOGO_W = A + 'logo/xxviii-wordmark-bone.svg';
  var FMT = {
    s: { w: 1080, h: 1920, vt: 385, vh: 1535 },   /* story / reel 9:16: keep text in y 320..1520 */
    f: { w: 1080, h: 1350, vt: 300, vh: 1050 }    /* feed 4:5 */
  };
  for (var k in FMT) FMT[k].cw = Math.round(1080 * 1080 / FMT[k].vh);
  var LINK = '<svg viewBox="0 0 40 40" fill="none" stroke="#141110" stroke-width="3.2" stroke-linecap="round"><path d="M17 23l6-6"/><path d="M19 12l3-3a6 6 0 0 1 9 9l-3 3"/><path d="M21 28l-3 3a6 6 0 0 1-9-9l3-3"/></svg>';
  var NB = 'Twenty&#8209;Eight';

  function segs(n) { var h = ''; for (var i = 1; i <= 28; i++) h += '<i class="' + (i <= n ? 'f' : '') + '"></i>'; return h; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function head(F) { return F === 'f' ? '<img class="m-logo" style="right:64px;top:62px;width:150px" src="' + LOGO_W + '" alt="XXVIII">' : ''; }
  function end(F, h, l, sub, o) {
    var f = F === 'f', sw = o && o.sw != null ? o.sw : 1;
    return '<div class="end">' +
      '<div class="mk-sweep" role="img" aria-label="XXVIII Twenty-Eight Steakhouse" style="top:' + (f ? 290 : 500) + 'px;width:' + (f ? 420 : 520) + 'px;background-position:' + (100 - sw * 100).toFixed(1) + '% 0"></div>' +
      '<div class="rule" style="top:' + (f ? 520 : 760) + 'px"></div>' +
      '<h1 class="eh" style="top:' + (f ? 570 : 820) + 'px;font-size:' + (f ? 104 : 116) + 'px">' + h + '</h1>' +
      '<div class="el" style="top:' + (f ? 830 : 1110) + 'px">' + l + '</div>' +
      (sub ? '<div class="es" style="top:' + (f ? 880 : 1166) + 'px">' + sub + '</div>' : '') + '</div>';
  }
  function H(F, html, size, top, left) { return '<h1 class="m-h" style="left:' + (left || (F === 'f' ? 64 : 72)) + 'px;top:' + top + 'px;font-size:' + size + 'px">' + html + '</h1>'; }
  function T(F, html, top, w, left) { return '<p class="m-sub" style="left:' + (left || (F === 'f' ? 64 : 72)) + 'px;top:' + top + 'px;width:' + (w || 900) + 'px">' + html + '</p>'; }
  function N(F, html, top, left) { return '<div class="m-num" style="left:' + (left || (F === 'f' ? 64 : 72)) + 'px;top:' + top + 'px">' + html + '</div>'; }
  function L(html, top, left, cls) { return '<div class="m-lbl ' + (cls || '') + '" style="left:' + (left || 72) + 'px;top:' + top + 'px">' + html + '</div>'; }
  function tag(n, left, top, big) { return '<div class="mtag' + (big ? ' big' : '') + '" style="left:' + left + 'px;top:' + top + 'px"><i class="hole"></i><div class="k">AGED</div><div class="n">' + n + '</div><div class="d">DAYS</div></div>'; }
  function cover(src, pos, alt) { return '<img class="cover" src="' + A + 'img/' + src + '-lg.webp" alt="' + (alt || '') + '" style="object-position:' + pos + '">'; }
  function letterbox(src) { return '<div class="lbx"><img src="' + A + 'img/' + src + '-lg.webp" alt=""></div><div class="lbx-rule" style="top:655px"></div><div class="lbx-rule" style="top:1265px"></div>'; }

  /* ----- the plan ----- (ss = source start s, d = duration s, p0..p1 = pan across the slice, 0 = left, 1 = right) */
  var plan = {
    'story-01': { fmt: 's', out: 'stories/story-01', segs: [{ v: 'cowboy-cut', ss: .2, d: 7, p0: .36, p1: .48,
      ov: [{ part: 'n', from: 1, to: 14, at: .6, step: .17 }, { part: 'sub', at: 3.4 }] }], still: { parts: ['n', 'sub'], n: 14 } },
    'story-02': { fmt: 's', out: 'stories/story-02', segs: [{ still: 'bg', d: 7, zoom: .04,
      ov: [{ part: 'head', at: .5 }, { part: 'poll', at: 1.4 }] }], still: { parts: ['bg', 'head', 'poll'] } },
    'story-02-clean': { fmt: 's', id: 'story-02', out: 'stories/story-02-clean', segs: [{ still: 'bg', d: 7, zoom: .04,
      ov: [{ part: 'head', at: .5 }] }], still: { parts: ['bg', 'head'] } },
    'story-03': { fmt: 's', out: 'stories/story-03', segs: [{ v: 'new-york-strip', ss: .2, d: 7, p0: .44, p1: .56,
      ov: [{ part: 'n', from: 19, to: 25, at: .6, step: .3 }, { part: 'sub', at: 3.2 }] }], still: { parts: ['n', 'sub'], n: 25 } },
    'story-04': { fmt: 's', out: 'stories/story-04', segs: [{ still: 'bg', d: 7, zoom: .05,
      ov: [{ part: 'head', at: .6 }, { part: 'link', at: 2 }] }], still: { parts: ['bg', 'head', 'link'] } },
    'story-04-clean': { fmt: 's', id: 'story-04', out: 'stories/story-04-clean', segs: [{ still: 'bg', d: 7, zoom: .05,
      ov: [{ part: 'head', at: .6 }] }], still: { parts: ['bg', 'head'] } },

    'story-05': { fmt: 's', out: 'stories/story-05', segs: [{ still: 'bg', d: 7, zoom: .1, pan: 1,
      ov: [{ part: 'head', at: .6 }, { part: 'sub', at: 2.2 }] }], still: { parts: ['bg', 'head', 'sub'] } },

    'reel-a': { fmt: 's', out: 'reels/reel-a-worth-the-wait', segs: [
      { v: 'new-york-strip', ss: .2, d: 7, p0: .40, p1: .58, ov: [{ part: 't1', at: .9, out: 6.0 }] },
      { v: 'cowboy-cut', ss: .3, d: 7, p0: .36, p1: .5, ov: [{ part: 't2', at: .9 }] },
      { end: 'end', d: 2.4, sweep: 36 }] },
    'reel-b': { fmt: 's', out: 'reels/reel-b-every-steak-lists-its-age', segs: [
      { img: 'block/filet-mignon', still: 'bg', d: 4.2, zoom: .07, ov: [{ part: 'c1', at: .4, out: 3.3 }] },
      { img: 'block/new-york-strip', still: 'bg', d: 4.2, zoom: .07, ov: [{ part: 'c2', at: .6, out: 3.3 }] },
      { img: 'block/prime-ribeye', still: 'bg', d: 4.2, zoom: .07, ov: [{ part: 'c3', at: .6, out: 3.3 }] },
      { img: 'block/porterhouse-for-two', still: 'bg', d: 4.4, zoom: .07, ov: [{ part: 'c4', at: .6 }] },
      { end: 'end', d: 2.4, sweep: 36 }] },
    'reel-c': { fmt: 's', out: 'reels/reel-c-the-long-wait', segs: [
      { v: 'chateaubriand-for-two', ss: .2, d: 5.5, p0: .34, p1: .62, ov: [{ part: 'e1', at: .8, out: 4.4 }] },
      { v: 'porterhouse-for-two', ss: .3, d: 5, p0: .40, p1: .56, vt: 720, ov: [{ part: 'e2', at: .6, out: 3.9 }] },
      { v: 'black-truffle-shavings', ss: 1, d: 3.2, p0: .44, p1: .52, ov: [{ part: 'x1', at: .6, out: 2.1 }] },
      { v: 'bone-marrow-crust', ss: 1, d: 3.2, p0: .50, p1: .56, ov: [{ part: 'x2', at: .6, out: 2.1 }] },
      { v: 'foie-gras-crown', ss: 1, d: 3.2, p0: .44, p1: .52, ov: [{ part: 'x3', at: .6, out: 2.1 }] },
      { v: 'oscar-enhancement', ss: 1, d: 3.2, p0: .46, p1: .54, ov: [{ part: 'x4', at: .6, out: 2.1 }] },
      { end: 'end', d: 2.4, sweep: 36 }] }
  };
  ['f', 's'].forEach(function (F) {
    var suf = F === 'f' ? 'feed' : 'story';
    plan['vad-1-' + F] = { fmt: F, id: 'vad-1', out: 'ads/video/meta-video-1-' + suf, segs: [
      { v: 'cowboy-cut', ss: .3, d: 6, p0: .36, p1: .5, ov: [{ part: 'base', at: 0 }, { part: 'h', at: .4 }, { part: 'sub', at: 1.6 }] }, { end: 'end', d: 2.6, sweep: 39 }] };
    plan['vad-2-' + F] = { fmt: F, id: 'vad-2', out: 'ads/video/meta-video-2-' + suf, segs: [
      { v: 'porterhouse-for-two', ss: .3, d: 6, p0: .38, p1: .56, vt: F === 's' ? 720 : 0, ov: [{ part: 'base', at: 0 }, { part: 'h', at: .4 }, { part: 'sub', at: 1.6 }] }, { end: 'end', d: 2.6, sweep: 39 }] };
    plan['vad-3-' + F] = { fmt: F, id: 'vad-3', out: 'ads/video/meta-video-3-' + suf, segs: [
      { v: 'prime-ribeye', ss: .3, d: 6, p0: .44, p1: .56, ov: [{ part: 'base', at: 0 }, { part: 'h', at: .4 }, { part: 'sub', at: 1.6 }] }, { end: 'end', d: 2.6, sweep: 39 }] };
  });

  /* ----- the parts ----- */
  function reelB(n, name, line) {
    return function (F) {
      return L('Every steak lists its age', 330, 72, 'br') + tag(n, 72, 384, true) + H(F, name, 104, 1320) + N(F, line, 1452);
    };
  }
  var P = {
    'story-01': {
      n: function (F, o) { return '<div class="segs" style="left:72px;width:936px;top:340px">' + segs(o.n) + '</div>' +
        '<div class="m-lbl" style="left:72px;top:372px;font-size:20px">Day 01</div><div class="m-lbl" style="right:72px;top:372px;font-size:20px">Day 28 · opening night</div>' +
        H(F, 'Day ' + pad(o.n) + '.', 230, 420); },
      sub: function (F) { return T(F, '<b>Halfway.</b> The first ' + NB + 's come out on Day 28, opening night.', 690, 900); }
    },
    'story-02': {
      bg: function () { return cover('texture/overhead-butcher-block-herb-frame', '50% 50%') + '<div class="shade-top" style="height:780px"></div>' +
        '<div class="cut cut-shadow" style="left:560px;top:660px;width:600px;transform:rotate(-8deg)"><img src="' + A + 'img/cutout/cafe-de-paris-butter-lg.webp" alt=""></div>' +
        '<div class="cut cut-shadow" style="left:-140px;top:1440px;width:700px;transform:rotate(9deg)"><img src="' + A + 'img/cutout/black-truffle-butter-lg.webp" alt=""></div>'; },
      head: function (F) { return L('Tonight’s question', 330, 72, 'br') + H(F, 'Which<br>butter?', 160, 380); },
      poll: function () { return '<div class="stk" style="left:72px;top:1100px;width:936px;padding:34px 40px 40px"><div class="k">Poll · tap to vote</div>' +
        '<div class="opt"><span>Café de Paris</span><em>A</em></div><div class="opt"><span>Black truffle</span><em>B</em></div></div>'; }
    },
    'story-03': {
      n: function (F, o) { return '<div class="segs" style="left:72px;width:936px;top:340px">' + segs(o.n) + '</div>' +
        '<div class="m-lbl" style="left:72px;top:372px;font-size:20px">Day 01</div><div class="m-lbl" style="right:72px;top:372px;font-size:20px">Day 28</div>' +
        H(F, 'Day ' + pad(o.n) + ' <span style="font-size:.42em;color:var(--ash);word-spacing:.2em;margin-left:.1em">of 28</span>', 230, 420); },
      sub: function (F) { return T(F, '<b>Still.</b> Twenty-five days in the glass room. They come out on Day 28, opening night.', 690, 900); }
    },
    'story-04': {
      bg: function () { return cover('interior/entrance-host-stand', '55% 50%', 'The entrance: walnut host stand, a view through to the room') + '<div class="shade-top" style="height:960px"></div>'; },
      head: function (F) { return L('The door is open', 330, 72, 'br') + H(F, 'Tables<br>are <em>open.</em>', 168, 380); },
      link: function () { return '<div class="link-chip" style="left:72px;top:750px">' + LINK + 'XXVIII.EXAMPLE/RESERVE</div>'; }
    },
    'story-05': {
      bg: function () { return cover('dryage/room-rack-aisle', '58% 50%', 'Inside the ageing room: the rack aisle, tagged cuts on steel shelves, the salt-brick wall at the end') + '<div class="shade-top" style="height:1180px"></div><div class="fade-bot" style="height:700px;background:linear-gradient(rgba(20,17,16,0),rgba(20,17,16,.85))"></div>'; },
      head: function (F) { return L('The ageing room · Day 07', 330, 72, 'br') + H(F, 'Inside the<br>glass room.', 168, 380); },
      sub: function (F) { return T(F, '<b style="text-shadow:0 2px 14px rgba(0,0,0,.9)">Steel racks, a lit salt-brick wall, and every cut tagged with its day.</b>', 790, 860); }
    },
    'reel-a': {
      t1: function (F) { return H(F, 'Twenty-eight<br>days in the<br>ageing room.', 128, 340) + N(F, 'New York Strip · aged 28 days', 730); },
      t2: function (F) { return H(F, 'The<br>' + NB + '.', 150, 340) + N(F, 'Bone-in ribeye · aged 28 days', 650); },
      end: function (F, o) { return end(F, 'Worth the wait.', 'Join the list · The Ageing List', 'xxviii.example/#footer', o); }
    },
    'reel-b': {
      bg: function (F, o) { return '<div class="band" style="height:1920px"></div>' + letterbox(o.seg.img); },
      c1: reelB(21, 'Filet Mignon.', '250 g · the tenderest cut'),
      c2: reelB(28, 'New York Strip.', '350 g · firm, beefy'),
      c3: reelB(35, 'Prime Ribeye.', '400 g · the richest cut'),
      c4: reelB(45, 'Porterhouse for Two.', '1.1 kg · sliced to share'),
      end: function (F, o) { return end(F, 'Every steak<br>lists its age.', NB + ' · Bonifacio Global City', '', o); }
    },
    'reel-c': {
      e1: function (F) { return H(F, 'The Long<br>Wait.', 150, 340) + N(F, 'Châteaubriand for Two · aged 45 days', 646); },
      e2: function (F) { return H(F, 'Sliced<br>to share.', 150, 340) + N(F, 'Porterhouse for Two · aged 45 days', 646); },
      x1: function (F) { return L('Enhancements', 340, 72, 'br') + H(F, 'Black truffle.', 120, 390) + N(F, 'Shaved at the table · ₱1,400', 540); },
      x2: function (F) { return L('Enhancements', 340, 72, 'br') + H(F, 'Marrow crust.', 120, 390) + N(F, 'Marrow, herbs, crumb, torched · ₱550', 540); },
      x3: function (F) { return L('Enhancements', 340, 72, 'br') + H(F, 'Foie gras crown.', 120, 390) + N(F, 'Seared foie gras on top · ₱1,200', 540); },
      x4: function (F) { return L('Enhancements', 340, 72, 'br') + H(F, 'Oscar.', 120, 390) + N(F, 'Crab, asparagus, béarnaise · ₱950', 540); },
      end: function (F, o) { return end(F, 'Order early.', 'The Long Wait · 45-day sharing cuts', 'Carved or sliced at the table, for two or three.', o); }
    },
    'vad-1': {
      base: function (F) { return head(F); },
      h: function (F) { return F === 'f' ? H(F, 'Worth<br>the wait.', 88, 52) : H(F, 'Worth<br>the wait.', 160, 340); },
      sub: function (F) { return F === 'f' ? T(F, 'The first ' + NB + 's are in the ageing room.', 232, 760) : T(F, 'The first ' + NB + 's are in the ageing room.', 660, 900); },
      end: function (F, o) { return end(F, 'The list<br>books first.', 'Join the list · The Ageing List', 'xxviii.example/#footer', o); }
    },
    'vad-2': {
      base: function (F) { return head(F); },
      h: function (F) { return F === 'f' ? H(F, 'Dinner for two<br>takes 45 days.', 92, 62) : H(F, 'Dinner for two<br>takes <em>45 days.</em>', 128, 340); },
      sub: function (F) { return F === 'f' ? T(F, '<b>Porterhouse for Two</b> · ₱9,800', 1236, 950) : T(F, '<b>Porterhouse for Two</b> · 45 days · ₱9,800', 610, 900); },
      end: function (F, o) { return end(F, 'Book a table<br>for two.', 'xxviii.example/#reserve', '', o); }
    },
    'vad-3': {
      base: function (F) { return head(F); },
      h: function (F) { return F === 'f' ? H(F, 'Some things<br>can’t be hurried.', 88, 64) : H(F, 'Some things<br>can’t be<br>hurried.', 140, 340); },
      sub: function (F) { return F === 'f' ? T(F, '<b>Prime Ribeye</b> · aged 35 days', 1236, 950) : T(F, '<b>Prime Ribeye</b> · aged 35 days', 760, 900); },
      end: function (F, o) { return end(F, 'Never hurried.', 'Book a table · xxviii.example/#reserve', '', o); }
    }
  };

  function build(id) {
    var pl = plan[id] || plan[id + '-' + (Q.get('fmt') || 'f')];
    var key = pl.id || id, F = Q.get('fmt') || pl.fmt, D = FMT[F];
    if (pl.fmt !== F && plan[key + '-' + F]) pl = plan[key + '-' + F];
    var segI = +(Q.get('seg') || (pl.still && pl.still.seg) || 0), seg = pl.segs[segI];
    var ov = Q.get('ov') === '1', still = Q.get('still') === '1';
    var want = Q.get('part') ? Q.get('part').split(',') : (pl.still ? pl.still.parts : Object.keys(P[key]).filter(function (p) { return p !== 'end'; }));
    var n = +(Q.get('n') || (pl.still && pl.still.n) || 1), sw = Q.get('sw') != null ? +Q.get('sw') : null;
    var ab = document.getElementById('ab');
    ab.className = 'ab ' + (F === 'f' ? 'feed' : 'story');
    var h = '';
    if (seg.v) {
      var vt = seg.vt || D.vt, vh = D.h - vt, iw = Math.round(vh * 16 / 9), p = (seg.p0 + seg.p1) / 2;
      h += '<div class="vid" data-bg style="top:' + vt + 'px;height:' + vh + 'px"><img src="' + A + 'video/' + seg.v + '-poster.webp" alt="" style="left:' + (-Math.round(p * (iw - 1080))) + 'px;width:' + iw + 'px"></div>';
      h += '<div data-part="frame"><div class="band" style="height:' + (vt + 2) + 'px"></div><div class="fade-top" style="top:' + vt + 'px;height:' + (F === 'f' ? 220 : 300) + 'px"></div><div class="fade-bot"></div></div>';
    }
    want.forEach(function (w) { if (P[key][w]) h += '<div data-part="' + w + '">' + P[key][w](F, { n: n, seg: seg, sw: sw }) + '</div>'; });
    if (!ov) h += '<div class="grain-ab" data-bg></div>';
    ab.innerHTML = h;
    if (ov) document.documentElement.classList.add('ov');
    if (Q.get('part') && seg.v && Q.get('part').split(',').indexOf('frame') < 0 && ov) { var fr = ab.querySelector('[data-part=frame]'); if (fr) fr.hidden = true; }
    if (still) document.documentElement.classList.add('still');
  }
  window.MOTION = { plan: plan, fmt: FMT, build: build };
})();
