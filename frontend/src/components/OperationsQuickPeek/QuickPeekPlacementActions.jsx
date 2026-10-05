import { useContext, useRef, useState } from 'react';
import MoveItemToOtherBox from '../MoveItemToOtherBox';
import { ToastContext } from '../Toast';
import { API_BASE } from '../../api/API_BASE';
import * as S from './OperationsQuickPeek.styles';

async function changePlacement(itemId, sourceBoxId, destBoxId, compartmentKey) {
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

export default function QuickPeekPlacementActions({ item, box, onMoved }) {
  const [choosing, setChoosing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const { showToast } = useContext(ToastContext) || {};
  const source = String(box?._id || '');
  const isAdrift = box?.systemType === 'orphaned';
  const itemId = String(item?._id || item?.id || '');
  const move = async ({ destBoxId = null, destLabel = 'Items Adrift', compartmentKey } = {}) => {
    if (lock.current || (!source && !isAdrift) || !itemId || (!source && !destBoxId)) return;
    lock.current = true; setPending(true); setError('');
    try {
      await changePlacement(itemId, source || null, destBoxId, compartmentKey);
      onMoved?.();
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
    } catch (failure) {
      setError(failure.message);
      showToast?.({ variant: 'danger', title: 'MOVE FAILED', message: failure.message, timeoutMs: 5000 });
    } finally { lock.current = false; setPending(false); }
  };
  return <S.ActionGroup aria-label="Placement actions">
    <S.ActionGroupLabel>Placement</S.ActionGroupLabel>
    <S.ActionGroupButtons>
      <S.ItemCarouselActionButton type="button" disabled={pending || (!source && !isAdrift) || item.item_status === 'gone'} onClick={() => setChoosing(!choosing)} aria-expanded={choosing}>Move…</S.ItemCarouselActionButton>
      {!isAdrift ? <S.ItemCarouselActionButton type="button" disabled={pending || !source || item.item_status === 'gone'} onClick={() => move()} title="Remove from this box; keep in Items Adrift">Unbox</S.ItemCarouselActionButton> : null}
    </S.ActionGroupButtons>
    {pending ? <S.ActionGroupLabel role="status">Moving…</S.ActionGroupLabel> : null}
    {choosing && !pending ? <MoveItemToOtherBox itemId={itemId} currentBoxId={source} showOrphanOption={!isAdrift} onBoxSelected={move} /> : null}
    {error ? <S.ActionGroupLabel role="alert">{error}</S.ActionGroupLabel> : null}
  </S.ActionGroup>;
}
