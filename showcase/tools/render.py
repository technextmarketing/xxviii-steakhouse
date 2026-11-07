"""XXVIII showcase exporter.

Renders every artboard in showcase/art/ through headless Chrome (DevTools protocol) at its exact
pixel size and writes PNG exports, web-sized WebP derivatives, contact sheets, a text-fit report
and captions.txt.

    python showcase/tools/render.py                 # everything
    python showcase/tools/render.py post-01 story-02 # only these artboards (no sheets/captions)

Self-contained: starts its own static server on a free local port and a Chrome on a free
debugging port in 9700-9749; the temporary Chrome profile is deleted in `finally`.
"""
import base64, functools, http.server, io, json, os, shutil, socket, socketserver, subprocess, sys, tempfile, threading, time, urllib.request

import websocket
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SHOW = os.path.join(ROOT, "showcase")
EXP = os.path.join(SHOW, "exports")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# name, artboard file, export path (relative to exports/), width, height (None = full length)
JOBS = [(f"post-{i:02d}", f"post-{i:02d}.html", f"posts/post-{i:02d}.png", 1080, 1350) for i in range(1, 13)]
JOBS += [(f"story-{i:02d}", f"story-{i:02d}.html", f"stories/story-{i:02d}.png", 1080, 1920) for i in range(1, 5)]
JOBS += [(f"ad-feed-{i}", f"ad-feed-{i}.html", f"ads/meta-feed-{i}.png", 1080, 1350) for i in range(1, 4)]
JOBS += [(f"ad-story-{i}", f"ad-story-{i}.html", f"ads/meta-story-{i}.png", 1080, 1920) for i in range(1, 4)]
JOBS += [(f"email-{n}", f"email-{n}.html", f"email/email-{n}.png", 600, None) for n in ("welcome", "confirmation", "birthday", "thankyou")]

FIT_JS = r"""
(() => {
  const W = %d, H = %s, out = [];
  const root = document.querySelector('.ab') || document.body;
  const R0 = root.getBoundingClientRect();
  const all = root.querySelectorAll('*');
  for (const el of all) {
    if (el.closest('[data-bleed]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const name = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
    const txt = el.textContent.trim().slice(0, 40);
    // text box must sit inside the canvas
    if (r.left < R0.left - 1 || r.right > R0.left + W + 1 || r.top < R0.top - 1 || (H && r.bottom > R0.top + H + 1))
      out.push({el: name, text: txt, issue: 'outside canvas', rect: [r.left|0, r.top|0, r.right|0, r.bottom|0]});
    // clipped text inside its own box
    if ((cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2))
      out.push({el: name, text: txt, issue: 'clipped', sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight});
    // text glyphs wider than the box (line too long to wrap)
    const range = document.createRange(); range.selectNodeContents(el);
    const tr = range.getBoundingClientRect();
    if (tr.right > R0.left + W + 1 || tr.left < R0.left - 1)
      out.push({el: name, text: txt, issue: 'glyphs outside canvas', rect: [tr.left|0, tr.right|0]});
  }
  const fonts = ['80px Gloock', '600 20px "Big Shoulders"', '20px "Hanken Grotesk"'].map(f => document.fonts.check(f));
  const broken = [...document.images].filter(i => i.complete && !i.naturalWidth && i.getAttribute('src')).map(i => i.getAttribute('src'));
  return {issues: out, fonts, broken};
})()
"""

READY_JS = r"""
(async () => {
  await document.fonts.ready;
  try { await Promise.all(['80px Gloock', '600 20px "Big Shoulders"', '20px "Hanken Grotesk"'].map(f => document.fonts.load(f))); } catch (e) {}
  const imgs = [...document.images];
  await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  for (let k = 0; k < 40 && window.ARTBOARD_READY === false; k++) await new Promise(r => setTimeout(r, 100));
  return true;
})()
"""


def free_port(lo=0, hi=0):
    rng = range(lo, hi + 1) if lo else [0]
    for p in rng:
        s = socket.socket()
        try:
            s.bind(("127.0.0.1", p))
            port = s.getsockname()[1]
            s.close()
            return port
        except OSError:
            s.close()
    raise RuntimeError("no free port")


def start_server():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass
    handler = functools.partial(Quiet, directory=ROOT)
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", free_port()), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


class Cdp:
    def __init__(self, port):
        for _ in range(80):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
                page = [t for t in tabs if t["type"] == "page"][0]
                break
            except Exception:
                time.sleep(0.2)
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=90, suppress_origin=True)
        self.n = 0

    def __call__(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == self.n:
                if "error" in m:
                    raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})

    def eval(self, expr, wait=True):
        r = self("Runtime.evaluate", expression=expr, awaitPromise=wait, returnByValue=True)
        return r.get("result", {}).get("value")


