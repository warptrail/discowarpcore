import React from 'react';
import * as S from './AllItemsList.styles';
import AllItemsBrowseControls from './AllItemsBrowseControls';
import AllItemsArchiveBrowseControls from './AllItemsArchiveBrowseControls';

export default function AllItemsToolbar({
  statusFilter = 'active',
  filter = 'all',
  sortBy = 'alpha',
  sortDirection = 'asc',
  searchQuery = '',
  colorBy = 'none',
  onStatusChange,
  onFilterChange,
  onSortChange,
  onSortDirectionChange,
  onColorByChange,
  onRandomize,
  onSearchChange,
  categoryOptions = [],
  batchOptions = [],
  batchModeEnabled = false,
  onToggleBatchMode,
  itemSelectionModeEnabled = false,
  onToggleItemSelectionMode,
  visibleCount = 0,
  totalCount = 0,
  activeCount = 0,
  goneCount = 0,
  orphanedCount = 0,
}) {
  const safeCategoryOptions = Array.isArray(categoryOptions)
    ? categoryOptions
    : [];
  const safeBatchOptions = Array.isArray(batchOptions) ? batchOptions : [];
  const archiveMode = statusFilter === 'gone';
  return (
    <S.HeaderPanel>
      <S.TitleRow>
        <S.TitlePip aria-hidden="true" />
        <S.Title>All Items</S.Title>

        <S.PageActionBar>
          {!archiveMode ? (
            <>
              <S.HeaderModeButton
                type="button"
                $tone={itemSelectionModeEnabled ? 'warning' : 'ghost'}
                onClick={() => onToggleItemSelectionMode?.()}
              >
                {itemSelectionModeEnabled ? 'Exit move' : 'Move items'}
              </S.HeaderModeButton>
              {!batchModeEnabled ? (
                <S.HeaderModeButton
                  type="button"
                  $tone="ghost"
                  onClick={() => onToggleBatchMode?.()}
                >
                  Batch images
                </S.HeaderModeButton>
              ) : null}
            </>
          ) : null}
        </S.PageActionBar>
      </S.TitleRow>

      {archiveMode ? (
        <AllItemsArchiveBrowseControls
          searchQuery={searchQuery}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSearchChange={onSearchChange}
          onStatusChange={onStatusChange}
          onSortChange={onSortChange}
          onSortDirectionChange={onSortDirectionChange}
        />
      ) : (
        <AllItemsBrowseControls
          statusFilter={statusFilter}
          filter={filter}
          sortBy={sortBy}
          sortDirection={sortDirection}
          searchQuery={searchQuery}
          colorBy={colorBy}
          onStatusChange={onStatusChange}
          onFilterChange={onFilterChange}
          onSortChange={onSortChange}
          onSortDirectionChange={onSortDirectionChange}
          onColorByChange={onColorByChange}
          onRandomize={onRandomize}
          onSearchChange={onSearchChange}
          categoryOptions={safeCategoryOptions}
          batchOptions={safeBatchOptions}
          visibleCount={visibleCount}
          totalCount={totalCount}
          activeCount={activeCount}
          goneCount={goneCount}
          orphanedCount={orphanedCount}
        />
      )}
    </S.HeaderPanel>
  );
}
