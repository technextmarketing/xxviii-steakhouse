"""7 Nov: replace the frosted story cut-out animation with the butcher-block shot wipe (site/site.js)."""
p = 'site/site.js'
s = open(p, encoding='utf-8').read()
a = s.index("  var story = $('.story'), frost = $('.story__frost')")
b = s.index("  /* ───────── Board")
new = r'''  var story = $('.story'), sLines = $$('.story__line');
  /* Story stage (7 Nov, v3): four sharp butcher-block shots, one per beat, wiping up like the ageing-room
     door as the days pass; it ends on The Twenty-Eight at Day 28. Replaces the old frosted cut-out. */
  var shots = $$('.story__shot'), shotWord = $('[data-shot-word]'), shotDish = $('[data-shot-dish]'), shotIdx = 0;
  function dishName(slug) { for (var i = 0; i < X.menu.length; i++) { var it = X.menu[i].items || []; for (var k = 0; k < it.length; k++) if (it[k].img === slug) return it[k].name; } return ''; }
  function shotTag(i) {
    if (i === shotIdx || !shots[i]) return; shotIdx = i;
    if (shotWord) shotWord.textContent = shots[i].getAttribute('data-word');
    if (shotDish) shotDish.textContent = dishName(shots[i].getAttribute('data-dish'));
  }
  if (shotDish && shots[0]) shotDish.textContent = dishName(shots[0].getAttribute('data-dish'));
  function shotsInto(tl, span, offset) {
    shots.forEach(function (sh, i) {
      var im = $('img', sh);
      if (i > 0) {
        var at = offset + span * (i * 7 - 1.2) / 28;
        tl.fromTo(sh, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: span * 1.6 / 28, ease: 'power3.inOut',
          onStart: function () { shotTag(i); }, onReverseComplete: function () { shotTag(i - 1); } }, at);
      }
      tl.fromTo(im, { scale: 1.16, xPercent: i % 2 ? 2 : -2 }, { scale: 1, xPercent: 0, duration: span * 8.5 / 28, ease: 'none' }, offset + span * Math.max(0, i * 7 - 1.2) / 28);
    });
  }
  if (MOTION) shots.forEach(function (sh, i) { if (i > 0) sh.classList.remove('is-on'); });
  mm.add('(min-width: 900px)', function () {
    story.classList.add('story--pinned');
    var st = { v: 1 }; setDay(1);
    G.set(sLines, { autoAlpha: 0, y: 26 });
    var tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: story, start: 'top top', end: '+=260%', pin: true, scrub: 1, anticipatePin: 1 } });
    tl.to(st, { v: 28, duration: 27, onUpdate: function () { setDay(st.v); } }, 0)
      .fromTo('.story__glow', { autoAlpha: .55, scale: .9 }, { autoAlpha: 1, scale: 1.06, duration: 27 }, 0)
      .fromTo('.story__win', { yPercent: 4 }, { yPercent: -4, duration: 28 }, 0)
      .fromTo('.ruler__fill', { scaleX: 0 }, { scaleX: 1, duration: 27 }, 0)
      .to(sLines[0], { autoAlpha: 1, y: 0, duration: 2, ease: 'power2.out' }, .5)
      .to(sLines[0], { autoAlpha: 0, y: -18, duration: 1.6, ease: 'power2.in' }, 10)
      .to(sLines[1], { autoAlpha: 1, y: 0, duration: 2, ease: 'power2.out' }, 11.8)
      .to(sLines[1], { autoAlpha: 0, y: -18, duration: 1.6, ease: 'power2.in' }, 19.6)
      .to(sLines[2], { autoAlpha: 1, y: 0, duration: 2.4, ease: 'power2.out' }, 21.4)
      .to({}, { duration: 3 });
    shotsInto(tl, 27, 0);
    return function () { story.classList.remove('story--pinned'); G.set(sLines, { clearProps: 'all' }); setDay(28); };
  });
  mm.add('(max-width: 899px)', function () {
    story.classList.add('story--count');
    var st = { v: 1 }; setDay(1);
    var tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.story__stage', start: 'top 80%', end: 'bottom 30%', scrub: .6 } });
    tl.to(st, { v: 28, duration: 1, onUpdate: function () { setDay(st.v); } }, 0)
      .fromTo('.ruler__fill', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
    shotsInto(tl, 1, 0);
    G.from(sLines, { autoAlpha: 0, y: 22, duration: 1.1, ease: 'expo.out', stagger: .15, scrollTrigger: { trigger: '.story__lines', start: 'top 88%', once: true } });
    return function () { story.classList.remove('story--count'); setDay(28); };
  });

'''
s = s[:a] + new + s[b:]
old_rm = "    var fr0 = $('.story__frost'); if (fr0) { fr0.style.setProperty('--frost', '0px'); fr0.style.setProperty('--fog', '0'); }\n"
new_rm = "    var lastShot = $$('.story__shot'); lastShot.forEach(function (x, i) { x.classList.toggle('is-on', i === lastShot.length - 1); });\n"
assert old_rm in s
s = s.replace(old_rm, new_rm)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
