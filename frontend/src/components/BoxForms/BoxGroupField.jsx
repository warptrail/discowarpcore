import React, { useMemo } from 'react';
import BoxSelectableField from './BoxSelectableField';

const normalize = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const toTrimmed = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

export default function BoxGroupField({
  compact = false,
  groupValue = '',
  setGroupValue = () => {},
  groupOptions = [],
  groupsLoading = false,
  groupError = '',
}) {
  const normalizedOptions = useMemo(() => {
    const byKey = new Map();

    for (const option of Array.isArray(groupOptions) ? groupOptions : []) {
      const label = toTrimmed(
        typeof option === 'string'
          ? option
          : option?.label || option?.value || '',
      );
      if (!label) continue;

      const key = normalize(label);
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, label);
    }

    return [...byKey.values()]
      .sort((left, right) =>
        String(left).localeCompare(String(right), undefined, {
          sensitivity: 'base',
          numeric: true,
        }),
      )
      .map((label) => ({
        key: label,
        label,
        meta: 'existing',
      }));
  }, [groupOptions]);

  return (
    <BoxSelectableField
      compact={compact}
      label="Group"
      inputId="box-group-combobox"
      value={groupValue}
      setValue={(nextValue) => setGroupValue(toTrimmed(nextValue))}
      options={normalizedOptions}
      loading={groupsLoading}
      onCreateOption={(inputValue) => {
        const next = toTrimmed(inputValue);
        return next
          ? { key: next, label: next }
          : null;
      }}
      createBusy={false}
      errorMessage={groupError}
      placeholder="Search or enter a group..."
      dropdownAriaLabel="Group options"
      noneLabel="None / Unassigned"
      emptyMessage="No matching groups"
      loadingMessage="Loading groups…"
      createLabelBuilder={(rawValue) => `Use group "${String(rawValue || '').trim()}"`}
      createBadgeText="Use"
      helperText="Optional parent furniture/unit grouping."
      allowFreeform
    />
  );
}
