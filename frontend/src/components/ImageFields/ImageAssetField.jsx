import React, { useMemo } from 'react';
import styled from 'styled-components';
import ImageSourcePicker from '../ImageSourcePicker';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import {
  createImageAssetState,
  toTrimmed,
} from './imageAssetState';

const Field = styled.section`
  border: 1px solid rgba(105, 154, 176, 0.44);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(11, 22, 30, 0.9) 0%, rgba(9, 17, 24, 0.94) 100%);
  padding: ${({ $compact }) => ($compact ? '0.4rem' : '0.52rem')};
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.3rem' : '0.38rem')};
  min-width: 0;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d6e9f2;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const VariantBadge = styled.span`
  border: 1px solid rgba(103, 157, 183, 0.5);
  border-radius: 999px;
  padding: 0.08rem 0.36rem;
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  color: #a8c7da;
  background: rgba(14, 26, 36, 0.84);
  text-transform: uppercase;
  white-space: nowrap;
`;

const BodyRow = styled.div`
  display: grid;
  grid-template-columns: ${({ $compact }) => ($compact ? '66px minmax(0, 1fr)' : '74px minmax(0, 1fr)')};
  gap: ${({ $compact }) => ($compact ? '0.34rem' : '0.42rem')};
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $compact }) => ($compact ? '62px minmax(0, 1fr)' : '68px minmax(0, 1fr)')};
  }
`;

const PreviewFrame = styled.div`
  width: ${({ $compact }) => ($compact ? '66px' : '74px')};
  height: ${({ $compact }) => ($compact ? '66px' : '74px')};
  border-radius: 10px;
  border: 1px solid rgba(99, 154, 175, 0.54);
  overflow: hidden;
  background: rgba(10, 17, 23, 0.92);
  display: grid;
  place-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: ${({ $compact }) => ($compact ? '62px' : '68px')};
    height: ${({ $compact }) => ($compact ? '62px' : '68px')};
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`;

const Placeholder = styled.div`
  color: #93adbe;
  font-size: 0.6rem;
  line-height: 1.15;
  text-align: center;
  padding: 0.24rem;
  text-transform: uppercase;
`;

const ActionStack = styled.div`
  display: grid;
  gap: 0.3rem;
  min-width: 0;
  align-content: start;
  container-type: inline-size;
`;

const RenderOptionsPanel = styled.div`
  border: 1px solid rgba(91, 133, 156, 0.5);
  border-radius: 8px;
  background: rgba(10, 22, 30, 0.9);
  padding: ${({ $compact }) => ($compact ? '0.26rem' : '0.3rem')};
  display: grid;
  gap: 0.26rem;
`;

const RenderModeBadge = styled.span`
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

const RenderOptionsLabel = styled.div`
  color: #95b7cb;
  font-size: 0.59rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const RenderOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.24rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }

  @container (max-width: 420px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container (max-width: 320px) {
    grid-template-columns: 1fr;
  }
`;

const RenderOptionField = styled.label`
  display: grid;
  gap: 0.18rem;
  min-width: 0;
`;

