import React from 'react';

import BoxTree from '../BoxTree';
import ItemsFlatList from '../ItemsFlatList';
import BoxInlineItemActions from './BoxInlineItemActions';
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
        />
        <BoxInlineItemActions box={tree} onItemsChanged={refreshBox} />
      </S.TreeTabScope>
    );
  }

  if (activeTab === 'flat') {
    return (
      <S.FlatTabScope>
        <S.SectionHeading>
          <S.SectionTitle>Items</S.SectionTitle>
          <S.SectionCount>
            {flatItems.length} {flatItems.length === 1 ? 'item' : 'items'}
          </S.SectionCount>
          <S.SectionRule aria-hidden="true" />
        </S.SectionHeading>
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

        <BoxInlineItemActions box={tree} onItemsChanged={refreshBox} />
      </S.FlatTabScope>
    );
  }

  return null;
}
