"""Render XXVIII brand exports with headless Chrome (CDP), then make the print PDFs press-ready with PyMuPDF.
Needs the project served over http:   python -m http.server 4642 --bind 127.0.0.1 --directory <project root>
Run:  python brand/print/_render.py [base_url] [only-ids...]
PNG artboards -> brand/exports/
Print PDFs -> brand/print/<piece>.pdf : each page = 3 mm bleed + 10 mm slug with crop marks; TrimBox and BleedBox set;
the last page(s) of each file are the foil plates (named spot colour "Brass foil", 100 % tint = foil area)."""
import base64, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.request
import websocket
import pymupdf as fitz

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4642').rstrip('/')
HERE = os.path.dirname(os.path.abspath(__file__))
EXPORTS = os.path.join(HERE, '..', 'exports')
FONT = os.path.join(HERE, 'fonts', 'HankenGrotesk-Regular.ttf')
os.makedirs(EXPORTS, exist_ok=True)

PNG = [  # (artboard id, file name, w, h)
    ('avatar-monogram', 'avatar-monogram-1080.png', 1080, 1080),
    ('avatar-seal', 'avatar-seal-1080.png', 1080, 1080),
    ('fb-cover', 'facebook-cover-1640x624.png', 1640, 624),
    ('fb-cover-room', 'facebook-cover-dining-room-1640x624.png', 1640, 624),
    ('ig-story', 'instagram-story-template-1080x1920.png', 1080, 1920),
    ('email-header', 'email-header-1200x400.png', 1200, 400),
    ('gbp-cover', 'gbp-cover-2048x1152.png', 2048, 1152),
    ('gbp-cover-room', 'gbp-cover-dining-room-2048x1152.png', 2048, 1152),
    ('og-image', 'og-image-1200x630.png', 1200, 630),
    ('pattern-tally', 'pattern-tally-2000.png', 2000, 2000),
]
PDF = [  # (doc id, label, trim w mm, trim h mm)
    ('business-card', 'Business card', 85, 55), ('steak-card', 'Steak card', 85, 55),
    ('gift-voucher', 'Gift voucher', 210, 99), ('table-tent', 'Table tent', 100, 150),
]
MM = 72 / 25.4
BLEED, SLUG = 3, 10


def spot_foil(doc):
    """Swap every fill/stroke colour on the foil plates for the Separation colour space "Brass foil" (tint 1)."""
    fn = doc.get_new_xref()
    doc.update_object(fn, '<< /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [0.2 0.35 0.75 0.15] /N 1 >>')
    cs = doc.get_new_xref()
    doc.update_object(cs, '[ /Separation /Brass#20foil /DeviceCMYK %d 0 R ]' % fn)
    seen = set()

    def fix_stream(xref):
        data = doc.xref_stream(xref)
        if not data:
            return
        t = data.decode('latin-1')
        def sw(m):   # dark ink (the marks) becomes the foil; white paper stays unprinted
            vals = [float(v) for v in m.group(1, 2, 3)]
            if sum(vals) > 1.5:
                return '1 g' if m.group(4) == 'rg' else '1 G'
            return '/CSfoil cs 1 scn' if m.group(4) == 'rg' else '/CSfoil CS 1 SCN'
        t2 = re.sub(r'(?<![\d.])(\d*\.?\d+) (\d*\.?\d+) (\d*\.?\d+) (rg|RG)', sw, t)
        if t2 != t:
            doc.update_stream(xref, t2.encode('latin-1'))

    def add_cs(x):
        kind, val = doc.xref_get_key(x, 'Resources')
        if kind == 'xref':
            target, key = int(val.split()[0]), 'ColorSpace'
        elif kind == 'dict':
            target, key = x, 'Resources/ColorSpace'
        else:
            doc.xref_set_key(x, 'Resources', '<< /ColorSpace << /CSfoil %d 0 R >> >>' % cs); return
        k2, cur = doc.xref_get_key(target, key)
        if k2 == 'dict':
            doc.xref_set_key(target, key, cur.rstrip()[:-2] + ' /CSfoil %d 0 R >>' % cs)
        else:
            doc.xref_set_key(target, key, '<< /CSfoil %d 0 R >>' % cs)

    def walk_xobjects(holder):
        kind, val = doc.xref_get_key(holder, 'Resources/XObject')
        if kind == 'xref':
            kind, val = 'dict', doc.xref_object(int(val.split()[0]))
        if kind != 'dict':
            return
        for m in re.findall(r'(\d+) 0 R', val):
            x = int(m)
            if x in seen:
                continue
            seen.add(x)
            if doc.xref_get_key(x, 'Subtype')[1] == '/Form':
                fix_stream(x); add_cs(x); walk_xobjects(x)

    for page in doc:
        add_cs(page.xref)
        for c in page.get_contents():
            fix_stream(c)
        walk_xobjects(page.xref)


