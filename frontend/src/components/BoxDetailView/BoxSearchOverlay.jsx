import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { BOX_SEARCH_SORT_OPTIONS } from './useBoxWorkspaceSearch';
import CustomSelect from '../CustomSelect';

const Surface = styled.section`
  position: fixed;
  z-index: 190;
  left: max(10px, calc((100vw - 980px) / 2));
  right: max(10px, calc((100vw - 980px) / 2));
  top: ${({ $top }) => `${$top}px`};
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(102, 226, 218, 0.42);
  border-radius: 16px;
  color: #edf3f7;
  background:
    radial-gradient(circle at 8% 0%, rgba(76, 198, 193, 0.15), transparent 34%),
    radial-gradient(circle at 92% 8%, rgba(167, 139, 250, 0.14), transparent 31%),
    rgba(8, 13, 19, 0.94);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.08),
    0 22px 55px rgba(0, 0, 0, 0.48),
    0 0 30px rgba(76, 198, 193, 0.08);
  backdrop-filter: blur(18px) saturate(125%);
  animation: finder-in 220ms cubic-bezier(0.22, 1, 0.36, 1);

  @keyframes finder-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 520px) {
    gap: 10px;
    padding: 12px;
    border-radius: 13px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Heading = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
`;
const Eyebrow = styled.span`
  display: block;
  color: rgba(121, 222, 216, 0.82);
  font: 700 0.68rem/1.2 ui-monospace, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;
const Count = styled.span`
  color: rgba(226, 234, 242, 0.7);
  font: 700 0.78rem/1.2 ui-monospace, monospace;
  white-space: nowrap;
`;
const Input = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 50px;
  padding: 0 14px;
  border: 1px solid rgba(127, 215, 255, 0.38);
  border-radius: 12px;
  background: rgba(3, 8, 13, 0.78);
  color: #f4f7fa;
  font-size: clamp(1rem, 2.5vw, 1.18rem);
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: rgba(112, 236, 226, 0.86); box-shadow: 0 0 0 3px rgba(76, 198, 193, 0.12); }
`;
const Tools = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;
const Clear = styled.button`
  min-width: 72px;
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.055);
  color: rgba(232, 238, 244, 0.74);
  cursor: pointer;
  &:hover, &:focus-visible { color: white; background: rgba(167, 139, 250, 0.13); outline: 1px solid rgba(167, 182, 255, 0.42); }
`;
const Empty = styled.p`
  margin: 0;
  color: rgba(222, 229, 237, 0.72);
  font-size: 0.84rem;
`;

export default function BoxSearchOverlay({
  mode,
  shortId,
  query,
  onQueryChange,
  sortMode,
  onSortChange,
  matchCount,
  onMinimize,
  onClear,
  onCommit,
}) {
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const [top, setTop] = useState(112);

  useLayoutEffect(() => {
    if (mode !== 'expanded') return undefined;
    const measure = () => {
      const header = document.querySelector('header');
      setTop(Math.max(8, Math.round((header?.getBoundingClientRect().bottom || 96) + 8)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'expanded') return undefined;
    inputRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onMinimize();
    };
    const onPointer = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (event.target.closest?.('[data-box-finder-trigger]')) return;
      onMinimize();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [mode, onMinimize]);

  if (mode !== 'expanded' || typeof document === 'undefined') return null;

  return createPortal(
    <Surface ref={panelRef} $top={top} aria-label={`Search box ${shortId}`}>
      <Heading>
        <div>
          <Eyebrow>This box + nested boxes</Eyebrow>
        </div>
        <Count>{matchCount} {matchCount === 1 ? 'match' : 'matches'}</Count>
      </Heading>
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onCommit();
        }}
        placeholder={`What are you looking for in #${shortId}?`}
        aria-label={`Search box ${shortId} and nested boxes`}
      />
      <Tools>
        <CustomSelect
          value={sortMode}
          onChange={onSortChange}
          options={BOX_SEARCH_SORT_OPTIONS}
          ariaLabel="Sort box search results"
          tone="#4CC6C1"
        />
        <Clear type="button" onClick={onClear}>Clear</Clear>
      </Tools>
      {query && matchCount === 0 ? (
        <Empty>Nothing in this box matches yet. Try one simpler word.</Empty>
      ) : null}
    </Surface>,
    document.body,
  );
}
