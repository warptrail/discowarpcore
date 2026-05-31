import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { formatTokenLabel, normalizeRenderTokens } from '../../constants/renderTokens';
import {
  RENDER_TOKEN_OPTIONS,
} from '../../constants/renderTokens';
import tokenColorsCsv from '../../assets/token-colors.csv?raw';
import RenderTokenOptionPicker from '../Processing/RenderTokenOptionPicker';
import {
  ensureTokenColorMapLoaded,
  getTokenSurfaceColors,
} from '../../util/tokenColorMap';

const Wrap = styled.div`
  display: grid;
  gap: 0.36rem;
`;

const ConsoleGrid = styled.div`
  display: grid;
  gap: 0.32rem;
`;

const GridRow = styled.div`
  display: grid;
  gap: 0.38rem;
  align-items: center;
  grid-template-columns: ${({ $columns = '1fr' }) => $columns};

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const InlineGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const InlineLabel = styled.span`
  flex: 0 0 auto;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(180, 206, 227, 0.82);
  font-weight: 700;
`;

const SummaryText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #f0fbff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-family: 'SFMono-Regular', Menlo, Consolas, Monaco, 'Liberation Mono', monospace;
`;

const RightGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.36rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const ControlStrip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const ModeSegmented = styled.div`
  display: inline-flex;
  flex-wrap: nowrap;
  min-width: 0;
  max-width: 100%;
  border: 1px solid rgba(88, 136, 162, 0.62);
  border-radius: 6px;
  background: rgba(8, 17, 24, 0.96);
  overflow: hidden;
`;

const ModeSegmentButton = styled.button`
  min-height: 29px;
  padding: 0 0.6rem;
  border: 0;
  border-right: ${({ $isLast }) => ($isLast ? '0' : '1px solid rgba(88, 136, 162, 0.45)')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(45, 115, 156, 0.98) 0%, rgba(24, 71, 100, 0.98) 100%)'
      : 'rgba(8, 17, 24, 0.96)'};
  color: ${({ $active }) => ($active ? '#eef8ff' : 'rgba(159, 190, 206, 0.72)')};
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? 'inset 0 0 0 1px rgba(182, 225, 255, 0.35), 0 0 0 1px rgba(95, 166, 219, 0.28)' : 'none'};
  transition: color 120ms ease, background 120ms ease, opacity 120ms ease, box-shadow 120ms ease;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const SourceBatchRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
  align-items: center;
  width: 100%;

  @media (max-width: 820px) {
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const SourceBatchSummary = styled(InlineGroup)`
  flex: 1 1 320px;

  @media (max-width: 820px) {
    width: 100%;
  }
`;

const SourceBatchActions = styled(RightGroup)`
  margin-left: auto;

  @media (max-width: 820px) {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
`;

const StageSummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;

  @media (max-width: 820px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const TokenMatrix = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border: 1px solid rgba(88, 136, 162, 0.48);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(8, 17, 24, 0.88);
`;

const TokenMatrixHeader = styled.span`
  min-width: 0;
  padding: 0.28rem 0.38rem 0.2rem;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(180, 206, 227, 0.78);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;

  &:nth-child(2) {
    border-right: 0;
  }
`;

const TokenMatrixValueButton = styled.button`
  min-width: 0;
  min-height: 38px;
  padding: 0.32rem 0.38rem 0.38rem;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background:
    linear-gradient(180deg, ${({ $gradientStart }) => $gradientStart} 0%, ${({ $gradientEnd }) => $gradientEnd} 100%);
  color: ${({ $textColor }) => $textColor};
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  cursor: pointer;

  &:nth-child(4) {
    border-right: 0;
  }

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const PickerPanel = styled.div`
  display: grid;
  gap: 0.24rem;
  width: 100%;
  border: 1px solid rgba(88, 136, 162, 0.48);
  border-radius: 6px;
  background: rgba(8, 17, 24, 0.84);
  padding: 0.3rem;
`;

const PickerList = styled.div`
  display: grid;
  gap: 0.22rem;
`;

const PickerRowButton = styled.button`
  width: 100%;
  text-align: left;
  border: 1px solid ${({ $active }) =>
    $active ? 'rgba(124, 196, 242, 0.92)' : 'rgba(87, 130, 158, 0.48)'};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(36, 79, 108, 0.92) 0%, rgba(23, 55, 79, 0.92) 100%)'
      : 'linear-gradient(180deg, rgba(17, 38, 54, 0.9) 0%, rgba(10, 25, 36, 0.9) 100%)'};
  color: #e6f4ff;
  padding: 0.34rem 0.46rem;
  cursor: pointer;
  display: grid;
  gap: 0.14rem;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const PickerRowMain = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: center;