def press_ready(did, label, tw, th, main_pdf, foil_pdf, sides, foil_sides):
    bw, bh = tw + 2 * BLEED, th + 2 * BLEED
    W, H = (bw + 2 * SLUG) * MM, (bh + 2 * SLUG) * MM
    out = fitz.open()
    src, foil = fitz.open(main_pdf), fitz.open(foil_pdf)
    spot_foil(foil)
    jobs = [(src, i, sides[i] if i < len(sides) else '', False) for i in range(src.page_count)] + \
           [(foil, i, foil_sides[i] if i < len(foil_sides) else '', True) for i in range(foil.page_count)]
    for doc, i, side, is_foil in jobs:
        pg = out.new_page(width=W, height=H)
        bleed = fitz.Rect(SLUG * MM, SLUG * MM, (SLUG + bw) * MM, (SLUG + bh) * MM)
        trim = fitz.Rect((SLUG + BLEED) * MM, (SLUG + BLEED) * MM, (SLUG + BLEED + tw) * MM, (SLUG + BLEED + th) * MM)
        pg.show_pdf_page(bleed, doc, i, keep_proportion=False)   # source pages are bleed size (Chrome may round by 0.1 mm)
        pg.set_bleedbox(bleed)
        pg.set_trimbox(trim)
        gap, ln = (BLEED + 1) * MM, 6 * MM   # crop marks start 1 mm outside the bleed
        for x in (trim.x0, trim.x1):
            for y, d in ((trim.y0, -1), (trim.y1, 1)):
                pg.draw_line((x, y + d * gap), (x, y + d * (gap + ln)), color=(0, 0, 0), width=.25)
        for y in (trim.y0, trim.y1):
            for x, d in ((trim.x0, -1), (trim.x1, 1)):
                pg.draw_line((x + d * gap, y), (x + d * (gap + ln), y), color=(0, 0, 0), width=.25)
        pg.insert_font(fontname='HK', fontfile=FONT)
        if is_foil:
            note = 'FOIL – brass · plate for the %s · spot colour "Brass foil", 100%% = foil · %s' % (side, label)
        else:
            note = 'XXVIII · %s · %s · trim %g × %g mm · bleed %d mm' % (label, side or 'page %d' % (i + 1), tw, th, BLEED)
            if did == 'table-tent' and side == 'face 1':
                note += ' · QR placeholder: regenerate once the domain is confirmed'
        pg.insert_text((SLUG * MM, H - 3.4 * MM), note, fontname='HK', fontsize=6.5, color=(0, 0, 0))
    out.set_metadata({'title': 'XXVIII %s, press-ready' % label, 'author': 'XXVIII · Twenty-Eight Steakhouse',
                      'subject': 'Trim %g x %g mm, bleed %d mm, crop marks, foil plates last' % (tw, th, BLEED)})
    final = os.path.join(HERE, did + '.pdf')
    out.save(final, garbage=3, deflate=True)
    return final


prof = tempfile.mkdtemp(prefix='xb-render-')
port = 9611
proc = subprocess.Popen([CHROME, '--headless=new', f'--user-data-dir={prof}', f'--remote-debugging-port={port}',
                         '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
tmp = tempfile.mkdtemp(prefix='xb-pdf-')
try:
    for _ in range(60):
        try:
            page = [t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t['type'] == 'page'][0]; break
        except Exception:
            time.sleep(.2)
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], timeout=120, suppress_origin=True)
    n = [0]
    def cmd(m, **p):
        n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': m, 'params': p}))
        while True:
            r = json.loads(ws.recv())
            if r.get('id') == n[0]:
                if 'error' in r: raise RuntimeError(r['error'])
                return r.get('result', {})
    def wait_ready():
        for _ in range(100):
            v = cmd('Runtime.evaluate', expression="document.body && document.body.dataset.ready === '1'", returnByValue=True)['result'].get('value')
            if v: return
            time.sleep(.1)
    cmd('Page.enable'); cmd('Runtime.enable')
    only = set(sys.argv[2:])
    for aid, name, w, h in PNG:
        if only and aid not in only: continue
        cmd('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=1, mobile=False)
        cmd('Page.navigate', url=f'{BASE}/brand/print/artboard.html?id={aid}')
        time.sleep(1.2); wait_ready(); time.sleep(.6)
        shot = cmd('Page.captureScreenshot', format='png', clip={'x': 0, 'y': 0, 'width': w, 'height': h, 'scale': 1}, captureBeyondViewport=True)
        open(os.path.join(EXPORTS, name), 'wb').write(base64.b64decode(shot['data']))
        print('png', name)
    cmd('Emulation.clearDeviceMetricsOverride')
    for did, label, tw, th in PDF:
        if only and did not in only: continue
        files, sides = {}, {}
        for mode in ('main', 'foil'):
            cmd('Page.navigate', url=f'{BASE}/brand/print/print.html?id={did}' + ('&foil=1' if mode == 'foil' else ''))
            time.sleep(1.2); wait_ready(); time.sleep(.4)
            sides[mode] = cmd('Runtime.evaluate', expression='window.__sides', returnByValue=True)['result'].get('value') or []
            pdf = cmd('Page.printToPDF', printBackground=True, preferCSSPageSize=True, marginTop=0, marginBottom=0, marginLeft=0, marginRight=0, scale=1)
            files[mode] = os.path.join(tmp, f'{did}-{mode}.pdf')
            open(files[mode], 'wb').write(base64.b64decode(pdf['data']))
        print('pdf', press_ready(did, label, tw, th, files['main'], files['foil'], sides['main'], sides['foil']))
    ws.close()
finally:
    proc.kill(); time.sleep(.5); shutil.rmtree(prof, ignore_errors=True); shutil.rmtree(tmp, ignore_errors=True)
