"""XXVIII video exporter: reels, footage stories and Meta video ads (silent; add licensed audio in-app).

    python showcase/tools/reels.py                  # everything
    python showcase/tools/reels.py reel-a story-01  # only these plan ids (vad-1 = both formats)

The edit lives in showcase/art/motion.js (window.MOTION.plan): footage segments, crop pan, overlay parts and timing.
1. Every overlay part is rendered from showcase/art/motion.html through headless Chrome with a transparent
   background (Emulation.setDefaultBackgroundColorOverride alpha 0) and text-fit checked at its exact size.
2. ffmpeg crops a slice of each 16:9 source with a slow pan (crop x expression), drops it below a dark band,
   overlays the PNGs with timed alpha fades and a small rise, joins segments with 0.5 s crossfades.
3. Output: H.264 yuv420p, 30 fps, faststart, NO audio track, <= 4.5 Mbit/s; a poster PNG + web poster per file;
   exports/reels/contact-sheet-reels.png (1 frame per 2 s); exports/video-report.json (ffprobe).
"""
import base64, json, os, shutil, subprocess, sys, tempfile, time
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render  # shared CDP + static server helpers, FIT_JS, READY_JS

ROOT, SHOW, EXP = render.ROOT, render.SHOW, render.EXP
VID = os.path.join(ROOT, "assets", "video")
XF = 0.5          # crossfade between segments (s)
FPS = 30


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(" ".join(cmd)[:600]); print(r.stderr[-2500:]); raise SystemExit("ffmpeg failed")
    return r.stdout


class Shooter:
    def __init__(self, cdp, base, tmp):
        self.cdp, self.base, self.tmp, self.cache, self.fit = cdp, base, tmp, {}, []

    def png(self, pid, fmt, W, H, part, seg=0, n=None, ov=True, extra=""):
        q = f"id={pid}&fmt={fmt}&seg={seg}&part={part}" + (f"&n={n}" if n else "") + ("&ov=1" if ov else "") + extra
        if q in self.cache:
            return self.cache[q]
        cdp = self.cdp
        cdp("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=1, mobile=False)
        if ov:
            cdp("Emulation.setDefaultBackgroundColorOverride", color={"r": 0, "g": 0, "b": 0, "a": 0})
        else:
            cdp("Emulation.setDefaultBackgroundColorOverride")
        cdp("Page.navigate", url=f"{self.base}/showcase/art/motion.html?{q}")
        time.sleep(0.35)
        for _ in range(60):
            if cdp.eval("document.readyState") == "complete":
                break
            time.sleep(0.1)
        cdp.eval(render.READY_JS)
        time.sleep(0.25)
        fit = cdp.eval(render.FIT_JS % (W, H))
        if fit and fit.get("issues"):
            self.fit.append({"q": q, "issues": fit["issues"]})
        shot = cdp("Page.captureScreenshot", format="png", captureBeyondViewport=False, clip={"x": 0, "y": 0, "width": W, "height": H, "scale": 1})
        path = os.path.join(self.tmp, f"ov-{len(self.cache):03d}.png")
        open(path, "wb").write(base64.b64decode(shot["data"]))
        self.cache[q] = path
        return path


def seg_video(sh, pid, F, D, seg, i, out):
    """One segment -> intermediate mp4 (crf 14)."""
    W, H = 1080, D["h"]
    vt = seg.get("vt") or D["vt"]
    vh = H - vt
    cw = round(1080 * 1080 / vh)
    d = seg["d"]
    ins, filt, k = [], [], 1
    fmt_key = F
    if seg.get("v"):
        x0, x1 = seg["p0"] * (1920 - cw), seg["p1"] * (1920 - cw)
        ins += ["-ss", str(seg["ss"]), "-t", f"{d:.3f}", "-i", os.path.join(VID, seg["v"] + "-hd.mp4")]
        filt.append(f"[0:v]fps={FPS},crop={cw}:1080:x='{x0:.1f}+({x1 - x0:.1f})*t/{d}':y=0,scale=1080:{vh}:flags=lanczos,setsar=1,"
                    f"pad=1080:{H}:0:{vt}:color=0x141110,format=yuv420p[b0]")
        frame = sh.png(pid, fmt_key, W, H, "frame", i)
        ins += ["-loop", "1", "-framerate", str(FPS), "-t", f"{d:.3f}", "-i", frame]
        filt.append(f"[1:v]format=rgba[fr];[b0][fr]overlay=0:0[b1]")
        k, cur = 2, "b1"
    elif seg.get("sweep"):
        # end card with the brass light sweeping across the mark: one rendered frame per step, eased
        part, nfr = seg.get("end"), seg["sweep"]
        pat = os.path.join(sh.tmp, f"sw-{pid}-{fmt_key}-{i}-%03d.png")
        for j in range(nfr):
            t = j / (nfr - 1); e = t * t * (3 - 2 * t)
            shutil.copyfile(sh.png(pid, fmt_key, W, H, part, i, ov=False, extra=f"&sw={e:.3f}"), pat % j)
        ins += ["-framerate", f"{nfr / d:.4f}", "-i", pat]
        filt.append(f"[0:v]fps={FPS},setsar=1,format=yuv420p[b1]")
        k, cur = 1, "b1"
    else:
        part = seg.get("end") or seg.get("still")
        bg = sh.png(pid, fmt_key, W, H, part, i, ov=False)
        frames = int(round(d * FPS))
        z = seg.get("zoom", .035)
        ins += ["-loop", "1", "-framerate", str(FPS), "-t", f"{d:.3f}", "-i", bg]
        zx = "(iw-iw/zoom)*(0.15+0.7*on/" + str(frames) + ")" if seg.get("pan") else "iw/2-(iw/zoom/2)"
        filt.append(f"[0:v]scale=2160:-2,zoompan=z='1+{z}*on/{frames}':x='{zx}':y='ih/2-(ih/zoom/2)':d=1:s=1080x{H}:fps={FPS},setsar=1,format=yuv420p[b1]")
        k, cur = 1, "b1"
    for o in seg.get("ov", []):
        if o["part"] == "n":
            nums = list(range(o["from"], o["to"] + 1))
            for j, nv in enumerate(nums):
                p = sh.png(pid, fmt_key, W, H, "n", i, n=nv)
                ins += ["-loop", "1", "-framerate", str(FPS), "-t", f"{d:.3f}", "-i", p]
                a = o["at"] + j * o["step"]
                en = f"gte(t,{a:.3f})" if j == len(nums) - 1 else f"between(t,{a:.3f},{a + o['step'] - 0.001:.3f})"
                filt.append(f"[{k}:v]format=rgba[o{k}];[{cur}][o{k}]overlay=0:0:enable='{en}'[c{k}]")
                cur, k = f"c{k}", k + 1
            continue
        p = sh.png(pid, fmt_key, W, H, o["part"], i)
        ins += ["-loop", "1", "-framerate", str(FPS), "-t", f"{d:.3f}", "-i", p]
        a = o["at"]
        fo = f",fade=t=out:st={o['out']}:d=0.45:alpha=1" if o.get("out") else ""
        fi = f"fade=t=in:st={a}:d=0.8:alpha=1" if a > 0 else "null"
        rise = f"'if(lt(t,{a}),28,if(lt(t,{a + 1.0}),28*pow(1-(t-{a})/1.0,3),0))'" if a > 0 else "0"
        filt.append(f"[{k}:v]format=rgba,{fi}{fo}[o{k}];[{cur}][o{k}]overlay=x=0:y={rise}:eval=frame[c{k}]")
        cur, k = f"c{k}", k + 1
    filt.append(f"[{cur}]format=yuv420p[vout]")
    run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(filt), "-map", "[vout]", "-t", f"{d:.3f}", "-r", str(FPS),
         "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-pix_fmt", "yuv420p", out])
    return d


