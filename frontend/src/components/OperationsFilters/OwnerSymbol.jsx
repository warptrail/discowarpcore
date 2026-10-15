// Simple silhouettes remain readable at small profile-control sizes.
export default function OwnerSymbol({ owner }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {owner==='discofish' ? <>
      <path d="M7 12 3 8v8l4-4Zm0 0c4-6 10-6 14 0-4 6-10 6-14 0Z" />
      <circle cx="17" cy="11" r=".8" fill="currentColor" stroke="none" />
    </> : owner==='laserfox' ? <>
      <path d="m4 4 6 4h4l6-4-2 12-6 5-6-5L4 4Z" />
      <path d="m8 12 4 5 4-5M12 17v4" />
    </> : <><circle cx="12" cy="8" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}
  </svg>;
}
