"""Split the showcase launch-kit ZIP into an images kit and a video kit (each < 100 MB, GitHub file limit)."""
import json, os, re, zipfile
os.chdir('showcase/exports')
files = [os.path.join(r, n).replace('\\', '/')[2:] for r, d, f in os.walk('.') for n in f]
files = [f for f in files if not f.endswith('.zip') and f != 'manifest.js']
vid = sorted(f for f in files if f.endswith('.mp4'))
img = sorted(f for f in files if not f.endswith('.mp4'))
for name, group in (('xxviii-launch-kit-images.zip', img), ('xxviii-launch-kit-video.zip', vid)):
    with zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for f in group:
            z.write(f, 'xxviii-launch-kit/' + f, compress_type=zipfile.ZIP_STORED if f.endswith(('.mp4', '.png')) else zipfile.ZIP_DEFLATED)
    print(name, round(os.path.getsize(name) / 1e6, 1), 'MB', len(group), 'files')
if os.path.exists('xxviii-launch-kit.zip'):
    os.replace('xxviii-launch-kit.zip', '../../qa/xxviii-launch-kit-full.zip')  # keep locally for Drive, out of git
m = open('manifest.js', encoding='utf-8').read()
data = json.loads(m[m.index('{'):m.rindex('}') + 1])
data.pop('xxviii-launch-kit.zip', None)
for n in ('xxviii-launch-kit-images.zip', 'xxviii-launch-kit-video.zip'):
    data[n] = os.path.getsize(n)
open('manifest.js', 'w', encoding='utf-8').write(m[:m.index('{')] + json.dumps(data) + m[m.rindex('}') + 1:])
os.chdir('..')
h = open('index.html', encoding='utf-8').read()
old = '<a class="btn btn-line" id="dlZip" href="exports/xxviii-launch-kit.zip" download>Download all (ZIP)</a>'
new = ('<a class="btn btn-line" id="dlZip" href="exports/xxviii-launch-kit-images.zip" download>Images and copy (ZIP)</a> '
       '<a class="btn btn-line" id="dlZipV" href="exports/xxviii-launch-kit-video.zip" download>Video (ZIP)</a>')
assert old in h
h = h.replace(old, new).replace('All exports in one ZIP (posts, stories, ads, video, email, captions).', 'All exports in two ZIPs: images and copy (posts, stories, ads, email, captions), and video (reels, stories, ads).')
open('index.html', 'w', encoding='utf-8').write(h)
j = open('showcase.js', encoding='utf-8').read()
oldj = "  if (FILES['xxviii-launch-kit.zip']) $('#dlZip').textContent = 'Download all (ZIP · ' + size('exports/xxviii-launch-kit.zip') + ')';"
newj = ("  if (FILES['xxviii-launch-kit-images.zip']) $('#dlZip').textContent = 'Images and copy (ZIP · ' + size('exports/xxviii-launch-kit-images.zip') + ')';\n"
        "  if (FILES['xxviii-launch-kit-video.zip'] && $('#dlZipV')) $('#dlZipV').textContent = 'Video (ZIP · ' + size('exports/xxviii-launch-kit-video.zip') + ')';")
assert oldj in j
open('showcase.js', 'w', encoding='utf-8').write(j.replace(oldj, newj))
print('page updated')
