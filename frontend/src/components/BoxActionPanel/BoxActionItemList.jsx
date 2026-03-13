import React, { useEffect, useState } from 'react';
import ItemEditForm from '../ItemEditForm';
import MoveItemToOtherBox from '../MoveItemToOtherBox';
import BoxActionItemRow from './BoxActionItemRow';
import {
  EmptyMessage,
  InlineItemWorkspace,
  ItemList,
  WorkspaceClose,
  WorkspaceHeader,
  WorkspaceTitle,
} from './BoxActionPanel.styles';

const getItemId = (item) => item?._id ?? item?.id;

export default function BoxActionItemList({
  itemsUI,
  isBusy,
  zippingIds,
  zippingItemId,
  justReturnedIds,
  justReturnedItemId,
  isUndoing,
  enteringIdsRef,
  routeShortId,
  boxMongoId,
  boxTree,
  onItemUpdated,
  handleMoveRequest,
  handleOrphanRequest,
  refreshBox,
}) {
  const [editingItemId, setEditingItemId] = useState(null);
  const [movingItemId, setMovingItemId] = useState(null);

  useEffect(() => {
    const itemIds = new Set(itemsUI.map((item) => getItemId(item)).filter(Boolean));
    if (editingItemId && !itemIds.has(editingItemId)) {
      setEditingItemId(null);
    }
    if (movingItemId && !itemIds.has(movingItemId)) {
      setMovingItemId(null);
    }
  }, [editingItemId, movingItemId, itemsUI]);

  if (itemsUI.length === 0) {
    return <EmptyMessage>This box is empty. Add some items below.</EmptyMessage>;
  }

  const focusedItemId = editingItemId || movingItemId;
  const hasFocusedItem = !!focusedItemId;

  const openEditWorkspace = (itemId) => {
    if (isBusy) return;
    setMovingItemId(null);
    setEditingItemId((curr) => (curr === itemId ? null : itemId));
  };

  const openMoveWorkspace = (itemId) => {
    if (isBusy) return;
    setEditingItemId(null);
    setMovingItemId((curr) => (curr === itemId ? null : itemId));
  };

  const handleMoveToSelectedBox = (item, { destBoxId, destLabel, destShortId }) => {
    if (isBusy || !item) return;
    const itemId = getItemId(item);
    if (!itemId) return;

    setMovingItemId(null);
    handleMoveRequest({
      itemId,
      itemName: item?.name,
      itemQuantity: item?.quantity,
      sourceBoxId: boxMongoId,
      destBoxId,
      destLabel,
      destShortId,
    });
  };

  const handleOrphan = (itemId) => {
    if (isBusy) return;

    if (itemId === editingItemId) setEditingItemId(null);
    if (itemId === movingItemId) setMovingItemId(null);

    handleOrphanRequest({
      boxMongoId,
      itemId,
    });
  };

  return (
    <>
      <ItemList>
        {itemsUI.map((item) => {
          const id = getItemId(item);
          if (!id) return null;

          const leavingByBatch = zippingIds.has(id);
          const leavingBySingle = zippingItemId === id;
          const enteringByBatch = justReturnedIds.has(id);
          const enteringBySingle = justReturnedItemId === id;
          const isLeaving = leavingByBatch || leavingBySingle;
          const isUndo = isUndoing && (enteringByBatch || enteringBySingle);
          const isEntering = enteringByBatch || enteringBySingle;
          const isPreEnter = enteringIdsRef.current.has(id);
          const isEditingRow = editingItemId === id;
          const isMovingRow = movingItemId === id;
          const isFocusedRow = focusedItemId === id;

          const zipProp = isLeaving ? 'out' : isEntering ? 'in' : undefined;
          const flashProp = isUndo
            ? 'yellow'
            : isEntering
              ? 'green'
              : isLeaving
                ? 'red'
                : undefined;

          return (
            <React.Fragment key={id}>
              <BoxActionItemRow
                item={item}
                isMoving={isBusy || isLeaving}
                isEditing={isEditingRow}
                hasEditingFocus={hasFocusedItem}
                isFocusedRow={isFocusedRow}
                isSelectingMoveTarget={isMovingRow}
                zipProp={zipProp}
                flashProp={flashProp}
                isEntering={isEntering}
                isPreEnter={isPreEnter}
                onEdit={() => openEditWorkspace(id)}
                onMove={() => openMoveWorkspace(id)}
                onOrphan={() => handleOrphan(id)}
              />

              {isMovingRow && (
                <InlineItemWorkspace>
                  <WorkspaceHeader>
                    <WorkspaceTitle>
                      Move {item?.name || '(Unnamed Item)'} to another box
                    </WorkspaceTitle>
                    <WorkspaceClose
                      type="button"
                      onClick={() => setMovingItemId(null)}
                    >
                      Close
                    </WorkspaceClose>
                  </WorkspaceHeader>

                  <MoveItemToOtherBox
                    currentBoxId={boxMongoId}
                    onBoxSelected={(payload) =>
                      handleMoveToSelectedBox(item, payload)
                    }
                  />
                </InlineItemWorkspace>
              )}

              {isEditingRow && (
                <InlineItemWorkspace>
                  <WorkspaceHeader>
                    <WorkspaceTitle>
                      Editing {item?.name || '(Unnamed Item)'}
                    </WorkspaceTitle>
                    <WorkspaceClose
                      type="button"
                      onClick={() => setEditingItemId(null)}
                    >
                      Close
                    </WorkspaceClose>
                  </WorkspaceHeader>

                  <ItemEditForm
                    key={`edit-${id}`}
                    initialItem={item}
                    boxId={routeShortId}
                    boxMongoId={boxMongoId}
                    sourceBoxId={boxMongoId}
                    sourceBoxLabel={boxTree?.label}
                    sourceBoxShortId={routeShortId}
                    onClose={() => setEditingItemId(null)}
                    onItemUpdated={onItemUpdated}
                    onMoveRequest={handleMoveRequest}
                    onOrphanRequest={handleOrphanRequest}
                    refreshBox={refreshBox}
                  />
                </InlineItemWorkspace>
              )}
            </React.Fragment>
          );
        })}
      </ItemList>
    </>
  );
}
