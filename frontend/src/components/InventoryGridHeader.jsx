import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from '../styles/InventoryGridHeader.styles';
import OperationsControlPanel from './OperationsFilters/OperationsControlPanel';
import OperationsFinderPresence from './OperationsFilters/OperationsFinderPresence';
import RetrievalSearchBar from './Retrieval/RetrievalSearchBar';
import OperationsQuickBoxCreate from './OperationsQuickBoxCreate/OperationsQuickBoxCreate';
import IntakeQuickItemMaker from './Intake/IntakeQuickItemMaker';
import BoxLocatorControl from './BoxLocatorControl';
import OperationsControlConsole from './OperationsInventory/OperationsControlConsole';
import { ToastContext } from './Toast';
import {
  INVENTORY_FINDER_CLOSE_EVENT,
  INVENTORY_FINDER_OPEN_EVENT,
  INVENTORY_FINDER_COMMIT_EVENT,
  INVENTORY_FINDER_STATE_EVENT,
} from '../constants/inventoryFinderEvents';

function MobileTelemetry({ values }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (values.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % values.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [values]);

  return <S.MobileTelemetryValue key={index}>{values[index]}</S.MobileTelemetryValue>;
}

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

export default function InventoryGridHeader({
  totalBoxes = 0,
  totalItems = 0,
  orphanedCount = 0,
  searchQuery = '',
  onSearchChange,
  searchScope = 'all',
  onSearchScopeChange,
  boxLocatorQuery = '',
  onBoxLocatorQueryChange,
  boxLocatorMatchingRootCount = 0,
  boxLocatorVisibleBoxCount = 0,
  boxLocatorExactMatch = null,
  onBoxLocatorActivateExact,
  sortBy = 'boxId',
  onSortChange,
  sortDirection = 'asc',
  onSortDirectionChange,
  categoryFilter = 'all',
  onCategoryFilterChange,
  locationFilter = 'all',
  onLocationFilterChange,
  locations = [],
  ownerFilter = 'all',
  onOwnerFilterChange,
  keepPriorityFilter = 'all',
  onKeepPriorityFilterChange,
  viewMode = 'cards',
  onViewModeChange,
  onQuickBoxCreated,
  onQuickOrphanCreated,
  onPrimaryFinderInteraction,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const [quickPanel, setQuickPanel] = useState('');
  const [finderMinimized, setFinderMinimized] = useState(true);
  const [finderCollapsing, setFinderCollapsing] = useState(false);
  const [consoleFinderMount, setConsoleFinderMount] = useState(null);
  const [finderActionsMount, setFinderActionsMount] = useState(null);
  const [mobileTelemetryMount, setMobileTelemetryMount] = useState(null);
  const filtersActive = Boolean(
    String(searchQuery || '').trim() ||
      String(boxLocatorQuery || '').trim() ||
      categoryFilter !== 'all' ||
      locationFilter !== 'all' ||
      ownerFilter !== 'all' ||
      keepPriorityFilter !== 'all',
  );

  useEffect(() => {
    const syncMount = () => {
      setConsoleFinderMount(
        document.getElementById('operations-console-finder-mount'),
      );
      setFinderActionsMount(document.getElementById('operations-finder-actions-mount'));
    };

    syncMount();
    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMobileTelemetryMount(document.getElementById('mobile-telemetry-mount'));
  }, []);

  useEffect(() => {
    const handleFinderOpen = () => {
      setFinderCollapsing(false);
      setFinderMinimized(false);
    };
    const handleFinderClose = () => {
      setFinderCollapsing(false);
      setFinderMinimized(true);
    };

    window.addEventListener(INVENTORY_FINDER_OPEN_EVENT, handleFinderOpen);
    window.addEventListener(INVENTORY_FINDER_CLOSE_EVENT, handleFinderClose);
    return () => {
      window.removeEventListener(INVENTORY_FINDER_OPEN_EVENT, handleFinderOpen);
      window.removeEventListener(INVENTORY_FINDER_CLOSE_EVENT, handleFinderClose);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(INVENTORY_FINDER_STATE_EVENT, {
        detail: { minimized: finderMinimized, filtersActive },
      }),
    );
  }, [filtersActive, finderMinimized]);

  useEffect(() => {
    if (searchScope !== 'all') onSearchScopeChange?.('all');
  }, [onSearchScopeChange, searchScope]);

  const toggleQuickPanel = (panel) => {
    setQuickPanel((prev) => (prev === panel ? '' : panel));
  };

  const toggleQuickBoxPanel = () => {
    const opening = quickPanel !== 'box';
    setQuickPanel(opening ? 'box' : '');
    if (opening) {
      setFinderCollapsing(false);
      setFinderMinimized(false);
    }
  };

  const handleQuickBoxCreated = async (created) => {
    await Promise.resolve(onQuickBoxCreated?.(created));
    setQuickPanel('');
  };

  const handleQuickOrphanCreated = async (payload) => {
    await Promise.resolve(onQuickOrphanCreated?.(payload));
    showToast?.({
      variant: 'success',
      title: 'Item set adrift',
      message: payload?.message || `Added "${payload?.item?.name || 'item'}" to Items Adrift.`,
      timeoutMs: 3600,
    });
    setQuickPanel('');
  };

  const handleQuickOrphanError = (error) => {
    showToast?.({
      variant: 'danger',
      title: 'Quick capture failed',
      message: error?.message || 'Could not add this item to Items Adrift.',
      timeoutMs: 4600,
    });
  };

  const commitSearchToConsole = () => {
    const query = searchQuery.trim();
    if (!query || finderCollapsing) return;

    setFinderCollapsing(true);
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(INVENTORY_FINDER_COMMIT_EVENT, {
          detail: { query, scope: 'all' },
        }),
      );
      setFinderMinimized(true);
      setFinderCollapsing(false);
    }, 180);
  };

  const secondaryFinderControls = quickPanel === 'box' ? (
    <OperationsQuickBoxCreate
      onCreated={handleQuickBoxCreated}
      onCancel={() => setQuickPanel('')}
    />
  ) : (
    <S.AdvancedFilters id="inventory-grid-advanced-filters">
      <OperationsControlPanel
        actionsTarget={finderActionsMount}
        actionsVisible={!finderMinimized}
        sortBy={sortBy} onSortChange={onSortChange} sortDirection={sortDirection} onSortDirectionChange={onSortDirectionChange}
        locations={locations} locationFilter={locationFilter} onLocationFilterChange={onLocationFilterChange}
        categoryFilter={categoryFilter} onCategoryFilterChange={onCategoryFilterChange}
        ownerFilter={ownerFilter} onOwnerFilterChange={onOwnerFilterChange}
        keepPriorityFilter={keepPriorityFilter} onKeepPriorityFilterChange={onKeepPriorityFilterChange}
        filtersActive={filtersActive} onReset={() => {
          onSearchChange?.(''); onBoxLocatorQueryChange?.(''); onCategoryFilterChange?.('all');
          onLocationFilterChange?.('all'); onOwnerFilterChange?.('all'); onKeepPriorityFilterChange?.('all');
        }}
      />
    </S.AdvancedFilters>
  );

  const primaryFinderControls = (
    <S.UnifiedFinderWorkspace>
    <S.PrimaryFinderRow
      onPointerDownCapture={(event) => {
        if (event.target instanceof HTMLElement && event.target.closest('input')) {
          onPrimaryFinderInteraction?.(event.target.closest('input'));
        }
      }}
    >
      <S.PrimarySearchGroup as="div">
        <RetrievalSearchBar
          id="operations-main-search"
          label="Search inventory"
          hint=""
          value={searchQuery}
          onChange={onSearchChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitSearchToConsole();
          }}
        />
      </S.PrimarySearchGroup>

      <BoxLocatorControl
        compact
        query={boxLocatorQuery}
        onQueryChange={onBoxLocatorQueryChange}
        matchingRootCount={boxLocatorMatchingRootCount}
        visibleBoxCount={boxLocatorVisibleBoxCount}
        exactMatch={boxLocatorExactMatch}
        onActivateExact={onBoxLocatorActivateExact}
      />

    </S.PrimaryFinderRow>

    <OperationsFinderPresence visible={!finderMinimized}>
      <S.FilterPanel
        $scrollable={quickPanel === 'box' || quickPanel === 'orphan'}
      >
        {secondaryFinderControls}
      </S.FilterPanel>
    </OperationsFinderPresence>
    </S.UnifiedFinderWorkspace>
  );

  return (
    <S.HeaderShell>
      <OperationsControlConsole
        totalBoxes={totalBoxes} totalItems={totalItems} orphanedCount={orphanedCount}
        viewMode={viewMode} onViewModeChange={onViewModeChange} quickPanel={quickPanel}
        onToggleBox={toggleQuickBoxPanel} onToggleItem={() => toggleQuickPanel('orphan')}
      >

        {quickPanel === 'orphan' ? (
          <S.QuickOrphanInlinePanel>
            <IntakeQuickItemMaker
              compact
              title="Quick adrift-item capture"
              onItemCreated={handleQuickOrphanCreated}
              onItemError={handleQuickOrphanError}
              onCancel={() => setQuickPanel('')}
            />
          </S.QuickOrphanInlinePanel>
        ) : null}
      </OperationsControlConsole>

      {consoleFinderMount
        ? createPortal(primaryFinderControls, consoleFinderMount)
        : null}
      {mobileTelemetryMount ? createPortal(
        <MobileTelemetry
          values={[
            `${plural(totalBoxes, 'box', 'boxes')}`,
            `${plural(totalItems, 'item', 'items')}`,
            `${plural(orphanedCount, 'item adrift', 'items adrift')}`,
          ]}
        />,
        mobileTelemetryMount,
      ) : null}
    </S.HeaderShell>
  );
}