def render(cdp, base, job):
    name, src, rel, w, h = job
    still = "?still=1" if name.startswith(("story", "ad-story")) else ""
    vh = h or 1200
    cdp("Emulation.setDeviceMetricsOverride", width=w, height=vh, deviceScaleFactor=1, mobile=False)
    cdp("Page.navigate", url=f"{base}/showcase/art/{src}{still}")
    time.sleep(0.6)
    for _ in range(60):
        if cdp.eval("document.readyState") == "complete":
            break
        time.sleep(0.15)
    cdp.eval(READY_JS)
    time.sleep(1.4 if still else 0.5)
    if h is None:
        h = int(cdp.eval("Math.ceil(document.documentElement.scrollHeight)"))
        cdp("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=1, mobile=False)
        time.sleep(0.4)
    fit = cdp.eval(FIT_JS % (w, "null" if rel.startswith("email") else h))
    shot = cdp("Page.captureScreenshot", format="png", captureBeyondViewport=True,
               clip={"x": 0, "y": 0, "width": w, "height": h, "scale": 1})
    im = Image.open(io.BytesIO(base64.b64decode(shot["data"]))).convert("RGB")
    out = os.path.join(EXP, rel)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, optimize=True)
    # web derivative for the showcase page
    web = os.path.join(EXP, "web", name + ".webp")
    os.makedirs(os.path.dirname(web), exist_ok=True)
    tw = 600 if w > 600 else 600
    im.resize((tw, round(im.size[1] * tw / im.size[0])), Image.LANCZOS).save(web, quality=86, method=5)
    return {"name": name, "file": rel, "size": im.size, **(fit or {})}


def font(size, face="BigShoulders.ttf"):
    try:
        return ImageFont.truetype(os.path.join(ROOT, "assets", "fonts", face), size)
    except Exception:
        return ImageFont.load_default()


def sheet(files, cols, tw, th, out, title):
    pad, top = 36, 120
    rows = (len(files) + cols - 1) // cols
    W = cols * tw + (cols + 1) * pad
    H = top + rows * (th + 60) + pad
    im = Image.new("RGB", (W, H), (20, 17, 16))
    d = ImageDraw.Draw(im)
    d.text((pad, 40), title, font=font(46, "Gloock-Regular.ttf"), fill=(239, 231, 218))
    for i, (label, f) in enumerate(files):
        t = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
        x = pad + (i % cols) * (tw + pad)
        y = top + (i // cols) * (th + 60)
        im.paste(t, (x, y))
        d.rectangle([x - 1, y - 1, x + tw, y + th], outline=(84, 68, 44))
        d.text((x, y + th + 14), label.upper(), font=font(22), fill=(194, 154, 91))
    im.save(out, optimize=True)


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    jobs = [j for j in JOBS if not only or j[0] in only]
    jobs = [j for j in jobs if os.path.exists(os.path.join(SHOW, "art", j[1]))]
    httpd = start_server()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    port = free_port(9700, 9749)
    prof = tempfile.mkdtemp(prefix="xxviii-render-")
    proc = subprocess.Popen([CHROME, "--headless=new", f"--user-data-dir={prof}", f"--remote-debugging-port={port}",
                             "--hide-scrollbars", "--force-color-profile=srgb", "--window-size=1080,1920", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    report = []
    try:
        cdp = Cdp(port)
        cdp("Page.enable"); cdp("Runtime.enable")
        for job in jobs:
            r = render(cdp, base, job)
            report.append(r)
            flag = "OK " if not r.get("issues") and all(r.get("fonts", [1])) and not r.get("broken") else "FIX"
            print(f"{flag} {r['name']:<20} {r['size'][0]}x{r['size'][1]}  issues={len(r.get('issues', []))} fonts={r.get('fonts')} broken={r.get('broken')}")
            for iss in r.get("issues", [])[:8]:
                print("      ", iss)
        if not only:
            # captions.txt from the showcase data (single source)
            cdp("Emulation.setDeviceMetricsOverride", width=1200, height=900, deviceScaleFactor=1, mobile=False)
            cdp("Page.navigate", url=f"{base}/showcase/index.html")
            time.sleep(2.5)
            txt = cdp.eval("window.SHOWCASE && window.SHOWCASE.captionsText ? window.SHOWCASE.captionsText() : ''")
            if txt:
                with open(os.path.join(EXP, "captions.txt"), "w", encoding="utf-8", newline="\r\n") as f:
                    f.write(txt)
                print("captions.txt", len(txt), "chars")
    finally:
        try:
            proc.kill()
        except Exception:
            pass
        time.sleep(0.6)
        shutil.rmtree(prof, ignore_errors=True)
        httpd.shutdown()
    if not only:
        posts = [(f"Post {i:02d}", os.path.join(EXP, "posts", f"post-{i:02d}.png")) for i in range(1, 13)]
        posts = [p for p in posts if os.path.exists(p[1])]
        if posts:
            sheet(posts, 4, 360, 450, os.path.join(EXP, "posts", "contact-sheet-posts.png"), "XXVIII · Worth the Wait · feed posts 4:5")
        vert = [(f"Story {i:02d}", os.path.join(EXP, "stories", f"story-{i:02d}.png")) for i in range(1, 5)]
        vert += [(f"Meta story {i}", os.path.join(EXP, "ads", f"meta-story-{i}.png")) for i in range(1, 4)]
        vert = [p for p in vert if os.path.exists(p[1])]
        if vert:
            sheet(vert, 7, 270, 480, os.path.join(EXP, "stories", "contact-sheet-vertical.png"), "XXVIII · stories and story ads 9:16")
        feed = [(f"Meta feed {i}", os.path.join(EXP, "ads", f"meta-feed-{i}.png")) for i in range(1, 4)]
        feed = [p for p in feed if os.path.exists(p[1])]
        if feed:
            sheet(feed, 3, 360, 450, os.path.join(EXP, "ads", "contact-sheet-ads.png"), "XXVIII · Meta feed ads 4:5")
    with open(os.path.join(EXP, "fit-report.json" if not only else "fit-report-partial.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1)
    bad = [r["name"] for r in report if r.get("issues") or r.get("broken") or not all(r.get("fonts", [1]))]
    print(f"\n{len(report)} artboards rendered; text-fit failures: {bad or 'none'}")


if __name__ == "__main__":
    main()
