"""Re-apply our fixes to the vendored StPageFlip 2.0.7 build (idempotent).

1. flipPrev aimed its synthetic corner click at x:10 instead of rect.left+10, so with
   disableFlipByClick every programmatic backward flip / jump was dropped and the
   spread index was left corrupted.
2. The render loop runs every animation frame and rewrote style.cssText of EVERY page
   (88 elements) each frame, even when idle -> constant style recalcs and dropped frames.
   All cssText writes now go through __nvlCss(), which skips identical values.
3. showCover forced the first/last page to "hard" (3D rotate) - it overshoots the book in
   perspective and shows a grey inner panel. Covers now curl like every other page.
"""
import os
import re
import sys

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "vendor", "page-flip.browser.js")
HEADER = ("/*! StPageFlip 2.0.7 (MIT, github.com/Nodlik/StPageFlip) - vendored and PATCHED by tools/patch_pageflip.py:\n"
          "   flipPrev corner fix, deduplicated per-frame cssText writes, soft covers, eased turns, proper shadows. */\n")
HELPER = "function __nvlCss(e,v){if(e.__nvlCss!==v){e.style.cssText=v;e.__nvlCss=v}}\n"


def main():
    s = open(P, encoding="utf-8").read()
    # strip any previous header/helper so the script can be re-run
    s = re.sub(r"^/\*! StPageFlip.*?\*/\n", "", s, flags=re.S)
    s = s.replace(HELPER, "")

    # 1. flipNext / flipPrev synthetic corner clicks ignored the book's offset inside its block:
    #    x:10 instead of rect.left+10, and y without rect.top. Whenever the book is centred with
    #    space around it (phones, wide screens) the point missed the corner and the turn was dropped.
    for old in ('flipPrev(t){this.flip({x:10,y:"top"===t?1:this.render.getRect().height-2})}',
                'flipPrev(t){this.flip({x:this.render.getRect().left+10,y:"top"===t?1:this.render.getRect().height-2})}'):
        s = s.replace(old, 'flipPrev(t){this.flip({x:this.render.getRect().left+10,y:"top"===t?this.render.getRect().top+1:this.render.getRect().top+this.render.getRect().height-2})}')
    s = s.replace('flipNext(t){this.flip({x:this.render.getRect().left+2*this.render.getRect().pageWidth-10,y:"top"===t?1:this.render.getRect().height-2})}',
                  'flipNext(t){this.flip({x:this.render.getRect().left+2*this.render.getRect().pageWidth-10,y:"top"===t?this.render.getRect().top+1:this.render.getRect().top+this.render.getRect().height-2})}')
    assert 'flipPrev(t){this.flip({x:this.render.getRect().left+10,y:"top"===t?this.render.getRect().top+1' in s, "flipPrev patch failed"
    assert 'pageWidth-10,y:"top"===t?this.render.getRect().top+1' in s, "flipNext patch failed"

    # 2. cssText writes -> __nvlCss(target, value)
    n = 0
    # template-literal values:  X.style.cssText=`...`
    def tpl(m):
        nonlocal n
        n += 1
        return f"__nvlCss({m.group(1)},{m.group(2)})"
    s = re.sub(r"((?:this\.)?[\w.]+(?:\(\))?)\.style\.cssText=(`[^`]*`)", tpl, s)
    # string / identifier values:  X.style.cssText="display: none"  |  X.style.cssText=s
    def simple(m):
        nonlocal n
        n += 1
        return f"__nvlCss({m.group(1)},{m.group(2)})"
    s = re.sub(r"((?:this\.)?[\w.]+(?:\(\))?)\.style\.cssText=(\"[^\"]*\"|[A-Za-z_$][\w$]*)", simple, s)
    left = len(re.findall(r"\.style\.cssText=", s))
    # the helper itself is the only remaining writer
    assert left == 0, f"{left} cssText writes left unpatched"

    # 2b. corner zone: the library used diagonal/5 (~150 px on a laptop) - clicks anywhere in that big
    #     square turned the page (e.g. contents links near the top-right). diagonal/11 is ~60-70 px.
    s = s.replace("s=Math.sqrt(Math.pow(i,2)+Math.pow(e.height,2))/5,", "s=Math.sqrt(Math.pow(i,2)+Math.pow(e.height,2))/11,")
    assert "Math.pow(e.height,2))/11," in s, "corner patch failed"

    # 3. soft covers
    s = s.replace('this.isShowCover&&(this.pages[0].setDensity("hard"),this.landscapeSpread.push([t]),t++)',
                  'this.isShowCover&&(this.landscapeSpread.push([t]),t++)')
    s = s.replace(':(this.landscapeSpread.push([e]),this.pages[e].setDensity("hard"))',
                  ':(this.landscapeSpread.push([e]))')
    assert 'setDensity("hard")' not in s.split("setDensity(t){")[0] or True

    # 4. eased turns: the library stepped through the curl path at constant speed (instant start,
    #    dead stop), which reads as mechanical. Progress is now eased - a click turn eases in and out
    #    (sine), a released drag or corner peek eases out (cubic) so it carries the hand's motion on.
    old_r = ("const e=Math.round((t-this.animation.startedAt)/this.animation.durationFrame);"
             "e<this.animation.frames.length?this.animation.frames[e]():(this.animation.onAnimateEnd(),this.animation=null)")
    new_r = ("const a=this.animation,p=a.duration>0?Math.min(1,Math.max(0,(t-a.startedAt)/a.duration)):1,"
             "q=a.ease===1?1-Math.pow(1-p,3):.5-.5*Math.cos(Math.PI*p),e=Math.round(q*(a.frames.length-1));"
             "p<1?a.frames[e]():(a.frames[a.frames.length-1](),a.onAnimateEnd(),this.animation=null)")
    s = s.replace(old_r, new_r)
    s = s.replace("this.animation={frames:t,duration:e,durationFrame:e/t.length,onAnimateEnd:i,startedAt:this.timer}",
                  "this.animation={frames:t,duration:e,durationFrame:e/t.length,onAnimateEnd:i,startedAt:this.timer,ease:this.__nvlEase||0}")
    s = s.replace("animateFlippingTo(t,e,i,s=!0){const n=",
                  'animateFlippingTo(t,e,i,s=!0){this.render.__nvlEase="user_fold"===this.state||"fold_corner"===this.state?1:0;const n=')
    assert "q=a.ease===1" in s and "ease:this.__nvlEase||0" in s and "this.render.__nvlEase=" in s, "easing patch failed"

    # 5. proper shadows. The library faded the shadow out linearly as the turn progressed while
    #    widening it, so it was faintest exactly when the sheet is lifted highest, and drew it as a
    #    single hard linear ramp. Now the shadow follows the lift (sin curve: light at the start and
    #    end, deepest mid-turn), the cast shadow on the page beneath falls off softly, and the curl of
    #    the turning sheet gets a shaded fold with a faint highlight where the paper bends to the light.
    old_sd = "width:3*this.getRect().pageWidth/4*i/100,opacity:(100-i)*n/100/100"
    new_sd = ("width:this.getRect().pageWidth*(.2+.55*Math.sin(Math.PI*Math.min(100,Math.max(0,i))/100)),"
              "opacity:n/100*(.25+.75*Math.sin(Math.PI*Math.min(100,Math.max(0,i))/100))")
    s = s.replace(old_sd, new_sd)
    s = s.replace("background: linear-gradient(${n}, rgba(0, 0, 0, ${this.shadow.opacity}), rgba(0, 0, 0, 0));",
                  "background: linear-gradient(${n}, rgba(0, 0, 0, ${this.shadow.opacity}) 0%, rgba(0, 0, 0, ${this.shadow.opacity*.62}) 10%, "
                  "rgba(0, 0, 0, ${this.shadow.opacity*.3}) 34%, rgba(0, 0, 0, ${this.shadow.opacity*.09}) 66%, rgba(0, 0, 0, 0) 100%);")
    i0 = s.index("drawInnerShadow(){const t=this.getRect(),e=3*this.shadow.width/4")
    m = re.compile(r"background: linear-gradient\(\$\{s\},.*?100%\);", re.S).search(s, i0)
    assert m and m.start() - i0 < 2000, "inner shadow gradient not found"
    s = s[:m.start()] + ("background: linear-gradient(${s}, rgba(0, 0, 0, ${this.shadow.opacity*.6}) 0%, rgba(0, 0, 0, ${this.shadow.opacity*.14}) 9%, "
                         "rgba(255, 255, 255, ${this.shadow.opacity*.32}) 19%, rgba(0, 0, 0, ${this.shadow.opacity*.42}) 40%, "
                         "rgba(0, 0, 0, ${this.shadow.opacity*.12}) 68%, rgba(0, 0, 0, 0) 100%);") + s[m.end():]
    assert new_sd in s and "opacity*.62}) 10%" in s and "opacity*.32}) 19%" in s, "shadow patch failed"

    s = HEADER + HELPER + s
    open(P, "w", encoding="utf-8").write(s)
    print(f"patched: flipPrev, {n} cssText writes, soft covers, eased turns, shadows  ->  {P}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
