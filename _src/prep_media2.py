"""Batch 2 media (7 Nov): 12 HEVC camera-move videos -> H.264 web MP4s (1920 + 1280) + posters;
12 butcher-block keyframes -> assets/img/block; 10 textures/scenes -> assets/img/texture.
Usage: python _src/prep_media2.py <scratch root holding zip1..zip5>"""
import glob, json, os, re, subprocess, sys
from PIL import Image

Z = sys.argv[1]
OUT = 'assets'
os.makedirs(f'{OUT}/video', exist_ok=True)
os.makedirs(f'{OUT}/img/block', exist_ok=True)
os.makedirs(f'{OUT}/img/texture', exist_ok=True)

VID = {  # source name fragment -> (dish slug, move)
    'Picanha_Slow_Glide': ('picanha', 'glide-left'),
    'New_York_Strip_Slow_Glide': ('new-york-strip', 'glide-right'),
    'Prime_Ribeye_Slow_Glide': ('prime-ribeye', 'glide-left'),
    'Filet_Mignon_Slow_Glide': ('filet-mignon', 'glide-right'),
    'Cowboy_Cut_Slow_Glide': ('cowboy-cut', 'glide-left'),
    'Black_Truffle_Tilt': ('black-truffle-shavings', 'tilt-down'),
    'Bone_Marrow_Crust_Dolly': ('bone-marrow-crust', 'dolly-rise'),
    'Chateaubriand_Slow_Orbit': ('chateaubriand-for-two', 'orbit'),
    'Foie_Gras_Crown_Arc': ('foie-gras-crown', 'arc'),
    'Oscar_Push_In': ('oscar-enhancement', 'push-in'),
    'Porterhouse_Overhead': ('porterhouse-for-two', 'overhead-descend'),
    'Tomahawk_Crane': ('sovereign-tomahawk', 'crane'),
}
BLOCK = {'Cowboy_Cut': 'cowboy-cut', 'Filet_Mignon': 'filet-mignon', 'New_York_Strip': 'new-york-strip',
         'Picanha': 'picanha', 'Prime_Ribeye': 'prime-ribeye', 'Black_Truffle': 'black-truffle-shavings',
         'Bone_Marrow_Crust': 'bone-marrow-crust', 'Chateaubriand': 'chateaubriand-for-two',
         'Foie_Gras_Crown': 'foie-gras-crown', 'Oscar': 'oscar-enhancement', 'Porterhouse': 'porterhouse-for-two',
         'Sovereign_Tomahawk': 'sovereign-tomahawk'}

media = {'video': {}, 'block': {}, 'texture': {}}

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print('ERR', ' '.join(cmd)[:120], r.stderr[-400:])

if 'video' in sys.argv[2:] or len(sys.argv) == 2:
    for p in sorted(glob.glob(Z + '/zip1/*/*.mp4') + glob.glob(Z + '/zip3/*.mp4')):
        key = next(k for k in VID if k in os.path.basename(p)); slug, move = VID[key]
        base = f'{OUT}/video/{slug}'
        for w, crf, tag in ((1920, 22, 'hd'), (1280, 24, 'sd')):
            out = f'{base}-{tag}.mp4'
            if not os.path.exists(out):
                run(['ffmpeg', '-y', '-v', 'error', '-i', p, '-vf', f'scale={w}:-2:flags=lanczos', '-c:v', 'libx264',
                     '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-an',
                     '-movflags', '+faststart', out])
        poster = f'{base}-poster.webp'
        if not os.path.exists(poster):
            run(['ffmpeg', '-y', '-v', 'error', '-ss', '0.05', '-i', p, '-frames:v', '1', '-vf', 'scale=1920:-2', base + '-poster.png'])
            Image.open(base + '-poster.png').save(poster, 'WEBP', quality=80); os.remove(base + '-poster.png')
        media['video'][slug] = {'move': move, 'hd': f'{slug}-hd.mp4', 'sd': f'{slug}-sd.mp4', 'poster': f'{slug}-poster.webp',
                                'w': 1920, 'h': 1080, 'sec': 8}
        print('video', slug, os.path.getsize(f'{base}-hd.mp4') // 1024, 'KB', os.path.getsize(f'{base}-sd.mp4') // 1024, 'KB')

for p in sorted(glob.glob(Z + '/zip2/*.png') + glob.glob(Z + '/zip4/*.png')):
    n = os.path.basename(p); key = n.split('_Butcher_Block')[0]; slug = BLOCK[key]
    im = Image.open(p).convert('RGB')
    for w, tag in ((1920, 'lg'), (1200, 'md'), (640, 'sm')):
        c = im.copy(); c.thumbnail((w, w), Image.LANCZOS); c.save(f'{OUT}/img/block/{slug}-{tag}.webp', 'WEBP', quality=82, method=4)
    media['block'][slug] = {'w': 2048, 'h': 1152}
    print('block', slug)

for p in sorted(glob.glob(Z + '/zip5/*/*.png')):
    n = os.path.basename(p)
    m = re.match(r'\d{3}_(.+?)_(Texture|Scene)_', n); name, kind = m.groups()
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    im = Image.open(p).convert('RGB')
    sizes = ((1600, 'lg'), (800, 'sm')) if kind == 'Texture' else ((2400, 'lg'), (1280, 'md'), (640, 'sm'))
    for w, tag in sizes:
        c = im.copy(); c.thumbnail((w, w), Image.LANCZOS); c.save(f'{OUT}/img/texture/{slug}-{tag}.webp', 'WEBP', quality=80, method=4)
    media['texture'][slug] = {'kind': kind.lower(), 'w': im.size[0], 'h': im.size[1], 'sizes': [t for _, t in sizes]}
    print('texture', slug)

prev = {}
if os.path.exists(f'{OUT}/img/media2.json'):
    prev = json.load(open(f'{OUT}/img/media2.json'))
for k in media:
    prev.setdefault(k, {}).update(media[k])
json.dump(prev, open(f'{OUT}/img/media2.json', 'w'), indent=1)
print('done')
