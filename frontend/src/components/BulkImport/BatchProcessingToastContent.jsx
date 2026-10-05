import { controlStyles, inputStyles } from '../../styles/primitives';
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
  gap: ${({ $compactPresentation }) => ($compactPresentation ? '0.26rem' : '0.36rem')};
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
  font-size: 0.74rem;
  text-transform: none;
  letter-spacing: normal;
  color: rgba(180, 206, 227, 0.82);
  font-weight: 700;
`;

const SummaryText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #f0fbff;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: normal;
  font-family: inherit;
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
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: ${({ $compact }) => ($compact ? 'rgba(9, 17, 25, 0.82)' : 'var(--dw-surface)')};
  overflow: hidden;
`;

const ModeSegmentButton = styled.button`
  min-height: ${({ $compact }) => ($compact ? '36px' : '29px')};
  padding: 0 ${({ $compact }) => ($compact ? '0.52rem' : '0.6rem')};
  border: 0;
  border-right: ${({ $isLast, $compact }) => ($isLast || $compact ? '0' : '1px solid var(--dw-border)')};
  border-radius: ${({ $compact }) => ($compact ? '3px' : '0')};
  background: ${({ $active, $compact }) =>
    $compact
      ? $active ? 'rgba(76, 198, 193, 0.14)' : 'transparent'
      : $active ? 'var(--dw-surface-raised)' : 'rgba(8, 17, 24, 0.96)'};
  color: ${({ $active, $compact }) =>
    $active ? '#eef8ff' : $compact ? 'rgba(230, 237, 243, 0.74)' : 'rgba(159, 190, 206, 0.72)'};
  font-family: inherit;
  font-size: ${({ $compact }) => ($compact ? '0.76rem' : '0.67rem')};
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
  box-shadow: ${({ $active, $compact }) =>
    $compact
      ? $active ? 'inset 3px 0 0 rgba(76, 198, 193, 0.78)' : 'none'
      : $active ? 'inset 0 0 0 1px rgba(182, 225, 255, 0.35), 0 0 0 1px rgba(95, 166, 219, 0.28)' : 'none'};
  transition: color 120ms ease, background 120ms ease, opacity 120ms ease, box-shadow 120ms ease;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;
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

const CompactSelectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
`;

const CompactSelectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.32rem;
  flex-wrap: wrap;

  @media (max-width: 520px) {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
  }

  > button:last-child {
    width: 100%;
  }
`;

const TokenMatrix = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  overflow: hidden;
  background: var(--dw-surface);
`;

const TokenMatrixHeader = styled.span`
  min-width: 0;
  padding: 0.28rem 0.38rem 0.2rem;
  border-right: 1px solid var(--dw-border);
  color: rgba(180, 206, 227, 0.78);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
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
  border-top: 1px solid var(--dw-border);
  border-right: 1px solid var(--dw-border);
  background:
    linear-gradient(180deg, ${({ $gradientStart }) => $gradientStart} 0%, ${({ $gradientEnd }) => $gradientEnd} 100%);
  color: ${({ $textColor }) => $textColor};
  font-size: 0.75rem;
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

  ${controlStyles}
`;

const PickerPanel = styled.div`
  display: grid;
  gap: 0.24rem;
  width: 100%;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
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
  border-radius: var(--dw-radius-sm);
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'var(--dw-surface-raised)'};
  color: var(--dw-text);
  padding: 0.34rem 0.46rem;
  cursor: pointer;
  display: grid;
  gap: 0.14rem;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;
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
  font-size: 0.75rem;
  color: rgba(176, 205, 224, 0.84);
  white-space: nowrap;
`;

const PickerRowMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.46rem;
  font-size: 0.75rem;
  color: rgba(156, 186, 207, 0.8);
`;

const MonoMeta = styled.span`
  font-family: inherit;
  letter-spacing: normal;
`;

const PickerPager = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.32rem;
  margin-top: 0.2rem;
`;

const PagerLabel = styled.span`
  font-size: 0.75rem;
  color: rgba(160, 191, 211, 0.84);
`;

