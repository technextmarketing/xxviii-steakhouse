"""Convert the client's 2048px PNG food photos into web WebP sets + manifest.json."""
import os, sys, json, re
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
SKIP = {'030','033','028','068'}  # broken cutouts superseded by *_Fixed / *_Transparent versions
man = {}
for r, d, f in os.walk(SRC):
    folder = os.path.basename(r)
    for n in sorted(f):
        if not n.lower().endswith('.png'): continue
        m = re.match(r'(\d{3})_(.+?)_(Plated_Shot|Plated|White_Plate_Shot|White_Plate_Cutout|Cutout_Alpha|Cutout_Transparent|Cutout_Fixed|Cutout)_', n)
        if not m: print('skip', n); continue
        num, name, kind = m.groups()
        key = folder[:6] + num
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        cut = 'Cutout' in kind
        if 'White_Plate_Shot' in kind: slug += '-white'
        if cut and (folder.startswith('Beyond') and num in ('015','017','013') ): continue  # broken originals (fixed versions exist)
        if cut and folder.startswith('Sauces') and num == '008': continue
        im = Image.open(os.path.join(r, n))
        if cut:
            im = im.convert('RGBA'); bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox(); im = im.crop(bb)
            sizes = [(1200, 'lg'), (600, 'sm')]; sub = 'cutout'
        else:
            im = im.convert('RGB'); sizes = [(1600, 'lg'), (800, 'md'), (420, 'sm')]; sub = 'plated'
        for w, tag in sizes:
            c = im.copy(); c.thumbnail((w, w), Image.LANCZOS)
            p = os.path.join(OUT, sub, f'{slug}-{tag}.webp')
            c.save(p, 'WEBP', quality=82 if not cut else 84, method=6)
        man.setdefault(slug, {})[sub] = {'w': im.size[0], 'h': im.size[1], 'src_folder': folder, 'src': n}
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print(len(man), 'dishes')
