import { lazy, Suspense, useContext, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useDialogFocus from '../../hooks/useDialogFocus';
import { ToastContext } from '../Toast';
import { Button } from './QuickPeekItemControls.styles';
import { showPlacementUndo } from './quickPeekPlacement';
import * as S from './QuickPeekAddItems.styles';

const CreateItem = lazy(() => import('../Intake/IntakeQuickItemMaker'));
const MoveItem = lazy(() => import('../Intake/IntakeMoveExistingTab'));

export default function QuickPeekAddItems({ box, expanded, onItemsChanged }) {
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);
  const dialogId = useId();
  const { showToast } = useContext(ToastContext) || {};
  const isAdrift = box?.systemType === 'orphaned';
  const close = () => { if (!busy) setView(null); };
  useDialogFocus(dialogRef, close, view !== null);
  const label = isAdrift ? 'Create unboxed item' : 'Add item to this box';

  const created = (payload) => {
    onItemsChanged?.(payload);
    showToast?.({ variant: 'success', title: 'ITEM CREATED', message: payload.message, sticky: true });
    setView(null);
  };
  const moved = (payload) => {
    onItemsChanged?.(payload);
    showPlacementUndo({
      item: { ...payload.item, compartmentKey: payload.sourceCompartmentKey },
      box: payload.sourceBox || { systemType: 'orphaned', label: 'Items Adrift' },
      destBoxId: box._id, destLabel: `#${box.box_id}${box.compartmentKey || ''} ${box.label || ''}`,
      onMoved: onItemsChanged, showToast,
    });
    setView(null);
  };

  return <>
    <Button type="button" aria-label={label} title={label} aria-haspopup="dialog"
      aria-expanded={view !== null} aria-controls={view !== null ? dialogId : undefined}
      disabled={!isAdrift && !box?._id} onClick={() => setView(isAdrift ? 'create' : 'menu')}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4v6M12 3 4 7v10l8 4M4 7l8 4 8-4M12 11v10M18 15v6M15 18h6" /></svg>
    </Button>
    {view !== null ? createPortal(
      <S.Overlay $expanded={expanded} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <S.Dialog ref={dialogRef} id={dialogId} tabIndex={-1} role="dialog" aria-modal="true"
          aria-label={isAdrift ? 'Create unboxed item' : `Add items to #${box.box_id}${box.compartmentKey || ''}`} aria-busy={busy}>
          <S.Header>
            {view !== 'menu' && !isAdrift ? <Button type="button" aria-label="Back to add item choices"
              title="Back" disabled={busy} onClick={() => setView('menu')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
            </Button> : null}
            <S.Identity>{isAdrift ? 'Items Adrift' : <><code>#{box.box_id}{box.compartmentKey}</code>{box.label || 'Untitled box'}</>}
              {view !== 'menu' ? <small>{view === 'create' ? 'Create here' : 'Move here'}</small> : null}
            </S.Identity>
            <Button type="button" aria-label="Close add item flow" title="Close" disabled={busy} onClick={close}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </Button>
          </S.Header>
          <S.Body $menu={view === 'menu'}>
            {view === 'menu' ? <S.ChoiceRail role="group" aria-label="Add item choices">
              <S.Choice type="button" aria-label="Create item here" title="Create an item in this box" onClick={() => setView('create')}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 3 6 3.5v7L9 17l-6-3.5v-7L9 3Zm-6 3.5 6 3.5 6-3.5M9 10v7M18 13v8M14 17h8" /></svg><span>Create</span>
              </S.Choice>
              <S.Choice type="button" aria-label="Move existing item here" title="Move an existing item into this box" onClick={() => setView('move')}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 3 5 3v6l-5 3-5-3V6l5-3Zm-5 3 5 3 5-3M8 9v6M11 18h10m-4-4 4 4-4 4" /></svg><span>Move</span>
              </S.Choice>
            </S.ChoiceRail> : <Suspense fallback={<p role="status">Loading item controls…</p>}>
              {view === 'create' ? <CreateItem compact captureVariant="console" mode={isAdrift ? 'orphan' : 'inBox'} targetBox={isAdrift ? null : box}
                onCancel={close} onBusyChange={setBusy} onItemCreated={created} />
                : <MoveItem compact currentBox={box} onBusyChange={setBusy} onItemMoved={moved} />}
            </Suspense>}
          </S.Body>
        </S.Dialog>
      </S.Overlay>, document.getElementById('operations-box-quick-peek') || document.body,
    ) : null}
  </>;
}
