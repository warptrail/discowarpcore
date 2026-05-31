import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from './Retrieval.styles';

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export default function FilterCombobox({
  id,
  name,
  ariaLabel,
  placeholder,
  options = [],
  selectedKey = '',
  onSelectedKeyChange,
  emptyMessage = 'No matching options',
  disabled = false,
  clearInputOnSelect = false,
  clearSelectedOnInput = true,
  variant = 'facet',
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isUserFiltering, setIsUserFiltering] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState(null);
  const shellRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const listId = `${id}-listbox`;

  const safeOptions = useMemo(() => (Array.isArray(options) ? options : []), [options]);

  const selectedOption = useMemo(
    () => safeOptions.find((option) => String(option?.key || '') === String(selectedKey || '')) || null,
    [safeOptions, selectedKey],
  );

  useEffect(() => {
    if (open) return;
    if (selectedOption) {
      setInputValue(selectedOption.label || '');
    }
  }, [open, selectedOption]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      setDropdownLayout(null);
      return undefined;
    }

    const updateLayout = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      const margin = 8;
      const gap = 6;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const width = Math.max(180, Math.round(rect.width));
      const left = Math.min(
        Math.max(margin, Math.round(rect.left)),
        Math.max(margin, viewportWidth - width - margin),
      );

      const spaceBelow = viewportHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const shouldPlaceAbove = spaceBelow < 160 && spaceAbove > spaceBelow;

      if (shouldPlaceAbove) {
        const maxHeight = Math.max(120, Math.min(320, Math.round(spaceAbove - gap)));
        const top = Math.max(margin, Math.round(rect.top - gap - maxHeight));
        setDropdownLayout({
          left,
          top,
          width,
          maxHeight,
        });
        return;
      }

      const maxHeight = Math.max(120, Math.min(320, Math.round(spaceBelow - gap)));
      const top = Math.min(
        viewportHeight - margin - maxHeight,
        Math.round(rect.bottom + gap),
      );
      setDropdownLayout({
        left,
        top: Math.max(margin, top),
        width,
        maxHeight,
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    const query = isUserFiltering ? normalize(inputValue) : '';
    if (!query) return safeOptions;

    return safeOptions.filter((option) => normalize(option?.label).includes(query));
  }, [inputValue, isUserFiltering, safeOptions]);

  const handleSelect = (option) => {
    const nextKey = String(option?.key || '').trim();
    if (!nextKey) return;

    onSelectedKeyChange?.(nextKey);
    setInputValue(clearInputOnSelect ? '' : option?.label || '');
    setIsUserFiltering(false);
    setActiveIndex(-1);
    setOpen(false);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsUserFiltering(false);
    setOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      setIsUserFiltering(false);
      setActiveIndex(-1);
      if (selectedOption) {
        setInputValue(selectedOption.label || '');
      }
    }, 120);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
        return;
      }
      if (!filteredOptions.length) return;
      setActiveIndex((current) => {
        if (current < 0) return 0;
        return (current + 1) % filteredOptions.length;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filteredOptions.length > 0 ? filteredOptions.length - 1 : -1);
        return;
      }
      if (!filteredOptions.length) return;
      setActiveIndex((current) => {
        if (current < 0) return filteredOptions.length - 1;
        return (current - 1 + filteredOptions.length) % filteredOptions.length;
      });
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setIsUserFiltering(false);
      setActiveIndex(-1);
      setInputValue(selectedOption?.label || '');
      return;
    }

    if (event.key === 'Enter') {
      if (!open) return;
      event.preventDefault();

      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        handleSelect(filteredOptions[activeIndex]);
        return;
      }

      const normalizedInput = normalize(inputValue);
      if (!normalizedInput) return;

      const exact = filteredOptions.find((option) => normalize(option?.label) === normalizedInput);
      if (exact) {
        handleSelect(exact);
        return;
      }

      if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      }
    }
  };

  const activeOptionId =
    open && activeIndex >= 0 && activeIndex < filteredOptions.length
      ? `${id}-option-${activeIndex}`
      : undefined;

  const dropdown = open && dropdownLayout
    ? (
      <S.FilterComboboxDropdown
        $variant={variant}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        style={{
          left: `${dropdownLayout.left}px`,
          top: `${dropdownLayout.top}px`,
          width: `${dropdownLayout.width}px`,
          maxHeight: `${dropdownLayout.maxHeight}px`,
        }}
      >
        {filteredOptions.length ? (
          filteredOptions.map((option, index) => {
            const optionKey = String(option?.key || '');
            const isSelected = optionKey === String(selectedKey || '');
            const isActive = index === activeIndex;

            return (
              <S.FilterComboboxOption
                $variant={variant}
                id={`${id}-option-${index}`}
                key={optionKey}
                role="option"
                aria-selected={isSelected}
                $active={isActive}
                $selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(option);
                }}
              >
                <S.FilterComboboxOptionLabel>{option?.label || optionKey}</S.FilterComboboxOptionLabel>
              </S.FilterComboboxOption>
            );
          })
        ) : (
          <S.FilterComboboxEmptyState>{emptyMessage}</S.FilterComboboxEmptyState>
        )}
      </S.FilterComboboxDropdown>
    )
    : null;

  return (
    <S.FilterComboboxShell ref={shellRef} $variant={variant}>
      <S.FilterComboboxInput
        $variant={variant}
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        value={inputValue}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInputValue(nextValue);
          setIsUserFiltering(true);
          setOpen(true);
          setActiveIndex(-1);
          if (selectedKey && clearSelectedOnInput) {
            onSelectedKeyChange?.('');
          }
        }}
        onKeyDown={handleKeyDown}
      />
      <S.FilterComboboxCaret $variant={variant} aria-hidden="true">⌄</S.FilterComboboxCaret>

      {dropdown && typeof document !== 'undefined'
        ? createPortal(dropdown, document.body)
        : null}
    </S.FilterComboboxShell>
  );
}
