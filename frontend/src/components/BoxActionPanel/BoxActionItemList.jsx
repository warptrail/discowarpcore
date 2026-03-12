import React from 'react';
import ItemEditForm from '../ItemEditForm';
import {
  EmptyMessage,
  ItemList,
  ItemRow,
  BoxLabel,
  ItemEditWrapper,
} from './BoxActionPanel.styles';

export default function BoxActionItemList({
  itemsUI,
  openItemId,
  visibleItemId,
  zippingIds,
  zippingItemId,
  justReturnedIds,
  justReturnedItemId,
  isUndoing,
  enteringIdsRef,
  itemEditHeight,
  itemEditRef,
  handleToggle,
  routeShortId,
  boxMongoId,
  boxTree,
  onItemUpdated,
  handleMoveRequest,
  handleOrphanRequest,
  refreshBox,
}) {
  if (itemsUI.length === 0) {
    return <EmptyMessage>This box is empty. Add some items below.</EmptyMessage>;
  }

  return (
    <ItemList>
      {itemsUI.map((item) => {
        const id = item._id;
        const isOpen = openItemId === id;
        const isVisible = visibleItemId === id;
        const leavingByBatch = zippingIds.has(id);
        const leavingBySingle = zippingItemId === id;
        const enteringByBatch = justReturnedIds.has(id);
        const enteringBySingle = justReturnedItemId === id;
        const isLeaving = leavingByBatch || leavingBySingle;
        const isUndo = isUndoing && (enteringByBatch || enteringBySingle);
        const isEntering = enteringByBatch || enteringBySingle;
        const isPreEnter = enteringIdsRef.current.has(id);
        const zipProp = isLeaving ? 'out' : isEntering ? 'in' : undefined;
        const flashProp = isUndo
          ? 'yellow'
          : isEntering
            ? 'green'
            : isLeaving
              ? 'red'
              : undefined;

        return (
          <div key={item._id}>
            <ItemRow
              onClick={() => handleToggle(item._id)}
              $isOpen={isOpen}
              $zip={zipProp}
              $flash={flashProp}
              $flashDelay={isEntering ? 280 : 0}
              $preEnter={isPreEnter}
            >
              <BoxLabel>{item.name || '(Unnamed Item)'}</BoxLabel>
            </ItemRow>

            {isVisible && (
              <ItemEditWrapper $isOpen={isOpen} $maxHeight={itemEditHeight}>
                <div ref={itemEditRef}>
                  <ItemEditForm
                    key={item.item_id}
                    initialItem={item}
                    boxId={routeShortId}
                    boxMongoId={boxMongoId}
                    sourceBoxId={boxMongoId}
                    sourceBoxLabel={boxTree?.label}
                    sourceBoxShortId={routeShortId}
                    onClose={() => handleToggle(item._id)}
                    onItemUpdated={onItemUpdated}
                    onMoveRequest={handleMoveRequest}
                    onOrphanRequest={handleOrphanRequest}
                    refreshBox={refreshBox}
                  />
                </div>
              </ItemEditWrapper>
            )}
          </div>
        );
      })}
    </ItemList>
  );
}
