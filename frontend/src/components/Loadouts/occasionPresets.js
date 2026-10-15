export const OCCASION_PRESETS = [
  {
    id: 'camping', name: 'Camping & backpacking', eyebrow: 'Trail / basecamp',
    description: 'From a trunk at the campsite to a pack on the trail.',
    palette: ['#a5dfb5', '#ead7a3'], rgb: '165, 223, 181', glyph: 'mountain',
    hint: 'Adapt this starter list to the weather, route and what you can carry. Add cooking and comfort gear for car camping.',
    source: { label: 'NPS trip essentials', url: 'https://www.nps.gov/articles/10essentials.htm' },
    items: ['Backpack or camp bag', 'Tent or shelter', 'Sleeping bag', 'Sleeping pad', 'Water bottles and treatment', 'Food and trail snacks', 'Headlamp and spare batteries', 'Map and compass', 'Sun protection', 'Warm layers and rain shell', 'First-aid pouch', 'Repair kit', 'Fire-starting supplies'],
  },
  {
    id: 'travel', name: 'Air travel & city breaks', eyebrow: 'Departure / city lights',
    description: 'A light carry-on, a new skyline, the essentials within reach.',
    palette: ['#9acfff', '#c1baff'], rgb: '154, 207, 255', glyph: 'plane',
    hint: 'Tailor your carry-on and checked bag to the trip. Check your airline and destination rules before packing.',
    items: ['Carry-on bag', 'Passport or travel ID', 'Wallet', 'Phone and charging cable', 'Power bank', 'Travel adapter', 'Headphones', 'Toiletry pouch', 'Clothing and walking shoes', 'Personal medications', 'Reusable water bottle', 'Day bag'],
  },
  {
    id: 'roadtrip', name: 'Cross-country road trip', eyebrow: 'Open road / golden hour',
    description: 'Long miles, roadside stops and a well-organized trunk.',
    palette: ['#ffd08e', '#ffad99'], rgb: '255, 208, 142', glyph: 'road',
    hint: 'Add gear for your vehicle, season and overnight stops. Keep frequently used things within reach.',
    items: ['Road-trip bag', 'Driver ID and vehicle documents', 'Phone mount', 'Car charger and cables', 'Offline maps', 'Water and snacks', 'Cooler', 'Roadside assistance kit', 'First-aid pouch', 'Flashlight', 'Blanket and layers', 'Toiletry bag'],
  },
  {
    id: 'festival', name: 'Rave & EDM festival', eyebrow: 'After dark / main stage',
    description: 'Ultraviolet nights, bright little details and room to dance.',
    palette: ['#d7b4ff', '#ffaddc'], rgb: '215, 180, 255', glyph: 'wave',
    hint: 'Customize for your venue, weather and camping plans. Check the event’s bag and permitted-item policy.',
    items: ['Festival bag', 'Ticket and ID', 'Earplugs', 'Hydration pack or bottle', 'Phone and charging cable', 'Power bank', 'Comfortable shoes', 'Festival outfit', 'Light layer or rain poncho', 'Sunglasses and sunscreen', 'Kandi and accessories', 'Meet-up plan'],
  },
  {
    id: 'edc', name: 'Everyday carry', eyebrow: 'Daily orbit / pocket essentials',
    description: 'The small things that make an ordinary day run smoothly.',
    palette: ['#8fdfd6', '#bbcbdc'], rgb: '143, 223, 214', glyph: 'pocket',
    hint: 'Keep this one lean. Include only the things you actually reach for on a normal day.',
    items: ['Keys', 'Wallet', 'Phone', 'Earbuds', 'Charging cable', 'Water bottle', 'Small notebook and pen', 'Everyday bag'],
  },
  {
    id: 'emergency', name: 'Earthquake & bug-out bag', eyebrow: 'Ready station / grab and go',
    description: 'A dedicated place for your household’s emergency essentials.',
    palette: ['#ffe09b', '#ffbc9a'], rgb: '255, 224, 155', glyph: 'shield',
    hint: 'A starter inventory list: adapt quantities, accessibility needs and supplies to your household and emergency plan. Review dates and readiness regularly.',
    source: { label: 'Ready.gov kit planning', url: 'https://www.ready.gov/kit' },
    items: ['Emergency backpack', 'Water supply', 'Shelf-stable food', 'Manual can opener', 'Battery or hand-crank radio', 'Flashlight and spare batteries', 'First-aid kit', 'Personal medications', 'Whistle', 'Dust masks', 'Sanitation supplies', 'Phone charger and power bank', 'Copies of important documents', 'Local map and contact plan', 'Sturdy shoes and warm clothing'],
  },
];

const CUSTOM = { id: 'custom', name: 'Custom loadout', eyebrow: 'Your own occasion', description: 'A kit for whatever comes next.', palette: ['#a8d5ff', '#c9bfff'], rgb: '168, 213, 255', glyph: 'pack', hint: 'Add inventory items or a simple reminder for anything you still need.', items: [] };

export function getOccasion(id) {
  return OCCASION_PRESETS.find(preset => preset.id === id) || CUSTOM;
}

export function occasionStyle(id) {
  const theme = getOccasion(id);
  return { '--loadout-accent': theme.palette[0], '--loadout-secondary': theme.palette[1], '--loadout-rgb': theme.rgb };
}

export function starterEntries(id) {
  return getOccasion(id).items.map(label => ({ label, itemId: null, gathered: false, returned: false }));
}
