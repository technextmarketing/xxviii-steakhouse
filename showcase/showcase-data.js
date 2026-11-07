/* XXVIII showcase — campaign content (single source for the page AND exports/captions.txt).
   Classic script. Reads window.XXVIII for brand facts. Copy: UK English, calm, no invented claims. */
(function () {
  var X = window.XXVIII, C = X.brand.contact;
  var TAGS = {
    core: '#XXVIII #TwentyEightSteakhouse #WorthTheWait',
    place: '#BGC #BGCEats #TaguigEats #ManilaEats',
    beef: '#DryAged #DryAgedBeef #Steakhouse'
  };
  function ig(lines, extra) { return lines.join('\n\n') + '\n\n' + [TAGS.core, extra || TAGS.beef, TAGS.place].join(' '); }

  var posts = [
    { id: 'post-01', title: 'The Twenty-Eight', idea: 'Signature reveal',
      fb: 'This is The Twenty-Eight. A bone-in ribeye, dry-aged for 28 days, finished with cultured butter that has aged beside it in the same room. ₱5,800. Join The Ageing List to book first: ' + C.web + '/list',
      ig: ig(['The Twenty-Eight.', 'Bone-in ribeye. 600 g. Aged 28 days in the glass room by our door, finished with cultured butter that aged right beside it.', 'Our house signature, from opening night.']),
      tt: 'The steak we named ourselves after. 28 days in the ageing room, then the coals. #XXVIII #WorthTheWait #DryAged #BGCEats' },
    { id: 'post-02', title: 'Day 07 · Still', idea: 'Ageing-room tag close-up',
      fb: 'Day seven in the ageing room. The first Twenty-Eights went in on Day 01 and come out on Day 28, opening night. Nothing moves, nothing is rushed.',
      ig: ig(['Day 07. Still.', 'A week in the cold, quiet room by the entrance. The first Twenty-Eights went in on Day 01; they come out on Day 28, opening night.', 'We post the board every week. Turn on notifications to watch them age.'], '#DryAgedBeef #AgeingRoom #Steakhouse'),
      tt: 'Day 7 of 28 for the first Twenty-Eights. Still. Cold. Quiet. Come back on Day 14. #XXVIII #AgeingRoom #DryAged #ManilaFood' },
    { id: 'post-03', title: 'Every steak lists its age', idea: 'The honesty rule',
      fb: 'Our menu tells you how many days every steak has aged. Twenty-one, twenty-eight, thirty-five, forty-five. Nothing is hidden.',
      ig: ig(['Every steak lists its age.', 'Filet and picanha, 21 days. The Twenty-Eight and the strip, 28. Prime ribeye, 35. The Long Wait sharing cuts, 45.', 'It is on the menu, on the board in the ageing room, and on the card that comes with your steak.']),
      tt: 'How long has your steak aged? Ours tells you. #XXVIII #DryAged #SteakTok #BGCEats' },
    { id: 'post-04', title: 'The steak card', idea: 'Aged 28 days. Cut today. Yours tonight.',
      fb: 'Every steak at Twenty-Eight arrives with a small card that gives its own age. For this New York strip: Aged 28 days. Cut today. Yours tonight.',
      ig: ig(['Aged 28 days.\nCut today.\nYours tonight.', 'Every steak arrives with a card that gives its own age: 21, 28, 35 or 45 days. This one is the New York strip. Keep it, if you like.']),
      tt: 'Every steak comes with a card that gives its age. #XXVIII #WorthTheWait #Steakhouse #BGCEats' },
    { id: 'post-05', title: 'Patience', idea: 'House cocktail, typographic',
      fb: 'Patience, our house cocktail. A beef-fat-washed bourbon Old Fashioned, stirred slowly, over one clear ice cube. ₱720.',
      ig: ig(['Patience.', 'Beef-fat-washed bourbon. Stirred slowly. One clear ice cube.', 'The house cocktail, and good advice.'], '#OldFashioned #CocktailBar #Steakhouse'),
      tt: 'A beef-fat-washed Old Fashioned, stirred slowly. It is called Patience for a reason. #XXVIII #OldFashioned #BGCBars' },
    { id: 'post-06', title: 'The Long Wait', idea: 'The Sovereign Tomahawk, 45 days',
      fb: 'The Long Wait: our 45-day sharing cuts. The Sovereign Tomahawk is 1.4 kg, for two or three, ₱12,500. Order early, when you book.',
      ig: ig(['The Long Wait.', 'The Sovereign Tomahawk. 1.4 kg, aged 45 days, for two or three.', 'Order early, when you book. It has waited long enough to be worth planning for.']),
      tt: '45 days for one steak. Worth it. #XXVIII #Tomahawk #DryAged #SteakTok' },
    { id: 'post-07', title: 'Made at your table', idea: 'Caesar, prepared tableside',
      fb: 'The Caesar is made at your table: anchovy and garlic crushed in the bowl, yolk and oil whisked by hand, romaine and parmesan tossed in front of you. For two, ₱1,100.',
      ig: ig(['Made at your table.', '01 Anchovy and garlic, crushed in the bowl.\n02 Yolk, lemon and oil, whisked by hand.\n03 Romaine and parmesan, tossed.', 'The Caesar, prepared tableside. For two.'], '#CaesarSalad #Tableside #Steakhouse'),
      tt: 'Three steps, one bowl, at your table. #XXVIII #CaesarSalad #Tableside #BGCEats' },
    { id: 'post-08', title: 'The Last Course', idea: 'Dessert trio',
      fb: 'The Last Course. Dark chocolate fondant, crème brûlée, sticky toffee pudding. Take your time; the table is yours.',
      ig: ig(['Take your time.', 'Dark chocolate fondant. Crème brûlée. Sticky toffee pudding.', 'The Last Course. Nobody will bring the bill until you ask.'], '#Dessert #Steakhouse #DateNight'),
      tt: 'Nobody rushes dessert here. #XXVIII #Dessert #BGCEats' },
    { id: 'post-09', title: 'A room for fourteen', idea: 'The private room',
      fb: 'Our private room seats fourteen at one long table. For birthdays, families and long dinners that shouldn\'t end early. Enquiries: ' + C.email,
      ig: ig(['A room for fourteen.', 'One long table, three low lamps, and no one waiting for it.', 'Private dining enquiries: ' + C.email], '#PrivateDining #Steakhouse #DryAged'),
      tt: 'One table, fourteen chairs, no rush. #XXVIII #PrivateDining #BGC' },
    { id: 'post-10', title: 'Tables are open', idea: 'Reservations open',
      fb: 'Reservations are open for opening night and the weeks after. Book at ' + C.web + '/reserve or call ' + C.phone + '.',
      ig: ig(['Your table has waited too.', 'Reservations are open from opening night. Link in bio, or scan the code on the post.']),
      tt: 'Tables are open. Link in bio. #XXVIII #WorthTheWait #BGCEats #NewRestaurant' },
    { id: 'post-11', title: 'Time is the finest ingredient', idea: 'Opening night',
      fb: 'Twenty-eight days ago the first Twenty-Eights went into the ageing room. Tonight they come out, and we open. Time is the finest ingredient.',
      ig: ig(['Time is the finest ingredient.', 'Day 28. The first Twenty-Eights are ready, and so are we. Thank you for waiting with us.']),
      tt: 'Day 28. Opening night. #XXVIII #WorthTheWait #NewRestaurant #BGC' },
    { id: 'post-12', title: 'Choose your sauce or butter', idea: 'Poll post',
      fb: 'Help us choose for opening week. A Café de Paris butter, B Béarnaise, C Green Peppercorn & Cognac, D Chimichurri Verde. Tell us in the comments.',
      ig: ig(['Sauce or butter?', 'A Café de Paris butter\nB Béarnaise\nC Green Peppercorn & Cognac\nD Chimichurri Verde', 'Comment a letter. The most-chosen goes on every table in opening week.'], '#SteakSauce #Steakhouse #DryAged'),
      tt: 'A, B, C or D. Comment below. #XXVIII #SteakTok #BGCEats' }
  ];

  var stories = [
    { id: 'story-01', title: 'Day 14. Halfway.', line: 'The Twenty-Eight glide; the day count rolls to 14 of 28.', video: 'cowboy-cut' },
    { id: 'story-02', title: 'Which butter?', line: 'Poll: Café de Paris or black truffle butter, on slate.', video: null },
    { id: 'story-03', title: 'Day 25. Almost.', line: 'The strip glide; the first Twenty-Eights come out on Day 28.', video: 'new-york-strip' },
    { id: 'story-04', title: 'Tables are open', line: 'Châteaubriand orbit with a link sticker to the booking page.', video: 'chateaubriand-for-two' }
  ];

  var reels = [
    { id: 'reel-a', title: 'Worth the Wait', line: 'Tomahawk crane, The Twenty-Eight glide, the XXVIII end card.' },
    { id: 'reel-b', title: 'Every steak lists its age', line: 'Filet 21, strip 28, ribeye 35, porterhouse 45: each with its ageing tag.' },
    { id: 'reel-c', title: 'The Long Wait', line: 'Châteaubriand orbit, porterhouse overhead, then the four enhancements.' }
  ];
  var videoAds = [
    { id: 'vad-1', name: 'Worth the wait' }, { id: 'vad-2', name: 'Dinner for two' }, { id: 'vad-3', name: 'Never hurried' }
  ];

  var reel = [
    { t: '00:00–00:03', shot: 'The glass door of the ageing room, condensation on the pane. Slow push in.', text: 'The first cuts go in today.', sound: 'Cold-room hum. The soft release of the door seal.', vis: 'tag' },
    { t: '00:03–00:06', shot: 'A hand chalks DAY 01 on the board beside the first rack.', text: 'Twenty-eight days. No shortcuts.', sound: 'Chalk on slate. One low piano note.', vis: 'board' },
    { t: '00:06–00:10', shot: 'Locked-off time-lapse of the ribeye darkening; a day counter rolls 01 to 28.', text: 'Day 01 → Day 28', sound: 'A clock that ticks slower and slower.', vis: 'prime-ribeye' },
    { t: '00:10–00:13', shot: 'Overhead: the cut hits the grill. Smoke crosses the lamp light.', text: 'Cut today.', sound: 'The sear, close-miked. Nothing else.', vis: 'cowboy-cut' },
    { t: '00:13–00:17', shot: 'The plate is set down; a hand places the small card beside it.', text: 'Yours tonight.', sound: 'Dining-room murmur, a glass set on walnut.', vis: 'new-york-strip' },
    { t: '00:17–00:20', shot: 'End card: the XXVIII mark on charcoal, brass light sweeps across.', text: 'Worth the wait. Tables open soon.', sound: 'The hum cuts to silence on the last frame.', vis: 'mark' }
  ];

  var adsFeed = [
    { id: 'ad-feed-1', story: 'ad-story-1', name: 'Worth the wait', primary: 'The first Twenty-Eights are in the ageing room. Join The Ageing List and you book before anyone else.', headline: 'Worth the wait.', desc: 'The list books first · Twenty-Eight, BGC', cta: 'Sign up', runs: 'Day 06 to Day 18, before tables open' },
    { id: 'ad-feed-2', story: 'ad-story-2', name: 'Dinner for two', primary: 'Our Porterhouse for Two has aged 45 days. Strip and tenderloin on the bone, sliced at the table. Book a table for two.', headline: 'Dinner for two takes 45 days.', desc: 'Porterhouse for Two · ₱9,800', cta: 'Book now', runs: 'From Day 23' },
    { id: 'ad-feed-3', story: 'ad-story-3', name: 'Never hurried', primary: 'A dark, quiet dining room in BGC where every steak lists its age and no one brings the bill until you ask.', headline: 'Some things can\'t be hurried.', desc: 'Prime ribeye, aged 35 days', cta: 'Book now', runs: 'From Day 27' }
  ];

  var search = {
    url: C.web + '/reserve',
    headlines: ['Twenty-Eight Steakhouse BGC', 'Dry-Aged Steaks in BGC', 'Every Steak Lists Its Age', 'Aged 28 Days. Cut Today.', 'Book Opening Night', 'Reserve a Table Online', 'The Twenty-Eight Ribeye', '45-Day Sharing Cuts', 'A Private Room for 14', 'Some Things Can\'t Be Hurried', 'Worth the Wait', 'Tableside Caesar for Two', 'Dinner Is Never Hurried', 'Bonifacio Global City', 'Patience: Our Old Fashioned'],
    descriptions: ['Dry-aged in a glass room by our entrance. Every steak on the menu lists its age.', 'Bone-in ribeye aged 28 days, finished with cultured butter aged beside it. Book now.', 'Forty-five-day sharing cuts for the table. Order a day ahead. Private room for 14.', 'A quiet, dark dining room in BGC. Tables open from opening night. Reserve online.']
  };

  var emails = [
    { id: 'email-welcome', name: 'Welcome to The Ageing List', when: 'On sign-up (from Day 03)', subject: 'Welcome to The Ageing List', pre: 'The first Twenty-Eights went in on Day 01. Here is what happens next.' },
    { id: 'email-confirmation', name: 'Reservation confirmation', when: 'Instantly on booking', subject: 'Your table is set · Twenty-Eight', pre: 'Opening night, 7:30 PM, two guests. Everything you need is inside.' },
    { id: 'email-birthday', name: 'Birthday invitation', when: '21 days before a guest\'s birthday', subject: 'Another year, aged well', pre: 'A table kept for you in your birthday month.' },
    { id: 'email-thankyou', name: 'Thank you + review ask', when: 'The morning after a visit', subject: 'Thank you for waiting with us', pre: 'If it was worth the wait, tell people. If not, tell us.' }
  ];

  var sms = [
    { name: 'Booking confirmation', ch: 'SMS', text: 'Twenty-Eight: your table for 2 is set for [Date], 7:30 PM. Ref XXVIII-0000. To change it, reply here or call ' + C.phone + '.' },
    { name: 'Day-of reminder', ch: 'SMS', text: 'Twenty-Eight: see you tonight at 7:30 PM. The beef has waited 28 days, so take your time getting here. Reply C to cancel.' },
    { name: 'Ageing List first access', ch: 'SMS', text: 'Twenty-Eight: tables open to The Ageing List first, for [48] hours. Book: ' + C.web + '/reserve Reply STOP to opt out.' },
    { name: 'Birthday month', ch: 'Viber', text: 'Happy birthday from Twenty-Eight. We would like to keep a table for you this month. [Birthday gesture, to confirm with the owner]', button: 'Book your table' }
  ];

  /* the 28-day launch calendar: one planned piece per day. prev = preview key */
  var CH = {
    feed: { name: 'Feed post', short: 'Feed' }, story: { name: 'Story', short: 'Story' }, reel: { name: 'Reel', short: 'Reel' },
    ads: { name: 'Meta ads', short: 'Ads' }, google: { name: 'Google', short: 'Google' }, email: { name: 'Email', short: 'Email' },
    sms: { name: 'SMS / Viber', short: 'SMS' }, pr: { name: 'PR', short: 'PR' }
  };
  function P(n) { return posts[n - 1]; }
  var days = [
    { ch: 'reel', fmt: 'Reel · 9:16 · to shoot', hook: 'The first Twenty-Eights go into the ageing room.', prev: 'reel', cap: 'The first Twenty-Eights went into the ageing room today. On Day 28 they come out, and we open. Follow along. #XXVIII #WorthTheWait #DryAged' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'Every steak lists its age.', prev: 'post-03' },
    { ch: 'email', fmt: 'Email · welcome', hook: 'The Ageing List opens for sign-ups.', prev: 'email-welcome', cap: 'Subject: Welcome to The Ageing List\nPreheader: The first Twenty-Eights went in on Day 01. Here is what happens next.' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'Meet The Twenty-Eight.', prev: 'post-01' },
    { ch: 'story', fmt: 'Story · poll', hook: 'Which butter? Café de Paris or black truffle.', prev: 'story-02', cap: 'Story poll: Which butter? Café de Paris / Black truffle. Share the result on Day 06.' },
    { ch: 'ads', fmt: 'Meta ad · image + video', hook: 'Worth the wait. Join the list, book first.', prev: 'ad-feed-1' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'Day 07. Still.', prev: 'post-02' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'Patience, the house cocktail.', prev: 'post-05' },
    { ch: 'pr', fmt: 'Invitation card', hook: 'Tasting invitations go to food writers.', prev: 'pr', cap: 'Printed invitation, hand-delivered with a small tag. Tasting on Day 26, 7:00 PM. Reply by Day 22.' },
    { ch: 'reel', fmt: 'Reel · 9:16 · 17 s', hook: 'Worth the Wait: the teaser.', prev: 'reel-a', cap: 'Twenty-eight days for one steak. Worth the wait. Join The Ageing List, link in bio. #XXVIII #WorthTheWait #DryAged #BGCEats\n[Add licensed audio in-app]' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'The Caesar is made at your table.', prev: 'post-07' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'The Long Wait: 45 days for the table.', prev: 'post-06' },
    { ch: 'google', fmt: 'Business Profile post', hook: 'The listing goes live with hours and menu.', prev: 'gbp', cap: 'Business Profile update: "Opening soon. Every steak lists its age." Button: Learn more (Reserve from Day 20). Photo: The Twenty-Eight.' },
    { ch: 'story', fmt: 'Story · video', hook: 'Day 14. Halfway.', prev: 'story-01', cap: 'Story on the Twenty-Eight glide: Day 14 of 28. Sticker: "Remind me" for opening night.' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'Aged 28 days. Cut today. Yours tonight.', prev: 'post-04' },
    { ch: 'feed', fmt: 'Feed · 4:5 · poll', hook: 'Sauce or butter: A, B, C or D.', prev: 'post-12' },
    { ch: 'reel', fmt: 'Reel · 9:16 · 20 s', hook: 'Every steak lists its age: 21, 28, 35, 45.', prev: 'reel-b', cap: 'Filet, 21 days. Strip, 28. Ribeye, 35. Porterhouse, 45. Every steak lists its age. #XXVIII #DryAged #SteakTok #BGCEats\n[Add licensed audio in-app]' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'A room for fourteen.', prev: 'post-09' },
    { ch: 'sms', fmt: 'SMS · Ageing List', hook: 'The list gets first access to tables.', prev: 'sms', cap: sms[2].text },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'Your table has waited too.', prev: 'post-10' },
    { ch: 'story', fmt: 'Story · link', hook: 'Tables are open. Link sticker.', prev: 'story-04', cap: 'Story with link sticker: ' + C.web + '/reserve' },
    { ch: 'google', fmt: 'Search ads · RSA', hook: 'Search campaign goes live for BGC.', prev: 'search', cap: 'Responsive search ad: 15 headlines (≤ 30 characters), 4 descriptions (≤ 90). Final URL ' + C.web + '/reserve' },
    { ch: 'ads', fmt: 'Meta ad · image + video', hook: 'Dinner for two takes 45 days.', prev: 'ad-feed-2' },
    { ch: 'reel', fmt: 'Reel · 9:16 · 23 s', hook: 'The Long Wait, and what goes on top.', prev: 'reel-c', cap: 'The Long Wait: 45-day sharing cuts, carved at the table. Then truffle, marrow crust, foie gras, Oscar. Order early. #XXVIII #DryAged #Steakhouse #BGCEats\n[Add licensed audio in-app]' },
    { ch: 'story', fmt: 'Story · video', hook: 'Day 25. Almost.', prev: 'story-03', cap: 'Story on the strip glide: Day 25 of 28. The first Twenty-Eights come out on Day 28, opening night.' },
    { ch: 'feed', fmt: 'Feed · 4:5', hook: 'Take your time. The Last Course.', prev: 'post-08' },
    { ch: 'ads', fmt: 'Meta ad · image + video', hook: 'Some things can\'t be hurried.', prev: 'ad-feed-3' },
    { ch: 'feed', fmt: 'Feed · 4:5 · all channels', hook: 'Opening night. Time is the finest ingredient.', prev: 'post-11' }
  ];
  days.forEach(function (d, i) {
    d.day = i + 1;
    var p = posts.filter(function (x) { return x.id === d.prev; })[0];
    if (p && !d.cap) d.cap = p.ig;
    var a = adsFeed.filter(function (x) { return x.id === d.prev || x.story === d.prev; })[0];
    if (a && !d.cap) d.cap = 'Primary text: ' + a.primary + '\nHeadline: ' + a.headline + '\nCTA: ' + a.cta + '\nFormats: feed 4:5 and story 9:16, image and video.';
  });

  /* month one after opening: weekly rhythm (Monday closed) */
  var month = {
    start: 2, /* day 1 falls on a Wednesday (0 = Monday) */
    length: 30,
    rules: [
      { dow: 1, ch: 'story', t: ['The ageing-room board', 'This week\'s board', 'What is ready on Friday', 'The board, week four'] },
      { dow: 2, ch: 'feed', t: ['Guests\' first week', 'Bone marrow, split', 'The French onion', 'Oysters, half dozen', 'Porterhouse for Two'] },
      { dow: 3, ch: 'reel', every: 2, t: ['The tomahawk, carved', 'Patience, stirred', 'Bananas Foster, flamed'] },
      { dow: 3, ch: 'email', every: 2, off: 1, t: ['The ageing-room diary', 'Ageing List: the month ahead'] },
      { dow: 4, ch: 'ads', every: 2, t: ['Ads: swap to dinner-for-two', 'Ads: private room set', 'Ads: weekend set'] },
      { dow: 5, ch: 'google', t: ['Business Profile post', 'Profile: weekend hours', 'Profile: new photos', 'Profile: Sunday lunch', 'Profile post'] },
      { dow: 6, ch: 'story', t: ['Sunday lunch', 'Sunday lunch', 'Sunday lunch', 'Sunday lunch', 'Sunday lunch'] }
    ],
    extra: [
      { d: 2, ch: 'pr', t: 'Press release + media kit' },
      { d: 9, ch: 'pr', t: 'Follow-up to tasting guests' },
      { d: 15, ch: 'sms', t: 'Ageing Club launch SMS' },
      { d: 16, ch: 'email', t: 'Thank-you flow switched on' },
      { d: 23, ch: 'pr', t: 'Partner dinner pitch' },
      { d: 28, ch: 'sms', t: 'Day 28 of being open: list SMS' },
      { d: 28, ch: 'feed', t: 'One month open' }
    ]
  };

  var metrics = [
    { name: 'Reservations by source', where: 'Booking system with UTM-tagged links per channel, ad and QR', why: 'The one number that pays for the campaign. Tag every link so each piece can be credited.', when: 'Daily in launch, then weekly' },
    { name: 'Business Profile calls, directions and website taps', where: 'Google Business Profile performance', why: 'Shows who is planning a visit, not just looking.', when: 'Weekly' },
    { name: 'Saves and shares per post', where: 'Instagram and Facebook insights', why: 'Saves mean "I want to go". Better than likes for a restaurant.', when: 'Per post, 7 days after' },
    { name: 'Ageing List sign-ups', where: 'Email platform, by source form (site, Wi-Fi, QR)', why: 'Owned audience before the doors open; the list books first.', when: 'Daily in launch' },
    { name: 'Email opens and clicks to reserve', where: 'Email platform reports, by email', why: 'Which messages move people from reading to booking.', when: 'Per send' },
    { name: 'Cost per reservation from ads', where: 'Ads manager spend ÷ tagged bookings', why: 'Keeps paid spend honest; move budget to what books tables.', when: 'Weekly' },
    { name: 'Ageing Club return visits', where: 'Loyalty card scans at the table', why: 'Second visits are the real test of a restaurant.', when: 'Monthly' },
    { name: 'Reviews and replies', where: 'Business Profile and review sites', why: 'Count new reviews and reply to every one within two days.', when: 'Twice a week' }
  ];

  var press = {
    headline: 'Twenty-Eight opens in Bonifacio Global City with a dry-ageing room guests can watch',
    standfirst: 'The new steakhouse ages every cut on site, behind glass by the entrance, and lists the age of every steak on its menu.',
    body: [
      'Twenty-Eight (written XXVIII) opens on [opening date] at [Street], Bonifacio Global City, Taguig. The first Twenty-Eights went into the glass ageing room 28 days before opening; the longer-aged cuts were hung weeks earlier, so they are ready on opening night too. The restaurant has shared their progress on its social channels.',
      'The menu is built around the ageing room: The Ageing Room steaks list their age, from 21 to 35 days; The Long Wait sharing cuts are aged for 45. The house signature, The Twenty-Eight, is a bone-in ribeye finished with cultured butter aged beside it. The house cocktail, Patience, is a beef-fat-washed Old Fashioned.',
      'The dining room seats 84, with a private room for 14. Twenty-Eight is open Tuesday to Sunday; Monday the beef rests, and so does the team.'
    ],
    boilerplate: 'About Twenty-Eight. Twenty-Eight is a dry-aged steakhouse in Bonifacio Global City built on one idea: some things can\'t be hurried. Every steak is aged on site and lists its age on the menu, and no table is ever rushed. Reservations at ' + C.web + '. Press enquiries: ' + C.email + '.',
    kit: [
      ['Logo pack', 'Primary, horizontal, wordmark, monogram, seal and tag lockups in brass, bone, charcoal and oxblood (SVG)'],
      ['Dish photography', '50 plated photographs and transparent cut-outs, named by dish'],
      ['Fact sheet', 'Address, hours, capacity (84, private room for 14), booking details'],
      ['The ageing room, explained', 'One page on how and why every cut is dry-aged on site'],
      ['Menu', 'The full menu with ages per cut (PDF)'],
      ['Campaign stills', 'The Worth the Wait posts and the ageing-room diary, cleared for editorial use']
    ]
  };

  /* plain-text captions file (written to exports/captions.txt by tools/render.py) */
  function captionsText() {
    var L = [], hr = '------------------------------------------------------------';
    L.push('XXVIII · TWENTY-EIGHT STEAKHOUSE — "WORTH THE WAIT" LAUNCH CAPTIONS', 'UK English. Placeholders in [brackets]. Contacts are placeholders (.example).', '');
    posts.forEach(function (p) {
      L.push(hr, p.id.toUpperCase() + ' · ' + p.title + ' (' + p.idea + ')', 'File: exports/posts/' + p.id + '.png (1080 x 1350)', '',
        '[FACEBOOK]', p.fb, '', '[INSTAGRAM]', p.ig, '', '[TIKTOK]', p.tt, '');
    });
    L.push(hr, 'STORIES (exports/stories)');
    stories.forEach(function (s) { L.push(s.id + ' · ' + s.title + ' — ' + s.line); });
    L.push('', hr, 'REELS (exports/reels, 1080 x 1920, no audio: add licensed audio in-app)');
    reels.forEach(function (r) { L.push(r.id + ' · ' + r.title + ' — ' + r.line); });
    L.push('', hr, 'REEL STORYBOARD · INTO THE ROOM · 20 SECONDS (to shoot)');
    reel.forEach(function (r, i) { L.push('Frame ' + (i + 1) + ' ' + r.t + ' | Shot: ' + r.shot + ' | On screen: ' + r.text + ' | Sound: ' + r.sound); });
    L.push('', hr, 'META ADS (exports/ads)');
    adsFeed.forEach(function (a, i) { L.push('Variant ' + (i + 1) + ' · ' + a.name + ' (meta-feed-' + (i + 1) + ', meta-story-' + (i + 1) + ')', 'Primary text: ' + a.primary, 'Headline: ' + a.headline, 'Description: ' + a.desc, 'CTA: ' + a.cta, ''); });
    L.push(hr, 'GOOGLE SEARCH · RESPONSIVE SEARCH AD', 'Final URL: ' + search.url);
    search.headlines.forEach(function (h, i) { L.push('H' + (i + 1) + ' (' + h.length + '/30): ' + h); });
    search.descriptions.forEach(function (d, i) { L.push('D' + (i + 1) + ' (' + d.length + '/90): ' + d); });
    L.push('', hr, 'EMAIL');
    emails.forEach(function (e) { L.push(e.name + ' — ' + e.when, 'Subject: ' + e.subject, 'Preheader: ' + e.pre, ''); });
    L.push(hr, 'SMS / VIBER');
    sms.forEach(function (s) { L.push(s.ch + ' · ' + s.name + ' (' + s.text.length + ' chars)', s.text + (s.button ? '  [Button: ' + s.button + ']' : ''), ''); });
    L.push(hr, '28-DAY LAUNCH CALENDAR');
    days.forEach(function (d) { L.push('Day ' + (d.day < 10 ? '0' : '') + d.day + ' · ' + CH[d.ch].name + ' · ' + d.fmt + ' · ' + d.hook); });
    L.push('', hr, 'PRESS RELEASE', press.headline, press.standfirst, '');
    press.body.forEach(function (b) { L.push(b, ''); });
    L.push(press.boilerplate, '');
    return L.join('\n');
  }

  window.SHOWCASE = { posts: posts, stories: stories, reels: reels, videoAds: videoAds, reel: reel, adsFeed: adsFeed, search: search, emails: emails, sms: sms,
    CH: CH, days: days, month: month, metrics: metrics, press: press, captionsText: captionsText };
})();
