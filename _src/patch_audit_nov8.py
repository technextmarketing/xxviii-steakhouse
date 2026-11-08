"""8 Nov full audit (content + format): opening state, booking promises, data wiring, captions, CTAs, meta, noindex."""
import re

def load(p): return open(p, encoding='utf-8').read()
def save(p, s): open(p, 'w', encoding='utf-8').write(s)

class F:
    def __init__(s, p): s.p = p; s.h = load(p)
    def rep(s, a, b, n=1):
        c = s.h.count(a); assert c == n, (s.p, c, a[:90]); s.h = s.h.replace(a, b)
    def save(s): save(s.p, s.h)

# ---------- data ----------
D = F('assets/data/xxviii.js')
D.rep("      capacity: '84 covers · private room for 14',",
      "      capacity: '84 covers · private room for 14',\n"
      "      privateSeats: 14,      /* the private room's one long table; also the largest booking the form takes */\n"
      "      enquiryFrom: 9,        /* parties this size or larger become a private-room enquiry */\n"
      "      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bonifacio+Global+City+Taguig',")
D.rep("null = the restaurant is open. */", "null = no date yet: in the preview build the site says 'Opening soon'; after launch (PREVIEW false) null = open. */")
D.save()

# ---------- index.html ----------
H = F('index.html')
r = H.rep
r('<title>XXVIII · Twenty-Eight Steakhouse — Dry-aged in Bonifacio Global City</title>',
  '<title>XXVIII · Twenty-Eight Steakhouse | Dry-aged in BGC</title>\n<meta name="robots" content="noindex, nofollow">')
LIVE = 'https://technextmarketing.github.io/xxviii-steakhouse/'
r('<meta property="og:image" content="https://xxviii.example/assets/img/plated/cowboy-cut-lg.webp">\n<meta property="og:image:width" content="1600">\n<meta property="og:image:height" content="1600">',
  f'<meta property="og:image" content="{LIVE}assets/img/social/og-xxviii.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">')
r('<meta name="twitter:image" content="https://xxviii.example/assets/img/plated/cowboy-cut-lg.webp">',
  f'<meta name="twitter:image" content="{LIVE}assets/img/social/og-xxviii.jpg">')
r('<link rel="preload" href="assets/fonts/BigShoulders.woff2" as="font" type="font/woff2" crossorigin>',
  '<link rel="preload" href="assets/fonts/BigShoulders.woff2" as="font" type="font/woff2" crossorigin>\n'
  '<link rel="preload" href="assets/fonts/HankenGrotesk.woff2" as="font" type="font/woff2" crossorigin>\n'
  '<link rel="apple-touch-icon" href="assets/logo/touch-icon-180.png">\n<link rel="icon" type="image/png" sizes="32x32" href="assets/logo/favicon-32.png">')
# JSON-LD: placeholders out until confirmed
r('"telephone":"+63 (2) 0000 0028",', '')
r('"streetAddress":"[Street], Bonifacio Global City",', '')
# dead hooks
r(' data-priority="hero"', '')
r('<div class="booking" data-booking>', '<div class="booking">')
# opening state (static, no-JS)
r('<p class="label muted" data-status-short>Open tonight</p>', '<p class="label muted" data-status-short>Opening soon</p>')
r('<span data-status>Open tonight · 5:30 PM – 11:00 PM</span>', '<span data-status>Opening soon · Hours to be confirmed</span>')
# board
r('<p class="board__line">Every steak lists its age. Nothing is hidden.</p>', '<p class="board__line">Each cut, with the day it has reached.</p>')
r('The ageing room sits beside the dining room, behind glass. This board is its daily log.', 'The ageing room sits by the entrance, behind glass. This board is its log.')
r('<p class="age-tag" data-b-age>Aged <b>35</b> days</p>\n        <h3 data-b-name>Prime Ribeye</h3>', '<p class="age-tag" data-b-age>Aged <b>28</b> days</p>\n        <h3 data-b-name>New York Strip</h3>')
# room tour: keep the label, drop the sentence that explains the picture
H.h = re.sub(r'(<figcaption><b>[^<]+</b>)<span>[^<]*</span>(</figcaption>)', r'\1\2', H.h)
# menu
r('<p class="menu__intro">From the first taste to the last. Prices in Philippine pesos. Tell us about any allergies before you order; the kitchen will guide you.</p>',
  '<p class="menu__intro">From the first taste to the last. Prices in pesos.</p>')