const ActionButton = styled.button`
  min-height: ${({ $compact }) => ($compact ? '38px' : '29px')};
  border-radius: var(--dw-radius-sm);
  border: ${({ $tone, $selected, $modeToggle }) => `1px solid ${$modeToggle
      ? $selected
        ? 'rgba(124, 196, 242, 0.92)'
        : 'rgba(87, 130, 158, 0.55)'
      : $selected || $tone === 'primary'
        ? 'rgba(76, 198, 193, 0.62)'
        : $tone === 'warning'
          ? 'rgba(201, 163, 97, 0.7)'
          : 'rgba(230, 237, 243, 0.16)'}`};
  background: ${({ $tone, $selected, $modeToggle, $compact }) =>
    $compact
      ? $tone === 'primary' ? 'rgba(76, 198, 193, 0.14)' : 'rgba(9, 17, 25, 0.68)'
      : $modeToggle
      ? $selected
        ? 'var(--dw-surface-raised)'
        : 'var(--dw-surface-raised)'
      : $selected || $tone === 'primary'
      ? 'var(--dw-surface-raised)'
      : $tone === 'warning'
        ? 'var(--dw-surface-raised)'
        : 'var(--dw-surface-raised)'};
  color: ${({ $selected, $modeToggle, $compact, $tone }) =>
    $compact
      ? $tone === 'primary' ? '#d9f3ef' : 'rgba(230, 237, 243, 0.82)'
      : $modeToggle
      ? $selected
        ? 'rgba(235, 247, 255, 0.98)'
        : 'rgba(186, 210, 227, 0.66)'
      : $selected
        ? '#f4fff8'
        : '#e8fff5'};
  font-family: inherit;
  font-size: ${({ $compact }) => ($compact ? '0.78rem' : '0.68rem')};
  font-weight: 650;
  text-transform: none;
  letter-spacing: normal;
  padding: 0 ${({ $compact }) => ($compact ? '0.78rem' : '0.48rem')};
  cursor: pointer;
  box-shadow: ${({ $selected, $modeToggle, $compact }) =>
    $compact
      ? 'none'
      : $modeToggle
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

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;

  color: ${({ $tone, $primary, $secondary }) => $tone === 'danger' ? 'var(--dw-coral)' : ($tone === 'primary' || $primary) ? 'var(--dw-cyan)' : $secondary ? 'var(--dw-violet)' : 'var(--dw-text)'};
`;

const InlineSelect = styled.select`
  min-width: 0;
  min-height: 29px;
  max-width: 180px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: #d9ecf6;
  padding: 0 0.48rem;
  font-size: 0.75rem;
  line-height: 1.2;
  box-shadow: none;

  &:disabled {
    opacity: 0.56;
  }

  ${inputStyles}
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

const CompactSetupRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.36rem;
`;

const AdvancedOptionsToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 32px;
  padding: 0.1rem 0;
  border: 0;
  background: transparent;
  color: rgba(230, 237, 243, 0.75);
  text-align: left;
  font: inherit;
  font-size: 0.76rem;
  cursor: pointer;

  > span:nth-child(2) {
    color: rgba(230, 237, 243, 0.52);
  }

  > span:last-child {
    margin-left: auto;
    color: rgba(127, 215, 255, 0.88);
  }

  ${controlStyles}
`;

const CompactOptions = styled.div`
  display: grid;
  gap: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid var(--dw-border);
`;

const CompactTokenRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.42rem;
`;

const FooterActionButton = styled(ActionButton)`
  @media (max-width: 820px) {
    width: ${({ $compact }) => ($compact ? 'auto' : '100%')};
    justify-content: flex-start;
  }
`;

const BATCH_PAGE_SIZE = 12;

