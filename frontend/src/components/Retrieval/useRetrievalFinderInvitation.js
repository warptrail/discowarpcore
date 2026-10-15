import { useEffect, useState } from 'react';
import { startFinderInvitation } from './retrievalFinderCue';

export default function useRetrievalFinderInvitation() {
  const [inviting, setInviting] = useState(true);
  useEffect(() => startFinderInvitation({
    onChange: setInviting,
    windowTarget: window,
    documentTarget: document,
  }), []);
  return inviting;
}