r('<a class="btn btn-line" href="menu/index.html">Open the menu book</a>', '<a class="btn btn-line" href="menu/index.html">See the whole menu</a>')
r('<p class="menu__note muted" data-price-note>Service charge and VAT wording: to be confirmed.</p>',
  '<p class="menu__note muted">Tell us about any allergies before you order. <span data-preview>Service charge and VAT: to be confirmed.</span></p>')
# reel
r('<h2 id="reel-title">Around the steak.</h2>', '<h2 id="reel-title">Around the steak</h2>')
r('data-book>Save a seat at the table <span', 'data-book>Find a table for the evening <span')
# values: data is the source (site.js override removed)
r('<p class="value__line">The menu tells you how many days each steak has aged.</p>', '<p class="value__line">The menu tells you how many days each steak has aged. Nothing is hidden.</p>')
# private + reserve
r('One long table behind its own door. Birthdays, anniversaries, business dinners: the evening runs at your pace.',
  'One long table, its own door. The evening runs at your pace.')
r('<p class="reserve__line">Your table is yours for the evening. Nobody will ask for it back.</p>', '<p class="reserve__line">Your table is yours for the evening.</p>')
r('For parties over fourteen, call us on', 'For parties over <span data-seats-word>fourteen</span>, call us on')
r('<figcaption class="label">Where you’ll sit</figcaption>', '')
r('<figcaption class="label">How you arrive</figcaption>', '')
r('<p class="bk-hint muted">Closed on Mondays.</p>', '<p class="bk-hint muted" data-closed-hint>Closed on Mondays.</p>')
r('<p>Nine or more? The private room seats fourteen at one table.</p>', '<p><span data-enq-word>Nine</span> or more? The private room seats <span data-seats-word>fourteen</span> at one table.</p>')
r('data-submit>Hold my table <span', 'data-submit>Request my table <span')
r('<p class="bk-preview muted">Preview build: bookings are not sent yet.</p>', '<p class="bk-preview muted" data-preview>Preview build: bookings are not sent yet. Call to confirm.</p>', 2)
r('<h3 data-done-title>Your table is held</h3>', '<h3 data-done-title>Your request is noted</h3>')
r('<button class="btn btn-solid" type="button" data-ics>Add to calendar</button>', '<button class="btn btn-line" type="button" data-ics>Add to calendar</button>')
r('<a class="btn btn-solid" data-tel data-call href="tel:+63200000028" hidden>Call us now</a>', '<a class="btn btn-line" data-tel data-call href="tel:+63200000028" hidden>Call to confirm the room</a>')
r('<a class="link" href="menu/index.html">Open the menu book</a> <a class="link" href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener">Get directions</a>',
  '<a class="link" href="menu/index.html">Read the menu before you come</a> <a class="link" data-maps href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener">Get directions</a>')
r('<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener">Get directions</a>',
  '<a class="btn btn-line" data-maps href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener">Find the door</a>')
r('<p class="news__line muted">A short note when a new cut reaches its day.</p>', '<p class="news__line muted">A note when a cut reaches its day, and first word when tables open.</p>')
r('<button class="btn btn-solid" type="submit">Join</button>', '<button class="btn btn-line" type="submit">Join the Ageing List</button>')
H.h = H.h.replace('href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener"',
                  'data-maps href="https://www.google.com/maps/search/?api=1&amp;query=Bonifacio+Global+City+Taguig" target="_blank" rel="noopener"').replace('data-maps data-maps', 'data-maps')
# seams between Values / Private and Visit / footer
H.h = H.h.replace('assets/css/brand.css?v=3', 'assets/css/brand.css?v=4').replace(re.search(r'assets/data/xxviii\.js(\?v=\d+)?', H.h).group(0), 'assets/data/xxviii.js?v=7')
H.h = H.h.replace('site/site.css?v=18', 'site/site.css?v=19').replace('site/site.js?v=18', 'site/site.js?v=19').replace('site/chat.css?v=6', 'site/chat.css?v=7').replace('site/chat.js?v=5', 'site/chat.js?v=6')
H.save()

