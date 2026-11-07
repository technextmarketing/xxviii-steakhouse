"""Static instances of the variable brand fonts for the print PDFs only.
Chrome embeds variable fonts in PDFs as Type 3 (unnamed outlines), which many prepress RIPs reject.
Run from anywhere: python brand/print/fonts/_make_static.py"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', '..', 'assets', 'fonts')
JOBS = [
    ('BigShoulders.ttf', 'BigShoulders', {500: 'Medium', 600: 'SemiBold', 700: 'Bold'}, {'opsz': 14}),
    ('HankenGrotesk.ttf', 'HankenGrotesk', {400: 'Regular', 500: 'Medium', 600: 'SemiBold'}, {}),
]
for src, fam, weights, extra in JOBS:
    for w, style in weights.items():
        f = TTFont(os.path.join(SRC, src))
        axes = dict(extra, wght=w)
        inst = instantiateVariableFont(f, axes, updateFontNames=False)
        name = inst['name']
        for rec in name.names:   # make family/style names unique per static file
            if rec.nameID in (1, 16):
                rec.string = fam + ' Print'
            elif rec.nameID in (2, 17):
                rec.string = style
            elif rec.nameID == 4:
                rec.string = fam + ' Print ' + style
            elif rec.nameID == 6:
                rec.string = fam + 'Print-' + style
        out = os.path.join(HERE, '%s-%s.ttf' % (fam, style))
        inst.save(out)
        print('saved', os.path.basename(out))