def build(sh, pid, pl, fmts, tmp):
    F = pl["fmt"]; D = fmts[F]; D["h"] = D["h"]
    parts, durs = [], []
    for i, seg in enumerate(pl["segs"]):
        p = os.path.join(tmp, f"{pid}-seg{i}.mp4")
        durs.append(seg_video(sh, pl.get("id", pid), F, D, seg, i, p))
        parts.append(p)
    out = os.path.join(EXP, pl["out"] + ".mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    enc = ["-an", "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-maxrate", "4500k", "-bufsize", "9000k",
           "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart", "-tag:v", "avc1"]
    if len(parts) == 1:
        run(["ffmpeg", "-v", "error", "-y", "-i", parts[0], *enc, out])
        total = durs[0]
    else:
        ins, f, off, cur = [], [], 0.0, "0:v"
        for p in parts:
            ins += ["-i", p]
        for j in range(1, len(parts)):
            off += durs[j - 1] - XF
            f.append(f"[{cur}][{j}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}[x{j}]")
            cur = f"x{j}"
        total = sum(durs) - XF * (len(parts) - 1)
        run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(f), "-map", f"[{cur}]", *enc, out])
    # poster: first segment once its type is in, or the representative still
    pt = min(total - 0.2, 3.2 if len(parts) > 1 else total - 1.0)
    poster = os.path.join(EXP, pl["out"] + "-poster.png")
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{pt:.2f}", "-i", out, "-frames:v", "1", poster])
    web = os.path.join(EXP, "web", os.path.basename(pl["out"]) + ".webp")
    im = Image.open(poster).convert("RGB")
    im.resize((600, round(im.size[1] * 600 / im.size[0])), Image.LANCZOS).save(web, quality=84, method=5)
    return out


