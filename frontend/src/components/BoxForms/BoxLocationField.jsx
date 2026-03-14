import React, { useEffect, useMemo, useState } from 'react';
import * as S from './BoxEditForm.styles';

const normalize = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

export default function BoxLocationField({
  locationId,
  setLocationId,
  locationOptions = [],
  locationsLoading = false,
  onCreateLocation,
  createBusy = false,
  errorMessage = '',
}) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  const selectedLocation = useMemo(
    () =>
      (locationOptions || []).find(
        (loc) => String(loc?._id || '') === String(locationId || ''),
      ) || null,
    [locationOptions, locationId],
  );

  useEffect(() => {
    if (!open) {
      setInputValue(selectedLocation?.name || '');
    }
  }, [selectedLocation, open]);

  const normalizedInput = normalize(inputValue);

  const filteredOptions = useMemo(() => {
    const list = Array.isArray(locationOptions) ? locationOptions : [];
    if (!normalizedInput) return list;
    return list.filter((loc) =>
      normalize(loc?.name).includes(normalizedInput),
    );
  }, [locationOptions, normalizedInput]);

  const exactMatch = useMemo(
    () =>
      (locationOptions || []).find(
        (loc) => normalize(loc?.name) === normalizedInput,
      ) || null,
    [locationOptions, normalizedInput],
  );

  const canCreate = !!normalizedInput && !exactMatch;

  const closeMenu = () => setOpen(false);

  const handleSelectExisting = (loc) => {
    const id = String(loc?._id || '').trim();
    setLocationId(id);
    setInputValue(loc?.name || '');
    closeMenu();
  };

  const handleSelectNone = () => {
    setLocationId('');
    setInputValue('');
    closeMenu();
  };

  const handleCreate = async () => {
    if (!canCreate || typeof onCreateLocation !== 'function') return;
    const created = await onCreateLocation(inputValue);
    if (created?._id) {
      setLocationId(String(created._id));
      setInputValue(created?.name || inputValue.trim());
      closeMenu();
    }
  };

  return (
    <S.LocationSection>
      <S.Label htmlFor="box-location-combobox">Location</S.Label>
      <S.LocationShell>
        <S.LocationInput
          id="box-location-combobox"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              if (!locationId) setInputValue('');
              else setInputValue(selectedLocation?.name || '');
            }, 140);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeMenu();
              return;
            }
            if (e.key !== 'Enter') return;
            e.preventDefault();
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
            }
          }}
          placeholder="Search or create a location..."
          autoComplete="off"
          disabled={locationsLoading || createBusy}
        />

        {open && (
          <S.LocationDropdown role="listbox" aria-label="Location options">
            <S.LocationOption onMouseDown={handleSelectNone} $active={!locationId}>
              <S.LocationOptionName>None / Unassigned</S.LocationOptionName>
            </S.LocationOption>

            {filteredOptions.map((loc) => (
              <S.LocationOption
                key={loc._id}
                onMouseDown={() => handleSelectExisting(loc)}
                $active={String(loc._id) === String(locationId)}
              >
                <S.LocationOptionName>{loc.name}</S.LocationOptionName>
                <S.LocationOptionMeta>existing</S.LocationOptionMeta>
              </S.LocationOption>
            ))}

            {canCreate && (
              <S.LocationOption onMouseDown={handleCreate}>
                <S.LocationOptionName>
                  Create location &quot;{inputValue.trim()}&quot;
                </S.LocationOptionName>
                <S.CreateBadge>{createBusy ? 'Creating...' : 'Create'}</S.CreateBadge>
              </S.LocationOption>
            )}

            {!canCreate && filteredOptions.length === 0 && (
              <S.LocationOption $muted>
                <S.LocationOptionName>No matching locations</S.LocationOptionName>
              </S.LocationOption>
            )}
          </S.LocationDropdown>
        )}
      </S.LocationShell>
      {locationsLoading && <S.Hint>Loading locations…</S.Hint>}
      {!!errorMessage && <S.Hint $error>{errorMessage}</S.Hint>}
    </S.LocationSection>
  );
}
