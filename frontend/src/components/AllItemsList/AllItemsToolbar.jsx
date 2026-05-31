import React, { useEffect, useRef, useState } from 'react';
import * as S from './AllItemsList.styles';
import {
  BASE_FILTER_OPTIONS,
  COLOR_BY_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './allItemsList.utils';

const pluralize = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

export default function AllItemsToolbar({
  statusFilter = 'active',
  filter = 'all',
  sortBy = 'alpha',
  searchQuery = '',
  colorBy = 'none',
  onStatusChange,
  onFilterChange,
  onSortChange,
  onColorByChange,
  onSearchChange,
  categoryOptions = [],
  batchOptions = [],
  visibleCount = 0,
  totalCount = 0,
  activeCount = 0,
  goneCount = 0,
  orphanedCount = 0,
  batchModeEnabled = false,
  onToggleBatchMode,
  itemSelectionModeEnabled = false,
  onToggleItemSelectionMode,
}) {
  const safeCategoryOptions = Array.isArray(categoryOptions) ? categoryOptions : [];
  const safeBatchOptions = Array.isArray(batchOptions) ? batchOptions : [];
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const previousExpandedRef = useRef(true);
  const previousActionModeRef = useRef(Boolean(batchModeEnabled || itemSelectionModeEnabled));

  useEffect(() => {
    const actionModeEnabled = Boolean(batchModeEnabled || itemSelectionModeEnabled);
    const wasActionModeEnabled = previousActionModeRef.current;

    if (actionModeEnabled && !wasActionModeEnabled) {
      previousExpandedRef.current = controlsExpanded;
      setControlsExpanded(false);
    } else if (!actionModeEnabled && wasActionModeEnabled) {
      setControlsExpanded(previousExpandedRef.current);
    }

    previousActionModeRef.current = actionModeEnabled;
  }, [batchModeEnabled, controlsExpanded, itemSelectionModeEnabled]);

  return (
    <S.HeaderPanel>
      <S.TitleRow>
        <S.TitlePip aria-hidden="true" />
        <S.Title>All Items</S.Title>
        <S.HeaderModeButton type="button" $tone={itemSelectionModeEnabled ? 'warning' : 'ghost'} onClick={() => onToggleItemSelectionMode?.()}>
          {itemSelectionModeEnabled ? 'Exit Select' : 'Select Items'}
        </S.HeaderModeButton>
        <S.HeaderModeButton type="button" $tone={batchModeEnabled ? 'warning' : 'ghost'} onClick={() => onToggleBatchMode?.()}>
          {batchModeEnabled ? 'Exit Batch' : 'Batch Select'}
        </S.HeaderModeButton>
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

      <S.ControlsToggleRow>
        <S.ControlsToggleButton
          type="button"
          aria-expanded={controlsExpanded}
          onClick={() => setControlsExpanded((current) => !current)}
        >
          {controlsExpanded ? 'Hide Filters' : 'Show Filters'}
        </S.ControlsToggleButton>
      </S.ControlsToggleRow>

      {controlsExpanded ? (
        <S.ControlsRow>
          <S.ControlGroup $tone="#4cc6c1">
            <S.ControlLabel>Search</S.ControlLabel>
            <S.SearchInput
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search items..."
              aria-label="Search items"
              autoComplete="off"
            />
          </S.ControlGroup>

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
              {safeBatchOptions.map((option) => (
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

          <S.ControlGroup $tone="#f08a7b">
            <S.ControlLabel>Color By</S.ControlLabel>
            <S.Select value={colorBy} onChange={(event) => onColorByChange?.(event.target.value)}>
              {COLOR_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </S.Select>
          </S.ControlGroup>
        </S.ControlsRow>
      ) : null}

    </S.HeaderPanel>
  );
}
