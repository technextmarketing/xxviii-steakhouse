"""Build the reader's data files from the raw import (_import/) + book/book.json (written by _src/render.py).

    python -B tools/import_pdf.py out/xxviii-menu.pdf   # page images + text into _import/
    python -B tools/build_book.py                        # reader data into book/

Outputs (all generated - do not hand-edit):
    book/pages/NNN.webp     full-resolution pages (~1600 px high: zoom, high-DPI screens)
    book/md/NNN.webp        display-size pages for the flip-book (light to decode and repaint)
    book/thumbs/NNN.webp    thumbnails (rail, grid, search results)
    book/text.json          clean page text for search
    book/words/NNN.json     text runs per page (search highlights, selectable text in zoom/scroll)
    book/manifest.json      page list, titles, chapters, hotspots (contents lines -> page jumps)
    book/data.js            all of the above JSON in one classic script (window.MENU_BOOK), so the
                            reader also opens from file:// where fetch() of local JSON is blocked
"""
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone

from PIL import Image, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMP = os.path.join(ROOT, "_import")
BOOK = os.path.join(ROOT, "book")
Q = 10000      # coordinates are stored as integers in 1/10000 of the page
MD_W = 820     # width of the display-size page images used by the flip-book

BOILERPLATE = [re.compile(r"^\d{2}$")]          # folio page numbers: noise in search results


def load_runs(n):
    return json.load(open(os.path.join(IMP, "runs", f"{n:03d}.json"), encoding="utf-8"))


def q(v):
    return int(round(v * Q))


def is_blank_image(path):
    st = ImageStat.Stat(Image.open(path).convert("L").resize((120, 170)))
    return st.stddev[0] < 2


def main():
    cfg = json.load(open(os.path.join(BOOK, "book.json"), encoding="utf-8"))
    texts = json.load(open(os.path.join(IMP, "text.json"), encoding="utf-8"))
    n_pages = len(texts)
    lp = os.path.join(IMP, "links.json")
    page_links = json.load(open(lp, encoding="utf-8")) if os.path.exists(lp) else {}
    for d in ("pages", "thumbs", "words", "md"):
        os.makedirs(os.path.join(BOOK, d), exist_ok=True)

    # page -> chapter / section titles from the page plan
    chapter_of, section_of, starts = {}, {}, []
    for ch in cfg["chapters"]:
        starts.append((ch["page"], ch, None))
        for title, p in ch["sections"]:
            starts.append((p, ch, title))
    starts.sort(key=lambda s: (s[0], s[2] is not None))
    last_ch = max(p for c in cfg["chapters"] for _, p in c["sections"])
    for i, (p, ch, title) in enumerate(starts):
        end = starts[i + 1][0] if i + 1 < len(starts) else last_ch + 1
        for pg in range(p, end):
            chapter_of[pg] = ch["no"]
            section_of[pg] = title
    section_title = {sp: st for c in cfg["chapters"] for st, sp in c["sections"]}
    labels = cfg.get("pageLabels", {})

    def sync(src, dst):
        if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src) or os.path.getmtime(src) > os.path.getmtime(dst):
            shutil.copyfile(src, dst)

    for d in ("pages", "thumbs", "words", "md"):          # a shorter edition must not leave old pages behind
        for f in os.listdir(os.path.join(BOOK, d)):
            m = re.match(r"(\d{3})\.", f)
            if m and int(m.group(1)) > n_pages:
                os.remove(os.path.join(BOOK, d, f))

    pages, hotspots, words = [], [], {}
    for n in range(1, n_pages + 1):
        src = os.path.join(IMP, "large", f"{n:03d}.webp")
        sync(src, os.path.join(BOOK, "pages", f"{n:03d}.webp"))
        sync(os.path.join(IMP, "thumb", f"{n:03d}.webp"), os.path.join(BOOK, "thumbs", f"{n:03d}.webp"))
        md = os.path.join(BOOK, "md", f"{n:03d}.webp")
        if not os.path.exists(md) or os.path.getmtime(src) > os.path.getmtime(md):
            im = Image.open(src).convert("RGB")
            im.resize((MD_W, round(im.height * MD_W / im.width)), Image.LANCZOS).save(md, "WEBP", quality=84, method=6)
        w_, h_ = Image.open(src).size

        runs = [r for r in load_runs(n) if r["t"].strip()]
        for l in page_links.get(str(n), []):
            tgt = l["target"]
            hotspots.append({"page": n, "type": "page", "target": tgt, "rect": l["rect"],
                             "label": f"{next((c['title'] for c in cfg['chapters'] if c['page'] == tgt), None) or labels.get(str(tgt)) or section_title.get(tgt) or 'Go to page'} — p. {tgt}"})
        wd = {"w": [[r["t"], q(r["x"]), q(r["y"]), q(r["w"]), q(r["h"]), [q(c) for c in r["cw"]], r["s"]] for r in runs], "p": []}   # r["s"] = font size in pt
        words[n] = wd
        with open(os.path.join(BOOK, "words", f"{n:03d}.json"), "w", encoding="utf-8") as f:
            json.dump(wd, f, ensure_ascii=False, separators=(",", ":"))

        blank = not texts[n - 1].strip() and is_blank_image(src)
        label = labels.get(str(n))
        ch_no = chapter_of.get(n)
        if not label:
            if blank:
                label = "Blank page"
            elif ch_no and section_of.get(n) is None:
                label = next(c for c in cfg["chapters"] if c["no"] == ch_no)["title"]
            else:
                label = section_of.get(n) or ""
        pages.append({"n": n, "w": w_, "h": h_, "blank": blank, "title": label, "chapter": ch_no, "parts": 0})

    clean = []
    for t in texts:
        lines = [l.strip() for l in t.replace("\r", "").split("\n")]
        clean.append("\n".join(l for l in lines if l and not any(b.match(l) for b in BOILERPLATE)))
    with open(os.path.join(BOOK, "text.json"), "w", encoding="utf-8") as f:
        json.dump(clean, f, ensure_ascii=False, separators=(",", ":"))

    manifest = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "pageCount": n_pages,
        "pageSize": [pages[0]["w"], pages[0]["h"]],
        "pages": pages,
        "hotspots": hotspots + cfg.get("hotspots", []),
        "products": {},
    }
    with open(os.path.join(BOOK, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
    data = {"cfg": cfg, "man": manifest, "text": clean, "words": words}
    with open(os.path.join(BOOK, "data.js"), "w", encoding="utf-8") as f:
        f.write("/* GENERATED by tools/build_book.py - the reader's data in one classic script (works from file://). */\n")
        f.write("window.MENU_BOOK = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"pages {n_pages}  size {manifest['pageSize']}  blanks {[p['n'] for p in pages if p['blank']]}  hotspots {len(hotspots)}")
    for p in pages:
        print(f"  {p['n']:>2}  {p['chapter'] or '-':>4}  {p['title']}")


if __name__ == "__main__":
    sys.exit(main())