const RenderOptionLabel = styled.span`
  color: #c4dcea;
  font-size: 0.58rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const RenderSelect = styled.select`
  min-height: ${({ $compact }) => ($compact ? '30px' : '32px')};
  border-radius: 7px;
  border: 1px solid rgba(88, 136, 162, 0.62);
  background: rgba(11, 24, 33, 0.95);
  color: #d9ecf6;
  padding: 0 0.36rem;
  font-size: 0.64rem;
  line-height: 1.2;

  &:disabled {
    opacity: 0.6;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const ActionGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
`;

const ActionButton = styled.button`
  min-height: ${({ $compact }) => ($compact ? '30px' : '32px')};
  border-radius: 8px;
  border: 1px solid
    ${({ $tone }) => {
    if ($tone === 'primary') return 'rgba(95, 179, 144, 0.64)';
    if ($tone === 'danger') return 'rgba(203, 133, 133, 0.66)';
    return 'rgba(100, 151, 179, 0.62)';
  }};
  background: ${({ $tone }) => {
    if ($tone === 'primary') return 'rgba(16, 43, 35, 0.95)';
    if ($tone === 'danger') return 'rgba(62, 27, 27, 0.94)';
    return 'rgba(13, 31, 40, 0.94)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'primary') return '#e2faef';
    if ($tone === 'danger') return '#ffdede';
    return '#d9ecf6';
  }};
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 0.46rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const StatusLine = styled.div`
  min-height: 0.88rem;
  color: ${({ $tone }) => {
    if ($tone === 'error') return '#f2c0c0';
    if ($tone === 'success') return '#9fd8bf';
    return '#95b0c2';
  }};
  font-size: 0.68rem;
  line-height: 1.3;
`;

function renderStandardAction(action, compact) {
  if (!action || typeof action !== 'object') return null;
  if (typeof action.onClick !== 'function') return null;

  return (
    <ActionButton
      key={action.id || action.label}
      type="button"
      $tone={action.tone}
      $compact={compact}
      onClick={action.onClick}
      disabled={Boolean(action.disabled)}
    >
      {action.label}
    </ActionButton>
  );
}

function renderUploadAction(action, compact) {
  if (!action || typeof action !== 'object') return null;
  if (typeof action.onUpload !== 'function') return null;

  return (
    <ImageSourcePicker
      key={action.id || action.label}
      disabled={Boolean(action.disabled)}
      onFileSelected={action.onUpload}
      label={action.label}
      source={action.source || 'default'}
      renderAction={({ label, onClick, disabled }) => (
        <ActionButton
          type="button"
          $tone={action.tone}
          $compact={compact}
          onClick={onClick}
          disabled={disabled}
        >
          {label}
        </ActionButton>
      )}
    />
  );
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

export default function ImageAssetField({
  className,
  title = 'Image',
  variantLabel = '',
  imageState = null,
  previewAlt = 'Image preview',
  placeholder = 'No image uploaded.',
  uploadAction = null,
  clearAction = null,
  chooseExistingAction = null,
  processAction = null,
  revertAction = null,
  extraActions = [],
  statusLines = [],
  hint = '',
  renderTokens = null,
  renderTokenOptions = null,
  renderTokenModeOptions = null,
  onRenderTokenChange = null,
  renderTokensDisabled = false,
  compact = false,
}) {
  const normalizedState = useMemo(
    () => createImageAssetState(imageState || {}),
    [imageState]
  );

  const hasImage = Boolean(normalizedState.activeUrl);

  const lines = statusLines
    .filter((entry) => entry && toTrimmed(entry.text))
    .map((entry) => ({
      text: toTrimmed(entry.text),
      tone: entry.tone || 'default',
      key: entry.key || `${entry.tone || 'default'}:${toTrimmed(entry.text)}`,
    }));

  const normalizedRenderTokenOptions = useMemo(() => ({
    background: normalizeSelectOptions(renderTokenOptions?.background),
    glow: normalizeSelectOptions(renderTokenOptions?.glow),
    accent: normalizeSelectOptions(renderTokenOptions?.accent),
  }), [renderTokenOptions]);

  const hasRenderTokenSelectors = Boolean(
    normalizedRenderTokenOptions.background.length &&
    normalizedRenderTokenOptions.glow.length &&
    normalizedRenderTokenOptions.accent.length &&
    renderTokens &&
    typeof onRenderTokenChange === 'function'
  );
  const normalizedTokenMode = toTrimmed(renderTokens?.mode).toLowerCase() === 'random'
    ? 'random'
    : 'explicit';
  const normalizedRenderTokenModeOptions = useMemo(
    () => normalizeModeOptions(renderTokenModeOptions),
    [renderTokenModeOptions]
  );
  const showExplicitSelectors = normalizedTokenMode !== 'random';

  return (
    <Field className={className} $compact={compact}>
      <HeaderRow>
        <Title>{title}</Title>
        {toTrimmed(variantLabel) ? (
          <VariantBadge>{toTrimmed(variantLabel)}</VariantBadge>
        ) : null}
      </HeaderRow>

      <BodyRow $compact={compact}>
        <PreviewFrame $compact={compact}>
          {hasImage ? (
            <PreviewImage src={normalizedState.activeUrl} alt={previewAlt} />
          ) : (
            <Placeholder>{placeholder}</Placeholder>
          )}
        </PreviewFrame>

        <ActionStack>
          <ActionGrid>
            {renderUploadAction(uploadAction, compact)}
            {renderStandardAction(clearAction, compact)}
            {renderStandardAction(chooseExistingAction, compact)}
            {renderStandardAction(processAction, compact)}
            {renderStandardAction(revertAction, compact)}
            {extraActions.map((action) => renderStandardAction(action, compact))}
          </ActionGrid>

          {hasRenderTokenSelectors ? (
            <RenderOptionsPanel $compact={compact}>
            <RenderOptionsLabel>Render Tokens</RenderOptionsLabel>
            {normalizedTokenMode === 'random' ? (
              <RenderModeBadge>Random mode active</RenderModeBadge>
            ) : null}
            <RenderOptionsGrid>
                <RenderOptionField>
                  <RenderOptionLabel>Mode</RenderOptionLabel>
                  <RenderSelect
                    $compact={compact}
                    value={normalizedTokenMode}
                    onChange={(event) => onRenderTokenChange('mode', event.target.value)}
                    disabled={renderTokensDisabled}
                  >
                    {normalizedRenderTokenModeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </RenderSelect>
                </RenderOptionField>

                {showExplicitSelectors ? (
                <RenderOptionField>
                  <RenderOptionLabel>Background</RenderOptionLabel>
                  <RenderSelect
                    $compact={compact}
                    value={toTrimmed(renderTokens?.background)}
                    onChange={(event) => onRenderTokenChange('background', event.target.value)}
                    disabled={renderTokensDisabled}
                  >
                    {normalizedRenderTokenOptions.background.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </RenderSelect>
                </RenderOptionField>
                ) : null}

                {showExplicitSelectors ? (
                <RenderOptionField>
                  <RenderOptionLabel>Glow</RenderOptionLabel>
                  <RenderSelect
                    $compact={compact}
                    value={toTrimmed(renderTokens?.glow)}
                    onChange={(event) => onRenderTokenChange('glow', event.target.value)}
                    disabled={renderTokensDisabled}
                  >
                    {normalizedRenderTokenOptions.glow.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </RenderSelect>
                </RenderOptionField>
                ) : null}

                {showExplicitSelectors ? (
                <RenderOptionField>
                  <RenderOptionLabel>Accent</RenderOptionLabel>
                  <RenderSelect
                    $compact={compact}
                    value={toTrimmed(renderTokens?.accent)}
                    onChange={(event) => onRenderTokenChange('accent', event.target.value)}
                    disabled={renderTokensDisabled}
                  >
                    {normalizedRenderTokenOptions.accent.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </RenderSelect>
                </RenderOptionField>
                ) : null}
              </RenderOptionsGrid>
            </RenderOptionsPanel>
          ) : null}

        </ActionStack>
      </BodyRow>

      {lines.map((line) => (
        <StatusLine key={line.key} $tone={line.tone}>
          {line.text}
        </StatusLine>
      ))}

      {toTrimmed(hint) ? <StatusLine>{toTrimmed(hint)}</StatusLine> : null}
    </Field>
  );
}
