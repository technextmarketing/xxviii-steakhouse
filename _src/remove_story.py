"""8 Nov: client asked to remove the "Time is the finest ingredient" story section (day odometer, beats ruler, shot window)."""
import re

h = open('index.html', encoding='utf-8').read()
a = h.index('<!-- 3. Twenty-eight days -->')
b = h.index('<!-- 4. The Ageing Room board -->')
# also drop the diamond seam that sat between story and board
block = h[a:b]
assert '<section class="story"' in block
h = h[:a] + h[b:]
for old in ('        <li><a href="#story">Story</a></li>\n',
            '        <li><a href="#story"><span>Story</span></a></li>\n',
            '        <li><a class="link" href="#story">Story</a></li>\n'):
    assert old in h, old
    h = h.replace(old, '')
h = h.replace('<a class="hero__cue label" href="#story">', '<a class="hero__cue label" href="#ageing">')
assert '#story' not in h and 'story__' not in h and 'odo__' not in h
h = h.replace('site/site.css?v=5', 'site/site.css?v=6').replace('site/site.js?v=5', 'site/site.js?v=6')
open('index.html', 'w', encoding='utf-8').write(h)

j = open('site/site.js', encoding='utf-8').read()
a = j.index('  /* ───────── Odometer')
b = j.index('  /* ───────── Reduced motion')
j = j[:a] + j[b:]
j = j.replace("    shots.forEach(function (x, i) { x.classList.toggle('is-on', i === shots.length - 1); }); shotTag(shots.length - 1);\n", '')
a = j.index('  /* ───────── Story ─')
b = j.index('  /* ───────── Board')
j = j[:a] + j[b:]
j = j.replace("['story', 'ageing', 'menu', 'private', 'visit']", "['ageing', 'menu', 'private', 'visit']")
for w in ('setDay', 'shotTag', 'shotsInto', 'sLines', "$('.story'"):
    assert w not in j, w
open('site/site.js', 'w', encoding='utf-8').write(j)

c = open('site/site.css', encoding='utf-8').read()
n0 = len(c)
# drop every rule whose selector targets the removed story parts
c = re.sub(r'^[^\n{}]*\.(story|odo|ruler|beats|no-js \.odo)[^\n{]*\{[^{}]*\}\n?', '', c, flags=re.M)
# rules nested in @media blocks (single-line form)
c = re.sub(r'^\s+[^\n{}]*\.(story|odo|ruler|beats)[^\n{]*\{[^{}]*\}\n?', '', c, flags=re.M)
open('site/site.css', 'w', encoding='utf-8').write(c)
print('css bytes removed', n0 - len(c))
print('left in css:', [l.strip()[:60] for l in c.splitlines() if re.search(r'\.(story|odo__|ruler|beats)', l)])
