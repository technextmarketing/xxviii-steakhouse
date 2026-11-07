"""Drive the live menu book in headless Chrome: a list of steps in ONE session (shots, JS, waits), with every
page exception and console error printed. Used for the QA frames and by run_qa.py.

    python -B tools/live_cdp.py steps.json
    steps.json: {"url": "...", "size": "1440x900", "port": 9611, "steps": [
        {"js": "LIVE.Book.next()"}, {"wait": 1.2}, {"shot": "out.png"}, {"eval": "return LIVE.Book.s", "print": "spread"}]}

DevTools port 9611 by default (parallel builders use 9600-9649). Needs websocket-client.
"""
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


class Session:
    def __init__(self, port):
        self.port = port
        self.p = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={port}", f"--user-data-dir={tempfile.mkdtemp(prefix='xxviii-live')}",
                                   "--no-first-run", "--remote-allow-origins=*", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
                                   "--window-size=1600,1200", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(80):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
                break
            except Exception:
                time.sleep(.2)
        self.ws = websocket.create_connection([t for t in tabs if t.get("type") == "page"][0]["webSocketDebuggerUrl"], timeout=600)
        self.mid = 0
        self.errors = []

    def call(self, method, **params):
        self.mid += 1
        self.ws.send(json.dumps({"id": self.mid, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            meth = m.get("method")
            if meth == "Runtime.exceptionThrown":
                self.errors.append(m["params"]["exceptionDetails"].get("exception", {}).get("description", "exception").splitlines()[0])
            elif meth == "Runtime.consoleAPICalled" and m["params"]["type"] in ("error", "assert"):
                a = m["params"]["args"][0] if m["params"]["args"] else {}
                self.errors.append("console.error: " + str(a.get("value", a.get("description", ""))))
            elif meth == "Log.entryAdded" and m["params"]["entry"]["level"] == "error":
                e = m["params"]["entry"]
                self.errors.append("log: " + e["text"] + " " + e.get("url", ""))
            if m.get("id") == self.mid:
                return m.get("result", {})

    def ev(self, expr):
        r = self.call("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        if "exceptionDetails" in r:
            d = r["exceptionDetails"]
            return {"__error": d.get("exception", {}).get("description", str(d))}
        return r.get("result", {}).get("value")

    def open(self, url, W, H, reduced=False):
        mobile = W < 760
        self.call("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=1, mobile=mobile)
        if mobile:
            self.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
        if reduced:
            self.call("Emulation.setEmulatedMedia", features=[{"name": "prefers-reduced-motion", "value": "reduce"}])
        self.call("Page.enable"); self.call("Runtime.enable"); self.call("Log.enable")
        self.call("Page.addScriptToEvaluateOnNewDocument", source="try{localStorage.setItem('xxviii-live-sound','0')}catch(e){}")
        self.call("Page.navigate", url=url)
        for _ in range(120):
            time.sleep(.25)
            if self.ev("!!(window.LIVE && document.documentElement.classList.contains('ready'))") is True:
                break
        self.ev("document.fonts.ready.then(()=>1)")

    def shot(self, out):
        s = self.call("Page.captureScreenshot", format="png")
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        open(out, "wb").write(base64.b64decode(s["data"]))
        print("saved", out)

    def close(self):
        try:
            self.p.kill()
        except Exception:
            pass


def run(cfg):
    W, H = (int(v) for v in cfg.get("size", "1440x900").split("x"))
    s = Session(cfg.get("port", 9611))
    try:
        s.open(cfg["url"], W, H, cfg.get("reduced", False))
        for st in cfg.get("steps", []):
            if "js" in st:
                v = s.ev(f"(async()=>{{ {st['js']} }})()")
                if v is not None:
                    print(st.get("print", "js") + ":", json.dumps(v, ensure_ascii=False)[:3000])
            if "wait" in st:
                time.sleep(st["wait"])
            if "shot" in st:
                s.shot(st["shot"])
        if s.errors:
            print("PAGE ERRORS:", *s.errors, sep="\n  ")
        else:
            print("page errors: 0")
        return s.errors
    finally:
        s.close()


if __name__ == "__main__":
    run(json.load(open(sys.argv[1], encoding="utf-8")))
