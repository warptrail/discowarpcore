import React from 'react';

import BoxTree from '../BoxTree';
import AllItemsWorkspace from './AllItemsWorkspace';
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
          scopeLabel={viewMode === 'condensed' ? 'Box tree' : 'Compact hierarchy'}
          onManageBox={onManageBox}
        />
      </S.TreeTabScope>
    );
  }

  if (activeTab === 'flat') {
    return (
      <S.FlatTabScope>
        <AllItemsWorkspace
          box={tree}
          items={flatItems}
          searchQuery={searchQuery}
          openItemId={openItemId}
          onOpenItem={handleOpen}
          onManageBox={onManageBox}
          accent={accent}
          pulsing={pulsing}
          collapseDurMs={collapseDurMs}
          effectsById={effectsById}
          onFlash={handleFlash}
          triggerFlash={triggerFlash}
          onItemSaved={handleItemSaved}
          onItemsChanged={refreshBox}
          refreshBox={refreshBox}
        />
      </S.FlatTabScope>
    );
  }

  return null;
}
