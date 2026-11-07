/* XXVIII · Twenty-Eight Steakhouse — single source of truth for brand + menu.
   Classic script (works from file://). Exposes window.XXVIII.
   PLACEHOLDERS (confirm with the owner before launch) are listed in brand.placeholders.
   Prices are INDICATIVE PHP (Manila premium-steakhouse range), not confirmed. */
window.XXVIII = {
  brand: {
    name: 'Twenty-Eight',
    mark: 'XXVIII',
    descriptor: 'Steakhouse',
    pronounce: 'Pronounced “Twenty-Eight”',
    est: 'MMXXVI',
    story: [
      'Twenty-eight days. That is how long it takes for good beef to become great: still, cold, quiet, patient.',
      'We don’t rush the beef, so we never rush you.',
      'Every steak we serve has waited for this moment, and so has your table.'
    ],
    storyBeats: ['Still', 'Cold', 'Quiet', 'Patient'],
    values: [
      { name: 'Patience', line: 'Good things take time, in the ageing room and at the table.' },
      { name: 'Craft', line: 'Every cut is aged, trimmed and seared by hand.' },
      { name: 'Honesty', line: 'The menu tells you how many days each steak has aged. Nothing is hidden.' },
      { name: 'Gathering', line: 'A long wait deserves a long dinner. Guests are never hurried.' }
    ],
    taglines: ['Some things can’t be hurried.', 'Worth the wait.', 'Time is the finest ingredient.'],
    steakCard: ['Aged 28 days.', 'Cut today.', 'Yours tonight.'],
    /* Honesty rule: the card always prints THAT steak's real age (Aged 21 / 28 / 35 / 45 days). 28 is the house example (The Twenty-Eight). */
    steakCardFor: function (days) { return ['Aged ' + days + ' days.', 'Cut today.', 'Yours tonight.']; },
    /* Launch timeline: the longer cuts (35 and 45 days) went into the ageing room weeks before the campaign.
       Campaign Day 01 = the first Twenty-Eights go in; Day 28 = they come out = opening night. */
    launch: { campaign: 'Worth the Wait', day1: 'The first Twenty-Eights go into the ageing room.', day28: 'Opening night. The first Twenty-Eights come out.', note: 'The 35- and 45-day cuts were hung weeks earlier, so they are ready on opening night too.' },
    touches: [
      'A glass dry-ageing room by the entrance, with a small board showing the day each cut has reached.',
      'Every steak arrives with a small card: “Aged 28 days. Cut today. Yours tonight.”',
      'A dark, quiet look: charcoal, oxblood red and brushed brass.'
    ],
    nameRule: 'Write the name as XXVIII on the logo and signage, and as Twenty-Eight in running text. Never write the numerals 28 as the name: Manila competitors advertise “28-day aged” steaks.',
    palette: [
      { id: 'char', name: 'Charcoal', hex: '#141110', role: 'Ground. Pages, menus, signage.' },
      { id: 'char-2', name: 'Smoke', hex: '#1F1A18', role: 'Raised surfaces, cards.' },
      { id: 'ox', name: 'Oxblood', hex: '#7A1E24', role: 'The leather booths. Accent grounds, the ageing tag.' },
      { id: 'ox-deep', name: 'Cellar', hex: '#4A1216', role: 'Deep accent, gradients into charcoal.' },
      { id: 'brass', name: 'Brushed Brass', hex: '#C29A5B', role: 'The mark, rules, numerals, focus.' },
      { id: 'brass-hi', name: 'Lit Brass', hex: '#E2C48E', role: 'Highlights on brass, hover.' },
      { id: 'bone', name: 'Bone', hex: '#EFE7DA', role: 'Text on dark. Plates, linen.' },
      { id: 'ash', name: 'Ash', hex: '#A39686', role: 'Secondary text on dark.' }
    ],
    fonts: {
      display: { family: 'Gloock', role: 'Headlines, the XXVIII mark, dish names', why: 'High-contrast serif with knife-cut hairlines: an engraved steakhouse plaque, without the Didone fashion cliche.' },
      label: { family: 'Big Shoulders', role: 'Day counts, prices, tags, labels, navigation', why: 'Condensed sans named after Sandburg’s Chicago, the city of the stockyards. Reads like a butcher’s tag and a meat-locker stencil.' },
      body: { family: 'Hanken Grotesk', role: 'Body copy, descriptions, forms', why: 'Clean, warm grotesk that stays quiet next to the two display faces.' }
    },
    signature: { name: 'The Twenty-Eight', line: 'A bone-in ribeye dry-aged for 28 days, finished with cultured butter that has aged beside it in the same room.', img: 'cowboy-cut' },
    cocktail: { name: 'Patience', line: 'A beef-fat-washed bourbon Old Fashioned, stirred slowly and served over a single clear ice cube.', price: 720 },
    /* PLACEHOLDERS — replace once the owner confirms. Rule: no real-format phone, contacts on .example */
    contact: {
      area: 'Bonifacio Global City, Taguig',
      street: '[Street], Bonifacio Global City',
      phone: '+63 (2) 0000 0028',
      email: 'reservations@xxviii.example',
      web: 'xxviii.example',
      instagram: '@xxviii.steakhouse',
      facebook: 'XXVIII Steakhouse',
      tiktok: '@xxviii.steakhouse',
      hours: [
        { days: 'Tuesday – Thursday', time: '5:30 PM – 11:00 PM' },
        { days: 'Friday – Saturday', time: '5:30 PM – 12:00 AM' },
        { days: 'Sunday', time: '12:00 PM – 3:00 PM · 5:30 PM – 10:00 PM' },
        { days: 'Monday', time: 'Closed. The beef rests, and so do we.' }
      ],
      capacity: '84 covers · private room for 14',
      /* PLACEHOLDER (owner to confirm): opening night as 'YYYY-MM-DD'. While it is set and in the future, the website shows
         'Opening <date> · Reservations open' instead of live opening hours. null = the restaurant is open. */
      openingDate: null
    },
    placeholders: ['Street address', 'Phone', 'Email and domain (.example)', 'Social handles', 'Opening hours', 'Capacity and private room size', 'All prices (indicative PHP)', 'Steak weights and ageing days per cut', 'Opening year MMXXVI', 'Name clearance: IPOPHL / DTI (PH), ACRA (SG), domain, handles']
  },

  /* currency */
  cur: '₱',

  /* Menu — renamed sections per the brand doc. img = slug in assets/img/{plated|cutout}/<slug>-{lg|md|sm}.webp
     cut = has a cutout PNG/WebP. age = days dry-aged (the honesty rule: every steak lists its age). */
  menu: [
    { id: 'day-one', name: 'Day One', was: 'Amuse-Bouche', line: 'A first taste, on the house.', items: [
      { name: 'Wagyu Tallow Toast', desc: 'Grilled sourdough, whipped wagyu tallow, smoked salt, chive.', price: 0, note: 'Complimentary', img: 'wagyu-tallow-white', cutout: 'wagyu-tallow' }
    ]},
    { id: 'first-course', name: 'The First Course', was: 'To Begin', line: 'Raw, cured and seared. Something to start the evening.', items: [
      { name: 'Steak Tartare', desc: 'Hand-cut tenderloin, cured yolk, cornichon, caper, grilled bread.', price: 1150, img: 'steak-tartare', cutout: 'steak-tartare' },
      { name: 'Wagyu Carpaccio', desc: 'Shaved wagyu, aged parmesan, rocket, cold-pressed olive oil.', price: 1450, img: 'wagyu-carpaccio', cutout: 'wagyu-carpaccio' },
      { name: 'Seared Foie Gras', desc: 'Brioche, roasted fig, port reduction.', price: 1650, img: 'seared-foie-gras', cutout: 'seared-foie-gras' },
      { name: 'Roasted Bone Marrow', desc: 'Split canoe-cut bones, parsley and shallot salad, toast.', price: 980, img: 'roasted-bone-marrow', cutout: 'roasted-bone-marrow' },
      { name: 'Tiger Prawn Cocktail', desc: 'Poached tiger prawns, Marie Rose, lemon.', price: 1250, img: 'tiger-prawn-cocktail', cutout: 'tiger-prawn-cocktail' },
      { name: 'Oysters on the Half Shell', desc: 'Half dozen, shallot mignonette, lemon.', price: 1800, img: 'oysters-half-shell', cutout: 'oysters-half-shell' }
    ]},
    { id: 'garden', name: 'From the Garden', was: 'Soup and Garden', line: 'Soup, leaves and the season’s best.', items: [
      { name: 'French Onion Soup Gratinée', desc: 'Beef-bone broth, slow onions, Gruyère crust.', price: 650, img: 'french-onion-soup-gratinee', cutout: 'french-onion-soup-gratinee' },
      { name: 'Caesar, Prepared Tableside', desc: 'Romaine hearts, anchovy, soft egg, parmesan. Made at your table.', price: 1100, note: 'For two', img: 'caesar-prepared-tableside', cutout: 'caesar-prepared-tableside' },
      { name: 'The Classic Wedge', desc: 'Iceberg, blue cheese, smoked bacon, tomato, chive.', price: 720, img: 'classic-wedge', cutout: 'classic-wedge' },
      { name: 'Burrata & Heirloom Tomato', desc: 'Burrata, heirloom tomatoes, basil oil, aged balsamic.', price: 890, img: 'burrata-heirloom-tomato', cutout: 'burrata-heirloom-tomato' }
    ]},
    { id: 'ageing-room', name: 'The Ageing Room', was: 'The Butcher’s Selection', line: 'Every steak lists its age. Nothing is hidden.', items: [
      { name: 'The Twenty-Eight', desc: 'Bone-in ribeye, finished with cultured butter aged beside it in the same room.', age: 28, weight: '600 g', price: 5800, signature: true, img: 'cowboy-cut', cutout: 'cowboy-cut' },
      { name: 'Prime Ribeye', desc: 'The richest cut. Deep marbling, crisp fat cap.', age: 35, weight: '400 g', price: 4600, img: 'prime-ribeye', cutout: 'prime-ribeye' },
      { name: 'New York Strip', desc: 'Firm, beefy, a clean line of fat.', age: 28, weight: '350 g', price: 3900, img: 'new-york-strip', cutout: 'new-york-strip' },
      { name: 'Filet Mignon', desc: 'The tenderest cut, seared hard and rested long.', age: 21, weight: '250 g', price: 3600, img: 'filet-mignon', cutout: 'filet-mignon' },
      { name: 'Picanha', desc: 'Rump cap, fat-side down over the coals, chimichurri.', age: 21, weight: '300 g', price: 2800, img: 'picanha', cutout: 'picanha' }
    ]},
    { id: 'long-wait', name: 'The Long Wait', was: 'For the Table', line: 'Forty-five-day sharing cuts. Order early; they are worth the wait.', items: [
      { name: 'Châteaubriand for Two', desc: 'Centre-cut tenderloin, carved at the table, duck-fat potatoes.', age: 45, weight: '800 g', price: 8800, serves: 2, img: 'chateaubriand-for-two', cutout: 'chateaubriand-for-two' },
      { name: 'Porterhouse for Two', desc: 'Strip and tenderloin on the bone, sliced to share.', age: 45, weight: '1.1 kg', price: 9800, serves: 2, img: 'porterhouse-for-two', cutout: 'porterhouse-for-two' },
      { name: 'The Sovereign Tomahawk', desc: 'The long bone. Seared, rested, sliced and dressed with chimichurri.', age: 45, weight: '1.4 kg', price: 12500, serves: '2–3', img: 'sovereign-tomahawk', cutout: 'sovereign-tomahawk' }
    ], extras: { name: 'Enhancements', items: [
      { name: 'Oscar', desc: 'Crab, asparagus, béarnaise.', price: 950, img: 'oscar-enhancement', cutout: 'oscar-enhancement' },
      { name: 'Foie Gras Crown', desc: 'Seared foie gras on top.', price: 1200, img: 'foie-gras-crown', cutout: 'foie-gras-crown' },
      { name: 'Black Truffle Shavings', desc: 'Shaved at the table.', price: 1400, img: 'black-truffle-shavings', cutout: 'black-truffle-shavings' },
      { name: 'Bone Marrow Crust', desc: 'Marrow, herbs and crumb, torched.', price: 550, img: 'bone-marrow-crust', cutout: 'bone-marrow-crust' }
    ]}},
    { id: 'alongside', name: 'Alongside', was: 'Accompaniments', line: 'Sides to share, sauces and butters to choose.', items: [
      { name: 'Pommes Purée', desc: 'Butter, more butter, chive.', price: 420, img: 'pommes-puree', cutout: 'pommes-puree' },
      { name: 'Truffle Pommes Frites', desc: 'Parmesan, truffle, parsley.', price: 520, img: 'truffle-pommes-frites', cutout: 'truffle-pommes-frites' },
      { name: 'Duck Fat Roasted Potatoes', desc: 'Rosemary, garlic, sea salt.', price: 480, img: 'duck-fat-roasted-potatoes', cutout: 'duck-fat-roasted-potatoes' },
      { name: 'Gratin Dauphinois', desc: 'Cream, Gruyère, nutmeg.', price: 520, img: 'gratin-dauphinois', cutout: 'gratin-dauphinois' },
      { name: 'Lobster Macaroni', desc: 'Lobster, three cheeses, crumb.', price: 1150, img: 'lobster-macaroni', cutout: 'lobster-macaroni' },
      { name: 'Creamed Spinach', desc: 'Nutmeg, parmesan.', price: 420, img: 'creamed-spinach', cutout: 'creamed-spinach' },
      { name: 'Charred Broccolini', desc: 'Chilli, garlic, lemon.', price: 450, img: 'charred-broccolini', cutout: 'charred-broccolini' },
      { name: 'Wild Mushroom Fricassée', desc: 'Thyme, shallot, sherry.', price: 520, img: 'wild-mushroom-fricassee', cutout: 'wild-mushroom-fricassee' }
    ], extras: { name: 'Sauces & Butters', items: [
      { name: 'Béarnaise', price: 220, img: 'bearnaise-sauce', cutout: 'bearnaise-sauce' },
      { name: 'Bordelaise', price: 260, img: 'bordelaise-sauce', cutout: 'bordelaise-sauce' },
      { name: 'Green Peppercorn & Cognac', price: 260, img: 'green-peppercorn-cognac-sauce', cutout: 'green-peppercorn-cognac-sauce' },
      { name: 'Chimichurri Verde', price: 180, img: 'chimichurri-verde', cutout: 'chimichurri-verde' },
      { name: 'Black Truffle Butter', price: 450, img: 'black-truffle-butter', cutout: 'black-truffle-butter' },
      { name: 'Café de Paris Butter', price: 220, img: 'cafe-de-paris-butter', cutout: 'cafe-de-paris-butter' },
      { name: 'Horseradish Cream', price: 180, img: 'horseradish-cream', cutout: 'horseradish-cream' }
    ]}},
    { id: 'beyond', name: 'Beyond the Ageing Room', was: 'Beyond the Fire', line: 'For the table that wants something else.', added: true, items: [
      { name: 'Pan-Roasted Chilean Sea Bass', desc: 'Beurre blanc, caper, herb oil.', price: 2600, img: 'pan-roasted-chilean-sea-bass', cutout: 'pan-roasted-chilean-sea-bass' },
      { name: 'Lobster Thermidor', desc: 'Half lobster, brandy cream, Gruyère, lemon.', price: 3900, img: 'lobster-thermidor', cutout: 'lobster-thermidor' },
      { name: 'Herb-Crusted Rack of Lamb', desc: 'Dijon, herb crust, red wine jus.', price: 3400, img: 'herb-crusted-rack-of-lamb', cutout: 'herb-crusted-rack-of-lamb' },
      { name: 'Wild Mushroom Risotto', desc: 'Carnaroli, porcini, aged parmesan.', price: 1350, img: 'wild-mushroom-risotto', cutout: 'wild-mushroom-risotto' }
    ]},
    { id: 'last-course', name: 'The Last Course', was: 'The Final Act', line: 'Take your time. The table is yours.', items: [
      { name: 'Dark Chocolate Fondant', desc: 'Molten centre, vanilla bean ice cream.', price: 650, img: 'dark-chocolate-fondant', cutout: 'dark-chocolate-fondant' },
      { name: 'Crème Brûlée', desc: 'Vanilla custard, burnt sugar, berries.', price: 520, img: 'creme-brulee', cutout: 'creme-brulee' },
      { name: 'Bananas Foster', desc: 'Flamed tableside, rum caramel, ice cream.', price: 780, img: 'bananas-foster', cutout: 'bananas-foster' },
      { name: 'Sticky Toffee Pudding', desc: 'Date sponge, toffee sauce, clotted cream.', price: 560, img: 'sticky-toffee-pudding', cutout: 'sticky-toffee-pudding' },
      { name: 'Petit Fours', desc: 'Macarons, pâte de fruit, madeleines, truffles.', price: 450, img: 'petit-fours', cutout: 'petit-fours' }
    ]}
  ],
  drinks: [
    { name: 'Patience', desc: 'A beef-fat-washed bourbon Old Fashioned, stirred slowly and served over a single clear ice cube.', price: 720, house: true },
    { name: 'The Long Wait', desc: 'Aged rum, sherry, smoked demerara.', price: 680 },
    { name: 'Day One', desc: 'Gin, dry vermouth, a single olive. Very cold.', price: 640 },
    { name: 'Still', desc: 'Zero-proof. Smoked tea, verjus, honey.', price: 380 }
  ]
};
/* helpers */
window.XXVIII.img = function (slug, kind, size) { return (window.XXVIII_BASE || '') + 'assets/img/' + (kind || 'plated') + '/' + slug + '-' + (size || 'md') + '.webp'; };
window.XXVIII.peso = function (n) { return n ? '₱' + n.toLocaleString('en-PH') : 'Complimentary'; };

