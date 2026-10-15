const paths = {
  mountain: <><path d="m3 25 10-18 8 12 5-8 9 14H3Z" /><path d="m10 13 3 3 3-3M21 19l5 6" /><circle cx="29" cy="7" r="3" /></>,
  plane: <><path d="m4 17 12-3 8-10 3 1-4 10 10 3v3l-12-1-7 8-3-1 4-8-10 2Z" /><path d="M6 31h24" /></>,
  road: <><path d="m14 4-9 28M22 4l9 28M18 5v4m0 5v4m0 6v6" /><path d="M5 12h6m14 0h6" /><circle cx="29" cy="5" r="2" /></>,
  wave: <><path d="M3 18h4l3-10 5 21 5-24 5 22 3-9h5" /><path d="m6 3 1 3M29 30l1 3" /></>,
  pocket: <><path d="M8 7h20v15l-10 8L8 22V7Z" /><path d="M8 13h20M13 7V3h10v4" /><circle cx="18" cy="18" r="1" /></>,
  shield: <><path d="m18 3 12 5v10c0 7-12 13-12 13S6 25 6 18V8l12-5Z" /><path d="M18 11v12m-6-6h12" /></>,
  pack: <><path d="M13 8V4h10v4M9 8h18l3 23H6L9 8Z" /><path d="M12 18h12v9H12Z" /><path d="M12 12h12" /></>,
};

export default function LoadoutGlyph({ kind = 'pack', ...props }) {
  return <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[kind] || paths.pack}</svg>;
}
