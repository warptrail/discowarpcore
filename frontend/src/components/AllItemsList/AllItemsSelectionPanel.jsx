import React from 'react';
import MoveItemToOtherBox from '../MoveItemToOtherBox';
import AllItemsDeclutterSessionControls from './AllItemsDeclutterSessionControls';
import * as S from './AllItemsList.styles';

function getDestinationLabel(destination) {
  if (!destination?.destBoxId) return 'No destination selected';
  const shortId = destination.destShortId ? `#${destination.destShortId}` : '';
  return [shortId, destination.destLabel].filter(Boolean).join(' • ') || 'Selected box';
}

export default function AllItemsSelectionPanel({
  selectedCount = 0,
  selectableCount = 0,
  sourceBatchOptions = [],
  pendingSourceBatchId = '',
  destination = null,
  destinationPickerOpen = false,
  moving = false,
  onSelectAllVisible,
  onClearSelection,
  onPendingSourceBatchChange,
  onSelectSourceBatch,
  onToggleDestinationPicker,
  onDestinationSelected,
  onMoveSelected,
  onExit,
  declutterControls = null,
}) {
  const safeBatchOptions = Array.isArray(sourceBatchOptions) ? sourceBatchOptions : [];
  const selectedBatch = safeBatchOptions.find(
    (option) => String(option.value || '') === String(pendingSourceBatchId || ''),
  );
  const selectedBatchSelectableCount = Number(selectedBatch?.selectableCount || 0);
  const canSelectBatch = Boolean(pendingSourceBatchId && selectedBatchSelectableCount > 0);
  const canMove = selectedCount > 0 && destination?.destBoxId && !moving;

  return (
    <S.BatchSelectionPanel>
      <S.BatchSelectionSummary>
        <S.BatchSelectionTitle>Select Items</S.BatchSelectionTitle>
        <S.BatchSelectionText>
          {selectedCount} selected from {selectableCount} active visible items.
          No-longer-have items are excluded from selection.
        </S.BatchSelectionText>
      </S.BatchSelectionSummary>

      <S.ItemSelectionControls>
        <S.SelectionControlCluster>
          <S.ToolbarButton
            type="button"
            $tone="ghost"
            disabled={!selectableCount || moving}
            onClick={() => onSelectAllVisible?.()}
          >
            Select All Visible
          </S.ToolbarButton>
          <S.ToolbarButton
            type="button"
            $tone="ghost"
            disabled={!selectedCount || moving}
            onClick={() => onClearSelection?.()}
          >
            Clear
          </S.ToolbarButton>
        </S.SelectionControlCluster>

        {safeBatchOptions.length ? (
          <S.SelectionBatchCluster>
            <S.SelectionSelectLabel>
              <span>JSON Batch</span>
              <S.Select
                value={pendingSourceBatchId}
                disabled={moving}
                onChange={(event) => onPendingSourceBatchChange?.(event.target.value)}
              >
                <option value="">Choose source batch...</option>
                {safeBatchOptions.map((option) => {
                  const archiveSuffix = option.archiveStatus === 'archived' ? ' (Archived)' : '';
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}{archiveSuffix} - {option.selectableCount}/{option.totalCount}
                    </option>
                  );
                })}
              </S.Select>
            </S.SelectionSelectLabel>
            <S.ToolbarButton
              type="button"
              disabled={!canSelectBatch || moving}
              onClick={() => onSelectSourceBatch?.(pendingSourceBatchId)}
            >
              Select Batch Items
            </S.ToolbarButton>
          </S.SelectionBatchCluster>
        ) : null}

        <S.SelectionDestinationCluster>
          <S.SelectionDestinationText>
            Destination: <strong>{getDestinationLabel(destination)}</strong>
          </S.SelectionDestinationText>
          <S.ToolbarButton
            type="button"
            $tone="ghost"
            disabled={moving}
            onClick={() => onToggleDestinationPicker?.()}
          >
            {destinationPickerOpen ? 'Hide Boxes' : 'Choose Box'}
          </S.ToolbarButton>
          <S.ToolbarButton
            type="button"
            $tone="primary"
            disabled={!canMove}
            onClick={() => onMoveSelected?.()}
          >
            {moving ? 'Moving...' : 'Move Selected'}
          </S.ToolbarButton>
          <S.ToolbarButton type="button" $tone="warning" disabled={moving} onClick={() => onExit?.()}>
            Exit Select
          </S.ToolbarButton>
        </S.SelectionDestinationCluster>

        {destinationPickerOpen ? (
          <S.SelectionBoxPicker>
            <MoveItemToOtherBox
              itemId=""
              currentBoxId=""
              showOrphanOption={false}
              showRecentDestinations={false}
              onBoxSelected={onDestinationSelected}
            />
          </S.SelectionBoxPicker>
        ) : null}

        {declutterControls ? (
          <AllItemsDeclutterSessionControls
            selectedCount={selectedCount}
            sessions={declutterControls.sessions}
            selectedSessionId={declutterControls.selectedSessionId}
            newSessionName={declutterControls.newSessionName}
            loadingSessions={declutterControls.loadingSessions}
            adding={declutterControls.adding}
            error={declutterControls.error}
            onSelectedSessionChange={declutterControls.setSelectedSessionId}
            onNewSessionNameChange={declutterControls.setNewSessionName}
            onRefreshSessions={declutterControls.loadSessions}
            onAddToSelectedSession={declutterControls.addToSelectedSession}
            onCreateSessionAndAdd={declutterControls.createSessionAndAdd}
          />
        ) : null}
      </S.ItemSelectionControls>
    </S.BatchSelectionPanel>
  );
}
