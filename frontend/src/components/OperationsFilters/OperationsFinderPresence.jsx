import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Presence = styled.div`
  grid-area: filters;
  display: grid;
  grid-template-rows: ${({ $visible }) => $visible ? '1fr' : '0fr'};
  min-width: 0;
  visibility: ${({ $visible }) => $visible ? 'visible' : 'hidden'};
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  transition:
    grid-template-rows 240ms cubic-bezier(.22, 1, .36, 1),
    visibility 0s linear ${({ $visible }) => $visible ? '0ms' : '240ms'};

  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

const Viewport = styled.div`
  min-height: 0;
  min-width: 0;
  overflow: ${({ $clipped }) => $clipped ? 'hidden' : 'visible'};
`;

const Content = styled.div`
  min-width: 0;
  transform: translateY(${({ $visible }) => $visible ? '0' : '-0.75rem'});
  transition: transform 240ms cubic-bezier(.22, 1, .36, 1);
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

// Retain drafts while hidden, and release clipping once dropdowns can be opened.
export default function OperationsFinderPresence({ visible, children }) {
  const presenceRef = useRef(null);
  const previousVisible = useRef(visible);
  const [transitioning, setTransitioning] = useState(false);

  useLayoutEffect(() => {
    if (!visible && presenceRef.current?.contains(document.activeElement)) {
      document.getElementById('operations-finder-toggle')?.focus();
    }
    if (previousVisible.current === visible) return undefined;
    previousVisible.current = visible;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTransitioning(!reducedMotion);
    if (reducedMotion) return undefined;
    // Fall back when interrupted transitions do not emit an end event.
    const timer = window.setTimeout(() => setTransitioning(false), 260);
    return () => window.clearTimeout(timer);
  }, [visible]);

  return (
    <Presence
      id="inventory-grid-filters"
      ref={presenceRef}
      aria-label="Find and filter inventory"
      aria-hidden={!visible}
      inert={!visible}
      $visible={visible}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') {
          setTransitioning(false);
        }
      }}
    >
      <Viewport $clipped={!visible || transitioning}>
        <Content $visible={visible}>{children}</Content>
      </Viewport>
    </Presence>
  );
}
