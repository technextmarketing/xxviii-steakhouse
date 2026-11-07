"""Build menu/index.html (the live book) and menu/print.html (the printed menu) from live/*.template.html.

    python -B _src/build_live.py

Inlines the primary logo as SVG with a brass foil gradient (the cover's foil catches the lamp: live.js moves the
gradient), so it works from file:// as well as http. Also stamps the PDF size and a cache-busting version.
"""
import json
import os
import re
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJ = os.path.dirname(ROOT)


def main():
    tpl = open(os.path.join(ROOT, "live", "index.template.html"), encoding="utf-8").read()
    svg = open(os.path.join(PROJ, "assets", "logo", "xxviii-primary-brass.svg"), encoding="utf-8").read()
    svg = re.sub(r"<title>.*?</title>", "", svg)
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w = float(m.group(1))
    grad = (f'<defs><linearGradient id="foilg" class="foilg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{w:.0f}" y2="0">'
            '<stop offset="0" stop-color="#8a6a3a"/><stop offset=".38" stop-color="#c29a5b"/><stop offset=".5" stop-color="#f4dfb4"/>'
            '<stop offset=".62" stop-color="#c29a5b"/><stop offset="1" stop-color="#8a6a3a"/></linearGradient></defs>')
    svg = svg.replace('<g fill="#C29A5B">', grad + '<g fill="url(#foilg)">', 1)
    svg = svg.replace('role="img"', 'role="img" class="foil-svg"', 1)
    book = json.load(open(os.path.join(ROOT, "book", "book.json"), encoding="utf-8"))
    out = tpl.replace("{{LOGO}}", svg).replace("{{PDFMB}}", str(book.get("pdfMB", ""))).replace("{{V}}", time.strftime("%Y%m%d%H%M"))
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(out)
    print("index.html", len(out) // 1000, "KB")
    # the printed menu is the same pages in print mode (live.js reads LIVE_PRINT)
    ptpl = open(os.path.join(ROOT, "live", "print.template.html"), encoding="utf-8").read()
    open(os.path.join(ROOT, "print.html"), "w", encoding="utf-8").write(ptpl.replace("{{LOGO}}", svg))
    print("print.html")


if __name__ == "__main__":
    main()
