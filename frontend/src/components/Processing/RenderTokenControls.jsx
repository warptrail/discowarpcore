import { useMemo } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';

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

function normalizeModeOptions(options = []) {
  const source = Array.isArray(options) ? options : [];
  const normalized = source
    .map((entry) => ({
      id: toTrimmed(entry?.id).toLowerCase(),
      label: toTrimmed(entry?.label),
    }))
    .filter((entry) => (entry.id === 'explicit' || entry.id === 'random') && entry.label);
  if (!normalized.length) {
    return [
      { id: 'explicit', label: 'Explicit Tokens' },
      { id: 'random', label: 'Random Tokens' },
    ];
  }
  return normalized;
}

const Panel = styled.div`
  border: 1px solid rgba(91, 133, 156, 0.5);
  border-radius: 12px;
  background: rgba(10, 22, 30, 0.9);
  padding: ${({ $compact }) => ($compact ? '0.4rem' : '0.6rem')};
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.4rem' : '0.56rem')};
`;

const Label = styled.div`
  color: #95b7cb;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const ModeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 18px;
  padding: 0.08rem 0.34rem;
  border-radius: 999px;
  border: 1px solid rgba(118, 214, 179, 0.62);
  background: rgba(20, 58, 45, 0.92);
  color: #c8f6e5;
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Field = styled.label`
  display: grid;
  gap: 0.24rem;
  min-width: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: ${({ $compact }) => ($compact ? '0.42rem' : '0.56rem')};

  ${Field}:nth-child(1) {
    grid-column: span 3;
  }

  ${Field}:nth-child(2) {
    grid-column: span 3;
  }

  ${Field}:nth-child(3) {
    grid-column: span 3;
  }

  ${Field}:nth-child(4) {
    grid-column: span 3;
  }

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    ${Field}:nth-child(1),
    ${Field}:nth-child(2),
    ${Field}:nth-child(3),
    ${Field}:nth-child(4) {
      grid-column: auto;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;

    ${Field}:nth-child(1),
    ${Field}:nth-child(2),
    ${Field}:nth-child(3),
    ${Field}:nth-child(4) {
      grid-column: auto;
    }
  }
`;

const FieldLabel = styled.span`
  color: #c4dcea;
  font-size: 0.66rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const Select = styled.select`
  min-height: ${({ $compact }) => ($compact ? '36px' : '40px')};
  border-radius: 10px;
  border: 1px solid rgba(88, 136, 162, 0.62);
  background: rgba(11, 24, 33, 0.95);
  color: #d9ecf6;
  padding: 0 0.78rem;
  font-size: 0.72rem;
  line-height: 1.2;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);

  &:disabled {
    opacity: 0.6;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export default function RenderTokenControls({
  renderTokens = null,
  renderTokenOptions = null,
  renderTokenModeOptions = null,
  onRenderTokenChange = null,
  disabled = false,
  compact = false,
  title = 'Render Tokens',
  randomBadgeText = 'Random mode active',
}) {
  const normalizedRenderTokenOptions = useMemo(() => ({
    background: normalizeSelectOptions(renderTokenOptions?.background),
    glow: normalizeSelectOptions(renderTokenOptions?.glow),
    accent: normalizeSelectOptions(renderTokenOptions?.accent),
  }), [renderTokenOptions]);

  const normalizedRenderTokenModeOptions = useMemo(
    () => normalizeModeOptions(renderTokenModeOptions),
    [renderTokenModeOptions]
  );

  const hasSelectors = Boolean(
    normalizedRenderTokenOptions.background.length &&
    normalizedRenderTokenOptions.glow.length &&
    normalizedRenderTokenOptions.accent.length &&
    renderTokens &&
    typeof onRenderTokenChange === 'function'
  );

  if (!hasSelectors) return null;

  const normalizedTokenMode = toTrimmed(renderTokens?.mode).toLowerCase() === 'random'
    ? 'random'
    : 'explicit';
  const showExplicitSelectors = normalizedTokenMode !== 'random';

  return (
    <Panel $compact={compact}>
      <Label>{title}</Label>
      {normalizedTokenMode === 'random' ? (
        <ModeBadge>{randomBadgeText}</ModeBadge>
      ) : null}
      <Grid $compact={compact}>
        <Field>
          <FieldLabel>Mode</FieldLabel>
          <Select
            $compact={compact}
            value={normalizedTokenMode}
            onChange={(event) => onRenderTokenChange('mode', event.target.value)}
            disabled={disabled}
          >
            {normalizedRenderTokenModeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {showExplicitSelectors ? (
          <Field>
            <FieldLabel>Background</FieldLabel>
            <Select
              $compact={compact}
              value={toTrimmed(renderTokens?.background)}
              onChange={(event) => onRenderTokenChange('background', event.target.value)}
              disabled={disabled}
            >
              {normalizedRenderTokenOptions.background.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {showExplicitSelectors ? (
          <Field>
            <FieldLabel>Glow</FieldLabel>
            <Select
              $compact={compact}
              value={toTrimmed(renderTokens?.glow)}
              onChange={(event) => onRenderTokenChange('glow', event.target.value)}
              disabled={disabled}
            >
              {normalizedRenderTokenOptions.glow.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {showExplicitSelectors ? (
          <Field>
            <FieldLabel>Accent</FieldLabel>
            <Select
              $compact={compact}
              value={toTrimmed(renderTokens?.accent)}
              onChange={(event) => onRenderTokenChange('accent', event.target.value)}
              disabled={disabled}
            >
              {normalizedRenderTokenOptions.accent.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
      </Grid>
    </Panel>
  );
}
