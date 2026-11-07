"""8 Nov brand kit update: every change made to the website and menu since Edition I was set.
Voice: CTA wording rules. Menu system: three ways to read the menu, photo-first rules. Digital: the booking funnel,
the context chip, the floating dock + phone bar, the host in chat."""
h = open('brand/index.html', encoding='utf-8').read()
ARR = '<span class="arr" aria-hidden="true"></span>'

def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:90])
    h = h.replace(old, new)

# ---------- IV · Voice: calls to action
CTA = '''
  <div class="ctav">
    <h3>Calls to action</h3>
    <p class="sub">Every invitation leads to the same place, a table. Each one is written for the moment it sits in, so no two buttons on a page say the same thing.</p>
    <ul class="ctav-rules">
      <li><b>One goal.</b><span>A held table, or a private-room enquiry. Nothing else gets a solid brass button.</span></li>
      <li><b>One line per moment.</b><span>Name what the guest is looking at: the cut, the room, the drink. Never repeat a line on the same page.</span></li>
      <li><b>No pressure.</b><span>No “now”, no “hurry”, no countdowns. The Long Wait is the only thing we ask guests to order early.</span></li>
      <li><b>Verb first, short.</b><span>Two to six words, sentence case in the copy, set in Big Shoulders capitals on the button.</span></li>
    </ul>
    <div class="say ctav-say">
      <div class="say-head"><span class="label">We say</span><span class="label">We don’t say</span></div>
      <ul class="say-list">
        <li><p>Book a table for this cut.</p><p>Book now!</p></li>
        <li><p>Start the evening with Patience.</p><p>Grab a drink before it’s gone.</p></li>
        <li><p>Book an unhurried dinner.</p><p>Reserve fast, tables are filling up.</p></li>
        <li><p>Pre-order a 45-day cut.</p><p>Limited stock, order today.</p></li>
      </ul>
    </div>
  </div>
'''
rep('''  <div class="banned">
    <h3>Words we leave out</h3>''', CTA + '''
  <div class="banned">
    <h3>Words we leave out</h3>''')

# ---------- XV · Menu system: rules + three ways to read it
rep('''        <li><b>Allergens</b>''', '''        <li><b>Photos lead</b><span>Every dish is pictured. The photograph comes first and type never sits on the food.</span></li>
        <li><b>Allergens</b>''')
FMT = '''
  <div class="fmt">
    <h3>Three ways to read it</h3>
    <p class="sub">One menu, one view per device. The same data feeds all three, so a price changes once.</p>
    <div class="fmt-grid">
      <figure class="fmt-item fmt-book">
        <div class="fmt-frame"><img src="img/digital/menu-book-desktop.webp" alt="The menu book on a computer: a two-page spread of The First Course, each dish photographed with its price" width="1140" height="810" loading="lazy" decoding="async"></div>
        <figcaption><b>The book</b><span>Computers and tablets. A leather-bound book that turns its pages: arrows, the page edges or search. Every page is loaded before the cover opens, so turns never wait.</span></figcaption>
      </figure>
      <figure class="fmt-item fmt-phone">
        <div class="fmt-frame"><img src="img/digital/menu-cards-phone.webp" alt="The menu on a phone: one scroll, a full-width photo for each dish with its name, price and description below" width="390" height="844" loading="lazy" decoding="async"></div>
        <figcaption><b>The scroll</b><span>Phones. One scroll, course by course: a full-width photo for every dish, then its name, price and one line. No pages to turn.</span></figcaption>
      </figure>
      <figure class="fmt-item fmt-pdf">
        <div class="fmt-frame fmt-pdfart"><img src="../assets/logo/xxviii-primary-brass.svg" alt="" width="725" height="311"><span class="label">20 pages · A4 · 5.8 MB</span></div>
        <figcaption><b>The printed menu</b><span>A PDF of the same spreads, for the table and for guests who want to keep it. Rebuilt whenever the menu changes.</span><a class="link label" href="../menu/out/xxviii-menu.pdf" download>Download the PDF</a></figcaption>
      </figure>
    </div>
  </div>
'''
rep('''    <ul class="mp-floats mp-floats-r" id="mpFloatsR" aria-hidden="true"></ul>
  </div>
</section>''', '''    <ul class="mp-floats mp-floats-r" id="mpFloatsR" aria-hidden="true"></ul>
  </div>''' + FMT + '''</section>''')

