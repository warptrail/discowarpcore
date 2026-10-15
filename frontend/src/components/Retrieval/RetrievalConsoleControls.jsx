import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import RetrievalTagScopeBar from './RetrievalTagScopeBar';
import RetrievalModeToggle from './RetrievalModeToggle';
import RetrievalViewToggle from './RetrievalViewToggle';
import { RETRIEVAL_MODE_COLORS } from '../../styles/tokens';

const Controls = styled.div`
  --retrieval-mode-accent: ${({ $mode }) => RETRIEVAL_MODE_COLORS[$mode] || RETRIEVAL_MODE_COLORS.items};
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) ${({ $hasView }) => $hasView ? 'auto' : ''};
  align-items: center;
  gap: 4px;
  min-width: 0;
  @media (max-width: 1099px) {
    [aria-label='Retrieval results view mode'] button { min-width: 44px; width: 44px; min-height: 44px; }
  }
  @media (min-width: 1100px) {
    display: ${({ $tagScope }) => $tagScope ? 'contents' : 'flex'}; justify-content: flex-start; gap: 6px;
  }
  ${({ $tagScope }) => $tagScope && css`
    display: contents;
    > :not([data-tag-scope]) { grid-row: 2; }
  `}
`;
const Count = styled.div`
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  min-width: 0;
  color: var(--dw-text-secondary);
  font: 500 .6875rem/1.15 var(--dw-font-ui);
  > strong { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 650; }
  > span { font-size: .625rem; color: var(--dw-text-muted); }
  @media (min-width: 1100px) {
    flex-shrink: 0;
    padding-inline: 6px;
    > strong { font: 650 .875rem/1.2 var(--dw-font-data); }
    > span { font-size: .6875rem; }
  }
`;
export function RetrievalConsoleControls({ mode = 'items', onModeChange, shown = 0, total = 0, loading = false, scope,
  presentation = 'cards', onPresentationChange, desktop = false }) {
  const noun = mode === 'boxes' ? scope ? 'tagged boxes' : 'boxes' : scope ? 'tagged items' : 'items';
  const label = `${shown} shown / ${total} ${noun}`;
  const hasView = Boolean(onPresentationChange);
  const count = <Count role="status" aria-label={label} title={label} aria-busy={loading}>
    <strong>{shown} / {total}</strong><span>{noun}</span>
  </Count>;
  const viewToggle = hasView ? <RetrievalViewToggle presentation={presentation} onChange={onPresentationChange} desktop={desktop} /> : null;
  return <Controls $mode={mode} $hasView={hasView} $tagScope={Boolean(scope)} aria-label="Retrieval console controls">
    <RetrievalModeToggle mode={mode} onChange={onModeChange} compact desktop={desktop} />
    {scope ? <RetrievalTagScopeBar scope={scope} /> : null}
    {desktop ? <>{viewToggle}{count}</> : <>{count}{viewToggle}</>}
  </Controls>;
}

export default function RetrievalConsolePortal(props) {
  const [mount, setMount] = useState(null);
  useEffect(() => {
    let currentMount;
    const sync = () => {
      const nextMount = document.getElementById('retrieval-header-controls-mount');
      if (nextMount === currentMount) return;
      currentMount = nextMount;
      setMount(nextMount);
    };
    sync();
    // Header replacement (including live editing) must not leave controls in a detached host.
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return mount ? createPortal(<RetrievalConsoleControls {...props} />, mount) : null;
}
