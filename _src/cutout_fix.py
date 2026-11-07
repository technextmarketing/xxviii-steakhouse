"""Make missing/failed cutouts with rembg isnet-general-use (CPU)."""
import glob, sys
from PIL import Image
from rembg import remove, new_session
Z = sys.argv[1]
jobs = {'sovereign-tomahawk': 'For the Table*/010_Sovereign_Tomahawk_Cutout*', 'black-truffle-butter': 'Sauces*/005_Black_Truffle_Butter*'}
s = new_session('isnet-general-use')
for slug, pat in jobs.items():
    src = Image.open(glob.glob(Z + '/' + pat)[0]).convert('RGB')
    out = remove(src, session=s, post_process_mask=True)
    a = out.getchannel('A').point(lambda v: 0 if v < 18 else v); out.putalpha(a)
    out = out.crop(a.point(lambda v: 255 if v > 8 else 0).getbbox())
    for w, t in ((1200, 'lg'), (600, 'sm')):
        c = out.copy(); c.thumbnail((w, w), Image.LANCZOS); c.save(f'assets/img/cutout/{slug}-{t}.webp', 'WEBP', quality=84, method=4)
    print(slug, out.size)
