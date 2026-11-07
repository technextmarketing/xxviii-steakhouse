"""Render the printed menu: print.html -> out/xxviii-menu.pdf (+ page PNGs, a contact sheet, book/book.json).

    python -m http.server 4643 --bind 127.0.0.1 --directory <project root>    # in the background
    python -B _src/render.py [base-url]       # default http://127.0.0.1:4643/menu/print.html
    python -B tools/import_pdf.py out/xxviii-menu.pdf
    python -B tools/build_book.py

Chrome DevTools Page.printToPDF at the exact page size (230 x 330 mm), backgrounds on.
Then _src/compress_pdf.py re-encodes the photos as JPEG. Before printing it checks every page: text inside the content box (overflow must print []), no clipped titles, emptiness per page, minimum type sizes.
The contents (book/book.json) come from the page plan in assets/print/print.js (window.PLAN).
"""
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

import pymupdf
import websocket
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9640                      # parallel builders use 9600-9649
PDF = os.path.join(ROOT, "out", "xxviii-menu.pdf")
MM = 1 / 25.4
CHECK = r"""(() => {
  const pts = v => parseFloat(v) * .75, out = [];
  // text must stay inside its page's content box (photos may bleed: the page clips them on purpose)
  document.querySelectorAll('.pp').forEach((pp, i) => {
    const inner = pp.querySelector('.pg-in'); if (!inner) return;
    const b = inner.getBoundingClientRect();
    pp.querySelectorAll('.pg-in h2, .pg-in h3, .pg-in p, .pg-in dt, .pg-in dd, .pg-in .pr, .pg-in figcaption').forEach(e => {
      const q = e.getBoundingClientRect(); if (!q.width) return;
      if (q.bottom > b.bottom + 1 || q.top < b.top - 1 || q.right > b.right + 1 || q.left < b.left - 1) out.push([i + 1, 'outside', e.className || e.tagName, e.textContent.trim().slice(0, 24)]);
    });
  });
  const min = sel => { const a = [...document.querySelectorAll(sel)].map(e => pts(getComputedStyle(e).fontSize)); return a.length ? Math.round(Math.min(...a) * 10) / 10 : null; };
  return { overflow: out, clipped: window.__clipped(document), empty: window.__emptiness([...document.querySelectorAll('.pp')]),
    type: { descPt: min('.t__d'), namePt: min('.t__n, .bt__n'), pricePt: min('.pr:not(.pr--note)'), labelPt: min('.rh, .sub, .fo, .mac figcaption, .age-tag, .lw__m, .bt__m') } };
})()"""


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4643/menu/print.html"
    prof = tempfile.mkdtemp(prefix="xxviii-menu-")
    p = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={PORT}", f"--user-data-dir={prof}",
                          "--no-first-run", "--remote-allow-origins=*", "--hide-scrollbars", "--window-size=1200,1400", "about:blank"],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
                break
            except Exception:
                time.sleep(.2)
        ws = websocket.create_connection([t for t in tabs if t.get("type") == "page"][0]["webSocketDebuggerUrl"], timeout=600)
        mid = [0]
        errors = []

        def call(method, **params):
            mid[0] += 1
            ws.send(json.dumps({"id": mid[0], "method": method, "params": params}))
            while True:
                m = json.loads(ws.recv())
                if m.get("method") == "Runtime.exceptionThrown":
                    errors.append(m["params"]["exceptionDetails"].get("exception", {}).get("description", "exception"))
                if m.get("method") == "Runtime.consoleAPICalled" and m["params"]["type"] == "error":
                    errors.append(str(m["params"]["args"][0].get("value")))
                if m.get("id") == mid[0]:
                    return m.get("result", {})

        def ev(expr):
            r = call("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
            if "exceptionDetails" in r:
                raise RuntimeError(r["exceptionDetails"])
            return r.get("result", {}).get("value")

        call("Page.enable")
        call("Runtime.enable")
        call("Page.navigate", url=url)
        for _ in range(200):
            time.sleep(.2)
            try:
                if ev("!!window.__readyFlag"):
                    break
            except Exception:
                pass
        missing = ev("window.__ready")
        if missing:
            print("MISSING IMAGES:", missing)
        call("Emulation.setEmulatedMedia", media="print")
        time.sleep(.3)
        chk = ev(CHECK)
        print("overflow:", json.dumps(chk["overflow"]))
        print("clipped titles:", chk["clipped"])
        print("empty % per page:", chk["empty"])
        print("type (pt):", json.dumps(chk["type"]))
        plan = ev("window.PLAN")
        n_pages = ev("document.querySelectorAll('.pg').length")
        res = call("Page.printToPDF", paperWidth=230 * MM, paperHeight=330 * MM, marginTop=0, marginBottom=0,
                   marginLeft=0, marginRight=0, printBackground=True, preferCSSPageSize=True,
                   generateDocumentOutline=False, generateTaggedPDF=False)
        os.makedirs(os.path.dirname(PDF), exist_ok=True)
        with open(PDF, "wb") as f:
            f.write(base64.b64decode(res["data"]))
        if errors:
            print("page errors:", errors)
    finally:
        p.kill()

    # contents for the reader, from the page plan
    book = {
        "_readme": "GENERATED by _src/render.py from the page plan in assets/print/print.js. Edit there, then re-render.",
        "title": "The Menu", "brand": "XXVIII", "name": "Twenty-Eight",
        "pdf": "out/xxviii-menu.pdf",
        "reserve": {"href": "../index.html#reserve", "label": "Reserve a table"},
        "settings": {"flipSound": True, "startPage": 1, "indexPages": [], "hideInBookMode": []},
        "front": plan["front"], "back": plan["back"],
        "pageLabels": {str(k): v for k, v in plan["pageLabels"].items()},
        "chapters": plan["chapters"],
    }
    os.makedirs(os.path.join(ROOT, "book"), exist_ok=True)
    with open(os.path.join(ROOT, "book", "book.json"), "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=1)

    import compress_pdf          # photos -> JPEG at ~170 dpi inside the PDF (~47 MB -> < 6 MB)
    compress_pdf.main()
    book["pdfMB"] = round(os.path.getsize(PDF) / 1e6, 1)     # shown on the Download links
    with open(os.path.join(ROOT, "book", "book.json"), "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=1)
    doc = pymupdf.open(PDF)
    r = doc[0].rect
    print(f"pdf pages {doc.page_count} (html {n_pages})  size {r.width / 72 * 25.4:.1f} x {r.height / 72 * 25.4:.1f} mm  "
          f"{os.path.getsize(PDF) / 1e6:.1f} MB")
    pages = os.path.join(ROOT, "out", "pages")
    os.makedirs(pages, exist_ok=True)
    thumbs = []
    for i, pg in enumerate(doc, 1):
        pix = pg.get_pixmap(dpi=110, alpha=False)
        path = os.path.join(pages, f"page-{i:02d}.png")
        pix.save(path)
        thumbs.append(path)
    # contact sheet of every printed page (5 x 4)
    tw = 300
    th = round(tw * r.height / r.width)
    gap = 18
    cols = 5
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * gap, rows * th + (rows + 1) * gap), (8, 7, 6))
    for i, t in enumerate(thumbs):
        im = Image.open(t).convert("RGB").resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (gap + (i % cols) * (tw + gap), gap + (i // cols) * (th + gap)))
    out = os.path.join(ROOT, "out", "contact-sheet.png")
    sheet.save(out)
    print("contact sheet", out)


if __name__ == "__main__":
    main()
