import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import tokenColorsCsv from '../../assets/token-colors.csv?raw';
import { formatTokenLabel, normalizeRenderTokens } from '../../constants/renderTokens';
import { ensureTokenColorMapLoaded, getTokenSurfaceColors } from '../../util/tokenColorMap';
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

const Panel = styled.section`
  min-width: 0;
  padding-top: ${({ $compact }) => ($compact ? '0.42rem' : '0.52rem')};
  border-top: 1px solid rgba(97, 151, 158, 0.28);
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.34rem' : '0.42rem')};
`;

const ProfileToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: ${({ $compact }) => ($compact ? '36px' : '40px')};
  gap: 0.42rem;
  width: 100%;
  padding: 0.1rem 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:hover {
    color: #effffc;
  }

  &:focus-visible {
    outline: 2px solid rgba(173, 142, 255, 0.92);
    outline-offset: 2px;
  }
`;

const ProfileLead = styled.span`
  display: flex;
  align-items: baseline;
  gap: 0.44rem;
  min-width: 0;
`;

const Label = styled.div`
  color: #91bbba;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SummaryText = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #bdd5d4;
  font-size: 0.61rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-family: 'SFMono-Regular', Menlo, Consolas, Monaco, 'Liberation Mono', monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ToggleAffordance = styled.span`
  flex: 0 0 auto;
  color: #7bcac0;
  font-family: 'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace,
    Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.86rem;
  line-height: 1;
`;

const ProfileContent = styled.div`
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.36rem' : '0.46rem')};
  padding: ${({ $compact }) => ($compact ? '0.05rem 0 0.12rem' : '0.1rem 0 0.16rem')};
`;

const ModeSection = styled.div`
  display: grid;
  gap: 0.2rem;
`;

const FieldLabel = styled.span`
  color: #8faead;
  font-size: 0.58rem;
  font-weight: 760;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const Segmented = styled.div`
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: fit-content;
  border: 1px solid rgba(97, 151, 158, 0.46);
  border-radius: 5px;
  background: rgba(5, 11, 16, 0.8);
  overflow: hidden;
`;

const SegmentButton = styled.button`
  min-height: ${({ $compact }) => ($compact ? '34px' : '36px')};
  padding: 0 0.58rem;
  border: 0;
  border-right: ${({ $isLast }) => ($isLast ? '0' : '1px solid rgba(88, 136, 162, 0.45)')};
  background: ${({ $active }) =>
    $active
      ? 'rgba(38, 102, 96, 0.5)'
      : 'transparent'};
  color: ${({ $active }) => ($active ? '#effffc' : '#9fbdbc')};
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgba(173, 142, 255, 0.92);
    outline-offset: -2px;
  }
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ $compact }) => ($compact ? '0.3rem' : '0.36rem')};
`;

const TokenTile = styled.button`
  min-height: ${({ $compact }) => ($compact ? '42px' : '46px')};
  border-radius: 5px;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  background:
    linear-gradient(180deg, ${({ $gradientStart }) => $gradientStart} 0%, ${({ $gradientEnd }) => $gradientEnd} 100%);
  color: ${({ $textColor }) => $textColor};
  padding: 0.34rem 0.42rem;
  text-align: left;
  display: grid;
  align-content: space-between;
  gap: 0.22rem;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgba(173, 142, 255, 0.92);
    outline-offset: 2px;
  }
`;

const TokenTileLabel = styled.span`
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.82;
`;

const TokenTileValue = styled.span`
  font-size: 0.68rem;
  font-weight: 760;
  line-height: 1.15;
`;

const RandomModeNote = styled.div`
  color: #91b2b1;
  font-size: 0.64rem;
  line-height: 1.3;
`;

export default function RenderTokenControls({
  renderTokens = null,
  renderTokenOptions = null,
  onRenderTokenChange = null,
  disabled = false,
  compact = false,
  title = 'Render profile',
  showModeControl = true,
}) {
  ensureTokenColorMapLoaded(tokenColorsCsv);

  const [pickerField, setPickerField] = useState('');
  const [expanded, setExpanded] = useState(false);
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

  useEffect(() => {
    if (pickerField) setExpanded(true);
  }, [pickerField]);

  if (!hasSelectors) return null;

  return (
    <Panel $compact={compact}>
      <ProfileToggle
        type="button"
        $compact={compact}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Customize'} ${title}`}
        onClick={() => {
          setExpanded((value) => !value);
          if (expanded) setPickerField('');
        }}
      >
        <ProfileLead>
          <Label>{title}</Label>
          <SummaryText>{summaryLabel}</SummaryText>
        </ProfileLead>
        <ToggleAffordance aria-hidden="true">{expanded ? '−' : '+'}</ToggleAffordance>
      </ProfileToggle>

      {expanded ? (
        <ProfileContent $compact={compact}>
          {pickerField ? (
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
          ) : (
            <>
              {showModeControl ? (
                <ModeSection>
                  <FieldLabel>Token mode</FieldLabel>
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
            </>
          )}
        </ProfileContent>
      ) : null}
    </Panel>
  );
}
