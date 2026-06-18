import React, { useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { API_BASE } from '../api/API_BASE';
import { moveBoxedItem, orphanBoxedItem } from '../api/boxedItems';
import { ToastContext } from './Toast';
import MoveItemToOtherBox from './MoveItemToOtherBox';

function getItemId(item) {
  return String(item?._id ?? item?.id ?? '').trim();
}

function getSourceBoxId(item) {
  return String(
    item?.parentBoxMongoId ||
      item?.sourceBoxId ||
      item?.parentBox ||
      item?.boxId ||
      ''
  ).trim();
}

export default function CondensedBatchMovePanel({
  selectedItems,
  isOpen,
  onOpenChange,
  onMoved,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const [isMoving, setIsMoving] = useState(false);

  const moveTargets = useMemo(() => {
    return (Array.isArray(selectedItems) ? selectedItems : [])
      .map((item) => ({
        item,
        itemId: getItemId(item),
        sourceBoxId: getSourceBoxId(item),
      }))
      .filter((entry) => entry.itemId);
  }, [selectedItems]);

  const selectedCount = moveTargets.length;
  if (!isOpen || !selectedCount) return null;

  const sourceBoxIds = new Set(
    moveTargets.map((entry) => entry.sourceBoxId).filter(Boolean),
  );
  const commonSourceBoxId =
    sourceBoxIds.size === 1 ? [...sourceBoxIds][0] : '';

  const handleDestinationSelected = async ({
    destBoxId,
    destLabel,
    destShortId,
    isOrphanedDestination = false,
  }) => {
    if (isMoving) return;
    if (!isOrphanedDestination && !destBoxId) {
      showToast?.({
        variant: 'danger',
        title: 'Batch move failed',
        message: 'Destination box is missing.',
        timeoutMs: 4200,
      });
      return;
    }

    const movableTargets = moveTargets.filter((entry) => entry.sourceBoxId);
    if (movableTargets.length !== moveTargets.length) {
      showToast?.({
        variant: 'danger',
        title: 'Batch move failed',
        message: 'One or more selected items are missing source box information.',
        timeoutMs: 5200,
      });
      return;
    }

    try {
      setIsMoving(true);
      const results = await Promise.allSettled(
        movableTargets.map((entry) =>
          isOrphanedDestination
            ? orphanBoxedItem({
                itemId: entry.itemId,
                sourceBoxId: entry.sourceBoxId,
                baseUrl: API_BASE,
              })
            : moveBoxedItem({
                itemId: entry.itemId,
                sourceBoxId: entry.sourceBoxId,
                destBoxId,
                baseUrl: API_BASE,
              }),
        ),
      );

      const failed = results.filter((result) => result.status === 'rejected');
      const movedCount = results.length - failed.length;

      if (failed.length) {
        showToast?.({
          variant: movedCount ? 'warning' : 'danger',
          title: movedCount ? 'Batch move partially completed' : 'Batch move failed',
          message: movedCount
            ? `${movedCount} moved, ${failed.length} failed.`
            : failed[0]?.reason?.message || 'Could not move the selected items.',
          timeoutMs: 6200,
        });
      } else {
        showToast?.({
          variant: 'success',
          title: isOrphanedDestination ? 'Items orphaned' : 'Items moved',
          message: isOrphanedDestination
            ? `Moved ${movedCount} ${movedCount === 1 ? 'item' : 'items'} to No Box.`
            : `Moved ${movedCount} ${movedCount === 1 ? 'item' : 'items'} to ${
                destLabel ||
                (destShortId ? `Box #${destShortId}` : 'destination box')
              }.`,
          timeoutMs: 3600,
        });
      }

      await onMoved?.();
      onOpenChange?.(false);
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Batch move failed',
        message: error?.message || 'Could not move the selected items.',
        timeoutMs: 5200,
      });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Panel>
      <WorkspaceHeader>
        <WorkspaceTitle>
          Move {selectedCount} {selectedCount === 1 ? 'item' : 'items'} to another box
        </WorkspaceTitle>
        {isMoving ? <StatusText>Moving...</StatusText> : null}
      </WorkspaceHeader>
      <MoveItemToOtherBox
        itemIds={moveTargets.map((entry) => entry.itemId)}
        currentBoxId={commonSourceBoxId}
        onBoxSelected={handleDestinationSelected}
        showRecentDestinations={false}
      />
    </Panel>
  );
}

const Panel = styled.section`
  display: grid;
  gap: 0.7rem;
  margin: 0 0 0.75rem;
  padding: 0.72rem;
  border: 1px solid rgba(112, 218, 184, 0.28);
  border-radius: 10px;
  background: rgba(9, 24, 20, 0.72);
`;

const WorkspaceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
`;

const WorkspaceTitle = styled.h4`
  margin: 0;
  color: #edf7f2;
  font-size: 0.96rem;
  line-height: 1.2;
`;

const StatusText = styled.span`
  color: rgba(237, 247, 242, 0.72);
  font-size: 0.78rem;
`;