`;

const PickerRowLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.74rem;
  font-weight: 700;
  color: #f3fbff;
`;

const PickerRowDate = styled.span`
  font-size: 0.66rem;
  color: rgba(176, 205, 224, 0.84);
  white-space: nowrap;
`;

const PickerRowMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.46rem;
  font-size: 0.64rem;
  color: rgba(156, 186, 207, 0.8);
`;

const MonoMeta = styled.span`
  font-family: 'SFMono-Regular', Menlo, Consolas, Monaco, 'Liberation Mono', monospace;
  letter-spacing: 0.01em;
`;

const PickerPager = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.32rem;
  margin-top: 0.2rem;
`;

const PagerLabel = styled.span`
  font-size: 0.64rem;
  color: rgba(160, 191, 211, 0.84);
`;

const ActionButton = styled.button`
  min-height: 29px;
  border-radius: 5px;
  border: 1px solid
    ${({ $tone, $selected, $modeToggle }) =>
      $modeToggle
        ? $selected
          ? 'rgba(124, 196, 242, 0.92)'
          : 'rgba(87, 130, 158, 0.55)'
        : $selected || $tone === 'primary'
        ? 'rgba(100, 188, 151, 0.82)'
        : $tone === 'warning'
          ? 'rgba(201, 163, 97, 0.7)'
          : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $tone, $selected, $modeToggle }) =>
    $modeToggle
      ? $selected
        ? 'linear-gradient(180deg, rgba(36, 79, 108, 0.98) 0%, rgba(23, 55, 79, 0.98) 100%)'
        : 'linear-gradient(180deg, rgba(27, 53, 72, 0.72) 0%, rgba(18, 38, 54, 0.72) 100%)'
      : $selected || $tone === 'primary'
      ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
      : $tone === 'warning'
        ? 'linear-gradient(180deg, rgba(84, 55, 14, 0.96) 0%, rgba(57, 39, 13, 0.96) 100%)'
        : 'linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%)'};
  color: ${({ $selected, $modeToggle }) =>
    $modeToggle
      ? $selected
        ? 'rgba(235, 247, 255, 0.98)'
        : 'rgba(186, 210, 227, 0.66)'
      : $selected
        ? '#f4fff8'
        : '#e8fff5'};
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 0.48rem;
  cursor: pointer;
  box-shadow: ${({ $selected, $modeToggle }) =>
    $modeToggle
      ? $selected
        ? 'inset 0 0 0 1px rgba(182, 225, 255, 0.35), 0 0 0 1px rgba(102, 166, 214, 0.42)'
        : 'none'
      : $selected
        ? 'inset 0 0 0 1px rgba(194, 255, 223, 0.35), 0 0 0 1px rgba(65, 154, 117, 0.34)'
        : 'none'};
  opacity: ${({ $selected, $modeToggle }) => ($modeToggle ? ($selected ? 1 : 0.62) : 1)};

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const InlineSelect = styled.select`
  min-width: 0;
  min-height: 29px;
  max-width: 180px;
  border-radius: 5px;
  border: 1px solid rgba(88, 136, 162, 0.62);
  background: rgba(11, 24, 33, 0.95);
  color: #d9ecf6;
  padding: 0 0.48rem;
  font-size: 0.68rem;
  line-height: 1.2;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);

  &:disabled {
    opacity: 0.56;
  }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.34rem;
  flex-wrap: wrap;

  @media (max-width: 820px) {
    align-items: stretch;
    justify-content: flex-start;
    flex-direction: column;
  }
