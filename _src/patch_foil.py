"""8 Nov: brass foil (menu cover effect) on the website's header logo, phone index logo, footer wordmark and intro mark."""
h = open('index.html', encoding='utf-8').read()

def rep(a, b):
    global h
    assert h.count(a) == 1, a
    h = h.replace(a, b)

rep('      <img src="assets/logo/xxviii-header-lit.svg" alt="" width="814" height="102">',
    '      <span class="foil foil--hdr" aria-hidden="true"><i></i></span>')
rep('    <img class="overlay__logo" src="assets/logo/xxviii-header-lit.svg" alt="" width="814" height="102">',
    '    <span class="foil foil--hdr overlay__logo" aria-hidden="true"><i></i></span>')
rep('    <img class="ftr__mark" src="assets/logo/xxviii-wordmark-brass.svg" alt="XXVIII Twenty-Eight Steakhouse" width="705" height="170" loading="lazy">',
    '    <span class="foil foil--word ftr__mark" role="img" aria-label="XXVIII Twenty-Eight Steakhouse"><i></i></span>')
h = h.replace('site/site.css?v=17', 'site/site.css?v=18').replace('site/site.js?v=17', 'site/site.js?v=18')
open('index.html', 'w', encoding='utf-8').write(h)

CSS = '''
/* 8 Nov: brass foil from the menu cover - a bright band that follows the pointer (slow sweep on touch), pressed in with a light top edge and a dark under-shadow */
.foil { display: block; filter: drop-shadow(0 -1px 0 rgba(255, 236, 200, .3)) drop-shadow(0 2px 2px rgba(0, 0, 0, .8)) drop-shadow(0 0 10px rgba(0, 0, 0, .35)); }
.foil > i { display: block; width: 100%; height: 100%;
  background: linear-gradient(100deg, #8a6a3a 0%, #c29a5b 38%, #f4dfb4 50%, #c29a5b 62%, #8a6a3a 100%);
  background-size: 260% 100%; background-position: var(--fx, 50%) 0; transition: background-position .9s cubic-bezier(.22, 1, .36, 1); }
.foil--hdr { height: 34px; aspect-ratio: 814 / 102; }
.foil--hdr > i { -webkit-mask: url(../assets/logo/xxviii-header-lit.svg) left center / contain no-repeat; mask: url(../assets/logo/xxviii-header-lit.svg) left center / contain no-repeat; }
.foil--word { width: 100%; aspect-ratio: 705 / 170; }
.foil--word > i { -webkit-mask: url(../assets/logo/xxviii-wordmark-brass.svg) center / contain no-repeat; mask: url(../assets/logo/xxviii-wordmark-brass.svg) center / contain no-repeat; }
.ftr__mark.foil { opacity: 1; }
.overlay__logo.foil { height: 21px; width: auto; }
.hdr__logo .foil--hdr { filter: drop-shadow(0 -1px 0 rgba(255, 236, 200, .25)) drop-shadow(0 1px 1px rgba(0, 0, 0, .8)); }
@media (max-width: 899px) { .hdr__logo .foil--hdr { height: 28px; } }
@media (max-width: 359px) { .hdr__logo .foil--hdr { height: 22px; } }
@media (hover: none), (pointer: coarse) { .foil > i { animation: foilsweep 7s ease-in-out infinite alternate; } }
@keyframes foilsweep { from { background-position: 15% 0; } to { background-position: 85% 0; } }
@media (prefers-reduced-motion: reduce) { .foil > i { animation: none; transition: none; } }
.intro__mark { background: linear-gradient(100deg, #8a6a3a 0%, #c29a5b 38%, #f4dfb4 50%, #c29a5b 62%, #8a6a3a 100%); background-size: 300% 100%; filter: drop-shadow(0 -1px 0 rgba(255, 236, 200, .3)) drop-shadow(0 2px 2px rgba(0, 0, 0, .8)); }
'''
open('site/site.css', 'a', encoding='utf-8').write(CSS)

j = open('site/site.js', encoding='utf-8').read()
m = "  /* ───────── Header: hide on scroll down, show on scroll up ───────── */"
assert j.count(m) == 1
j = j.replace(m, """  /* ───────── Brass foil: the bright band follows the pointer, like the menu cover ───────── */
  if (FINE && !RM) {
    var foils = $$('.foil'), fRaf = 0, fX = .5;
    window.addEventListener('pointermove', function (e) { fX = e.clientX / window.innerWidth; if (!fRaf) fRaf = requestAnimationFrame(function () { fRaf = 0; foils.forEach(function (f) { f.style.setProperty('--fx', (100 - fX * 100).toFixed(1) + '%'); }); }); }, { passive: true });
  }

""" + m)
open('site/site.js', 'w', encoding='utf-8').write(j)
print('ok')
