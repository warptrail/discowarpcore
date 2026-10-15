import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useFloatingSelectMenu from '../hooks/useFloatingSelectMenu';
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
  hideScrollbar = false,
  initialOpen = false,
  onDismiss,
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const floating = variant === 'floating';
  const menuStyle = useFloatingSelectMenu(buttonRef, isOpen && floating);
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
    if (initialOpen) buttonRef.current?.focus({ preventScroll: true });
  }, [initialOpen]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
        onDismiss?.('outside');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onDismiss]);

  useEffect(() => {
    if (!isOpen) return;
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, selectedIndex]);

  useEffect(() => {
    if (!floating || !isOpen || !menuStyle || highlightedIndex < 0) return;
    document.getElementById(`${listboxId}-${highlightedIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [floating, isOpen, menuStyle, highlightedIndex, listboxId]);

  const selectOption = (option) => {
    if (!option || disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      onDismiss?.('escape');
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

    if (event.key === 'Tab') {
      setIsOpen(false);
      onDismiss?.('tab');
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(event.key === 'Home' ? 0 : safeOptions.length - 1);
    }
  };

  const menu = isOpen ? (
    <S.SelectMenu ref={menuRef} id={listboxId} role="listbox" aria-label={ariaLabel} $variant={variant} $hideScrollbar={hideScrollbar}
      style={floating ? { ...menuStyle, visibility: menuStyle ? 'visible' : 'hidden' } : undefined}
      onMouseDown={floating ? (event) => event.preventDefault() : undefined}>
      {safeOptions.map((option, index) => (
        <S.SelectOption
          key={String(option.value)} type="button" id={`${listboxId}-${index}`} tabIndex={-1} role="option"
          aria-selected={index === selectedIndex} $active={index === highlightedIndex} $selected={index === selectedIndex}
          $accent={optionAccent ? option.accent : ''} $variant={variant} $ownerStyle={ownerStyle}
          onMouseEnter={() => setHighlightedIndex(index)} onClick={() => selectOption(option)}>
          {option.label}
        </S.SelectOption>
      ))}
    </S.SelectMenu>
  ) : null;

  return (
    <S.SelectWrap ref={wrapperRef} $tone={tone} $disabled={disabled} $open={isOpen} $variant={variant}>
      <S.SelectButton
        ref={buttonRef}
        type="button"
        $tone={tone}
        $variant={variant}
        $ownerStyle={ownerStyle}
        aria-label={ariaLabel}
        role="combobox"
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-${highlightedIndex}` : undefined}
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

      {floating && menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </S.SelectWrap>
  );
}
