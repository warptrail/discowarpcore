import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { rankTagOptions } from './tagNebulaModel';

const Shell = styled.div`
  position: relative;
  min-width: 0;
`;

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 38px;
  border: 1px solid rgba(119, 213, 255, 0.38);
  border-radius: 2px 6px 2px 2px;
  background: rgba(7, 13, 20, 0.92);
  overflow: hidden;

  &:focus-within {
    border-color: rgba(119, 213, 255, 0.82);
    box-shadow: 0 0 0 2px rgba(119, 213, 255, 0.2);
  }

  @media (max-width: 640px) {
    min-height: 44px;
  }
`;

const Input = styled.input`
  width: 100%;
  min-width: 0;
  padding: 0.48rem 0.56rem;
  border: 0;
  outline: 0;
  color: #e7f5fb;
  background: transparent;
  font: 500 0.84rem/1.2 system-ui, sans-serif;

  &::placeholder {
    color: rgba(214, 226, 234, 0.45);
  }

  @media (max-width: 640px) {
    font-size: 16px;
  }
`;

const OperatorButton = styled.button`
  min-width: 3.2rem;
  padding: 0 0.48rem;
  border: 0;
  border-left: 1px solid rgba(167, 182, 255, 0.28);
  color: ${({ $all }) => ($all ? '#e8dcff' : '#9edfff')};
  background: ${({ $all }) => (
    $all ? 'rgba(157, 112, 255, 0.18)' : 'rgba(52, 166, 218, 0.12)'
  )};
  font: 850 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    monospace;
  letter-spacing: 0.07em;
  cursor: pointer;
`;

const SelectionRail = styled.div`
  display: flex;
  gap: 0.22rem;
  margin-top: 0.26rem;
  padding-bottom: 0.1rem;
  overflow-x: auto;
  scrollbar-width: thin;
`;

const SelectedTag = styled.button`
  flex: 0 0 auto;
  padding: 0.25rem 0.36rem;
  border: 1px solid rgba(76, 198, 193, 0.4);
  border-radius: 2px;
  color: #c9fff7;
  background: rgba(76, 198, 193, 0.1);
  font: 760 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    monospace;
  cursor: pointer;
  white-space: nowrap;

  span {
    margin-left: 0.25rem;
    color: rgba(226, 239, 245, 0.58);
  }
`;

const Results = styled.ul`
  position: fixed;
  z-index: 2300;
  display: grid;
  gap: 2px;
  max-height: 19rem;
  margin: 0;
  padding: 0.34rem;
  overflow-y: auto;
  list-style: none;
  border: 1px solid rgba(119, 213, 255, 0.54);
  border-radius: 2px 7px 2px 2px;
  background: linear-gradient(155deg, rgba(16, 30, 44, 0.99), rgba(7, 13, 20, 0.99));
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.54);
`;

const Result = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0.42rem 0.52rem;
  border-left: 3px solid ${({ $active }) => (
    $active ? 'rgba(76, 198, 193, 0.95)' : 'transparent'
  )};
  color: ${({ $active }) => ($active ? '#eafffb' : '#d9e5eb')};
  background: ${({ $active }) => ($active ? 'rgba(76, 198, 193, 0.15)' : 'transparent')};
  font-size: 0.78rem;
  cursor: pointer;

  small {
    color: rgba(119, 213, 255, 0.55);
    font: 700 0.52rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      monospace;
  }
`;

const Empty = styled.li`
  padding: 0.62rem;
  color: rgba(214, 226, 234, 0.55);
  font-size: 0.72rem;
`;

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export default function RetrievalTagNebula({
  id,
  options = [],
  selectedKeys = [],
  onAdd,
  onRemove,
  operator = 'or',
  onOperatorChange,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [layout, setLayout] = useState(null);
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const safeSelectedKeys = useMemo(
    () => [...new Set((Array.isArray(selectedKeys) ? selectedKeys : []).map(normalize).filter(Boolean))],
    [selectedKeys],
  );
  const optionByKey = useMemo(
    () => new Map((Array.isArray(options) ? options : []).map((option) => [normalize(option?.key), option])),
    [options],
  );
  const results = useMemo(
    () => rankTagOptions(options, query, safeSelectedKeys),
    [options, query, safeSelectedKeys],
  );

  useEffect(() => {
    if (!open) {
      setLayout(null);
      return undefined;
    }

    const updateLayout = () => {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 8;
      const width = Math.min(Math.max(280, Math.round(rect.width)), window.innerWidth - margin * 2);
      const left = Math.min(Math.max(margin, Math.round(rect.left)), window.innerWidth - width - margin);
      const maxHeight = Math.min(304, Math.max(140, window.innerHeight - rect.bottom - 14));
      setLayout({ left, top: Math.round(rect.bottom + 5), width, maxHeight });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (shellRef.current?.contains(event.target) || resultsRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const select = (option) => {
    const key = normalize(option?.key);
    if (!key) return;
    onAdd?.(key);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results.length) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => (current + direction + results.length) % results.length);
      return;
    }
    if (event.key === 'Enter' && open && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex]);
      return;
    }
    if (event.key === 'Backspace' && !query && safeSelectedKeys.length) {
      onRemove?.(safeSelectedKeys[safeSelectedKeys.length - 1]);
    }
  };

  const listId = `${id}-results`;
  const popover = open && layout ? (
    <Results
      ref={resultsRef}
      id={listId}
      role="listbox"
      aria-label="Matching tags"
      style={{
        left: `${layout.left}px`,
        top: `${layout.top}px`,
        width: `${layout.width}px`,
        maxHeight: `${layout.maxHeight}px`,
      }}
    >
      {!query.trim() ? (
        <Empty>Type to fuzzy-search {options.length} tags.</Empty>
      ) : results.length ? results.map((option, index) => (
        <Result
          key={option.key}
          role="option"
          aria-selected={index === activeIndex}
          $active={index === activeIndex}
          onPointerDown={(event) => {
            event.preventDefault();
            select(option);
          }}
          onPointerMove={() => setActiveIndex(index)}
        >
          <span>#{option.label}</span>
          <small>ADD</small>
        </Result>
      )) : (
        <Empty>No fuzzy tag matches.</Empty>
      )}
    </Results>
  ) : null;

  return (
    <Shell ref={shellRef}>
      <SearchRow>
        <Input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          aria-label="Fuzzy-search and add tags"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          placeholder={safeSelectedKeys.length ? 'Add tag…' : 'Fuzzy-search tags…'}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <OperatorButton
          type="button"
          $all={operator === 'and'}
          aria-label={`Match ${operator === 'and' ? 'all' : 'any'} selected tags. Activate to switch.`}
          title={operator === 'and' ? 'Match all selected tags' : 'Match any selected tag'}
          onClick={() => onOperatorChange?.(operator === 'and' ? 'or' : 'and')}
        >
          {operator === 'and' ? 'ALL' : 'ANY'}
        </OperatorButton>
      </SearchRow>

      {safeSelectedKeys.length ? (
        <SelectionRail aria-label="Selected tags">
          {safeSelectedKeys.map((key) => (
            <SelectedTag
              key={key}
              type="button"
              aria-label={`Remove ${optionByKey.get(key)?.label || key} tag`}
              onClick={() => onRemove?.(key)}
            >
              #{optionByKey.get(key)?.label || key}<span aria-hidden="true">×</span>
            </SelectedTag>
          ))}
        </SelectionRail>
      ) : null}

      {popover && typeof document !== 'undefined' ? createPortal(popover, document.body) : null}
    </Shell>
  );
}
