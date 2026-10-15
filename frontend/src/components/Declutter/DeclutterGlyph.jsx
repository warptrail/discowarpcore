const paths = {
  box: ['m12 3 9 5v8l-9 5-9-5V8l9-5', 'm3 8 9 5 9-5M12 13v8M7.5 5.5l9 5'],
  close: ['M6 6l12 12M18 6 6 18'],
  check: ['m5 12 4 4L19 6'],
  review: ['M5 5h14v14H5z', 'M8 9h8M8 12h5M8 15h6'],
  discussion: ['M4 5h16v11H9l-5 4V5', 'M8 9h8M8 12h5'],
  actions: ['m13 3-8 11h7l-1 7 8-11h-7l1-7'],
  progress: ['M4 19h16', 'M7 15V9M12 15V5M17 15v-3'],
  keep: ['m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3', 'm8 12 3 3 5-6'],
  toss: ['M4 6h16M9 6V3h6v3', 'm6 6 1 15h10l1-15M10 10v7M14 10v7'],
  donate: ['M12 20 4 12C-1 6 7 1 12 7c5-6 13-1 8 5l-8 8'],
  sell: ['M3 3h9l9 9-9 9-9-9V3', 'M7 7h.01'],
  gift: ['M3 8h18v4H3zM5 12v9h14v-9M12 8v13', 'M12 8H8a3 3 0 1 1 3-3l1 3ZM12 8h4a3 3 0 1 0-3-3l-1 3Z'],
  unsure: ['M9 7a3 3 0 1 1 5 3c-2 1-2 2-2 4M12 18h.01'],
  photo: ['M3 4h18v16H3z', 'm3 16 5-5 5 5 3-3 5 5', 'M16 8h.01'],
  skip: ['m7 5 7 7-7 7M18 5v14'],
  lock: ['M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3'],
};

export default function DeclutterGlyph({ name }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {(paths[name] || paths.review).map((d, index) => <path key={index} d={d} />)}
  </svg>;
}