`;

const FooterActionButton = styled(ActionButton)`
  @media (max-width: 820px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const BATCH_PAGE_SIZE = 12;

export default function BatchProcessingToastContent({
  selectedCount = 0,
  renderTokens = null,
  processingModeEnabled = false,
  consoleStage = 'setup',
  actionMode = 'process',
  onActionModeChange = null,
  actionModeOptions = [],
  sourceBatchOptions = null,
  appliedSourceBatchId = '',
  onPendingSourceBatchChange = null,
  onApplySourceBatch = null,
  sourceBatchApplyLabel = 'Select Batch',
  busyAction = '',
  failedSelectableCount = 0,
  onSelectAllLoaded,
  onSelectNoneLoaded,
  onSelectUnprocessedLoaded,
  onSelectFailedLoaded,
  onProcessSelected,
  onEnterSelectionStage = null,
  onReturnToSetupStage = null,
  onRenderTokenChange,
  selectAllLabel = 'Select All Loaded',
  selectNoneLabel = 'Select None',
  selectUnprocessedLabel = 'Select Unprocessed',
  showSelectUnprocessed = true,
  showFailedSelector = true,
  primaryActionLabel = 'Process Selected',
  primaryBusyActionLabel = 'Processing…',
}) {
  ensureTokenColorMapLoaded(tokenColorsCsv);

  const safeSourceBatchOptions = useMemo(
    () => (Array.isArray(sourceBatchOptions) ? sourceBatchOptions : []),
    [sourceBatchOptions],
  );
  const appliedBatchId = String(appliedSourceBatchId || '').trim();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPage, setPickerPage] = useState(1);
  const [tokenPickerField, setTokenPickerField] = useState('');
  const sortedBatchOptions = useMemo(
    () =>
      [...safeSourceBatchOptions].sort((left, right) => {
        const byImportedAt = (Number(right?.importedAtMs) || 0) - (Number(left?.importedAtMs) || 0);
        if (byImportedAt !== 0) return byImportedAt;
        return String(left?.label || '').localeCompare(String(right?.label || ''), undefined, {
          sensitivity: 'base',
        });
      }),
    [safeSourceBatchOptions],
  );
  const totalBatchPages = Math.max(1, Math.ceil(sortedBatchOptions.length / BATCH_PAGE_SIZE));
  const currentBatchPage = Math.min(Math.max(1, pickerPage), totalBatchPages);
  const visibleBatchRows = sortedBatchOptions.slice(
    (currentBatchPage - 1) * BATCH_PAGE_SIZE,
    currentBatchPage * BATCH_PAGE_SIZE,
  );

  useEffect(() => {
    setPickerPage((current) => Math.min(Math.max(1, current), totalBatchPages));
  }, [totalBatchPages]);

  const normalizedRenderTokens = normalizeRenderTokens(renderTokens);
  const normalizedTokenMode = normalizedRenderTokens.mode === 'random' ? 'random' : 'explicit';
  const showTokenModeControls = actionMode === 'process' || actionMode === 'reprocess';
  const showFullTokenControls = showTokenModeControls && normalizedTokenMode === 'explicit';
  const inSelectionStage = consoleStage === 'select';
  const tokenPickerOptions = tokenPickerField ? RENDER_TOKEN_OPTIONS[tokenPickerField] || [] : [];
  const tokenPickerValue = tokenPickerField ? normalizedRenderTokens[tokenPickerField] || '' : '';
  const tokenPickerLabel =
    tokenPickerField === 'background'
      ? 'Background'
      : tokenPickerField === 'glow'
        ? 'Glow'
        : '';
  const backgroundSurface = getTokenSurfaceColors(normalizedRenderTokens.background, 'background');
  const glowSurface = getTokenSurfaceColors(normalizedRenderTokens.glow, 'glow');

  useEffect(() => {
    if (!showFullTokenControls) {
      setTokenPickerField('');
    }
  }, [showFullTokenControls]);

  return (
    <Wrap>
      {processingModeEnabled ? (
        <>
          <ConsoleGrid>
            {!inSelectionStage ? (
              <>
                {tokenPickerField ? (
                  <GridRow $columns="minmax(0, 1fr)">
                    <RenderTokenOptionPicker
                      fieldKey={tokenPickerField}
                      fieldLabel={tokenPickerLabel}
                      currentValue={tokenPickerValue}
                      options={tokenPickerOptions}
                      disabled={Boolean(busyAction)}
                      onBack={() => setTokenPickerField('')}
                      onSelect={(value) => {
                        onRenderTokenChange?.(tokenPickerField, value);
                        setTokenPickerField('');
                      }}
                    />
                  </GridRow>
                ) : (
                  <>
                <GridRow $columns="minmax(0, 1fr)">
                  {Array.isArray(actionModeOptions) && actionModeOptions.length ? (
                    <InlineGroup>
                      <InlineLabel>Action:</InlineLabel>
                      <ModeSegmented>
                        {actionModeOptions.map((option, index) => {
                          const value = String(option?.value || '').trim();
                          const label = String(option?.label || value || '').trim();
                          if (!value || !label) return null;
                          const selected = value === actionMode;
                          return (
                            <ModeSegmentButton
                              key={value}
                              type="button"
                              $active={selected}
                              $isLast={index === actionModeOptions.length - 1}
                              disabled={Boolean(busyAction)}
                              onClick={() => onActionModeChange?.(value)}
                            >
                              {label}
                            </ModeSegmentButton>
                          );
                        })}
                      </ModeSegmented>
                    </InlineGroup>
                  ) : <span />}
                </GridRow>

                {showTokenModeControls ? (
                  <GridRow $columns="minmax(0, 1fr)">
                    <ControlStrip>
                      <InlineLabel>Token:</InlineLabel>
                      <ModeSegmented role="group" aria-label="Token mode">
                        <ModeSegmentButton
                          type="button"
                          $active={normalizedTokenMode === 'explicit'}
                          disabled={Boolean(busyAction)}
                          onClick={() => onRenderTokenChange?.('mode', 'explicit')}
                        >
                          Custom
                        </ModeSegmentButton>
                        <ModeSegmentButton
                          type="button"
                          $active={normalizedTokenMode === 'random'}
                          $isLast
                          disabled={Boolean(busyAction)}
                          onClick={() => onRenderTokenChange?.('mode', 'random')}
                        >
                          Randomized
                        </ModeSegmentButton>
                      </ModeSegmented>

                      {showFullTokenControls ? (
                        <TokenMatrix>
                          <TokenMatrixHeader>BG</TokenMatrixHeader>
                          <TokenMatrixHeader>Glow</TokenMatrixHeader>
                          <TokenMatrixValueButton
                            type="button"
                            $gradientStart={backgroundSurface.gradientStart}
                            $gradientEnd={backgroundSurface.gradientEnd}
                            $textColor={backgroundSurface.textColor}
                            disabled={Boolean(busyAction)}
                            onClick={() => setTokenPickerField('background')}
                          >
                            {formatTokenLabel(normalizedRenderTokens.background)}
                          </TokenMatrixValueButton>
                          <TokenMatrixValueButton
                            type="button"
                            $gradientStart={glowSurface.gradientStart}
                            $gradientEnd={glowSurface.gradientEnd}
                            $textColor={glowSurface.textColor}
                            disabled={Boolean(busyAction)}
                            onClick={() => setTokenPickerField('glow')}
                          >
                            {formatTokenLabel(normalizedRenderTokens.glow)}
                          </TokenMatrixValueButton>
                        </TokenMatrix>
                      ) : null}
                    </ControlStrip>
                  </GridRow>
                ) : null}

                <GridRow $columns="minmax(0, 1fr)">
                  <ActionRow>
                    <FooterActionButton
                      type="button"
                      $tone="primary"
                      onClick={onEnterSelectionStage}
                      disabled={Boolean(busyAction)}
                    >
                      Select Items
                    </FooterActionButton>
                  </ActionRow>
                </GridRow>
                  </>
                )}
              </>
            ) : (
              <>
                <GridRow $columns="minmax(0, 1fr)">
                  <StageSummaryRow>
                    <FooterActionButton
                      type="button"
                      onClick={onReturnToSetupStage}
                      disabled={Boolean(busyAction)}
                    >
                      Back
                    </FooterActionButton>
                  </StageSummaryRow>
                </GridRow>

                <GridRow $columns="minmax(0, 1fr)">
                  <SourceBatchRow>
                    <SourceBatchSummary title={`${selectedCount} selected`}>
                      <SummaryText>{`${selectedCount} selected`}</SummaryText>
                    </SourceBatchSummary>
                    {safeSourceBatchOptions.length ? (
                      <SourceBatchActions>
                        <ActionButton
                          type="button"
                          onClick={() => {
                            setPickerOpen((current) => !current);
                            setPickerPage(1);
                          }}
                          disabled={Boolean(busyAction)}
                        >
                          {pickerOpen ? 'Close' : appliedBatchId ? 'Change Batch' : sourceBatchApplyLabel}
                        </ActionButton>
                      </SourceBatchActions>
                    ) : null}
                  </SourceBatchRow>
                </GridRow>

                {pickerOpen && safeSourceBatchOptions.length ? (
                  <GridRow $columns="minmax(0, 1fr)">
                    <SourceBatchRow>
                      <PickerPanel>
                        <PickerList>
                          {visibleBatchRows.map((option) => {
                            const value = String(option?.value || '').trim();
                            if (!value) return null;
                            const label = String(option?.label || value).trim() || value;
                            const importedAtLabel = String(option?.importedAtLabel || '—').trim() || '—';
                            const totalCount = Number(option?.totalCount) || 0;
                            const eligibleCount = Number(option?.eligibleCount) || 0;
                            const archiveSuffix =
                              String(option?.archiveStatus || '').trim().toLowerCase() === 'archived'
                                ? 'archived'
                                : 'active';
                            const batchIdentifier = String(option?.batchIdentifier || value).trim() || value;
                            const isApplied = appliedBatchId === value;

                            return (
                              <PickerRowButton
                                key={value}
                                type="button"
                                $active={isApplied}
                                disabled={Boolean(busyAction)}
                                onClick={() => {
                                  onPendingSourceBatchChange?.(value);
                                  onApplySourceBatch?.(value);
                                  setPickerOpen(false);
                                }}
                              >
                                <PickerRowMain>
                                  <PickerRowLabel>{label}</PickerRowLabel>
                                  <PickerRowDate>{importedAtLabel}</PickerRowDate>
                                </PickerRowMain>
                                <PickerRowMeta>
                                  <span>{`${eligibleCount}/${totalCount} eligible`}</span>
                                  <span>{archiveSuffix}</span>
                                  <MonoMeta>{batchIdentifier}</MonoMeta>
                                </PickerRowMeta>
                              </PickerRowButton>
                            );
                          })}
                        </PickerList>
                        <PickerPager>
                          <ActionButton
                            type="button"
                            onClick={() => setPickerPage((current) => Math.max(1, current - 1))}
                            disabled={currentBatchPage <= 1 || Boolean(busyAction)}
                          >
                            Prev
                          </ActionButton>
                          <PagerLabel>{`Page ${currentBatchPage} / ${totalBatchPages}`}</PagerLabel>
                          <ActionButton
                            type="button"
                            onClick={() => setPickerPage((current) => Math.min(totalBatchPages, current + 1))}
                            disabled={currentBatchPage >= totalBatchPages || Boolean(busyAction)}
                          >
                            Next
                          </ActionButton>
                        </PickerPager>
                      </PickerPanel>
                    </SourceBatchRow>
                  </GridRow>
                ) : null}

                <GridRow $columns="minmax(0, 1fr)">
                  <ActionRow>
                    <FooterActionButton type="button" onClick={onSelectAllLoaded}>
                      {selectAllLabel}
                    </FooterActionButton>
                    <FooterActionButton type="button" onClick={onSelectNoneLoaded}>
                      {selectNoneLabel}
                    </FooterActionButton>
                    {showSelectUnprocessed ? (
                      <FooterActionButton type="button" onClick={onSelectUnprocessedLoaded}>
                        {selectUnprocessedLabel}
                      </FooterActionButton>
                    ) : null}
                    {showFailedSelector ? (
                      <FooterActionButton
                        type="button"
                        onClick={onSelectFailedLoaded}
                        disabled={!failedSelectableCount}
                      >
                        Select Failed
                      </FooterActionButton>
                    ) : null}
                    <FooterActionButton
                      type="button"
                      $tone="primary"
                      onClick={onProcessSelected}
                      disabled={Boolean(busyAction) || !selectedCount}
                    >
                      {busyAction ? primaryBusyActionLabel : primaryActionLabel}
                    </FooterActionButton>
                  </ActionRow>
                </GridRow>
              </>
            )}
          </ConsoleGrid>
        </>
      ) : null}
    </Wrap>
  );
}
