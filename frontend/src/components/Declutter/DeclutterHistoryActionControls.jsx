import { useEffect, useMemo, useState } from 'react';

import { ItemMarkGoneConsolePanel } from '../ItemLifecycleConsolePanels';
import { getDeclutterBoxPurposeForRoute } from '../../util/declutterBoxPurpose';
import * as S from './Declutter.styles';
import { getItemName, getSessionItemItem } from './declutterUtils';

const ROUTE_ACTION_COPY = {
  discard: { label: 'Trash', complete: 'Already trashed it', disposition: 'trashed' },
  donate: { label: 'Donate', complete: 'Already donated it', disposition: 'donated' },
  sell: { label: 'Sell', complete: 'Already sold it', disposition: 'sold' },
  gift: { label: 'Gift', complete: 'Already gifted it', disposition: 'gifted' },
};

export default function DeclutterHistoryActionControls({
  candidate,
  stagingBoxes = [],
  busy = false,
  onComplete,
  onStage,
}) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const item = getSessionItemItem(candidate);
  const itemName = getItemName(item);
  const route = String(candidate?.stagingRoute || '').trim().toLowerCase();
  const routeCopy = ROUTE_ACTION_COPY[route] || null;
  const requiredPurpose = getDeclutterBoxPurposeForRoute(route);
  const currentBoxId = String(item?.box?.id || '').trim();

  useEffect(() => {
    setConfirmationOpen(false);
  }, [candidate?.id]);

  const compatibleBoxes = useMemo(
    () => stagingBoxes.filter((box) => box?.declutterPurpose === requiredPurpose),
    [requiredPurpose, stagingBoxes],
  );
  const currentStagingBox = compatibleBoxes.find(
    (box) => String(box?.id || box?._id || '') === currentBoxId,
  ) || null;
  const suggestedBox = compatibleBoxes.find(
    (box) => String(box?.id || box?._id || '') !== currentBoxId,
  ) || null;

  if (!routeCopy) {
    return (
      <S.HistoryWorkflowPanel>
        <S.HistoryWorkflowNotice>Choose a specific departure route before completing this action.</S.HistoryWorkflowNotice>
      </S.HistoryWorkflowPanel>
    );
  }

  const suggestedBoxId = String(suggestedBox?.id || suggestedBox?._id || '');
  const suggestedBoxLabel = [
    suggestedBox?.box_id ? `#${suggestedBox.box_id}` : '',
    suggestedBox?.label || '',
  ].filter(Boolean).join(' ');
  const currentStagingLabel = [
    currentStagingBox?.box_id ? `#${currentStagingBox.box_id}` : '',
    currentStagingBox?.label || '',
  ].filter(Boolean).join(' ');

  return (
    <S.HistoryWorkflowPanel>
      <S.HistoryWorkflowHeader>
        <span>Action // {routeCopy.label}</span>
        <small>The specific route wins over generic Toss.</small>
      </S.HistoryWorkflowHeader>
      <S.HistoryWorkflowCommands>
        {currentStagingBox ? (
          <S.HistoryWorkflowNotice $tone="staged">
            Staged in {currentStagingLabel}
          </S.HistoryWorkflowNotice>
        ) : suggestedBox ? (
          <S.HistoryStageButton
            type="button"
            disabled={busy}
            onClick={() => onStage?.(candidate, {
              boxId: suggestedBoxId,
              boxLabel: suggestedBoxLabel,
              route,
            })}
          >
            {busy ? 'Moving…' : `Move to staging · ${suggestedBoxLabel}`}
          </S.HistoryStageButton>
        ) : (
          <S.HistoryWorkflowNotice>
            No {routeCopy.label.toLowerCase()} staging box is configured.
          </S.HistoryWorkflowNotice>
        )}
        <S.HistoryCompleteToggle
          type="button"
          disabled={busy}
          aria-expanded={confirmationOpen}
          onClick={() => setConfirmationOpen((current) => !current)}
        >
          {confirmationOpen ? 'Hide verification' : routeCopy.complete}
        </S.HistoryCompleteToggle>
      </S.HistoryWorkflowCommands>
      {confirmationOpen ? (
        <S.HistoryVerificationPanel>
          <ItemMarkGoneConsolePanel
            busy={busy}
            itemName={itemName}
            initialDisposition={routeCopy.disposition}
            lockDisposition
            onCancel={() => setConfirmationOpen(false)}
            onConfirm={({ disposition, dispositionNotes }) => onComplete?.(candidate, {
              disposition,
              notes: dispositionNotes,
            })}
          />
        </S.HistoryVerificationPanel>
      ) : null}
    </S.HistoryWorkflowPanel>
  );
}
