const BOX_CUBE_PATH = 'm4 7 8-4 8 4v10l-8 4-8-4Zm0 0 8 4 8-4m-8 4v10';

export default function SortSymbol({ field }) {
  const paths = {
    boxId: BOX_CUBE_PATH,
    box: BOX_CUBE_PATH,
    name: 'm3 18 4-12 4 12M4.5 14h5M15 7h6m-6 5h4m-4 5h6',
    location: 'M18 10c0 5-6 11-6 11S6 15 6 10a6 6 0 1 1 12 0Z',
    itemCount: 'M4 5h3v3H4Zm0 6h3v3H4Zm0 6h3v3H4ZM11 6.5h9m-9 6h9m-9 6h9',
    tag: 'M3 3h8l10 10-8 8L3 11ZM7 7h.01',
    category: 'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
    owner: 'M4 21v-3a8 8 0 0 1 16 0v3M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    keepPriority: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
  };
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={paths[field] || paths.itemCount} />
    {field === 'location' && <circle cx="12" cy="10" r="2" />}
  </svg>;
}