export default function BatchProcessingToastContent({
  selectedCount = 0,
  compactPresentation = false,
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
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
    <Wrap $compactPresentation={compactPresentation}>
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
                ) : compactPresentation ? (
                  <>
                    <CompactSetupRow>
                      {Array.isArray(actionModeOptions) && actionModeOptions.length ? (
                        <ModeSegmented $compact role="group" aria-label="Image action">
                          {actionModeOptions.map((option, index) => {
                            const value = String(option?.value || '').trim();
                            const label = String(option?.label || value || '').trim();
                            if (!value || !label) return null;
                            return (
                              <ModeSegmentButton
                                key={value}
                                type="button"
                                $active={value === actionMode}
                                $compact
                                $isLast={index === actionModeOptions.length - 1}
                                disabled={Boolean(busyAction)}
                                onClick={() => onActionModeChange?.(value)}
                              >
                                {label}
                              </ModeSegmentButton>
                            );
                          })}
                        </ModeSegmented>
                      ) : <span />}
                      <FooterActionButton
                        type="button"
                        $tone="primary"
                        $compact
                        onClick={onEnterSelectionStage}
                        disabled={Boolean(busyAction)}
                      >
                        Select items
                      </FooterActionButton>
                    </CompactSetupRow>

                    {showTokenModeControls ? (
                      <>
                        <AdvancedOptionsToggle
                          type="button"
                          aria-expanded={advancedOpen}
                          aria-controls="batch-image-options"
                          onClick={() => setAdvancedOpen((current) => !current)}
                        >
                          <span>Image style</span>
                          <span>{normalizedTokenMode === 'random' ? 'Randomized' : 'Custom'}</span>
                          <span>{advancedOpen ? 'Hide' : 'Edit'}</span>
                        </AdvancedOptionsToggle>
                        {advancedOpen ? (
                          <CompactOptions id="batch-image-options">
                            <CompactTokenRow>
                              <ModeSegmented $compact role="group" aria-label="Image token mode">
                                <ModeSegmentButton
                                  type="button"
                                  $compact
                                  $active={normalizedTokenMode === 'explicit'}
                                  disabled={Boolean(busyAction)}
                                  onClick={() => onRenderTokenChange?.('mode', 'explicit')}
                                >
                                  Custom
                                </ModeSegmentButton>
                                <ModeSegmentButton
                                  type="button"
                                  $compact
                                  $active={normalizedTokenMode === 'random'}
                                  $isLast
                                  disabled={Boolean(busyAction)}
                                  onClick={() => onRenderTokenChange?.('mode', 'random')}
                                >
                                  Randomized
                                </ModeSegmentButton>
                              </ModeSegmented>
                            </CompactTokenRow>
                            {showFullTokenControls ? (
                              <TokenMatrix>
                                <TokenMatrixHeader>Background</TokenMatrixHeader>
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
                          </CompactOptions>
                        ) : null}
                      </>
                    ) : null}
                  </>
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
                {compactPresentation ? (
                  <CompactSelectionRow>
                    <FooterActionButton
                      type="button"
                      $compact
                      onClick={onReturnToSetupStage}
                      disabled={Boolean(busyAction)}
                    >
                      Back
                    </FooterActionButton>
                    {safeSourceBatchOptions.length ? (
                      <FooterActionButton
                        type="button"
                        $compact
                        onClick={() => {
                          setPickerOpen((current) => !current);
                          setPickerPage(1);
                        }}
                        disabled={Boolean(busyAction)}
                        aria-expanded={pickerOpen}
                      >
                        {pickerOpen ? 'Close batch list' : appliedBatchId ? 'Change batch' : 'Select batch'}
                      </FooterActionButton>
                    ) : null}
                  </CompactSelectionRow>
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
                  </>
                )}

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
                  {compactPresentation ? (
                    <CompactSelectionActions>
                      <FooterActionButton
                        type="button"
                        $compact
                        title={selectAllLabel}
                        aria-label={selectAllLabel}
                        onClick={onSelectAllLoaded}
                      >
                        Select all
                      </FooterActionButton>
                      <FooterActionButton
                        type="button"
                        $compact
                        title={selectNoneLabel}
                        aria-label={selectNoneLabel}
                        onClick={onSelectNoneLoaded}
                      >
                        Clear
                      </FooterActionButton>
                      <FooterActionButton
                        type="button"
                        $compact
                        $tone="primary"
                        onClick={onProcessSelected}
                        disabled={Boolean(busyAction) || !selectedCount}
                      >
                        {busyAction ? primaryBusyActionLabel : primaryActionLabel}
                      </FooterActionButton>
                    </CompactSelectionActions>
                  ) : (
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
                  )}
                </GridRow>
              </>
            )}
          </ConsoleGrid>
        </>
      ) : null}
    </Wrap>
  );
}
