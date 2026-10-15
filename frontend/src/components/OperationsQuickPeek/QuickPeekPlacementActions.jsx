import { useContext, useRef, useState } from 'react';
import MoveItemToOtherBox from '../MoveItemToOtherBox';
import { ToastContext } from '../Toast';
import { changePlacement, showPlacementUndo } from './quickPeekPlacement';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekPlacementActions({ item, box, onMoved, pickerOnly = false, pickerControl = null }) {
  const [choosing, setChoosing] = useState(pickerOnly);
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
      showPlacementUndo({ item, box, destBoxId, destLabel, onMoved, showToast });
    } catch (failure) {
      setError(failure.message);
      showToast?.({ variant: 'danger', title: 'MOVE FAILED', message: failure.message, timeoutMs: 5000 });
    } finally { lock.current = false; setPending(false); }
  };
  return <S.ActionGroup aria-label="Placement actions">
    {!pickerOnly ? <S.ActionGroupLabel>Placement</S.ActionGroupLabel> : null}
    {!pickerOnly ? <>
    <S.ActionGroupButtons>
      <S.ItemCarouselActionButton type="button" disabled={pending || (!source && !isAdrift) || item.item_status === 'gone'} onClick={() => setChoosing(!choosing)} aria-expanded={choosing}>Move…</S.ItemCarouselActionButton>
      {!isAdrift ? <S.ItemCarouselActionButton type="button" disabled={pending || !source || item.item_status === 'gone'} onClick={() => move()} title="Remove from this box; keep in Items Adrift">Unbox</S.ItemCarouselActionButton> : null}
    </S.ActionGroupButtons>
    </> : null}
    {pending ? <S.ActionGroupLabel role="status">Moving…</S.ActionGroupLabel> : null}
    {choosing && !pending ? <MoveItemToOtherBox itemId={itemId} currentBoxId={source} showOrphanOption={!isAdrift}
      compact={pickerOnly} filterTrailingControl={pickerControl}
      orphanOptionLabel="No box · Items Adrift" disabled={!itemId || (!source && !isAdrift) || item.item_status === 'gone'} onBoxSelected={move} /> : null}
    {error ? <S.ActionGroupLabel role="alert">{error}</S.ActionGroupLabel> : null}
  </S.ActionGroup>;
}
