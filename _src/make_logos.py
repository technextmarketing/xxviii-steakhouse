"""Build the XXVIII logo system as pure-path SVGs (no font dependency).
Run from the project root: python _src/make_logos.py
"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib.instancer import instantiateVariableFont

F = 'assets/fonts/'
gloock = TTFont(F + 'Gloock-Regular.ttf')
bs = instantiateVariableFont(TTFont(F + 'BigShoulders.ttf'), {'wght': 640, 'opsz': 30})
bsl = instantiateVariableFont(TTFont(F + 'BigShoulders.ttf'), {'wght': 500, 'opsz': 14})


def run(font, text, size, track=0.0):
    """Return (path_d, advance_width) for text at size px, tracking in em."""
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    s = size / upm; x = 0; d = []
    hmtx = font['hmtx']
    for i, ch in enumerate(text):
        g = cmap.get(ord(ch))
        if g is None:
            x += size * 0.3; continue
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
        d.append(pen.getCommands())
        x += hmtx[g][0] * s + (track * size if i < len(text) - 1 else 0)
    return ' '.join(d), x


def cap_height(font, size):
    return font['OS/2'].sCapHeight * size / font['head'].unitsPerEm


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


def lockup_primary(fill, sub):
    d1, w1 = run(gloock, 'XXVIII', 200, 0.075); ch1 = cap_height(gloock, 200)
    d2, w2 = run(bs, 'TWENTY-EIGHT', 34, 0.38); ch2 = cap_height(bs, 34)
    d3, w3 = run(bsl, 'STEAKHOUSE', 20, 0.6)
    W = max(w1, w2, w3) + 40; pad = 20
    y1 = ch1 + pad; ry = y1 + 34; y2 = ry + 26 + ch2; y3 = y2 + 34
    H = y3 + pad; cx = W / 2
    body = (f'<g fill="{fill}"><path transform="translate({cx-w1/2:.1f} {y1:.1f})" d="{d1}"/>'
            f'<rect x="{cx-w1/2:.1f}" y="{ry-0.75:.1f}" width="{w1/2-16:.1f}" height="1.5"/>'
            f'<rect x="{cx+16:.1f}" y="{ry-0.75:.1f}" width="{w1/2-16:.1f}" height="1.5"/>'
            f'<path d="M{cx:.1f} {ry-6:.1f} L{cx+6:.1f} {ry:.1f} L{cx:.1f} {ry+6:.1f} L{cx-6:.1f} {ry:.1f}Z"/>'
            f'<path transform="translate({cx-w2/2:.1f} {y2:.1f})" d="{d2}"/>'
            f'<path fill="{sub}" transform="translate({cx-w3/2:.1f} {y3:.1f})" d="{d3}"/></g>')
    return svg(W, H, body, 'XXVIII Twenty-Eight Steakhouse')


def lockup_horizontal(fill, sub):
    d1, w1 = run(gloock, 'XXVIII', 120, 0.075); ch1 = cap_height(gloock, 120)
    d2, w2 = run(bs, 'TWENTY-EIGHT', 30, 0.34)
    d3, w3 = run(bsl, 'STEAKHOUSE', 20, 0.5); ch3 = cap_height(bsl, 20)
    pad = 16; gap = 30
    W = pad + w1 + gap + 1.5 + gap + max(w2, w3) + pad; H = ch1 + pad * 2
    x2 = pad + w1 + gap * 2 + 1.5
    body = (f'<g fill="{fill}"><path transform="translate({pad} {pad+ch1:.1f})" d="{d1}"/>'
            f'<rect x="{pad+w1+gap:.1f}" y="{pad+6}" width="1.5" height="{ch1-12:.1f}"/>'
            f'<path transform="translate({x2:.1f} {pad+ch1/2-8:.1f})" d="{d2}"/>'
            f'<path fill="{sub}" transform="translate({x2:.1f} {pad+ch1/2+14+ch3:.1f})" d="{d3}"/></g>')
    return svg(W, H, body, 'XXVIII Twenty-Eight Steakhouse')


def wordmark(fill):
    d1, w1 = run(gloock, 'XXVIII', 200, 0.075); ch1 = cap_height(gloock, 200)
    return svg(w1 + 20, ch1 + 20, f'<path fill="{fill}" transform="translate(10 {ch1+10:.1f})" d="{d1}"/>', 'XXVIII')


def monogram(fill, bg=None):
    S = 512
    d1, w1 = run(gloock, 'XX', 190, 0.06); d2, w2 = run(gloock, 'VIII', 190, 0.075)
    ch = cap_height(gloock, 190)
    sc = min(1, 380 / max(w1, w2))
    y1 = 256 - 20; y2 = 256 + 20 + ch * sc
    body = f'<rect width="{S}" height="{S}" fill="{bg}"/>' if bg else ''
    body += (f'<g fill="{fill}"><path transform="translate({256-w1*sc/2:.1f} {y1:.1f}) scale({sc:.3f})" d="{d1}"/>'
             f'<rect x="{256-w2*sc/2:.1f}" y="255" width="{w2*sc:.1f}" height="2"/>'
             f'<path transform="translate({256-w2*sc/2:.1f} {y2:.1f}) scale({sc:.3f})" d="{d2}"/></g>')
    return svg(S, S, body, 'XXVIII monogram')


def seal(fill, bg=None):
    S = 600; c = S / 2; R = 262
    body = f'<rect width="{S}" height="{S}" fill="{bg}"/>' if bg else ''
    body += (f'<g fill="none" stroke="{fill}"><circle cx="{c}" cy="{c}" r="{R+26}" stroke-width="2"/>'
             f'<circle cx="{c}" cy="{c}" r="{R-34}" stroke-width="1.2"/></g>')
    text = 'AGED TWENTY-EIGHT DAYS  ·  CUT TODAY  ·  YOURS TONIGHT  ·  '
    gs = bs.getGlyphSet(); cmap = bs.getBestCmap(); upm = bs['head'].unitsPerEm
    size = 36; s = size / upm; track = 0.12 * size; r = R - 8
    widths = []
    for ch in text:
        g = cmap.get(ord(ch))
        widths.append(bs['hmtx'][g][0] * s + track if g else size * 0.3)
    k = 2 * math.pi * r / sum(widths)
    ang = -90.0; parts = []
    for ch, wch in zip(text, widths):
        g = cmap.get(ord(ch)); step = wch * k / r * 180 / math.pi
        if g and ch != ' ':
            pen = SVGPathPen(gs); gs[g].draw(TransformPen(pen, (s, 0, 0, -s, 0, 0)))
            gw = bs['hmtx'][g][0] * s; mid = ang + step / 2
            parts.append(f'<path transform="rotate({mid+90:.2f} {c} {c}) translate({c-gw/2:.2f} {c-r+cap_height(bs,size)/2+2:.2f})" d="{pen.getCommands()}"/>')
        ang += step
    d1, w1 = run(gloock, 'XXVIII', 112, 0.075); ch1 = cap_height(gloock, 112)
    body += f'<g fill="{fill}">' + ''.join(parts) + f'<path transform="translate({c-w1/2:.1f} {c+ch1/2:.1f})" d="{d1}"/></g>'
    return svg(S, S, body, 'XXVIII seal: Aged twenty-eight days, cut today, yours tonight')


def tag(fill, bg):
    """Butcher's ageing tag: the steak card / ageing-room tag shape."""
    W, H = 360, 600
    d1, w1 = run(gloock, 'XXVIII', 96, 0.075); ch1 = cap_height(gloock, 96)
    d2, w2 = run(bs, 'DAYS AGED', 26, 0.4)
    shape = f'M40 0 H{W-40} L{W} 40 V{H} H0 V40 Z'
    body = (f'<path d="{shape}" fill="{bg}"/><circle cx="{W/2}" cy="64" r="18" fill="none" stroke="{fill}" stroke-width="3"/>'
            f'<path d="{shape}" fill="none" stroke="{fill}" stroke-width="2" transform="translate(14 14) scale({(W-28)/W:.4f} {(H-28)/H:.4f})"/>'
            f'<g fill="{fill}"><g transform="translate({W/2} {H/2+20}) rotate(-90)"><path transform="translate({-w1/2:.1f} {ch1/2:.1f})" d="{d1}"/></g>'
            f'<path transform="translate({W/2-w2/2:.1f} {H-46:.1f})" d="{d2}"/></g>')
    return svg(W, H, body, 'XXVIII ageing tag')


