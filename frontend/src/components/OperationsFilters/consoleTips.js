// Idle-only, locally written scripts. Never replace a real system message.
export const CONSOLE_TIPS = [
  { id: 'welcome', kind: 'Home console', text: 'Search, find, move, declutter. Results, confirmations and Undo all live here.' },
  { id: 'search', kind: 'Search tip', text: 'Search item or box names, tags, notes and locations. A small clue can find a big box.' },
  { id: 'box-number', kind: 'Shortcut', text: 'Know the box number? Enter it beside the search field to narrow your view.' },
  { id: 'finder', kind: 'Find it', text: 'Tap an Item finder card for a bigger photo, item details and the recorded location—without browsing the whole box.' },
  { id: 'location', kind: 'Location tip', text: 'Room → Vicinity → Specifics → Exact Spot. A more precise location means less searching later.' },
  { id: 'placement', kind: 'Quick move', text: 'In Quick Peek, the box-and-arrow icon moves an item to another box or No box · Items Adrift. Undo stays in this console.' },
  { id: 'adrift', kind: 'Items Adrift', text: 'Not every item needs a box yet. Items Adrift keeps unboxed things searchable until you give them a home.' },
  { id: 'deck', kind: 'Declutter Deck', text: 'Use the stacked-card icon in Quick Peek to add an item to the Declutter Deck for a focused review.' },
  { id: 'small-step', kind: 'Small wins', text: 'Choose one shelf or one box. A few thoughtful decisions count—you do not have to finish everything today.' },
  { id: 'useful-tags', kind: 'Future you', text: 'A useful tag or short note today can save a long search tomorrow. Describe what you would actually look for.' },
  { id: 'declutter', kind: 'Declutter gently', text: 'Start with one easy decision: keep, donate or recycle. Make room for the things you actually use and enjoy.' },
  { id: 'teleport', kind: 'Warp-core wisdom', text: 'Item teleportation is not installed. A good location label is the next best thing.' },
  { id: 'controls', kind: 'How-to', text: 'The outward-arrow icon opens the full item page. Quick Peek keeps the quick controls close to your inventory.' },
  { id: 'motivation', kind: 'Permission to pause', text: 'Your inventory is a tool, not a test. One clear location and one less mystery are real progress.' },
];

export function nextConsoleTipIndex(index) {
  return (index + 1) % CONSOLE_TIPS.length;
}

export function getConsoleTipMotion(contentWidth, viewportWidth) {
  const distance = Math.max(0, contentWidth - viewportWidth);
  return { distance, durationMs: Math.max(14000, Math.ceil((distance / 18 + 8) * 1000)) };
}
