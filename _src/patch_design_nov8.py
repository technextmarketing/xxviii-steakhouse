"""8 Nov full audit (design): brand-kit fidelity - one solid brass CTA per view, square dock, brand --sec, h2 tiers,
label floor, zoom settle, no text over food, captions out, seams, diamond dot."""
import re

def load(p): return open(p, encoding='utf-8').read()
def save(p, s): open(p, 'w', encoding='utf-8').write(s)

# ---------- site.css ----------
s = load('site/site.css')
assert s.count('  --sec: clamp(72px, 8vw, 128px);\n') == 1
s = s.replace('  --sec: clamp(72px, 8vw, 128px);\n', '')          # use the brand token, do not fork it
# label floor: no label below .75rem (12px)
s = re.sub(r'(font: ?\d{3} )\.(6\d|7[0-4]?)rem', r'\1.75rem', s)
s = re.sub(r'(font-size: ?)\.(6\d|7[0-4]?)rem', r'\1.75rem', s)
s += '''
/* ═════════ 8 Nov full audit: brand-kit fidelity ═════════ */
/* Rhythm: one section pattern, no per-section exceptions */
.sig, .private { padding-bottom: calc(var(--sec) * .6); }
/* Headings: three tiers from the brand tokens */
.menu__head h2, .room__head h2, .patience__copy h2, .reserve__intro h2 { font-size: var(--t-h1); line-height: .98; letter-spacing: -.01em; }
.sig__title, .wait__intro h2, .private__copy h2, .visit__copy h2, .board h2, .reel__head h2, .values__title { font-size: var(--t-h2); line-height: .98; letter-spacing: -.01em; }
@media (min-width: 900px) { .hero__title { font-size: clamp(3.4rem, 1.2rem + 6.4vw, 8rem); } }
/* One solid brass button per view: the header turns solid only once the hero has gone */
.hdr:not(.is-scrolled) .hdr__cta { background: transparent; color: var(--bone); border-color: color-mix(in srgb, var(--bone) 35%, transparent); }
.hdr:not(.is-scrolled) .hdr__cta:hover { border-color: var(--brass); color: var(--brass-hi); }
@media (max-width: 767px) {
  .actbar__cta { background: transparent; color: var(--brass-hi) !important; box-shadow: inset 0 2px 0 var(--brass); }
}
/* Same button, same size, everywhere */
.room__head .cta-row .btn, .sig__copy .btn, .board__info .btn, .private__copy .btn { padding-left: 28px; padding-right: 28px; letter-spacing: .24em; }
@media (max-width: 599px) { .hero__ctas .btn { flex: 1 1 100%; justify-content: center; min-height: 48px; } }
.cta-row, .board__info .cta-row, .sig__copy .cta-row, .private__copy .cta-row, .visit__copy .cta-row, .room__head .cta-row, .wait__intro .cta-row, .patience__copy .cta-row, .values .cta-row { margin-top: clamp(24px, 2.4vw, 32px); }
.reel__foot .cta-row { margin-top: 0; }
/* Hairline controls share one border and a 44px floor */
.hero__pause, .reel__toggle, .intro__skip, .overlay__close, .vdlg__close, .stepper__btn { min-height: 44px; border-color: color-mix(in srgb, var(--bone) 35%, transparent); }
/* Hero meets the Ageing Room on a soft fade, not a hard edge */
.hero__shade { background-image: linear-gradient(0deg, var(--char) 0, var(--char) 4%, transparent 30%); }
/* No type over food: the hanging ribs sit to the right of the heading, the rack aisle to the right of the Long Wait intro */
@media (min-width: 900px) {
  .board__room { left: auto; width: 56%; -webkit-mask: linear-gradient(180deg, transparent 0, #000 22%, #000 60%, transparent 100%); mask: linear-gradient(180deg, transparent 0, #000 22%, #000 60%, transparent 100%); }
  .board__room::after { background: linear-gradient(90deg, var(--char) 0%, transparent 40%); }
  .wait__aisle { inset: -14% -18% -14% 42%; }
}
.crust__tag { display: none; }
/* Photos: crop by framing, settle at most 1.08 (sharper on retina) */
.sig__frame img { transform: scale(1.06); }
.sig__frame .sig__still { transform: scale(1.06); }
.reel__item img { transform: scale(1.08); }
.reel__item:hover img { transform: scale(1.12); }
@media (min-width: 900px) { .mpeek img { transform: scale(1.08); } }
/* Captions explain nothing: the room tour keeps its brass label only */
.rm figcaption span { display: none; }
/* Square corners: the status dot is a small diamond, like the rule */
.dot { border-radius: 0; transform: rotate(45deg); } .dot::after { border-radius: 0; }
.cursor { border-radius: 2px; }
/* Tokens only */
.bk-context { border-color: color-mix(in srgb, var(--brass) 45%, transparent); background: color-mix(in srgb, var(--brass) 7%, transparent); }
/* One divider grammar: the diamond seam */
.ftr { border-top: 0; }
'''
save('site/site.css', s)

# ---------- chat.css ----------
c = load('site/chat.css')
c = re.sub(r'(font: ?\d{3} )\.(6\d|7[0-4]?)rem', r'\1.75rem', c)
c = re.sub(r'(font-size: ?)\.(6\d|7[0-4]?)rem', r'\1.75rem', c)
c += '''
/* ═════════ 8 Nov full audit: the dock follows the button pair - square, hairline, no solid brass ═════════ */
.xxdock__ask { border-radius: 2px; background: color-mix(in srgb, var(--char) 88%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  color: var(--bone); border: 1px solid var(--brass); min-height: 56px; }
.xxdock__ask:hover { background: color-mix(in srgb, var(--char-2) 92%, transparent); color: var(--brass-hi); }
.xxdock__ask img { border-radius: 2px; width: 40px; height: 40px; }
.xxdock__ask::after { border-radius: 2px; }
.xxdock__book { border-radius: 2px; }
@media (max-width: 767px) {
  .xxdock__ask { min-height: 52px; border-radius: 2px; }
  .xxdock__book { border-radius: 2px; }
  /* phones: the host waits until the hero plate has gone */
  .xxdock.is-hero > * { opacity: 0; transform: translateX(28px); pointer-events: none; }
}
'''
save('site/chat.css', c)

# ---------- chat.js: hide the dock over the hero on phones ----------
j = load('site/chat.js')
m = '  function tuckCheck('
assert j.count(m) == 1, 'tuck'
j = j.replace(m, '''  (function () {
    var hero = document.querySelector('.hero'); if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) { es.forEach(function (e) { var dk = document.querySelector('.xxdock'); if (dk) dk.classList.toggle('is-hero', e.intersectionRatio > .45); }); }, { threshold: [0, .45, 1] }).observe(hero);
  })();
''' + m, 1)
save('site/chat.js', j)

# ---------- index.html: diamond seams before Private and before the footer ----------
h = load('index.html')
SEAM = '<div class="seam" aria-hidden="true"><div class="rule-diamond"><i></i></div></div>\n'
for a in ['<section class="private" id="private"', '<footer class="ftr" id="footer">']:
    assert h.count(a) == 1, a
    h = h.replace(a, SEAM + a)
# signature still: serve the large file first (it was the 800px file scaled up)
save('index.html', h)
print('ok')
