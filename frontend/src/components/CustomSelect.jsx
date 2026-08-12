import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as S from '../styles/CustomSelect.styles';

export default function CustomSelect({
  value,
  options = [],
  onChange,
  ariaLabel,
  disabled = false,
  tone = '#7FD7FF',
  variant = 'default',
  optionAccent = false,
  ownerStyle = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listboxId = useId();

  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options],
  );
  const selectedIndex = safeOptions.findIndex(
    (option) => String(option.value) === String(value),
  );
  const selectedOption = safeOptions[selectedIndex] || safeOptions[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, selectedIndex]);

  const selectOption = (option) => {
    if (!option || disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        selectOption(safeOptions[highlightedIndex]);
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      if (safeOptions.length === 0) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = highlightedIndex < 0
        ? selectedIndex >= 0 ? selectedIndex : 0
        : (highlightedIndex + direction + safeOptions.length) % safeOptions.length;
      setHighlightedIndex(nextIndex);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(event.key === 'Home' ? 0 : safeOptions.length - 1);
    }
  };

  return (
    <S.SelectWrap ref={wrapperRef} $tone={tone} $disabled={disabled} $open={isOpen} $variant={variant}>
      <S.SelectButton
        type="button"
        $tone={tone}
        $variant={variant}
        $ownerStyle={ownerStyle}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setIsOpen((previous) => !previous)}
        onKeyDown={handleKeyDown}
      >
        <S.SelectValue>{selectedOption?.label || 'Select an option'}</S.SelectValue>
        <S.SelectChevron aria-hidden="true">⌄</S.SelectChevron>
      </S.SelectButton>

      {isOpen ? (
        <S.SelectMenu id={listboxId} role="listbox" aria-label={ariaLabel} $variant={variant}>
          {safeOptions.map((option, index) => (
            <S.SelectOption
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              $active={index === highlightedIndex}
              $selected={index === selectedIndex}
              $accent={optionAccent ? option.accent : ''}
              $variant={variant}
              $ownerStyle={ownerStyle}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectOption(option)}
            >
              {option.label}
            </S.SelectOption>
          ))}
        </S.SelectMenu>
      ) : null}
    </S.SelectWrap>
  );
}
