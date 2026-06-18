import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from './BoxEditForm.styles';

const normalize = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const toTrimmed = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

export default function BoxSelectableField({
  compact = false,
  label = '',
  inputId = '',
  value = '',
  setValue = () => {},
  options = [],
  loading = false,
  onCreateOption,
  createBusy = false,
  errorMessage = '',
  placeholder = '',
  dropdownAriaLabel = '',
  noneLabel = 'None / Unassigned',
  includeNoneOption = true,
  emptyMessage = 'No matching options',
  loadingMessage = 'Loading options…',
  createLabelBuilder = (text) => `Create "${toTrimmed(text)}"`,
  createBadgeText = 'Create',
  createBusyText = 'Working…',
  helperText = '',
  allowFreeform = false,
}) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const inputRef = useRef(null);
  const selectingFromDropdownRef = useRef(false);

  const safeOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : [])
        .map((option) => {
          const key = String(option?.key || '').trim();
          const labelText = toTrimmed(option?.label);
          const meta = toTrimmed(option?.meta);
          if (!key || !labelText) return null;
          return { key, label: labelText, meta };
        })
        .filter(Boolean),
    [options],
  );

  const selectedOption = useMemo(
    () =>
      safeOptions.find(
        (option) => option.key === String(value || ''),
      ) || null,
    [safeOptions, value],
  );

  useEffect(() => {
    if (open) return;

    if (selectedOption) {
      setInputValue(selectedOption.label);
      return;
    }

    if (allowFreeform) {
      setInputValue(toTrimmed(value));
      return;
    }

    setInputValue('');
  }, [open, selectedOption, allowFreeform, value]);

  const normalizedInput = normalize(inputValue);

  const filteredOptions = useMemo(() => {
    if (!normalizedInput) return safeOptions;
    return safeOptions.filter((option) =>
      normalize(option.label).includes(normalizedInput),
    );
  }, [safeOptions, normalizedInput]);

  const exactMatch = useMemo(
    () =>
      safeOptions.find(
        (option) => normalize(option.label) === normalizedInput,
      ) || null,
    [safeOptions, normalizedInput],
  );

  const canCreate =
    Boolean(normalizedInput) &&
    !exactMatch &&
    typeof onCreateOption === 'function';

  const handleSelectExisting = (option) => {
    const key = String(option?.key || '').trim();
    if (!key) return;
    setValue(key);
    setInputValue(option?.label || '');
    setOpen(false);
  };

  const handleSelectNone = () => {
    setValue('');
    setInputValue('');
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!canCreate || typeof onCreateOption !== 'function') return;

    try {
      const created = await onCreateOption(inputValue);
      const fallback = toTrimmed(inputValue);

      const createdKey = toTrimmed(
        typeof created === 'string'
          ? created
          : created?.key || created?.value || created?._id || fallback,
      );
      const createdLabel = toTrimmed(
        typeof created === 'string'
          ? created
          : created?.label || created?.name || fallback,
      );

      const nextKey = createdKey || createdLabel;
      const nextLabel = createdLabel || createdKey;

      setValue(nextKey || '');
      setInputValue(nextLabel || '');
      setOpen(false);
    } catch {
      // Caller surfaces any creation errors via errorMessage.
    }
  };

  const updateDropdownPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const viewportPadding = 12;
    const top = rect.bottom + 6;
    const maxHeight = Math.max(160, window.innerHeight - top - viewportPadding);

    setDropdownStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(280, maxHeight)}px`,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  const dropdown = open && dropdownStyle ? (
    <S.LocationDropdown
      role="listbox"
      aria-label={dropdownAriaLabel || `${label} options`}
      style={dropdownStyle}
      $portal
    >
      {includeNoneOption ? (
        <S.LocationOption
          onMouseDown={() => {
            selectingFromDropdownRef.current = true;
            handleSelectNone();
          }}
          $active={!value}
        >
          <S.LocationOptionName>{noneLabel}</S.LocationOptionName>
        </S.LocationOption>
      ) : null}

      {filteredOptions.map((option) => (
        <S.LocationOption
          key={option.key}
          onMouseDown={() => {
            selectingFromDropdownRef.current = true;
            handleSelectExisting(option);
          }}
          $active={option.key === String(value || '')}
        >
          <S.LocationOptionName>{option.label}</S.LocationOptionName>
          {option.meta ? (
            <S.LocationOptionMeta>{option.meta}</S.LocationOptionMeta>
          ) : null}
        </S.LocationOption>
      ))}

      {canCreate ? (
        <S.LocationOption
          onMouseDown={() => {
            selectingFromDropdownRef.current = true;
            handleCreate();
          }}
        >
          <S.LocationOptionName>
            {createLabelBuilder(inputValue)}
          </S.LocationOptionName>
          <S.CreateBadge>
            {createBusy ? createBusyText : createBadgeText}
          </S.CreateBadge>
        </S.LocationOption>
      ) : null}

      {!canCreate && filteredOptions.length === 0 ? (
        <S.LocationOption $muted>
          <S.LocationOptionName>
            {loading ? loadingMessage : emptyMessage}
          </S.LocationOptionName>
        </S.LocationOption>
      ) : null}
    </S.LocationDropdown>
  ) : null;

  return (
    <S.LocationSection $compact={compact}>
      <S.Label htmlFor={inputId} $compact={compact}>{label}</S.Label>
      <S.LocationShell>
        <S.LocationInput
          ref={inputRef}
          id={inputId}
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (selectingFromDropdownRef.current) {
                selectingFromDropdownRef.current = false;
                return;
              }

              setOpen(false);

              const trimmed = toTrimmed(inputValue);
              if (allowFreeform) {
                if (!trimmed) {
                  setValue('');
                  setInputValue('');
                  return;
                }
                if (exactMatch) {
                  handleSelectExisting(exactMatch);
                  return;
                }
                setValue(trimmed);
                setInputValue(trimmed);
                return;
              }

              if (!selectedOption) {
                setInputValue('');
                return;
              }

              setInputValue(selectedOption.label || '');
            }, 140);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              return;
            }

            if (event.key !== 'Enter') return;
            event.preventDefault();

            if (exactMatch) {
              handleSelectExisting(exactMatch);
              return;
            }

            if (canCreate) {
              handleCreate();
              return;
            }

            if (filteredOptions.length > 0) {
              handleSelectExisting(filteredOptions[0]);
              return;
            }

            if (allowFreeform) {
              const trimmed = toTrimmed(inputValue);
              setValue(trimmed);
              setInputValue(trimmed);
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          disabled={loading || createBusy}
          $compact={compact}
        />

        {dropdown ? createPortal(dropdown, document.body) : null}
      </S.LocationShell>

      {helperText ? <S.Hint $compact={compact}>{helperText}</S.Hint> : null}
      {loading ? <S.Hint $compact={compact}>{loadingMessage}</S.Hint> : null}
      {errorMessage ? <S.Hint $error $compact={compact}>{errorMessage}</S.Hint> : null}
    </S.LocationSection>
  );
}
