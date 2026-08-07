import React from 'react';

import BoxTree from '../BoxTree';
import ItemsFlatList from '../ItemsFlatList';
import BoxDetailActionSection from './BoxDetailActionSection';
import * as S from './BoxDetailTabContent.styles';

export default function BoxDetailTabContent({
  activeTab,
  loading,
  error,
  tree,
  flatItems,
  openItemId,
  handleOpen,
  accent,
  pulsing,
  collapseDurMs,
  effectsById,
  triggerFlash,
  startPulse,
  stopPulse,
  handleFlash,
  handleItemSaved,
  refreshBox,
  searchQuery,
  sortMode,
  onManageBox,
  viewMode,
}) {
  if (loading || error || !tree) return null;

  if (activeTab === 'tree') {
    return (
      <S.TreeTabScope>
        <BoxTree
          node={tree}
          openItemId={openItemId}
          onOpenItem={handleOpen}
          accent={accent}
          pulsing={pulsing}
          collapseDurMs={collapseDurMs}
          effectsById={effectsById}
          triggerFlash={triggerFlash}
          startPulse={startPulse}
          stopPulse={stopPulse}
          onItemSaved={handleItemSaved}
          refreshBox={refreshBox}
          searchQuery={searchQuery}
          sortMode={sortMode}
          viewMode={viewMode}
          scopeLabel={Array.isArray(tree?.childBoxes) && tree.childBoxes.length > 0 ? 'Tree' : 'List'}
          onManageBox={onManageBox}
        />
      </S.TreeTabScope>
    );
  }

  if (activeTab === 'flat') {
    return (
      <S.FlatTabScope>
        <BoxDetailActionSection
          title="Items"
          count={flatItems.length}
          box={tree}
          onItemsChanged={refreshBox}
          onManageBox={onManageBox}
        >
          {flatItems.length === 0 && searchQuery ? (
            <S.FlatEmpty>Nothing in this box matches yet. Try one simpler word.</S.FlatEmpty>
          ) : null}

          <ItemsFlatList
            items={flatItems}
            openItemId={openItemId}
            onOpenItem={handleOpen}
            accent={accent}
            pulsing={pulsing}
            collapseDurMs={collapseDurMs}
            effectsById={effectsById}
            onFlash={handleFlash}
            showHeader={false}
            triggerFlash={triggerFlash}
            onItemSaved={handleItemSaved}
            refreshBox={refreshBox}
          />
        </BoxDetailActionSection>
      </S.FlatTabScope>
    );
  }

  return null;
}
