"""Run the live menu book's suite (tools/qa_live.js: LIVEQA) in headless Chrome at several sizes, plus a
reduced-motion pass. Prints failures, frame times and every page error; exit code 1 if anything failed.

    python -B tools/run_qa.py [base-url] [WxH ...]
    python -B tools/run_qa.py http://127.0.0.1:4643/menu/ 1440x900 1180x1000 768x1024 390x844

The classic image reader (menu/classic/) has its own suite: tools/run_qa_classic.py.
DevTools ports 9600+ (parallel builders use 9600-9649).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from live_cdp import Session  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def one(base, W, H, port, reduced=False):
    s = Session(port)
    try:
        s.open(base, W, H, reduced)
        s.ev(open(os.path.join(ROOT, "tools", "qa_live.js"), encoding="utf-8").read())
        res = s.ev("(async()=>{ const r = await LIVEQA(); return {pass:r.pass, fail:r.fail, failed:r.failed, frames:r.frames}; })()")
        if reduced and isinstance(res, dict):
            rm = s.ev("(async()=>{ const B=LIVE.Book; if (LIVE.mobile) return {ok:true}; B.goTo(0); await new Promise(r=>setTimeout(r,300)); B.next(); const s1=B.s; return {ok: s1===1 && !document.querySelector('.grainfx').getAnimations().length, s1}; })()")
            res["reducedMotion"] = rm
        return res, s.errors
    finally:
        s.close()


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4643/menu/"
    sizes = sys.argv[2:] or ["1440x900", "1180x1000", "768x1024", "390x844"]
    bad = 0
    runs = [(sz, False) for sz in sizes] + [(sizes[0], True)]
    for i, (size, rm) in enumerate(runs):
        W, H = (int(v) for v in size.split("x"))
        res, errs = one(base, W, H, 9600 + i, rm)
        tag = size + (" reduced-motion" if rm else "")
        if not isinstance(res, dict) or "pass" not in res:
            print(f"{tag}: ERROR {res}"); bad += 1; continue
        print(f"{tag}: {res['pass']} pass, {res['fail']} fail")
        for f in res["failed"]:
            print(f"    FAIL {f['name']}  {f.get('info', '')}")
        if res.get("frames") and any(res["frames"].values()):
            print("    frames:", json.dumps(res["frames"]))
        if rm:
            print("    reduced motion:", res.get("reducedMotion"))
            if not (res.get("reducedMotion") or {}).get("ok"):
                bad += 1
        for e in errs:
            print("    page error:", e)
        bad += res["fail"] + len(errs)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
