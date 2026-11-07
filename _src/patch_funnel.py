"""8 Nov: every section gets a CTA row; booking context chip; post-booking next steps."""
h = open('index.html', encoding='utf-8').read()
ARR = ' <span class="arr" aria-hidden="true"></span>'

def rep(old, new, count=1):
    global h
    assert h.count(old) == count, (h.count(old), old[:80])
    h = h.replace(old, new)

def row(primary, secondary=''):
    return '<div class="cta-row">' + primary + secondary + '</div>'

def book(label, note='', extra=''):
    n = ' data-note="%s"' % note if note else ''
    return '<a class="btn btn-solid" href="#reserve" data-book%s%s>%s%s</a>' % (n, extra, label, ARR)

# Ageing Room board: CTA inside the info panel (moves with the accordion on phones)
rep('        <p class="board__card"><span class="label">On its card</span><span class="board__card-txt" data-b-card></span></p>\n      </div>',
    '        <p class="board__card"><span class="label">On its card</span><span class="board__card-txt" data-b-card></span></p>\n        '
    + row(book('Book a table for this cut', extra=' data-b-book'), '<a class="btn btn-line" href="#menu">See the full menu</a>') + '\n      </div>')

# Signature
rep('        <p class="card3d__hint label muted" aria-hidden="true">Every steak arrives with its own card.</p>\n      </div>\n',
    '        <p class="card3d__hint label muted" aria-hidden="true">Every steak arrives with its own card.</p>\n      </div>\n      '
    + row(book('Reserve for The Twenty-Eight', 'The Twenty-Eight, please.'), '<a class="btn btn-line" href="#menu" data-menu-sec="ageing-room">See all the steaks</a>') + '\n')

# The room
rep('      <p class="room__intro">Dark wood, oxblood leather, brass light. A slow walk from the door to the long table.</p>\n',
    '      <p class="room__intro">Dark wood, oxblood leather, brass light. A slow walk from the door to the long table.</p>\n      '
    + row(book('Book a table in the room'), '<a class="btn btn-line" href="#private">See the private room</a>') + '\n')

# Menu: reserve first
rep('    <a class="btn btn-line" href="menu/index.html">Open the menu book <span class="arr" aria-hidden="true"></span></a>\n    <a class="link label menu__pdf"',
    '    ' + book('Reserve a table') + '\n    <a class="btn btn-line" href="menu/index.html">Open the menu book</a>\n    <a class="link label menu__pdf"')

# Long Wait
rep('        <p class="wait__line">Forty-five-day cuts for the table. Order early.</p>\n',
    '        <p class="wait__line">Forty-five-day cuts for the table. Order early.</p>\n        '
    + row(book('Pre-order a 45-day cut', 'We’d like to pre-order a 45-day cut for the table.')) + '\n')

# Patience
rep('      <ul class="drinks" data-drinks></ul>\n',
    '      <ul class="drinks" data-drinks></ul>\n      '
    + row(book('Book a table', 'Start us with Patience, please.'), '<button class="btn btn-line" type="button" data-ask="What drinks do you have?">Ask the host about drinks</button>') + '\n')

# Around the steak
rep('  <div class="reel__rows" data-reel></div>\n',
    '  <div class="reel__rows" data-reel></div>\n  <div class="wrap reel__foot">'
    + row(book('Reserve a table'), '<a class="btn btn-line" href="#menu">See the full menu</a>') + '</div>\n')

# Values
rep('    </ul>\n  </div>\n</section>\n\n<!-- 11. Private dining -->',
    '    </ul>\n    ' + row(book('Reserve a table'), '<button class="btn btn-line" type="button" data-ask="">Ask the host a question</button>')
    + '\n  </div>\n</section>\n\n<!-- 11. Private dining -->')

# Private: solid primary + call
rep('      <button class="btn btn-line" type="button" data-private-enquire>Enquire about the private room <span class="arr" aria-hidden="true"></span></button>\n',
    '      <div class="cta-row"><button class="btn btn-solid" type="button" data-private-enquire>Enquire about the private room' + ARR + '</button>'
    '<a class="btn btn-line" data-tel href="tel:+63200000028">Call the host</a></div>\n')

# Reserve: context chip above the form
rep('      <form class="booking__form" novalidate data-form>\n',
    '      <p class="bk-context" data-bk-context hidden><span class="label">Booking for</span> <span data-bk-context-txt></span> <button type="button" class="link label" data-bk-context-x>Remove</button></p>\n'
    '      <form class="booking__form" novalidate data-form>\n')

# After booking: next steps
rep('          <button class="btn btn-line" type="button" data-again>Change the booking</button>\n        </div>\n',
    '          <button class="btn btn-line" type="button" data-again>Change the booking</button>\n        </div>\n'
    '        <p class="booking__next"><span class="label muted">Before you come</span> <a class="link" href="menu/index.html">Open the menu book</a> <a class="link" href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener">Get directions</a></p>\n')

# Visit: reserve first, directions second
rep('      <a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener">Get directions <span class="arr" aria-hidden="true"></span></a>\n',
    '      ' + row(book('Reserve a table'), '<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener">Get directions</a>') + '\n')

h = h.replace('site/site.css?v=13', 'site/site.css?v=14').replace('site/site.js?v=14', 'site/site.js?v=15').replace('site/chat.js?v=3', 'site/chat.js?v=4')
open('index.html', 'w', encoding='utf-8').write(h)
print('ok', h.count('class="cta-row"'), 'cta rows')
