import { controlStyles, inputStyles } from '../../styles/primitives';
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
  border: 1px solid rgba(230, 237, 243, 0.16);
  border-radius: var(--dw-radius);
  color: var(--dw-text);
  background: var(--dw-surface);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.32);
  animation: finder-in 220ms cubic-bezier(0.22, 1, 0.36, 1);

  @keyframes finder-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 520px) {
    gap: 10px;
    padding: 12px;
    border-radius: var(--dw-radius);
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
  color: var(--dw-teal);
  font: 700 0.75rem/1.2 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;
const Count = styled.span`
  color: var(--dw-text-secondary);
  font: 700 0.78rem/1.2 var(--dw-font-ui);
  white-space: nowrap;
`;
const Input = styled.input`
  ${inputStyles}
  width: 100%;
  min-width: 0;
  min-height: 50px;
  padding: 0 14px;
  border: 1px solid rgba(230, 237, 243, 0.2);
  border-radius: var(--dw-radius);
  background: var(--dw-background);
  color: var(--dw-text);
  font-size: clamp(1rem, 2.5vw, 1.18rem);
  outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  box-sizing: border-box;
  &:focus { border-color: var(--dw-cyan); box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.18); }
`;
const Tools = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;
const DirectionToggle = styled.button`
  ${controlStyles}
  min-width: 48px;
  min-height: 44px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--dw-text-secondary);
  font: 700 1.55rem/1 var(--dw-font-ui);
  cursor: pointer;
  transition: color 140ms ease, transform 140ms ease;

  &:hover,
  &:focus-visible {
    color: var(--dw-cyan);
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    transform: scale(1.08);
  }

  &:focus-visible {
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.22em;
  }
`;
const Clear = styled.button`
  ${controlStyles}
  min-width: 72px;
  min-height: 44px;
  border: 0;
  border-radius: var(--dw-radius);
  background: var(--dw-surface-raised);
  color: var(--dw-text-secondary);
  cursor: pointer;
  &:hover, &:focus-visible { color: var(--dw-cyan); background: var(--dw-surface-raised); outline: 2px solid var(--dw-cyan); }
`;
const Empty = styled.p`
  margin: 0;
  color: var(--dw-text-secondary);
  font-size: 0.84rem;
`;

export default function BoxSearchOverlay({
  mode,
  shortId,
  query,
  onQueryChange,
  sortMode,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
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
        <DirectionToggle
          type="button"
          aria-label={`Sort direction: ${sortDirection === 'desc' ? 'descending' : 'ascending'}`}
          aria-pressed={sortDirection === 'desc'}
          onClick={() => onSortDirectionChange(sortDirection === 'desc' ? 'asc' : 'desc')}
        >
          {sortDirection === 'desc' ? '↓' : '↑'}
        </DirectionToggle>
        <Clear type="button" onClick={onClear}>Clear</Clear>
      </Tools>
      {query && matchCount === 0 ? (
        <Empty>Nothing in this box matches yet. Try one simpler word.</Empty>
      ) : null}
    </Surface>,
    document.body,
  );
}