# ---------- site.js ----------
S = F('site/site.js')
r = S.rep
r("  var C = X.brand.contact;\n", "  var C = X.brand.contact;\n"
  "  var SEATS = C.privateSeats || 14, ENQ = C.enquiryFrom || 9;\n"
  "  var NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];\n"
  "  function word(n) { return NUMW[n] || String(n); }\n"
  "  $$('[data-seats-word]').forEach(function (n) { n.textContent = word(SEATS); });\n"
  "  $$('[data-enq-word]').forEach(function (n) { var w = word(ENQ); n.textContent = w.charAt(0).toUpperCase() + w.slice(1); });\n"
  "  if (C.mapsUrl) $$('[data-maps]').forEach(function (a) { a.href = C.mapsUrl; });\n"
  "  (function () { var cl = C.hours.filter(function (h) { return /^closed/i.test(h.time); }).map(function (h) { return h.days; }); var n = $('[data-closed-hint]'); if (n) n.textContent = cl.length ? 'Closed on ' + cl.join(' and ') + 's.' : ''; })();\n")
r("  var ST_NOW = OPEN ? { open: false, txt: 'Opening ' + longDate(OPEN.utc) + ' · Reservations open', short: 'Opening ' + longDate(OPEN.utc) } : status();",
  "  /* No date yet in the preview build: never claim to be open. */\n"
  "  var PENDING = !OPEN && PREVIEW && !C.openingDate;\n"
  "  var ST_NOW = OPEN ? { open: false, txt: 'Opening ' + longDate(OPEN.utc) + ' · Reservations open', short: 'Opening ' + longDate(OPEN.utc) }\n"
  "    : PENDING ? { open: false, pending: true, txt: 'Opening soon · Date to be confirmed', short: 'Opening soon' } : status();")
r("    if (OPEN) return it.age >= 45", "    if (OPEN || PENDING) return it.age >= 45")
r("  var LINE_OVERRIDE = { 'ageing-room': 'Single cuts, weighed and aged in the glass room.' };",
  "  var LINE_OVERRIDE = {};\n  (function () { var a = section('ageing-room'); if (a) LINE_OVERRIDE['ageing-room'] = (WORDS0[a.items.length] || a.items.length) + ' single cuts, each tagged with its day.'; })();")
S.h = S.h.replace("  var LINE_OVERRIDE = {};", "  var WORDS0 = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];\n  var LINE_OVERRIDE = {};", 1)
r("  var VALUE_LINE = { Honesty: 'The menu tells you how many days each steak has aged.' };", "  var VALUE_LINE = {};")
r("[C.instagram, C.facebook, C.tiktok].forEach(function (hnd, i) { if (soc[i]) soc[i].title = hnd + ' (to be confirmed)'; });",
  "[C.instagram, C.facebook, C.tiktok].forEach(function (hnd, i) { if (soc[i]) { soc[i].textContent = ['Instagram', 'Facebook', 'TikTok'][i] + ' · ' + hnd + (PREVIEW ? ' (soon)' : ''); soc[i].title = hnd + (PREVIEW ? ' (to be confirmed)' : ''); } });")
r("  function isEnquiry() { return occ.value === 'Private dining' || party >= 9; }", "  function isEnquiry() { return occ.value === 'Private dining' || party >= ENQ; }")
r("isEnquiry() ? 'Send the enquiry ' : 'Hold my table '", "isEnquiry() ? 'Send the enquiry ' : (PREVIEW ? 'Request my table ' : 'Hold my table ')")
r("(closed ? (inf.wd === 1 ? ', closed' : ', no tables left') : '')", "(closed ? (HOURS[inf.wd] ? ', no more seatings' : ', closed') : '')")
r("'<p class=\"bk-times__none\">No tables left on this day.</p>'", "'<p class=\"bk-times__none\">No more seatings on this day. Please choose another.</p>'")
r("party = Math.max(1, Math.min(14, n));", "party = Math.max(1, Math.min(SEATS, n));")
r("stepBtns[1].disabled = party >= 14;", "stepBtns[1].disabled = party >= SEATS;")
r("show = party >= 9 && occ.value", "show = party >= ENQ && occ.value")
r("setParty(party < 9 ? 10 : party);", "setParty(party < ENQ ? ENQ + 1 : party);")
r("'Use digits only, with at least 7 of them.'", "'Use at least 7 digits. Spaces, + and brackets are fine.'")
r("'Please add an email address for the confirmation.'", "(PREVIEW ? 'Please add an email address so we can reply.' : 'Please add an email address for the confirmation.')")
r("enq ? 'Your enquiry is with us' : 'Your table is held'", "enq ? 'Your enquiry is noted' : (PREVIEW ? 'Your request is noted' : 'Your table is held')")
r("'We’ll call you within a day to confirm the room.'", "'The team will contact you to confirm the room.'")
r("C.phone + '. Preview build: this booking was not sent.'", "C.phone + '.' + (PREVIEW ? ' Preview build: this request was not sent. Call to confirm.' : '')")
r("'You are on the Ageing List. We will write when a cut reaches its day.'", "(PREVIEW ? 'Thank you. The list opens at launch; we will keep your place.' : 'You are on the Ageing List. We will write when a cut reaches its day.')")
r("    status: function () { return ST_NOW; },", "    status: function () { return ST_NOW; }, pending: PENDING, preview: PREVIEW, seats: SEATS, enquiryFrom: ENQ,")
S.save()

