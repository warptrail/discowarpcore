import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import * as S from './LegacyBoxLocator.styles';
import BoxIdPrefixInput from '../../BoxIdPrefixInput';

const MAX_PREFIX_LENGTH = 3;

export default function LegacyBoxLocatorControl({
  query = '',
  onQueryChange,
  matches = [],
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInputLocked, setIsInputLocked] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const wrapperRef = useRef(null);
  const anchorRef = useRef(null);
  const dropdownRef = useRef(null);

  const hasQuery = query.length > 0;
  const safeMatches = useMemo(
    () => (Array.isArray(matches) ? matches : []),
    [matches],
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      const isInsideControl = wrapperRef.current?.contains(event.target);
      const isInsideDropdown = dropdownRef.current?.contains(event.target);

      if (!isInsideControl && !isInsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!hasQuery || safeMatches.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    setHighlightedIndex((prev) =>
      prev >= 0 && prev < safeMatches.length ? prev : 0,
    );
  }, [hasQuery, safeMatches.length]);

  const handleInputChange = (event) => {
    const digitsOnly = String(event.target.value || '')
      .replace(/\D/g, '')
      .slice(0, MAX_PREFIX_LENGTH);
    onQueryChange?.(digitsOnly);
    setIsOpen(true);
  };

  const handleSelect = (entry) => {
    if (!entry) return;
    onSelect?.(entry);
    setIsOpen(false);
  };

  const unlockInput = () => {
    if (!isInputLocked) return;
    setIsInputLocked(false);
  };

  const handleInputKeyDown = (event) => {
    if (isInputLocked) {
      if (event.key === 'Tab') return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        unlockInput();
        const nextValue = `${query}${event.key}`
          .replace(/\D/g, '')
          .slice(0, MAX_PREFIX_LENGTH);
        onQueryChange?.(nextValue);
        setIsOpen(true);
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        unlockInput();
        const nextValue = String(query || '').slice(0, -1);
        onQueryChange?.(nextValue);
        return;
      }

      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      if (safeMatches.length === 0) return;
      setHighlightedIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, safeMatches.length - 1),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      if (safeMatches.length === 0) return;
      setHighlightedIndex((prev) =>
        prev <= 0 ? 0 : Math.min(prev - 1, safeMatches.length - 1),
      );
      return;
    }

    if (event.key === 'Enter') {
      if (
        !isOpen ||
        highlightedIndex < 0 ||
        highlightedIndex >= safeMatches.length
      ) {
        return;
      }
      event.preventDefault();
      handleSelect(safeMatches[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleInputPaste = (event) => {
    event.preventDefault();
    unlockInput();

    const pasted = event.clipboardData?.getData('text') || '';
    const digitsOnly = String(pasted || '')
      .replace(/\D/g, '')
      .slice(0, MAX_PREFIX_LENGTH);
    onQueryChange?.(digitsOnly);
    setIsOpen(true);
  };

  const showDropdown = isOpen && hasQuery;

  useLayoutEffect(() => {
    if (!showDropdown) {
      setDropdownPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gutter = 8;
      const gap = 6;
      const preferredHeight = 280;
      const availableBelow = viewportHeight - rect.bottom - gap - gutter;
      const availableAbove = rect.top - gap - gutter;
      const openAbove = availableBelow < 150 && availableAbove > availableBelow;
      const availableHeight = openAbove ? availableAbove : availableBelow;
      const width = Math.min(rect.width, viewportWidth - gutter * 2);
      const left = Math.min(
        Math.max(gutter, rect.left),
        Math.max(gutter, viewportWidth - width - gutter),
      );

      setDropdownPosition({
        left,
        width,
        maxHeight: Math.max(96, Math.min(preferredHeight, availableHeight)),
        ...(openAbove
          ? { bottom: viewportHeight - rect.top + gap }
          : { top: rect.bottom + gap }),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(updatePosition)
        : null;
    resizeObserver?.observe(anchorRef.current);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      resizeObserver?.disconnect();
    };
  }, [showDropdown]);

  const dropdown =
    showDropdown && dropdownPosition && typeof document !== 'undefined'
      ? createPortal(
          <S.LocatorDropdown
            ref={dropdownRef}
            role="listbox"
            aria-label="Matching boxes"
            style={dropdownPosition}
          >
            {safeMatches.length === 0 ? (
              <S.LocatorEmpty>No matching box IDs.</S.LocatorEmpty>
            ) : (
              safeMatches.map((entry, index) => (
                <S.LocatorOption
                  key={entry.boxId}
                  type="button"
                  role="option"
                  aria-selected={highlightedIndex === index}
                  $active={highlightedIndex === index}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(entry);
                  }}
                >
                  <S.LocatorOptionMain>
                    #{entry.boxId} - {entry.label || 'Untitled'}
                  </S.LocatorOptionMain>
                  {entry.location ? (
                    <S.LocatorOptionMeta>{entry.location}</S.LocatorOptionMeta>
                  ) : null}
                </S.LocatorOption>
              ))
            )}
          </S.LocatorDropdown>,
          document.body,
        )
      : null;

  return (
    <S.ControlGroup $tone="#9BE564" ref={wrapperRef}>
      <S.ControlLabel htmlFor="inventory-box-locator">
        Box Locator
      </S.ControlLabel>
      <S.LocatorWrap ref={anchorRef}>
        <BoxIdPrefixInput
          inputAs={S.SearchInput}
          id="bx-locator"
          namePrefix="box_lookup"
          maxLength={MAX_PREFIX_LENGTH}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          onPaste={handleInputPaste}
          placeholder="Box ID prefix"
          ariaLabel="Box ID prefix search"
        />
      </S.LocatorWrap>
      {dropdown}
    </S.ControlGroup>
  );
}
