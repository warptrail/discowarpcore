import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const expand = keyframes`
  from { grid-template-rows: 0fr; }
  to { grid-template-rows: 1fr; }
`;
const collapse = keyframes`
  from { grid-template-rows: 1fr; }
  to { grid-template-rows: 0fr; }
`;
const slideIn = keyframes`
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
`;
const slideOut = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(-100%); }
`;
const Presence = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  min-width: 0;
  > div { min-height: 0; min-width: 0; }
  &[data-phase='closed'] { display: none; }
  &[data-phase='opening'], &[data-phase='closing'] { overflow: hidden; }
  &[data-phase='opening'] { animation: ${expand} 240ms cubic-bezier(.22, 1, .36, 1) both; }
  &[data-phase='closing'] { animation: ${collapse} 240ms cubic-bezier(.22, 1, .36, 1) both; }
  &[data-phase='opening'] > div { animation: ${slideIn} 240ms cubic-bezier(.22, 1, .36, 1) both; }
  &[data-phase='closing'] > div { animation: ${slideOut} 240ms cubic-bezier(.22, 1, .36, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    &, > div { animation: none !important; }
  }
`;

// Slide the controls and their layout space away without unmounting local drafts.
export default function RetrievalFinderPresence({ visible, children, id = 'retrieval-controls-panel' }) {
  const [settledVisible, setSettledVisible] = useState(visible);
  const presenceRef = useRef(null);
  const phase = visible === settledVisible
    ? (visible ? 'open' : 'closed')
    : (visible ? 'opening' : 'closing');

  useEffect(() => {
    if (!visible && presenceRef.current?.contains(document.activeElement)) {
      document.getElementById('retrieval-finder-toggle')?.focus();
    }
    if (visible === settledVisible) return undefined;
    // Also completes when a browser suppresses animation events.
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260;
    const timer = window.setTimeout(() => setSettledVisible(visible), delay);
    return () => window.clearTimeout(timer);
  }, [visible, settledVisible]);

  return <Presence
    id={id}
    ref={presenceRef}
    data-phase={phase}
    aria-hidden={!visible}
    inert={!visible}
    onAnimationEnd={(event) => {
      if (event.target === event.currentTarget) setSettledVisible(visible);
    }}
  ><div>{children}</div></Presence>;
}
