import styled, { keyframes } from 'styled-components';
import { formatRenderTokenSummary } from '../../constants/renderTokens';
import RenderTokenControls from '../Processing/RenderTokenControls';
import {
  RENDER_TOKEN_MODE_OPTIONS,
  RENDER_TOKEN_OPTIONS,
} from '../../constants/renderTokens';

const Wrap = styled.div`
  display: grid;
  gap: 0.42rem;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const Line = styled.div`
  font-size: 0.78rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.92);
`;

const StatusLine = styled(Line)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Strong = styled.span`
  color: #ffffff;
  font-weight: 700;
`;

const Spinner = styled.span`
  width: 0.82rem;
  height: 0.82rem;
  border-radius: 999px;
  border: 2px solid rgba(122, 183, 226, 0.28);
  border-top-color: rgba(122, 183, 226, 0.95);
  animation: ${spin} 0.8s linear infinite;
  flex: 0 0 auto;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
`;

const ActionButton = styled.button`
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'primary'
        ? 'rgba(100, 188, 151, 0.82)'
        : $tone === 'warning'
          ? 'rgba(201, 163, 97, 0.7)'
          : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $tone }) =>
    $tone === 'primary'
      ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
      : $tone === 'warning'
        ? 'linear-gradient(180deg, rgba(84, 55, 14, 0.96) 0%, rgba(57, 39, 13, 0.96) 100%)'
        : 'linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%)'};
  color: #e8fff5;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 0.72rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

export default function BatchProcessingToastContent({
  batchName = '',
  contextLabel = '',
  selectedCount = 0,
  queuedCount = 0,
  runningCount = 0,
  completedCount = 0,
  failedCount = 0,
  renderTokens = null,
  pageLabel = '',
  processingModeEnabled = false,
  busyAction = '',
  failedSelectableCount = 0,
  onToggleProcessingMode,
  onSelectAllLoaded,
  onSelectNoneLoaded,
  onSelectUnprocessedLoaded,
  onSelectFailedLoaded,
  onProcessSelected,
  onRenderTokenChange,
  selectionScopeMessage = '',
  processingModeOffMessage = '',
  selectAllLabel = 'Select All Loaded',
  selectNoneLabel = 'Select None',
  selectUnprocessedLabel = 'Select Unprocessed',
  showSelectUnprocessed = true,
  showFailedSelector = true,
}) {
  const resolvedContextLabel = contextLabel || batchName || 'Batch processing';
  const resolvedScopeMessage =
    selectionScopeMessage ||
    'Selection and processing controls apply only to the currently loaded ledger page.';
  const resolvedOffMessage =
    processingModeOffMessage || 'Processing mode is off. This view is in archival review mode.';
  const inFlightCount = queuedCount + runningCount;
  const isLoading = busyAction === 'process-selected' || inFlightCount > 0;
  const activityLabel =
    busyAction === 'process-selected'
      ? 'Queueing selected items for processing...'
      : runningCount > 0
        ? `${runningCount} item${runningCount === 1 ? '' : 's'} actively processing.`
        : queuedCount > 0
          ? `${queuedCount} item${queuedCount === 1 ? '' : 's'} queued and waiting to start.`
          : 'No active processing jobs.';

  return (
    <Wrap>
      <Line>
        <Strong>{resolvedContextLabel}</Strong>
        {pageLabel ? ` · ${pageLabel}` : ''}
      </Line>
      <Line>
        Selected {selectedCount} · queued {queuedCount} · processing {runningCount} · completed {completedCount} · failed {failedCount}
      </Line>
      <StatusLine>
        {isLoading ? <Spinner aria-hidden="true" /> : null}
        <span>{activityLabel}</span>
      </StatusLine>
      <Line>{formatRenderTokenSummary(renderTokens)}</Line>
      <ButtonRow>
        <ActionButton type="button" onClick={onToggleProcessingMode} $tone={processingModeEnabled ? 'warning' : 'default'}>
          {processingModeEnabled ? 'Disable Processing Mode' : 'Enable Processing Mode'}
        </ActionButton>
      </ButtonRow>
      {processingModeEnabled ? (
        <>
          <Line>{resolvedScopeMessage}</Line>
          <RenderTokenControls
            renderTokens={renderTokens}
            renderTokenOptions={RENDER_TOKEN_OPTIONS}
            renderTokenModeOptions={RENDER_TOKEN_MODE_OPTIONS}
            onRenderTokenChange={onRenderTokenChange}
            disabled={busyAction === 'process-selected'}
          />
          <ButtonRow>
            <ActionButton type="button" onClick={onSelectAllLoaded}>{selectAllLabel}</ActionButton>
            <ActionButton type="button" onClick={onSelectNoneLoaded}>{selectNoneLabel}</ActionButton>
            {showSelectUnprocessed ? (
              <ActionButton type="button" onClick={onSelectUnprocessedLoaded}>
                {selectUnprocessedLabel}
              </ActionButton>
            ) : null}
            {showFailedSelector ? (
              <ActionButton
                type="button"
                onClick={onSelectFailedLoaded}
                disabled={!failedSelectableCount}
              >
                Select Failed
              </ActionButton>
            ) : null}
            <ActionButton
              type="button"
              $tone="primary"
              onClick={onProcessSelected}
              disabled={busyAction === 'process-selected' || !selectedCount}
            >
              {busyAction === 'process-selected' ? 'Processing…' : 'Process Selected'}
            </ActionButton>
          </ButtonRow>
        </>
      ) : (
        <Line>{resolvedOffMessage}</Line>
      )}
    </Wrap>
  );
}