# ---------- XVIII · Digital: the website kit
old_a = h.index('''        <p class="label muted">One pair of buttons</p>''')
old_b = h.index('''        <div class="ui-btns"><button class="btn btn-solid" type="button" disabled>Fully booked</button></div>''')
rep(h[old_a:old_b], '''        <p class="label muted">One pair of buttons per section</p>
        <div class="ui-btns"><a class="btn btn-solid" href="#digital">Book your evening ''' + ARR + '''</a><a class="btn btn-line" href="#menu">Explore the menu</a></div>
        <p class="ui-note">Solid brass moves the guest to the table. The outline goes one step deeper into the page. One of each, never two solids side by side.</p>
''')
rep('''<label class="check"><input type="checkbox" checked><span class="clear-box-ic" aria-hidden="true"></span><span>We’re celebrating something</span></label>
      </form>
    </div>''', '''<label class="check"><input type="checkbox" checked><span class="clear-box-ic" aria-hidden="true"></span><span>We’re celebrating something</span></label>
      </form>
    </div>

    <div class="fn">
      <h3>The way to the table</h3>
      <p class="sub">The website reads top to bottom as one walk: from the first film to a held table. Each section ends with its own invitation, and the button carries what the guest was looking at into the booking.</p>
      <ol class="fn-steps" id="fnSteps">
        <li><span class="label fn-k">Hook</span><b>The hero</b><span class="fn-cta">Book your evening</span></li>
        <li><span class="label fn-k">Proof</span><b>Ageing room, The Twenty-Eight, the room</b><span class="fn-cta">Book a table for this cut</span></li>
        <li><span class="label fn-k">Choose</span><b>Menu, The Long Wait, Patience</b><span class="fn-cta">Pre-order a 45-day cut</span></li>
        <li><span class="label fn-k">Trust</span><b>What we keep to, the private room</b><span class="fn-cta">Book an unhurried dinner</span></li>
        <li class="is-goal"><span class="label fn-k">Book</span><b>Reserve a table</b><span class="fn-cta">Hold my table</span></li>
        <li><span class="label fn-k">Arrive</span><b>Calendar, menu book, directions</b><span class="fn-cta">Book before you visit</span></li>
        <li><span class="label fn-k">Return</span><b>The Ageing List</b><span class="fn-cta">Join</span></li>
      </ol>
      <div class="fn-pair">
        <figure class="fn-ctx">
          <div class="fn-ctx-art"><p class="fn-chip"><span class="label">Booking for</span> <span>The Twenty-Eight, please.</span> <span class="label fn-x">Remove</span></p><p class="label muted">Notes</p><p class="fn-notes">The Twenty-Eight, please.<br>No shellfish at the table.</p></div>
          <figcaption><b>The booking remembers</b><span>A button on The Twenty-Eight, a cut on the board or the Long Wait writes one line at the top of the notes. The guest can remove it. Their own words are never touched.</span></figcaption>
        </figure>
        <figure class="fn-measure">
          <ul class="fn-ev"><li><code>section_view</code><span>half a section on screen</span></li><li><code>cta_click</code><span>every button, with its section</span></li><li><code>reserve_context</code><span>a button prefilled the booking</span></li><li><code>reserve_start</code><span>first touch of the form</span></li><li><code>reserve_submit</code><span>party, occasion, source, campaign</span></li></ul>
          <figcaption><b>Measured, quietly</b><span>Five events in the page’s data layer, ready for analytics. Campaign tags from an ad link stay with the visit and travel with the booking.</span></figcaption>
        </figure>
      </div>
    </div>

    <div class="dock-kit">
      <h3>Always within reach</h3>
      <div class="dk-grid">
        <figure class="dk-desk">
          <div class="dk-art"><div class="dk-page"><i></i><i></i><i></i></div><div class="dk-stack"><span class="dk-book">''' + '''<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5c2.8-.9 5.4-.6 8 1 2.6-1.6 5.2-1.9 8-1v13c-2.8-.9-5.4-.6-8 1-2.6-1.6-5.2-1.9-8-1Z"/><path d="M12 6.5v13"/></svg>Menu book</span><span class="dk-ask"><img src="../assets/logo/xxviii-monogram-avatar.svg" alt="" width="34" height="34">Ask the host</span></div></div>
          <figcaption><b>Computer</b><span>Bottom right: the menu book above, the host below. Header: “Reserve a table”, always.</span></figcaption>
        </figure>
        <figure class="dk-phone">
          <div class="dk-art dk-art-ph"><div class="dk-page"><i></i><i></i></div><span class="dk-ask dk-ask-ph"><img src="../assets/logo/xxviii-monogram-avatar.svg" alt="" width="34" height="34"></span><div class="dk-bar"><span>Call</span><span>Directions</span><span>Menu</span><span class="on">Reserve</span></div></div>
          <figcaption><b>Phone</b><span>A bar of four under the thumb. Menu opens the menu book; the host floats alone above the bar.</span></figcaption>
        </figure>
        <figure class="dk-chat">
          <div class="chm"><div class="chm-top"><img src="../assets/logo/xxviii-monogram-avatar.svg" alt="" width="30" height="30"><div><b>Ask the host</b><span>Replies in a moment · not a booking line</span></div></div>
            <p class="chm-you">how long is the ribeye aged</p>
            <div class="chm-host"><p>Our Prime Ribeye is aged 35 days. 400 g, ₱4,800. The richest cut on the board.</p><div class="chm-card"><img src="../assets/img/plated/prime-ribeye-sm.webp" alt="" width="420" height="420" loading="lazy"><div><span class="age-tag">Aged <b>35</b> days</span><span class="chm-btns"><span>Reserve</span><span>See it on the menu</span></span></div></div></div>
            <div class="chm-chips"><span>The Twenty-Eight</span><span>Book a table</span><span>Sauces</span></div></div>
          <figcaption><b>The host, in chat</b><span>The house voice, typed: calm, exact, no exclamation marks. Every answer shows a photo, a film or a button. When it doesn’t know, it says so and offers the phone.</span></figcaption>
        </figure>
      </div>
    </div>''')

rep('<link rel="stylesheet" href="brand.css">', '<link rel="stylesheet" href="brand.css?v=2">')
open('brand/index.html', 'w', encoding='utf-8').write(h)
print('ok')