C = {'brass': '#C29A5B', 'bone': '#EFE7DA', 'char': '#141110', 'ox': '#7A1E24'}
out = 'assets/logo/'
os.makedirs(out, exist_ok=True)
for name, (f, sub) in {'brass': (C['brass'], C['bone']), 'bone': (C['bone'], C['brass']),
                       'char': (C['char'], C['ox']), 'ox': (C['ox'], C['char'])}.items():
    open(out + f'xxviii-primary-{name}.svg', 'w').write(lockup_primary(f, sub))
    open(out + f'xxviii-horizontal-{name}.svg', 'w').write(lockup_horizontal(f, sub))
    open(out + f'xxviii-wordmark-{name}.svg', 'w').write(wordmark(f))
    open(out + f'xxviii-monogram-{name}.svg', 'w').write(monogram(f))
    open(out + f'xxviii-seal-{name}.svg', 'w').write(seal(f))
open(out + 'xxviii-primary-current.svg', 'w').write(lockup_primary('currentColor', 'currentColor'))
open(out + 'xxviii-monogram-avatar.svg', 'w').write(monogram(C['brass'], C['char']))
open(out + 'xxviii-seal-avatar.svg', 'w').write(seal(C['brass'], C['char']))
open(out + 'xxviii-tag-brass.svg', 'w').write(tag(C['brass'], C['char']))
open(out + 'xxviii-tag-ox.svg', 'w').write(tag(C['bone'], C['ox']))
open(out + 'favicon.svg', 'w').write(monogram(C['brass'], C['char']))
print(len(os.listdir(out)), 'files')