def probe(path):
    j = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate",
                        "-of", "json", path]))
    v = [s for s in j["streams"] if s["codec_type"] == "video"][0]
    return {"file": os.path.relpath(path, EXP).replace("\\", "/"), "duration": round(float(j["format"]["duration"]), 2),
            "mb": round(int(j["format"]["size"]) / 1048576, 2), "codec": v["codec_name"], "size": f"{v['width']}x{v['height']}",
            "pix": v["pix_fmt"], "fps": v["r_frame_rate"], "audio": any(s["codec_type"] == "audio" for s in j["streams"])}


def contact(files, out):
    tw, th, pad = 216, 384, 14
    rows = []
    for f in files:
        dur = float(json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", f]))["format"]["duration"])
        ts = [t + 0.6 for t in range(0, int(dur), 2)]
        frames = []
        for t in ts:
            tmpf = out + f".t{t}.png"
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", f, "-frames:v", "1", "-vf", f"scale={tw}:{th}", tmpf])
            frames.append((t, Image.open(tmpf).convert("RGB"))); os.remove(tmpf)
        rows.append((os.path.basename(f), frames))
    cols = max(len(r[1]) for r in rows)
    W = pad + cols * (tw + pad); H = sum(th + 64 for _ in rows) + pad
    im = Image.new("RGB", (W, H), (20, 17, 16)); d = ImageDraw.Draw(im)
    y = pad
    for name, frames in rows:
        d.text((pad, y), name, font=render.font(26), fill=(194, 154, 91))
        for c, (t, fr) in enumerate(frames):
            x = pad + c * (tw + pad)
            im.paste(fr, (x, y + 34)); d.text((x, y + 34 + th - 22), f"{t:.1f}s", font=render.font(18), fill=(239, 231, 218))
        y += th + 64
    im.save(out, optimize=True)


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    httpd = render.start_server()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    port = render.free_port(9700, 9749)
    prof = tempfile.mkdtemp(prefix="xxviii-reels-")
    tmp = tempfile.mkdtemp(prefix="xxviii-reels-build-")
    proc = subprocess.Popen([render.CHROME, "--headless=new", f"--user-data-dir={prof}", f"--remote-debugging-port={port}",
                             "--hide-scrollbars", "--force-color-profile=srgb", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    outs = []
    try:
        cdp = render.Cdp(port); cdp("Page.enable"); cdp("Runtime.enable")
        cdp("Page.navigate", url=f"{base}/showcase/art/motion.html"); time.sleep(1.2)
        plan = json.loads(cdp.eval("JSON.stringify(MOTION.plan)")); fmts = json.loads(cdp.eval("JSON.stringify(MOTION.fmt)"))
        sh = Shooter(cdp, base, tmp)
        for pid, pl in plan.items():
            if only and pid not in only and pl.get("id") not in only:
                continue
            t0 = time.time()
            o = build(sh, pid, pl, fmts, tmp)
            outs.append(o); print(f"built {pid:<12} -> {os.path.relpath(o, EXP)}  ({time.time() - t0:.0f}s)")
        if sh.fit:
            print("TEXT-FIT ISSUES:"); [print("  ", f) for f in sh.fit]
        else:
            print("text-fit: all overlay parts OK")
    finally:
        try: proc.kill()
        except Exception: pass
        time.sleep(0.6)
        shutil.rmtree(prof, ignore_errors=True); shutil.rmtree(tmp, ignore_errors=True)
        httpd.shutdown()
    rep = [probe(o) for o in outs]
    for r in rep:
        print(f"{r['file']:<44} {r['duration']:>5}s {r['mb']:>5} MB {r['codec']} {r['size']} {r['pix']} {r['fps']} audio={r['audio']}")
    old = []
    rp = os.path.join(EXP, "video-report.json")
    if os.path.exists(rp) and only:
        old = [r for r in json.load(open(rp, encoding="utf-8")) if r["file"] not in {x["file"] for x in rep}]
    json.dump(sorted(old + rep, key=lambda r: r["file"]), open(rp, "w", encoding="utf-8"), indent=1)
    reels = sorted(os.path.join(EXP, "reels", f) for f in os.listdir(os.path.join(EXP, "reels")) if f.endswith(".mp4")) if os.path.isdir(os.path.join(EXP, "reels")) else []
    if reels and (not only or any("reels" in o for o in outs)):
        contact(reels, os.path.join(EXP, "reels", "contact-sheet-reels.png")); print("contact sheet: exports/reels/contact-sheet-reels.png")


if __name__ == "__main__":
    main()
