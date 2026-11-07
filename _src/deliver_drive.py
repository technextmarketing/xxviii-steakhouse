"""Copy the XXVIII deliverables to the Marketing shared drive and md5-verify every file.
Usage: python _src/deliver_drive.py "<drive client folder>"  (run from the project root)."""
import hashlib, os, shutil, sys

DEST = sys.argv[1]
ROOT = os.getcwd()

def md5(p):
    h = hashlib.md5()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()

plan = []  # (src, dst)
def add_file(src, dst):
    plan.append((os.path.join(ROOT, src), os.path.join(DEST, dst)))
def add_tree(src, dst, skip=()):
    for r, dirs, files in os.walk(os.path.join(ROOT, src)):
        dirs[:] = [d for d in dirs if d not in skip]
        for n in files:
            s = os.path.join(r, n)
            rel = os.path.relpath(s, os.path.join(ROOT, src))
            plan.append((s, os.path.join(DEST, dst, rel)))

# 01 Website: the live link lives in the README; previews here
# 02 Brand Kit
add_tree('assets/logo', '02. Brand Kit/Logos (SVG)', skip=())
add_tree('brand/exports', '02. Brand Kit/Social and digital (PNG)')
for n in os.listdir(os.path.join(ROOT, 'brand/print')):
    if n.lower().endswith('.pdf'):
        add_file('brand/print/' + n, '02. Brand Kit/Print-ready PDFs/' + n)
add_tree('assets/fonts', '02. Brand Kit/Fonts')
# 03 Menu
add_file('menu/out/xxviii-menu.pdf', '03. Menu/XXVIII-Menu-230x330mm.pdf')
if os.path.exists(os.path.join(ROOT, 'menu/out/contact-sheet.png')):
    add_file('menu/out/contact-sheet.png', '03. Menu/XXVIII-Menu-all-pages-preview.png')
# 04 Launch campaign
for sub in ('posts', 'stories', 'reels', 'ads', 'email'):
    add_tree('showcase/exports/' + sub, '04. Launch Campaign - Worth the Wait/' + sub.capitalize())
add_file('showcase/exports/captions.txt', '04. Launch Campaign - Worth the Wait/Captions-all-platforms.txt')
# 05 Full HTML source snapshot (opens from file://)
SKIP = {'.git', 'qa', '_research', '_import', '__pycache__', '.impeccable', '.github'}
for r, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP and not (r == ROOT and d.startswith('.'))]
    for n in files:
        if n.endswith('.zip') or n.startswith('.claude'):
            continue
        s = os.path.join(r, n)
        rel = os.path.relpath(s, ROOT)
        plan.append((s, os.path.join(DEST, '05. Site Source (HTML)', rel)))

bad = 0
for s, d in plan:
    os.makedirs(os.path.dirname(d), exist_ok=True)
    if not (os.path.exists(d) and os.path.getsize(d) == os.path.getsize(s) and md5(d) == md5(s)):
        shutil.copy2(s, d)
for s, d in plan:  # verify pass (Drive sync can silently revert binaries)
    if md5(s) != md5(d):
        bad += 1; shutil.copy2(s, d)
        if md5(s) != md5(d):
            print('MISMATCH', d)
print(len(plan), 'files copied;', bad, 're-copied after verify')
