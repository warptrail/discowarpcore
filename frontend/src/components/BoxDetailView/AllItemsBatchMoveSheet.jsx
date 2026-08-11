import React, { useContext, useMemo, useState } from 'react';

import { API_BASE } from '../../api/API_BASE';
import { moveBoxedItem } from '../../api/boxedItems';
import MoveItemToOtherBox from '../MoveItemToOtherBox';
import ObsidianPrismSheet from '../Sheets/ObsidianPrismSheet';
import { ToastContext } from '../Toast';

function itemId(item) {
  return String(item?._id ?? item?.id ?? '').trim();
}

function sourceBoxId(item) {
  return String(item?.parentBoxMongoId || item?.sourceBoxId || item?.parentBox || item?.boxId || '').trim();
}

export default function AllItemsBatchMoveSheet({ selectedItems, onClose, onCompleted }) {
  const { showToast } = useContext(ToastContext) || {};
  const [moving, setMoving] = useState(false);
  const targets = useMemo(() => (selectedItems || []).map((item) => ({ itemId: itemId(item), sourceBoxId: sourceBoxId(item) })).filter(({ itemId: id }) => id), [selectedItems]);
  const sourceIds = new Set(targets.map((target) => target.sourceBoxId).filter(Boolean));
  const commonSourceBoxId = sourceIds.size === 1 ? [...sourceIds][0] : '';

  const handleDestination = async ({ destBoxId, destLabel, destShortId }) => {
    if (moving || !destBoxId) return;
    const skipped = targets.filter((target) => target.sourceBoxId === String(destBoxId));
    const moveable = targets.filter((target) => target.sourceBoxId && target.sourceBoxId !== String(destBoxId));
    const missingSource = targets.filter((target) => !target.sourceBoxId);
    setMoving(true);
    try {
      const results = await Promise.allSettled(moveable.map((target) => moveBoxedItem({ ...target, destBoxId, baseUrl: API_BASE })));
      const movedIds = results.flatMap((result, index) => result.status === 'fulfilled' ? [moveable[index].itemId] : []);
      const failedIds = [
        ...missingSource.map((target) => target.itemId),
        ...results.flatMap((result, index) => result.status === 'rejected' ? [moveable[index].itemId] : []),
      ];
      const detail = `${movedIds.length} moved${skipped.length ? `, ${skipped.length} already there` : ''}${failedIds.length ? `, ${failedIds.length} failed` : ''}.`;
      showToast?.({
        variant: failedIds.length ? (movedIds.length ? 'warning' : 'danger') : 'success',
        title: failedIds.length ? 'Batch move partially completed' : 'Items moved',
        message: failedIds.length ? detail : `${detail} ${destLabel || (destShortId ? `Box #${destShortId}` : '')}`,
        timeoutMs: failedIds.length ? 6200 : 3600,
      });
      await onCompleted?.({ movedIds, skippedIds: skipped.map((target) => target.itemId), failedIds });
    } finally {
      setMoving(false);
    }
  };

  return (
    <ObsidianPrismSheet
      eyebrow="Move selected items"
      title={`${targets.length} ${targets.length === 1 ? 'item' : 'items'}`}
      context="Choose a destination box"
      backLabel="Back to item selection"
      closeLabel="Close destination picker"
      onBack={onClose}
      onClose={onClose}
    >
      <MoveItemToOtherBox
        itemIds={targets.map((target) => target.itemId)}
        currentBoxId={commonSourceBoxId}
        onBoxSelected={handleDestination}
        showOrphanOption={false}
        showRecentDestinations={false}
        disabled={moving}
      />
    </ObsidianPrismSheet>
  );
}
