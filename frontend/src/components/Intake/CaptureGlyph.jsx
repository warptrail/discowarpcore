const PATHS = {
  item: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm-8 4.5 8 4.5 8-4.5M12 12v9',
  description: 'M5 6h14M5 12h14M5 18h9',
  tags: 'M3 4h8l10 10-7 7L3 10V4Zm4 3h.01',
  notes: 'M5 3h14v18H5V3Zm4 5h6M9 12h6M9 16h4',
  category: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  intake: 'M14 4h6v6M20 4l-9 9M9 4H4v16h16v-5',
  cancel: 'm6 6 12 12M18 6 6 18',
  capture: 'M4 12h16m-6-6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  new: 'm9 3 6 3.5v7L9 17l-6-3.5v-7L9 3Zm-6 3.5 6 3.5 6-3.5M9 10v7M18 13v8M14 17h8',
  organize: 'M4 5h16M4 12h10M4 19h6M18 10v11m-3-3 3 3 3-3',
  edit: 'm15 3 6 6-12 12H3v-6L15 3Zm-3 3 6 6',
  change: 'M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4',
  photo: 'M4 7h4l1.5-2h5L16 7h4v12H4V7Zm8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
};

export default function CaptureGlyph({ kind }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={PATHS[kind]} /></svg>;
}
