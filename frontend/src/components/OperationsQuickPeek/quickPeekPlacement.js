import { API_BASE } from '../../api/API_BASE';

export async function changePlacement(itemId, sourceBoxId, destBoxId, compartmentKey) {
  const url = destBoxId ? '/api/boxed-items/moveItem' : `/api/boxed-items/${encodeURIComponent(sourceBoxId)}/removeItem`;
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(destBoxId ? { itemId, sourceBoxId, destBoxId, compartmentKey } : { itemId }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error?.message || 'Could not change the item’s box. Please try again.');
  }
}

// Incoming and outgoing Quick Peek moves share the same persistent Undo workflow.
export function showPlacementUndo({ item, box, destBoxId, destLabel, onMoved, showToast }) {
  const source = String(box?._id || '');
  const itemId = String(item?._id || item?.id || '');
  const isAdrift = box?.systemType === 'orphaned';
  let undoPending = false;
  showToast?.({ variant: 'success', title: destBoxId ? 'ITEM MOVED' : 'ITEM UNBOXED',
    message: `${item.name} → ${destLabel}`, sticky: true,
    actions: [{ label: 'Undo', kind: 'primary', onClick: async () => {
      if (undoPending) return;
      undoPending = true;
      try {
        await changePlacement(itemId, destBoxId, source, item.compartmentKey || item.box?.compartmentKey || (box.isComplexBox ? 'A' : undefined));
        onMoved?.();
        showToast?.({ variant: 'success', title: 'MOVE UNDONE', message: `${item.name} returned to ${isAdrift ? 'Items Adrift' : box.label || box.box_id}.`, timeoutMs: 2600 });
      } catch (failure) {
        undoPending = false;
        showToast?.({ variant: 'danger', title: 'UNDO FAILED', message: failure.message, timeoutMs: 5000 });
      }
    } }],
  });
}
