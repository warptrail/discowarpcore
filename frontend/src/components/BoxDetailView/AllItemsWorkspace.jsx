import React, { useEffect, useMemo, useState } from 'react';

import ItemsFlatList from '../ItemsFlatList';
import BoxDetailActionSection from './BoxDetailActionSection';
import AllItemsBatchMoveSheet from './AllItemsBatchMoveSheet';
import * as S from './BoxDetailTabContent.styles';

export default function AllItemsWorkspace({ box, items, searchQuery, openItemId, onOpenItem, onItemsChanged, onManageBox, ...itemListProps }) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [destinationOpen, setDestinationOpen] = useState(false);
  const boxKey = String(box?._id || box?.box_id || '');

  useEffect(() => {
    setSelectionMode(false); setSelectedIds(new Set()); setDestinationOpen(false);
  }, [boxKey]);
  useEffect(() => { setSelectedIds(new Set()); }, [searchQuery]);

  const selectedItems = useMemo(() => (items || []).filter((item) => selectedIds.has(String(item?._id ?? item?.id ?? ''))), [items, selectedIds]);
  const toggleItem = (id, selected) => setSelectedIds((current) => {
    const next = new Set(current); if (selected) next.add(id); else next.delete(id); return next;
  });
  const cancel = () => { setSelectionMode(false); setSelectedIds(new Set()); setDestinationOpen(false); };
  const complete = async ({ failedIds }) => {
    await onItemsChanged?.();
    if (failedIds.length) setSelectedIds(new Set(failedIds)); else cancel();
    setDestinationOpen(false);
  };
  const visibleIds = (items || []).map((item) => String(item?._id ?? item?.id ?? '')).filter(Boolean);

  return (
    <BoxDetailActionSection
      title="All items"
      count={items?.length || 0}
      scopeNote="this box + nested boxes"
      box={box}
      onItemsChanged={onItemsChanged}
      onManageBox={onManageBox}
      hideInlineActions={selectionMode}
      headerAction={<S.SectionActionButton type="button" onClick={() => selectionMode ? cancel() : setSelectionMode(true)}>{selectionMode ? 'Cancel move' : 'Move items'}</S.SectionActionButton>}
    >
      {selectionMode ? (
        <S.SelectionToolbar aria-label="Move selected items">
          <S.SelectionCount>{selectedItems.length} selected</S.SelectionCount>
          <S.SelectionButton type="button" onClick={() => setSelectedIds(new Set(visibleIds))}>Select shown</S.SelectionButton>
          <S.SelectionButton type="button" $primary onClick={() => setDestinationOpen(true)} disabled={!selectedItems.length}>Choose destination</S.SelectionButton>
          <S.SelectionButton type="button" onClick={cancel}>Cancel</S.SelectionButton>
        </S.SelectionToolbar>
      ) : null}
      {!items?.length && searchQuery ? <S.FlatEmpty>Nothing in this box matches yet. Try one simpler word.</S.FlatEmpty> : null}
      <ItemsFlatList
        items={items}
        openItemId={selectionMode ? null : openItemId}
        onOpenItem={onOpenItem}
        showHeader={false}
        selectionMode={selectionMode}
        selectedItemIds={selectedIds}
        onSelectionChange={toggleItem}
        showBoxContext
        {...itemListProps}
      />
      {destinationOpen ? <AllItemsBatchMoveSheet selectedItems={selectedItems} onClose={() => setDestinationOpen(false)} onCompleted={complete} /> : null}
    </BoxDetailActionSection>
  );
}
