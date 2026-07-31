import React, { useEffect, useRef, useState } from 'react';
import * as S from './AllItemsList.styles';
import AllItemsBrowseControls from './AllItemsBrowseControls';
import {
  ALL_ITEMS_FILTERS_STATE_EVENT,
  ALL_ITEMS_FILTERS_TOGGLE_EVENT,
  ALL_ITEMS_INSIGHTS_OPEN_EVENT,
} from '../../constants/inventoryFinderEvents';

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
  batchModeEnabled = false,
  onToggleBatchMode,
  itemSelectionModeEnabled = false,
  onToggleItemSelectionMode,
}) {
  const safeCategoryOptions = Array.isArray(categoryOptions) ? categoryOptions : [];
  const safeBatchOptions = Array.isArray(batchOptions) ? batchOptions : [];
  const [controlsExpanded, setControlsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(max-width: 760px)').matches;
  });
  const previousExpandedRef = useRef(controlsExpanded);
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

  useEffect(() => {
    const handleToggle = () => setControlsExpanded((current) => !current);
    window.addEventListener(ALL_ITEMS_FILTERS_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(ALL_ITEMS_FILTERS_TOGGLE_EVENT, handleToggle);
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(ALL_ITEMS_FILTERS_STATE_EVENT, {
        detail: { expanded: controlsExpanded, searchQuery },
      }),
    );
  }, [controlsExpanded, searchQuery]);

  return (
    <S.HeaderPanel>
      <S.TitleRow>
        <S.TitlePip aria-hidden="true" />
        <S.Title>All Items</S.Title>
        <S.PulseButton
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent(ALL_ITEMS_INSIGHTS_OPEN_EVENT))
          }
        >
          Pulse
        </S.PulseButton>
      </S.TitleRow>

      <S.PageActionBar>
        <S.ControlsToggleButton
          type="button"
          aria-expanded={controlsExpanded}
          onClick={() => setControlsExpanded((current) => !current)}
        >
          {controlsExpanded ? 'Hide Browse' : 'Browse Items'}
        </S.ControlsToggleButton>
        <S.HeaderModeButton type="button" $tone={itemSelectionModeEnabled ? 'warning' : 'ghost'} onClick={() => onToggleItemSelectionMode?.()}>
          {itemSelectionModeEnabled ? 'Exit Select' : 'Select Items'}
        </S.HeaderModeButton>
        <S.HeaderModeButton type="button" $tone={batchModeEnabled ? 'warning' : 'ghost'} onClick={() => onToggleBatchMode?.()}>
          {batchModeEnabled ? 'Exit Batch' : 'Batch Select'}
        </S.HeaderModeButton>
      </S.PageActionBar>

      {controlsExpanded ? (
        <AllItemsBrowseControls
          statusFilter={statusFilter}
          filter={filter}
          sortBy={sortBy}
          searchQuery={searchQuery}
          colorBy={colorBy}
          onStatusChange={onStatusChange}
          onFilterChange={onFilterChange}
          onSortChange={onSortChange}
          onColorByChange={onColorByChange}
          onSearchChange={onSearchChange}
          categoryOptions={safeCategoryOptions}
          batchOptions={safeBatchOptions}
        />
      ) : null}

    </S.HeaderPanel>
  );
}
