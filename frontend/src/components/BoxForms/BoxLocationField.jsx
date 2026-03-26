import React, { useMemo } from 'react';
import BoxSelectableField from './BoxSelectableField';

export default function BoxLocationField({
  compact = false,
  locationId,
  setLocationId,
  locationOptions = [],
  locationsLoading = false,
  onCreateLocation,
  createBusy = false,
  errorMessage = '',
}) {
  const locationSelectOptions = useMemo(
    () =>
      (Array.isArray(locationOptions) ? locationOptions : [])
        .map((location) => {
          const key = String(location?._id || '').trim();
          const label = String(location?.name || '').trim();
          if (!key || !label) return null;
          return {
            key,
            label,
            meta: 'existing',
          };
        })
        .filter(Boolean),
    [locationOptions],
  );

  return (
    <BoxSelectableField
      compact={compact}
      label="Location"
      inputId="box-location-combobox"
      value={locationId}
      setValue={setLocationId}
      options={locationSelectOptions}
      loading={locationsLoading}
      onCreateOption={
        typeof onCreateLocation === 'function'
          ? async (inputValue) => {
              const created = await onCreateLocation(inputValue);
              if (!created?._id) return null;
              return {
                key: String(created._id),
                label: String(created?.name || inputValue || '').trim(),
              };
            }
          : null
      }
      createBusy={createBusy}
      errorMessage={errorMessage}
      placeholder="Search or create a location..."
      dropdownAriaLabel="Location options"
      noneLabel="None / Unassigned"
      emptyMessage="No matching locations"
      loadingMessage="Loading locations…"
      createLabelBuilder={(rawValue) => `Create location "${String(rawValue || '').trim()}"`}
      createBadgeText="Create"
      createBusyText="Creating..."
    />
  );
}