# ---------- chat.js ----------
J = F('site/chat.js')
r = J.rep
r("  var MAPS = 'https://www.google.com/maps/search/?api=1&query=Bonifacio+Global+City+Taguig';",
  "  var MAPS = (window.XXVIII && XXVIII.brand.contact.mapsUrl) || 'https://www.google.com/maps/search/?api=1&query=Bonifacio+Global+City+Taguig';")
r("' days. Five single cuts in the ageing room, and three ' + ages[ages.length - 1] + '-day cuts to share.'",
  "' days. ' + cap(numWord(STEAKS.filter(function (x) { return x.it.age < 45; }).length)) + ' single cuts in the ageing room, and ' + numWord(STEAKS.filter(function (x) { return x.it.age >= 45; }).length) + ' ' + ages[ages.length - 1] + '-day cuts to share.'")
r("text: 'Eight courses of choice, from Day One to the Last Course. Prices in Philippine pesos.'",
  "text: cap(numWord(SECTIONS.length)) + ' sections, from ' + SECTIONS[0].name + ' to ' + SECTIONS[SECTIONS.length - 1].name + '. Prices in Philippine pesos.'")
r("    return { intent: 'opening', text: 'We are open. ' + statusTxt() + '.',",
  "    if (S() && S().pending) return { intent: 'opening', text: 'Our opening date is still to be confirmed. Planned hours are below; the team will confirm before you book.', cards: [hoursCard(), buttons([bReserve()])], chips: ['See the steaks', 'Where are you?'] };\n"
  "    return { intent: 'opening', text: 'We are open. ' + statusTxt() + '.',")
r("' is outside our seatings: from 5:30 PM (12:00 PM on Sunday) to 10:30 PM. I have left the time for you to pick. '",
  "' is outside our seatings' + seatRange() + '. I have left the time for you to pick. '")
r("I am the host at Twenty-Eight.", "I am the website’s host assistant for Twenty-Eight.")
r("Replies in a moment · not a booking line", "Answers from this website · bookings go through the form")
# helpers
r("  function statusTxt() {", "  function numWord(n) { return ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n); }\n"
  "  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }\n"
  "  /* earliest and latest seating each day, from the hours in the data */\n"
  "  function seatRange() {\n"
  "    var site = S(); if (!site || !site.hours) return '';\n"
  "    var DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], seen = {}, out = [];\n"
  "    for (var wd = 0; wd < 7; wd++) { var h = site.hours[wd]; if (!h || !h.sessions.length) continue; var s = []; h.sessions.forEach(function (x) { for (var q = x.o; q <= x.c - 90; q += 30) s.push(q); }); if (!s.length) continue;\n"
  "      var k = site.fmt(s[0]) + ' to ' + site.fmt(s[s.length - 1]); if (h.sessions.length > 1) k = h.sessions.map(function (x) { return site.fmt(x.o) + ' to ' + site.fmt(x.c - 90); }).join(' and '); (seen[k] = seen[k] || []).push(DN[wd]); }\n"
  "    Object.keys(seen).forEach(function (k) { var d = seen[k]; out.push((d.length > 2 ? d[0] + ' to ' + d[d.length - 1] : d.join(' and ')) + ' ' + k); });\n"
  "    return out.length ? ': ' + out.join('; ') : '';\n  }\n"
  "  function statusTxt() {")
J.save()
print('ok')
