import React from 'react';
import * as S from './AllItemsList.styles';
import {
  BASE_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './allItemsList.utils';

const pluralize = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

export default function AllItemsToolbar({
  statusFilter = 'active',
  filter = 'all',
  sortBy = 'alpha',
  onStatusChange,
  onFilterChange,
  onSortChange,
  categoryOptions = [],
  visibleCount = 0,
  totalCount = 0,
  activeCount = 0,
  goneCount = 0,
  orphanedCount = 0,
}) {
  const safeCategoryOptions = Array.isArray(categoryOptions) ? categoryOptions : [];

  return (
    <S.HeaderPanel>
      <S.TitleRow>
        <S.TitlePip aria-hidden="true" />
        <S.Title>All Items</S.Title>
      </S.TitleRow>

      <S.TelemetryRow aria-live="polite">
        <S.TelemetryValue $tone="total">{visibleCount} shown</S.TelemetryValue>
        <S.Sep>//</S.Sep>
        <S.TelemetryValue $tone="total">
          {pluralize(totalCount, 'item', 'items')}
        </S.TelemetryValue>
        <S.Sep>//</S.Sep>
        <S.TelemetryValue $tone="active">{activeCount} active</S.TelemetryValue>
        <S.Sep>//</S.Sep>
        <S.TelemetryValue $tone="gone">{goneCount} gone</S.TelemetryValue>
        <S.Sep>//</S.Sep>
        <S.TelemetryValue $tone="orphaned">{orphanedCount} orphaned</S.TelemetryValue>
      </S.TelemetryRow>

      <S.ControlsRow>
        <S.ControlGroup $tone="#7fd7ff">
          <S.ControlLabel>View</S.ControlLabel>
          <S.Select
            value={statusFilter}
            onChange={(event) => onStatusChange?.(event.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>

        <S.ControlGroup $tone="#a7b6ff">
          <S.ControlLabel>Filter</S.ControlLabel>
          <S.Select value={filter} onChange={(event) => onFilterChange?.(event.target.value)}>
            {BASE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {safeCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>

        <S.ControlGroup $tone="#e8b15c">
          <S.ControlLabel>Sort</S.ControlLabel>
          <S.Select value={sortBy} onChange={(event) => onSortChange?.(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>
      </S.ControlsRow>
    </S.HeaderPanel>
  );
}
