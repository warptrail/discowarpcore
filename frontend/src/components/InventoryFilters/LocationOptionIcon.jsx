// Room names choose visual cues only; this never infers or changes location data.
function roomPath(label) {
  const name = String(label).toLowerCase();
  if (name === '[unknown]') return <><path strokeDasharray="2 3" d="M8 21H5V4h14v17h-3" /><path d="M10 10a2 2 0 1 1 3 1.7c-1 .5-1 1-1 1.8M12 17h.01" /></>;
  if (name.includes('bedroom')) return <><path d="M3 10v10m18-10v10M3 16h18M5 10V6h14v4M3 10h18v6H3Z" /><path d="M7 10V8h3v2m4 0V8h3v2" /></>;
  if (name.includes('closet')) return <><path d="M5 3h14v18H5ZM12 3v18m-3-9h.01m6 0h.01" /><path d="M7 5h10" /></>;
  if (name.includes('porch')) return <><path d="m3 8 9-5 9 5M5 8v13m14-13v13M3 21h18M8 21V9h8v12m-3-6h.01" /></>;
  if (name.includes('garage')) return <><path d="m2 7 10-5 10 5M4 8v13m16-13v13M6 8h12m-12 3h12m-11 8h10v-4l-2-2H9l-2 2Zm2 0v2m6-2v2m-6-5h.01m6 0h.01" /></>;
  if (name.includes('kitchen')) return <><path d="M4 3v5a2 2 0 0 0 4 0V3M6 3v18M17 3c-3 3-3 7 0 8h2V3Zm2 8v10" /></>;
  if (name.includes('bathroom')) return <><path d="M4 13h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm2 7v2m12-2v2M6 13V5a2 2 0 0 1 4 0v2m-2 0h4" /></>;
  if (name.includes('office')) return <><path d="M3 4h18v12H3Zm9 12v4m-4 0h8M6 8h5m-5 3h8" /></>;
  if (name.includes('living')) return <><path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M3 11h3v5h12v-5h3v8H3Zm2 8v2m14-2v2" /></>;
  return <><path d="M4 4h16v16H4Zm8 0v7h8M4 13h6v7" /><path d="M8 4v3m12 8h-3" /></>;
}

export default function LocationOptionIcon({ tier, label = '' }) {
  let drawing;
  if (tier === 'room') drawing = roomPath(label);
  else if (tier === 'exactSpot') drawing = <><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /><path d="M12 2v5m0 10v5M2 12h5m10 0h5" /></>;
  else if (/closet/i.test(label)) drawing = roomPath('closet');
  else if (/shelf|ledge/i.test(label)) drawing = <><path d="M4 3v18m16-18v18M4 8h16M4 15h16M4 21h16M7 4v4m3-3v3m5-4v4m2 8v5m-4-3v3" /></>;
  else if (/corner/i.test(label)) drawing = <><path d="M4 4v16h16M4 4l8 8 8-8M12 12v8" /><circle cx="15" cy="15" r="2" /></>;
  else if (tier === 'vicinity') drawing = <><path d="m3 8 9-5 9 5-9 5Zm0 5 9 5 9-5m-18 5 9 5 9-5" /></>;
  else drawing = <><path d="m4 7 8-4 8 4v10l-8 4-8-4Zm0 0 8 4 8-4m-8 4v10" /></>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawing}</svg>;
}
