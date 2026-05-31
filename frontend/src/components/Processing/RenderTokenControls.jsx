import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import tokenColorsCsv from '../../assets/token-colors.csv?raw';
import { formatTokenLabel, normalizeRenderTokens } from '../../constants/renderTokens';
import { ensureTokenColorMapLoaded, getTokenSurfaceColors } from '../../util/tokenColorMap';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';
import RenderTokenOptionPicker from './RenderTokenOptionPicker';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeSelectOptions(options = []) {
  const source = Array.isArray(options) ? options : [];
  return source
    .map((entry) => ({
      id: toTrimmed(entry?.id),
      label: toTrimmed(entry?.label),
    }))
    .filter((entry) => entry.id && entry.label);
}

const FIELD_ORDER = ['background', 'glow'];

const FIELD_LABELS = {
  background: 'Background',
  glow: 'Glow',
};

const Panel = styled.div`
  border: 1px solid rgba(91, 133, 156, 0.5);
  border-radius: 12px;
  background: rgba(10, 22, 30, 0.9);
  padding: ${({ $compact }) => ($compact ? '0.4rem' : '0.6rem')};
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.4rem' : '0.56rem')};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Label = styled.div`
  color: #95b7cb;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SummaryText = styled.span`
  min-width: 0;
  color: #d9ecf6;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-family: 'SFMono-Regular', Menlo, Consolas, Monaco, 'Liberation Mono', monospace;
`;

const ModeSection = styled.div`
  display: grid;
  gap: 0.26rem;
`;

const FieldLabel = styled.span`
  color: #c4dcea;
  font-size: 0.66rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const Segmented = styled.div`
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: fit-content;
  border: 1px solid rgba(88, 136, 162, 0.62);
  border-radius: 10px;
  background: rgba(8, 17, 24, 0.96);
  overflow: hidden;
`;

const SegmentButton = styled.button`
  min-height: ${({ $compact }) => ($compact ? '30px' : '32px')};
  padding: 0 0.72rem;
  border: 0;
  border-right: ${({ $isLast }) => ($isLast ? '0' : '1px solid rgba(88, 136, 162, 0.45)')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(34, 92, 126, 0.95) 0%, rgba(20, 60, 84, 0.95) 100%)'
      : 'rgba(8, 17, 24, 0.96)'};
  color: ${({ $active }) => ($active ? '#eaf6ff' : '#9fbece')};
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ $compact }) => ($compact ? '0.42rem' : '0.56rem')};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const TokenTile = styled.button`
  min-height: ${({ $compact }) => ($compact ? '52px' : '58px')};
  border-radius: 10px;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  background:
    linear-gradient(180deg, ${({ $gradientStart }) => $gradientStart} 0%, ${({ $gradientEnd }) => $gradientEnd} 100%);
  color: ${({ $textColor }) => $textColor};
  padding: 0.42rem 0.5rem;
  text-align: left;
  display: grid;
  align-content: space-between;
  gap: 0.22rem;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const TokenTileLabel = styled.span`
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.82;
`;

const TokenTileValue = styled.span`
  font-size: 0.76rem;
  font-weight: 760;
  line-height: 1.15;
`;

const RandomModeNote = styled.div`
  color: #95b7cb;
  font-size: 0.68rem;
  line-height: 1.3;
`;

export default function RenderTokenControls({
  renderTokens = null,
  renderTokenOptions = null,
  onRenderTokenChange = null,
  disabled = false,
  compact = false,
  title = 'Render Tokens',
  showModeControl = true,
}) {
  ensureTokenColorMapLoaded(tokenColorsCsv);

  const [pickerField, setPickerField] = useState('');
  const normalizedRenderTokenOptions = useMemo(
    () => ({
      background: normalizeSelectOptions(renderTokenOptions?.background),
      glow: normalizeSelectOptions(renderTokenOptions?.glow),
    }),
    [renderTokenOptions],
  );

  const hasSelectors = Boolean(
    normalizedRenderTokenOptions.background.length &&
    normalizedRenderTokenOptions.glow.length &&
    renderTokens &&
    typeof onRenderTokenChange === 'function',
  );

  const normalizedRenderTokens = useMemo(
    () => normalizeRenderTokens(renderTokens || {}),
    [renderTokens],
  );

  const normalizedTokenMode = normalizedRenderTokens.mode === 'random' ? 'random' : 'explicit';
  const pickerOptions = pickerField ? normalizedRenderTokenOptions[pickerField] || [] : [];
  const pickerValue = pickerField ? normalizedRenderTokens[pickerField] || '' : '';
  const summaryLabel =
    normalizedTokenMode === 'random'
      ? 'Randomized'
      : FIELD_ORDER.map((fieldKey) => formatTokenLabel(normalizedRenderTokens[fieldKey])).join(' · ');

  useEffect(() => {
    if (normalizedTokenMode !== 'explicit') {
      setPickerField('');
    }
  }, [normalizedTokenMode]);

  if (!hasSelectors) return null;

  if (pickerField) {
    return (
      <Panel $compact={compact}>
        <Label>{title}</Label>
        <RenderTokenOptionPicker
          fieldKey={pickerField}
          fieldLabel={FIELD_LABELS[pickerField] || formatTokenLabel(pickerField)}
          currentValue={pickerValue}
          options={pickerOptions}
          disabled={disabled}
          onBack={() => setPickerField('')}
          onSelect={(value) => {
            onRenderTokenChange?.(pickerField, value);
            setPickerField('');
          }}
        />
      </Panel>
    );
  }

  return (
    <Panel $compact={compact}>
      <HeaderRow>
        <Label>{title}</Label>
        <SummaryText>{summaryLabel}</SummaryText>
      </HeaderRow>

      {showModeControl ? (
        <ModeSection>
          <FieldLabel>Token Mode</FieldLabel>
          <Segmented role="group" aria-label="Token mode">
            <SegmentButton
              type="button"
              $compact={compact}
              $active={normalizedTokenMode === 'explicit'}
              onClick={() => onRenderTokenChange?.('mode', 'explicit')}
              disabled={disabled}
            >
              Custom
            </SegmentButton>
            <SegmentButton
              type="button"
              $compact={compact}
              $active={normalizedTokenMode === 'random'}
              $isLast
              onClick={() => onRenderTokenChange?.('mode', 'random')}
              disabled={disabled}
            >
              Randomized
            </SegmentButton>
          </Segmented>
        </ModeSection>
      ) : null}

      {normalizedTokenMode === 'explicit' ? (
        <TokenGrid $compact={compact}>
          {FIELD_ORDER.map((fieldKey) => {
            const surface = getTokenSurfaceColors(normalizedRenderTokens[fieldKey], fieldKey);
            return (
              <TokenTile
                key={fieldKey}
                type="button"
                $compact={compact}
                $borderColor={surface.borderColor}
                $gradientStart={surface.gradientStart}
                $gradientEnd={surface.gradientEnd}
                $textColor={surface.textColor}
                disabled={disabled}
                onClick={() => setPickerField(fieldKey)}
              >
                <TokenTileLabel>{FIELD_LABELS[fieldKey]}</TokenTileLabel>
                <TokenTileValue>{formatTokenLabel(normalizedRenderTokens[fieldKey])}</TokenTileValue>
              </TokenTile>
            );
          })}
        </TokenGrid>
      ) : (
        <RandomModeNote>
          Tokens will be chosen automatically for this render.
        </RandomModeNote>
      )}
    </Panel>
  );
}
