"""Shrink out/xxviii-menu.pdf in place (target <= 6 MB). Chrome embeds the WebP photos losslessly (Flate).
Each large colour image is downsampled to ~170 dpi of the size it is printed at (its largest placement on any
page) and re-encoded as JPEG. Soft masks (the cut-outs' transparency) are resized to the same pixel size and
stay lossless, so plate edges stay clean. Patterns, text and vectors are untouched.

    python -B _src/compress_pdf.py
"""
import os
import shutil

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "out", "xxviii-menu.pdf")
DPI, QUALITY = 170, 65
GROUND_PAGES = {2, 21}           # textured grounds under a 70-90 % char wash: detail is invisible, so 100 dpi / q 55
GROUND_DPI, GROUND_Q = 100, 55


def main():
    before = os.path.getsize(PDF)
    d = pymupdf.open(PDF)
    need, info = {}, {}                          # xref -> largest printed size in px at DPI
    for page in d:
        for im in page.get_images(full=True):
            xref, smask, w, h = im[0], im[1], im[2], im[3]
            info[xref] = (smask, w, h)
            ground = page.number + 1 in GROUND_PAGES and not smask
            if ground:
                info[xref] = (smask, w, h, True)
            elif len(info[xref]) == 3:
                info[xref] = (smask, w, h, False)
            dpi = GROUND_DPI if ground else DPI
            for r in page.get_image_rects(xref):
                tw, th = round(r.width / 72 * dpi), round(r.height / 72 * dpi)
                pw, ph = need.get(xref, (0, 0))
                need[xref] = (max(pw, tw), max(ph, th))
    done = 0
    for xref, (smask, w, h, ground) in info.items():
        if w * h < 200_000:
            continue
        tw, th = need.get(xref, (w, h))
        k = min(1.0, max(tw / w, th / h, 0.05))   # keep the aspect ratio, never upscale
        nw, nh = max(1, round(w * k)), max(1, round(h * k))
        pix = pymupdf.Pixmap(d, xref)
        if pix.alpha:
            pix = pymupdf.Pixmap(pix, 0)
        if pix.n != 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        if (nw, nh) != (w, h):
            pix = pymupdf.Pixmap(pix, nw, nh, None)
        d.update_stream(xref, pix.tobytes("jpeg", jpg_quality=GROUND_Q if ground else QUALITY), compress=False)
        for key, val in (("Filter", "/DCTDecode"), ("DecodeParms", "null"), ("ColorSpace", "/DeviceRGB"),
                         ("BitsPerComponent", "8"), ("Width", str(nw)), ("Height", str(nh))):
            d.xref_set_key(xref, key, val)
        if smask and (nw, nh) != (w, h):          # the mask must match the new pixel size
            m = pymupdf.Pixmap(pymupdf.Pixmap(d, smask), nw, nh, None)
            d.update_stream(smask, m.samples, compress=True)
            for key, val in (("Width", str(nw)), ("Height", str(nh)), ("DecodeParms", "null"),
                             ("ColorSpace", "/DeviceGray"), ("BitsPerComponent", "8")):
                d.xref_set_key(smask, key, val)
        done += 1
    tmp = PDF + ".tmp"
    d.save(tmp, garbage=1, deflate=True)
    d.close()
    shutil.move(tmp, PDF)
    e = pymupdf.open(PDF)                         # every page must still render
    for p in e:
        p.get_pixmap(dpi=12)
    print(f"compressed {done} images at {DPI} dpi: {before / 1e6:.1f} MB -> {os.path.getsize(PDF) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
