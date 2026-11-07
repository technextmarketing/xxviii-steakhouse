"""8 Nov brand kit quick update: brass foil on screen (logo chapter), phone rules + updated dock/chat captions (digital)."""
h = open('brand/index.html', encoding='utf-8').read()

def rep(a, b):
    global h
    assert h.count(a) == 1, a[:80]
    h = h.replace(a, b)

FOIL = '''
  <div class="foilb">
    <h3>On screen: brass foil</h3>
    <p class="sub">The mark is never flat yellow on a screen. It is struck in foil, like the menu cover: a darker brass at the edges, one bright band, a light top edge and a shadow beneath.</p>
    <div class="foilb-grid">
      <figure class="foilb-art foilb-char"><span class="bfoil" aria-hidden="true"><i></i></span><figcaption class="label">On charcoal · header, footer, intro</figcaption></figure>
      <figure class="foilb-art foilb-leather"><span class="bfoil" aria-hidden="true"><i></i></span><figcaption class="label">On oxblood leather · menu cover</figcaption></figure>
    </div>
    <ul class="foilb-rules">
      <li><b>The gradient</b><span><code>#8A6A3A → #C29A5B → #F4DFB4 → #C29A5B → #8A6A3A</code>, at 100°.</span></li>
      <li><b>The light</b><span>On a computer the bright band follows the pointer. On a phone it sweeps once every seven seconds. With reduced motion it stands still.</span></li>
      <li><b>Where</b><span>The logo and wordmark only: header, phone menu, footer, intro, menu cover. Never on body type, buttons or prices.</span></li>
      <li><b>Print</b><span>The same mark becomes real brass foil. The PDFs carry a separate foil plate.</span></li>
    </ul>
  </div>
'''
rep('''    </div>
  </div>
</section>

<!-- ============ VII · COLOUR ============ -->''', '''    </div>
  </div>
''' + FOIL + '''</section>

<!-- ============ VII · COLOUR ============ -->''')

rep('<figcaption><b>Phone</b><span>A bar of four under the thumb. Menu opens the menu book; the host floats alone above the bar.</span></figcaption>',
    '<figcaption><b>Phone</b><span>A bar of four under the thumb. Menu opens the menu book; the host floats alone above the bar and steps aside whenever it would cover a button or a field.</span></figcaption>')
rep('Every answer shows a photo, a film or a button. When it doesn’t know, it says so and offers the phone.</span></figcaption>',
    'Every answer shows a photo, a film or a button. “See it on the menu” opens the course and brings the dish to the middle of the screen, lit for a moment. When it doesn’t know, it says so and offers the phone.</span></figcaption>')

PHONE = '''
    <div class="phr">
      <h3>On a phone</h3>
      <ul class="phr-list">
        <li><b>Full width</b><span>Every button runs edge to edge, one above the other: solid first.</span></li>
        <li><b>44 px</b><span>The smallest thing a thumb can press. Dates, times and the guest stepper included.</span></li>
        <li><b>12 px</b><span>The smallest type on the page, labels included.</span></li>
        <li><b>Nothing sideways</b><span>No line is cut at the edge. Long lines wrap; only the photo reel and the Long Wait swipe.</span></li>
        <li><b>A clear top</b><span>The header masks whatever scrolls beneath it, so the logo never sits on a headline.</span></li>
      </ul>
    </div>
'''
rep('''    <div class="dock-kit">
      <h3>Always within reach</h3>''', PHONE + '''
    <div class="dock-kit">
      <h3>Always within reach</h3>''')

rep('the way to the table and the host in chat (XVIII)</p>', 'the way to the table and the host in chat (XVIII); brass foil on screen (VI) and phone rules (XVIII)</p>')
rep('brand.css?v=2', 'brand.css?v=3')
open('brand/index.html', 'w', encoding='utf-8').write(h)

CSS = '''
/* 8 Nov: brass foil on screen + phone rules */
.foilb { margin-top: clamp(56px, 7vw, 96px); }
.foilb h3 { margin-bottom: 10px; }
.foilb-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.foilb-art { margin: 0; display: grid; place-items: center; gap: 22px; padding: clamp(36px, 5vw, 64px) 24px 24px; min-height: 260px; }
.foilb-char { background: #141110; border: 1px solid var(--line-soft); }
.foilb-leather { background: #3a1013 url(../assets/img/texture/oxblood-tufted-leather-md.webp) center / cover; box-shadow: inset 0 0 60px rgba(0,0,0,.6); }
.foilb-art figcaption { color: var(--ash); }
.foilb-leather figcaption { color: #e2c48e; }
.bfoil { display: block; width: min(80%, 420px); aspect-ratio: 705 / 170; filter: drop-shadow(0 -1px 0 rgba(255,236,200,.3)) drop-shadow(0 2px 2px rgba(0,0,0,.8)) drop-shadow(0 0 10px rgba(0,0,0,.35)); }
.bfoil > i { display: block; width: 100%; height: 100%; background: linear-gradient(100deg, #8a6a3a 0%, #c29a5b 38%, #f4dfb4 50%, #c29a5b 62%, #8a6a3a 100%); background-size: 260% 100%; background-position: 50% 0;
  -webkit-mask: url(../assets/logo/xxviii-wordmark-brass.svg) center / contain no-repeat; mask: url(../assets/logo/xxviii-wordmark-brass.svg) center / contain no-repeat; animation: bfoil 7s ease-in-out infinite alternate; }
@keyframes bfoil { from { background-position: 15% 0; } to { background-position: 85% 0; } }
@media (prefers-reduced-motion: reduce) { .bfoil > i { animation: none; } }
.foilb-rules, .phr-list { list-style: none; margin: 28px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.phr-list { grid-template-columns: repeat(5, 1fr); }
.foilb-rules li, .phr-list li { display: grid; gap: 6px; align-content: start; padding: 18px 20px 20px; border-top: 1px solid var(--brass); background: rgba(255,255,255,.02); }
.foilb-rules b, .phr-list b { font: 400 1.3rem/1.15 var(--f-display); }
.foilb-rules span, .phr-list span { color: var(--ash); font-size: .92rem; }
.foilb-rules code { font: 500 .78rem/1.5 ui-monospace, Consolas, monospace; color: #e2c48e; word-break: break-word; }
.phr { margin-top: clamp(56px, 7vw, 96px); }
@media (max-width: 1100px) { .foilb-rules { grid-template-columns: 1fr 1fr; } .phr-list { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 760px) { .foilb-grid, .foilb-rules, .phr-list { grid-template-columns: 1fr; } }
'''
open('brand/brand.css', 'a', encoding='utf-8').write(CSS)
print('ok')