/* Media batch 2 (7 Nov): 12 camera-move videos (8 s, 1920x1080, H.264, no audio), 12 butcher-block keyframes (16:9),
   background kit (6 textures + 4 empty scenes). Videos: preload none, load near viewport, muted loop playsinline; sd on phones/save-data. */
window.XXVIII.media = {
  video: {"picanha": {"move": "glide-left"}, "new-york-strip": {"move": "glide-right"}, "prime-ribeye": {"move": "glide-left"}, "filet-mignon": {"move": "glide-right"}, "cowboy-cut": {"move": "glide-left"}, "black-truffle-shavings": {"move": "tilt-down"}, "bone-marrow-crust": {"move": "dolly-rise"}, "chateaubriand-for-two": {"move": "orbit"}, "foie-gras-crown": {"move": "arc"}, "oscar-enhancement": {"move": "push-in"}, "porterhouse-for-two": {"move": "overhead-descend"}, "sovereign-tomahawk": {"move": "crane"}},
  block: ["black-truffle-shavings", "bone-marrow-crust", "chateaubriand-for-two", "cowboy-cut", "filet-mignon", "foie-gras-crown", "new-york-strip", "oscar-enhancement", "picanha", "porterhouse-for-two", "prime-ribeye", "sovereign-tomahawk"],
  texture: {"scorched-oak-butcher-block": {"kind": "texture", "sizes": ["lg", "sm"]}, "charcoal-slate-stone": {"kind": "texture", "sizes": ["lg", "sm"]}, "dark-polished-walnut-grain": {"kind": "texture", "sizes": ["lg", "sm"]}, "oxblood-tufted-leather": {"kind": "texture", "sizes": ["lg", "sm"]}, "brushed-antique-brass": {"kind": "texture", "sizes": ["lg", "sm"]}, "dark-slate-herb-scatter-frame": {"kind": "texture", "sizes": ["lg", "sm"]}, "butcher-block-slate-wall-empty": {"kind": "scene", "sizes": ["lg", "md", "sm"]}, "walnut-table-steakhouse-dining-room": {"kind": "scene", "sizes": ["lg", "md", "sm"]}, "overhead-butcher-block-herb-frame": {"kind": "scene", "sizes": ["lg", "md", "sm"]}, "dark-slate-counter-smoke": {"kind": "scene", "sizes": ["lg", "md", "sm"]}}
};
window.XXVIII.video = function (slug, q) { var b = (window.XXVIII_BASE || '') + 'assets/video/' + slug; return q === 'poster' ? b + '-poster.webp' : b + '-' + (q || 'hd') + '.mp4'; };
window.XXVIII.block = function (slug, size) { return (window.XXVIII_BASE || '') + 'assets/img/block/' + slug + '-' + (size || 'md') + '.webp'; };
window.XXVIII.texture = function (slug, size) { return (window.XXVIII_BASE || '') + 'assets/img/texture/' + slug + '-' + (size || 'lg') + '.webp'; };
/* Media batch 3 (7 Nov): interior set, 16:9 2048x1152 -> assets/img/interior/<slug>-{lg 1920|md 1200|sm 640}.webp */
window.XXVIII.media.interior = {
  'dry-aging-cabinet': 'The glass ageing cabinet by the entrance: hanging cuts behind brass-framed glass, oxblood banquette, one table.',
  'main-dining-room': 'The dining room: white linen, oxblood leather chairs, brass pendants, tall windows.',
  'bar': 'The bar: dark wood counter, oxblood stools, the bartender polishing a glass, back bar of spirits.',
  'private-dining-room': 'The private room: one long table for fourteen, brass pendants, wood panelling.',
  'entrance-host-stand': 'The entrance: walnut host stand, a view through to the room.',
  'open-kitchen-chefs-counter': 'The open kitchen: chef at the pass, steel line, chef’s counter with oxblood stools.'
};
window.XXVIII.interior = function (slug, size) { return (window.XXVIII_BASE || '') + 'assets/img/interior/' + slug + '-' + (size || 'md') + '.webp'; };
