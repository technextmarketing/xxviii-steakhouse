"""Shrink out/xxviii-menu.pdf in place (target <= 6 MB). Chrome embeds the WebP photos losslessly (Flate).
Each large colour image is downsampled to ~170 dpi of the size it is printed at (its largest placement on any
page) and re-encoded as JPEG. Soft masks (the cut-outs' transparency) are resized to the same pixel size and
stored as grey JPEG (soft edges and shadows survive it). Patterns, text and vectors are untouched.

    python -B _src/compress_pdf.py
"""
import os
import shutil

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "out", "xxviii-menu.pdf")
DPI, QUALITY = 120, 56
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
        if w * h < 60_000:
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
        if smask:   # the soft mask (cut-out edge + drop shadow): same pixel size, grey JPEG (soft edges survive it well)
            m = pymupdf.Pixmap(d, smask)
            if (nw, nh) != (m.width, m.height):
                m = pymupdf.Pixmap(m, nw, nh, None)
            d.update_stream(smask, m.tobytes("jpeg", jpg_quality=80), compress=False)
            for key, val in (("Filter", "/DCTDecode"), ("Width", str(nw)), ("Height", str(nh)), ("DecodeParms", "null"),
                             ("ColorSpace", "/DeviceGray"), ("BitsPerComponent", "8")):
                d.xref_set_key(smask, key, val)
        done += 1
    # CSS background textures (walnut, oak, slate) live inside tiling patterns, not in the page image lists:
    # re-encode any remaining large lossless RGB image without a soft mask (they sit under an 80-90 % dark wash)
    masks = {v[0] for v in info.values() if v[0]}
    for xref in range(1, d.xref_length()):
        if xref in info or xref in masks:
            continue
        try:
            obj = d.xref_object(xref, compressed=True)
        except Exception:
            continue
        if "/Subtype/Image" not in obj or "/SMask" in obj or "DCTDecode" in obj or "/ImageMask" in obj or "DeviceGray" in obj:
            continue
        if any(f"/SMask {xref} 0 R" in d.xref_object(o, compressed=True) for o in info):   # a soft mask of another image
            continue
        pix = pymupdf.Pixmap(d, xref)
        if pix.width * pix.height < 30_000:
            continue
        if pix.alpha:
            pix = pymupdf.Pixmap(pix, 0)
        if pix.n != 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        d.update_stream(xref, pix.tobytes("jpeg", jpg_quality=GROUND_Q), compress=False)
        for key, val in (("Filter", "/DCTDecode"), ("DecodeParms", "null"), ("ColorSpace", "/DeviceRGB"), ("BitsPerComponent", "8")):
            d.xref_set_key(xref, key, val)
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
