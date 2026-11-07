"""Import the printed menu PDF into the raw page cache the reader is built from.

    python -B tools/import_pdf.py out/xxviii-menu.pdf
    python -B tools/build_book.py

Writes the raw import cache (git-ignored) that build_book.py reads:
    _import/large/NNN.webp    page images ~1600 px high (zoom, high-DPI screens)
    _import/thumb/NNN.webp    thumbnails
    _import/runs/NNN.json     text runs with per-character widths (search, highlights, selectable text)
    _import/links.json        internal PDF links (the contents lines on page 2 -> page jumps)
    _import/text.json         plain page text (search index)
The PDF is the source of truth for page content: re-run this after every render.
"""
import json
import os
import re
import sys

import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMP = os.path.join(ROOT, "_import")
PAGE_H, THUMB_W = 1600, 300          # 230 x 330 mm pages -> 1115 x 1600 px
FLAGS = pymupdf.TEXT_INHIBIT_SPACES | pymupdf.TEXT_PRESERVE_WHITESPACE   # letter-spaced labels stay one word


def clean(t):
    return t.replace("\t", " ").replace(" ", " ").replace("\n", "")


def runs_of(page):
    """One run per text span (a phrase in one font), coordinates as fractions of the page."""
    W, H = page.rect.width, page.rect.height
    out = []
    for bi, b in enumerate(page.get_text("rawdict", flags=FLAGS)["blocks"]):
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            if abs(l["dir"][1]) > 0.01:          # curved or rotated lettering (seal, gauge) is not running text
                continue
            for s in l["spans"]:
                chars = [c for c in s["chars"] if c["c"] not in "\n\r"]
                while chars and not chars[0]["c"].strip():
                    chars.pop(0)
                while chars and not chars[-1]["c"].strip():
                    chars.pop()
                if not chars:
                    continue
                t = clean("".join(c["c"] for c in chars))
                x0 = chars[0]["bbox"][0]
                x1 = max(c["bbox"][2] for c in chars)
                y0, y1 = s["bbox"][1], s["bbox"][3]
                cw = []
                for i, c in enumerate(chars):
                    nx = chars[i + 1]["bbox"][0] if i + 1 < len(chars) else c["bbox"][2]
                    cw.append(max(0.0, nx - c["bbox"][0]) / W)
                out.append({"t": t, "x": x0 / W, "y": y0 / H, "w": (x1 - x0) / W, "h": (y1 - y0) / H,
                            "cw": cw, "s": round(s["size"], 1), "b": bi})
    return out


def tidy(line):
    """Search text should read like the menu, not like the letter-spaced labels:
    "AGED35DAYS" / "A G E D 35 D A Y S" -> "Aged 35 Days", "THE BOARD BY THE DOOR" -> "The Board By The Door"."""
    line = re.sub(r"\b(?:[^\W\d_] ){2,}[^\W\d_]\b", lambda m: m.group(0).replace(" ", ""), line)
    line = re.sub(r"(?<=[^\W\d_])(?=\d)|(?<=\d)(?=[^\W\d_]{2})", " ", line)
    line = re.sub(r"\b([^\W\d_]{2,})\b", lambda m: m.group(1).capitalize() if m.group(1).isupper() and not re.fullmatch(r"[IVXLC]+", m.group(1)) else m.group(1), line)
    return re.sub(r"[ ]{2,}", " ", line).strip()


def page_text(page):
    t = page.get_text("text", flags=FLAGS).replace("\t", " ").replace("\u00a0", " ")
    t = re.sub(r"[ ]{2,}", " ", t)
    return "\n".join(tidy(l) for l in t.split("\n") if l.strip())


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    pdf = pymupdf.open(sys.argv[1])
    for d in ("large", "thumb", "runs"):
        os.makedirs(os.path.join(IMP, d), exist_ok=True)
    texts, links = [], {}
    for i, page in enumerate(pdf, 1):
        W, H = page.rect.width, page.rect.height
        links[i] = [{"target": l["page"] + 1, "rect": [round(l["from"].x0 / W, 4), round(l["from"].y0 / H, 4),
                     round(l["from"].width / W, 4), round(l["from"].height / H, 4)]}
                    for l in page.get_links() if l.get("kind") in (pymupdf.LINK_GOTO, pymupdf.LINK_NAMED) and l.get("page", -1) >= 0]
        scale = PAGE_H / page.rect.height
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        im.save(os.path.join(IMP, "large", f"{i:03d}.webp"), "WEBP", quality=86, method=6)
        th = round(im.height * THUMB_W / im.width)
        im.resize((THUMB_W, th), Image.LANCZOS).save(os.path.join(IMP, "thumb", f"{i:03d}.webp"), "WEBP", quality=80)
        with open(os.path.join(IMP, "runs", f"{i:03d}.json"), "w", encoding="utf-8") as f:
            json.dump(runs_of(page), f, ensure_ascii=False, separators=(",", ":"))
        texts.append(page_text(page))
        print(f"{i:03d}  {im.width}x{im.height}")
    with open(os.path.join(IMP, "links.json"), "w", encoding="utf-8") as f:
        json.dump(links, f)
    with open(os.path.join(IMP, "text.json"), "w", encoding="utf-8") as f:
        json.dump(texts, f, ensure_ascii=False, indent=0)
    for d in ("large", "thumb", "runs"):                 # pages left over from a longer edition
        for name in os.listdir(os.path.join(IMP, d)):
            m = re.match(r"(\d{3})\.", name)
            if m and int(m.group(1)) > len(pdf):
                os.remove(os.path.join(IMP, d, name))
    print(f"imported {len(pdf)} pages - now run: python -B tools/build_book.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
