import React from 'react';

import BoxControlBar from './BoxControlBar';
import NestBoxSection from './NestBoxSection';
import EditBoxDetailsForm from './EditBoxDetailsForm';
import DestroyBoxSection from './DestroyBoxSection';
import MiniOrphanedList from './MiniOrphanedList';
import AddItemToThisBoxForm from './AddItemToThisBoxForm';

import useBoxActionPanelController from './BoxActionPanel/useBoxActionPanelController';
import BoxActionItemList from './BoxActionPanel/BoxActionItemList';
import { DetailsPanel, PanelContainer } from './BoxActionPanel/BoxActionPanel.styles';

export default function BoxActionPanel({
  boxTree,
  boxMongoId,
  onItemUpdated,
  refreshBox,
  orphanedItems,
  fetchOrphanedItems,
  onItemAssigned,
  onBoxSaved,
  busy,
  onRequestDelete,
}) {
  const controller = useBoxActionPanelController({
    boxTree,
    boxMongoId,
    onBoxSaved,
    refreshBox,
    fetchOrphanedItems,
    onItemAssigned,
  });

  const {
    activePanel,
    isDestroyMode,
    isEmptyMode,
    isMoving,
    routeShortId,
    itemsUI,
    openItemId,
    visibleItemId,
    itemEditHeight,
    zippingIds,
    zippingItemId,
    justReturnedIds,
    justReturnedItemId,
    isUndoing,
    itemEditRef,
    enteringIdsRef,
    setActivePanel,
    togglePanel,
    handleEmptyTab,
    handleFormSaved,
    handleMoveRequest,
    handleOrphanRequest,
    handleItemAdded,
    handleItemAssigned,
    handleToggle,
  } = controller;

  return (
    <PanelContainer>
      <BoxControlBar
        active={activePanel}
        onClickEmpty={handleEmptyTab}
        onClickNest={() => togglePanel('nest')}
        onClickEdit={() => togglePanel('edit')}
        onClickDestroy={() => togglePanel('destroy')}
        busy={isMoving}
      />

      <NestBoxSection
        open={activePanel === 'nest'}
        onClose={() => setActivePanel(null)}
        onConfirm={() => {}}
        sourceBoxMongoId={boxMongoId}
        sourceBoxLabel={boxTree?.label}
        boxTree={boxTree}
        busy={busy || isMoving}
      />

      <DetailsPanel $open={activePanel === 'edit'} $maxHeight={420}>
        {activePanel === 'edit' && (
          <EditBoxDetailsForm
            boxMongoId={boxMongoId}
            initial={boxTree}
            onSaved={handleFormSaved}
            onCancel={() => setActivePanel(null)}
          />
        )}
      </DetailsPanel>

      <DestroyBoxSection
        open={activePanel === 'destroy'}
        onCancel={() => setActivePanel(null)}
        shortId={routeShortId}
        boxMongoId={boxMongoId}
        onRequestDelete={onRequestDelete}
        busy={busy}
      />

      {!isDestroyMode && (
        <BoxActionItemList
          itemsUI={itemsUI}
          openItemId={openItemId}
          visibleItemId={visibleItemId}
          zippingIds={zippingIds}
          zippingItemId={zippingItemId}
          justReturnedIds={justReturnedIds}
          justReturnedItemId={justReturnedItemId}
          isUndoing={isUndoing}
          enteringIdsRef={enteringIdsRef}
          itemEditHeight={itemEditHeight}
          itemEditRef={itemEditRef}
          handleToggle={handleToggle}
          routeShortId={routeShortId}
          boxMongoId={boxMongoId}
          boxTree={boxTree}
          onItemUpdated={onItemUpdated}
          handleMoveRequest={handleMoveRequest}
          handleOrphanRequest={handleOrphanRequest}
          refreshBox={refreshBox}
        />
      )}

      {!isDestroyMode && (
        <MiniOrphanedList
          boxMongoId={boxMongoId}
          onItemAssigned={handleItemAssigned}
          onItemUpdated={onItemUpdated}
          orphanedItems={orphanedItems}
          fetchOrphanedItems={fetchOrphanedItems}
        />
      )}

      {!isDestroyMode && !isEmptyMode && (
        <AddItemToThisBoxForm
          boxMongoId={boxMongoId}
          onAdded={handleItemAdded}
          boxShortId={routeShortId}
        />
      )}
    </PanelContainer>
  );
}
