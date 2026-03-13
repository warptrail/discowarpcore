import React from 'react';

import BoxTree from '../BoxTree';
import ItemsFlatList from '../ItemsFlatList';
import BoxActionPanel from '../BoxActionPanel';
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
        />
      </S.TreeTabScope>
    );
  }

  if (activeTab === 'flat') {
    return (
      <>
        <div style={{ color: 'yellow' }}>Flat view: {flatItems.length} items loaded</div>
        <ItemsFlatList
          items={flatItems}
          openItemId={openItemId}
          onOpenItem={handleOpen}
          accent={accent}
          pulsing={pulsing}
          collapseDurMs={collapseDurMs}
          effectsById={effectsById}
          onFlash={handleFlash}
        />
      </>
    );
  }

  if (activeTab === 'edit') {
    return <BoxActionPanel box={tree} boxTree={tree} boxMongoId={tree._id} />;
  }

  return null;
}
