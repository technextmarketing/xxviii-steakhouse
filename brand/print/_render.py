"""Render XXVIII brand exports with headless Chrome (CDP).
Needs the project served over http:   python -m http.server 4642 --bind 127.0.0.1 --directory <project root>
Run:  python brand/print/_render.py [base_url]
PNG artboards -> brand/exports/ ; print PDFs (true size + 3 mm bleed) -> brand/print/"""
import base64, json, os, shutil, subprocess, sys, tempfile, time, urllib.request
import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4642').rstrip('/')
HERE = os.path.dirname(os.path.abspath(__file__))
EXPORTS = os.path.join(HERE, '..', 'exports')
os.makedirs(EXPORTS, exist_ok=True)

PNG = [  # (artboard id, file name, w, h)
    ('avatar-monogram', 'avatar-monogram-1080.png', 1080, 1080),
    ('avatar-seal', 'avatar-seal-1080.png', 1080, 1080),
    ('fb-cover', 'facebook-cover-1640x624.png', 1640, 624),
    ('ig-story', 'instagram-story-template-1080x1920.png', 1080, 1920),
    ('email-header', 'email-header-1200x400.png', 1200, 400),
    ('gbp-cover', 'gbp-cover-2048x1152.png', 2048, 1152),
    ('og-image', 'og-image-1200x630.png', 1200, 630),
    ('pattern-tally', 'pattern-tally-2000.png', 2000, 2000),
]
PDF = [  # (doc id, width mm, height mm) incl. bleed
    ('business-card', 91, 61), ('steak-card', 91, 61), ('gift-voucher', 216, 105), ('table-tent', 106, 156),
]
MM = 1 / 25.4

prof = tempfile.mkdtemp(prefix='xb-render-')
port = 9611
proc = subprocess.Popen([CHROME, '--headless=new', f'--user-data-dir={prof}', f'--remote-debugging-port={port}',
                         '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
    for aid, name, w, h in PNG:
        cmd('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=1, mobile=False)
        cmd('Page.navigate', url=f'{BASE}/brand/print/artboard.html?id={aid}')
        time.sleep(1.2); wait_ready(); time.sleep(.6)
        shot = cmd('Page.captureScreenshot', format='png', clip={'x': 0, 'y': 0, 'width': w, 'height': h, 'scale': 1}, captureBeyondViewport=True)
        open(os.path.join(EXPORTS, name), 'wb').write(base64.b64decode(shot['data']))
        print('png', name)
    cmd('Emulation.clearDeviceMetricsOverride')
    for did, wmm, hmm in PDF:
        cmd('Page.navigate', url=f'{BASE}/brand/print/print.html?id={did}')
        time.sleep(1.2); wait_ready(); time.sleep(.4)
        pdf = cmd('Page.printToPDF', printBackground=True, preferCSSPageSize=True, paperWidth=wmm * MM, paperHeight=hmm * MM,
                  marginTop=0, marginBottom=0, marginLeft=0, marginRight=0, scale=1)
        open(os.path.join(HERE, did + '.pdf'), 'wb').write(base64.b64decode(pdf['data']))
        print('pdf', did)
    ws.close()
finally:
    proc.kill(); time.sleep(.5); shutil.rmtree(prof, ignore_errors=True)
