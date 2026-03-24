import { useEffect, useMemo, useRef, useState } from 'react';
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
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimeoutRef = useRef(null);
  const listId = `${id}-listbox`;

  const safeOptions = useMemo(() => (Array.isArray(options) ? options : []), [options]);

  const selectedOption = useMemo(
    () => safeOptions.find((option) => String(option?.key || '') === String(selectedKey || '')) || null,
    [safeOptions, selectedKey],
  );

  useEffect(() => {
    if (open) return;
    setInputValue(selectedOption?.label || '');
  }, [open, selectedOption]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    },
    [],
  );

  const filteredOptions = useMemo(() => {
    const query = normalize(inputValue);
    if (!query) return safeOptions;

    return safeOptions.filter((option) => normalize(option?.label).includes(query));
  }, [inputValue, safeOptions]);

  const handleSelect = (option) => {
    const nextKey = String(option?.key || '').trim();
    if (!nextKey) return;

    onSelectedKeyChange?.(nextKey);
    setInputValue(option?.label || '');
    setActiveIndex(-1);
    setOpen(false);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      setActiveIndex(-1);
      if (!selectedOption) {
        setInputValue('');
      } else {
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

  return (
    <S.FilterComboboxShell>
      <S.FilterComboboxInput
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
          setOpen(true);
          setActiveIndex(-1);
          if (selectedKey) {
            onSelectedKeyChange?.('');
          }
        }}
        onKeyDown={handleKeyDown}
      />
      <S.FilterComboboxCaret aria-hidden="true">⌄</S.FilterComboboxCaret>

      {open ? (
        <S.FilterComboboxDropdown id={listId} role="listbox" aria-label={ariaLabel}>
          {filteredOptions.length ? (
            filteredOptions.map((option, index) => {
              const optionKey = String(option?.key || '');
              const isSelected = optionKey === String(selectedKey || '');
              const isActive = index === activeIndex;

              return (
                <S.FilterComboboxOption
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
      ) : null}
    </S.FilterComboboxShell>
  );
}
