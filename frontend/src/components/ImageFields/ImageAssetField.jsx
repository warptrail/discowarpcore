import { controlStyles } from '../../styles/primitives';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { keyframes } from 'styled-components';
import ImageSourcePicker from '../ImageSourcePicker';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import {
  createImageAssetState,
  toTrimmed,
} from './imageAssetState';
import RenderTokenControls from '../Processing/RenderTokenControls';

const Field = styled.section`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: ${({ $compact }) => ($compact ? '0.5rem' : '0.64rem')};
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.42rem' : '0.52rem')};
  min-width: 0;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.42rem;
  min-width: 0;
`;

const Title = styled.h4`
  margin: 0;
  color: var(--dw-teal);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const VariantBadge = styled.span`
  color: var(--dw-text-muted);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;
  white-space: nowrap;
`;

const BodyRow = styled.div`
  display: grid;
  grid-template-columns: ${({ $hasImage, $compact }) =>
    ($hasImage
      ? ($compact ? 'minmax(94px, 126px) minmax(0, 1fr)' : 'minmax(128px, 180px) minmax(0, 1fr)')
      : '1fr')};
  gap: ${({ $compact }) => ($compact ? '0.46rem' : '0.6rem')};
  align-items: stretch;
  min-width: 0;

  @media (max-width: 860px) {
    grid-template-columns: ${({ $hasImage, $compact, $mobileHeaderPreview }) => {
    if (!$hasImage || $mobileHeaderPreview) return '1fr';
    return $compact ? 'minmax(94px, 120px) minmax(0, 1fr)' : 'minmax(116px, 154px) minmax(0, 1fr)';
  }};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $hasImage, $compact, $mobileHeaderPreview }) => {
    if (!$hasImage || $mobileHeaderPreview) return '1fr';
    return $compact ? 'minmax(92px, 112px) minmax(0, 1fr)' : 'minmax(112px, 142px) minmax(0, 1fr)';
  }};
  }
`;

const previewSurfaceStyles = `
  width: 100%;
  min-height: ${({ $compact }) => ($compact ? '96px' : '128px')};
  height: 100%;
  max-height: ${({ $compact }) => ($compact ? '138px' : '188px')};
  aspect-ratio: ${({ $compact }) => ($compact ? '1 / 1' : '4 / 3')};
  border-radius: 6px;
  border: 1px solid rgba(230, 237, 243, 0.14);
  overflow: hidden;
  background: var(--dw-background);
  display: grid;
  place-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${({ $compact, $mobileHeaderPreview }) =>
      ($mobileHeaderPreview ? '144px' : ($compact ? '92px' : '112px'))};
    max-height: ${({ $mobileHeaderPreview }) => ($mobileHeaderPreview ? '190px' : '148px')};
  }
`;

const PreviewButton = styled.button`
  ${previewSurfaceStyles}
  appearance: none;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 0;
  margin: 0;
  cursor: zoom-in;
  line-height: 0;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;

  &:hover {
    border-color: rgba(120, 196, 226, 0.8);
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(120, 196, 226, 0.92);
    box-shadow: none;
  }

  &:active {
    transform: scale(0.99);
  }

  ${controlStyles}
`;

const EmptyImageRail = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  gap: 0.5rem;
  padding: 0.42rem 0.5rem;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
`;

const EmptyImageLabel = styled.span`
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  font-weight: 720;
`;

const EmptyImageHint = styled.span`
  color: var(--dw-text-muted);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-align: right;
  text-transform: none;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  background: var(--dw-surface-raised);
`;

const ActionStack = styled.div`
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.42rem' : '0.5rem')};
  min-width: 0;
  align-content: start;
  container-type: inline-size;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 7.25rem), 1fr));
  gap: ${({ $compact }) => ($compact ? '0.3rem' : '0.36rem')};
  align-items: stretch;
`;

const ActionButton = styled.button`
  min-height: 44px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $tone }) => {
    if ($tone === 'primary') return 'rgba(76, 198, 193, 0.42)';
    if ($tone === 'danger') return 'rgba(240, 138, 123, 0.42)';
    return 'rgba(230, 237, 243, 0.16)';
  }};
  background: ${({ $tone }) => {
    if ($tone === 'primary') return 'rgba(76, 198, 193, 0.12)';
    if ($tone === 'danger') return 'rgba(240, 138, 123, 0.12)';
    return 'var(--dw-surface-raised)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'primary') return 'var(--dw-teal)';
    if ($tone === 'danger') return 'var(--dw-coral)';
    return 'var(--dw-text-secondary)';
  }};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;
  padding: 0.28rem 0.48rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgba(173, 142, 255, 0.92);
    outline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    font-size: ${MOBILE_FONT_SM};
  }

  ${controlStyles}

  color: ${({ $tone, $primary, $secondary }) => $tone === 'danger' ? 'var(--dw-coral)' : ($tone === 'primary' || $primary) ? 'var(--dw-cyan)' : $secondary ? 'var(--dw-violet)' : 'var(--dw-text)'};
`;

const StatusLine = styled.div`
  min-height: 0.88rem;
  color: ${({ $tone }) => {
    if ($tone === 'error') return '#f2c0c0';
    if ($tone === 'success') return '#9fd8bf';
    return '#95b0c2';
  }};
  font-size: 0.75rem;
  line-height: 1.3;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const ActivityLine = styled(StatusLine)`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  flex-wrap: wrap;
`;

const ActivitySpinner = styled.span`
  width: 0.82rem;
  height: 0.82rem;
  border-radius: var(--dw-radius-sm);
  border: 2px solid var(--dw-border);
  border-top-color: rgba(224, 244, 255, 0.96);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  flex: 0 0 auto;
`;

const ActivityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 0.08rem 0.34rem;
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $tone }) => {
    if ($tone === 'error') return 'rgba(221, 146, 146, 0.58)';
    if ($tone === 'success') return 'rgba(118, 214, 179, 0.62)';
    return 'rgba(103, 157, 183, 0.52)';
  }};
  background: ${({ $tone }) => {
    if ($tone === 'error') return 'rgba(71, 28, 28, 0.88)';
    if ($tone === 'success') return 'rgba(20, 58, 45, 0.92)';
    return 'rgba(14, 26, 36, 0.84)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'error') return '#ffdede';
    if ($tone === 'success') return '#c8f6e5';
    return '#c5dfed';
  }};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;
`;

const ActivityText = styled.span`
  min-width: 0;
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
          $tone={action.tone || 'primary'}
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
  mobileHeaderPreview = false,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const normalizedState = useMemo(
    () => createImageAssetState(imageState || {}),
    [imageState]
  );

  const hasImage = Boolean(normalizedState.activeUrl);
  const lightboxUrl = toTrimmed(normalizedState.activeUrl || normalizedState.originalUrl);

  const lines = statusLines
    .filter((entry) => entry && toTrimmed(entry.text))
    .map((entry) => ({
      text: toTrimmed(entry.text),
      tone: entry.tone || 'default',
      key: entry.key || `${entry.tone || 'default'}:${toTrimmed(entry.text)}`,
    }));

  return (
    <Field className={className} $compact={compact}>
      <HeaderRow>
        <Title>{title}</Title>
        {toTrimmed(variantLabel) ? (
          <VariantBadge>{toTrimmed(variantLabel)}</VariantBadge>
        ) : null}
      </HeaderRow>

      <BodyRow
        $compact={compact}
        $hasImage={hasImage}
        $mobileHeaderPreview={mobileHeaderPreview}
      >
        {hasImage ? (
          <PreviewButton
            type="button"
            $compact={compact}
            $mobileHeaderPreview={mobileHeaderPreview}
            onClick={() => setLightboxOpen(true)}
            aria-label={`Open full-size ${previewAlt.toLowerCase()}`}
          >
            <PreviewImage
              src={normalizedState.activeUrl}
              alt={previewAlt}
              $mobileHeaderPreview={mobileHeaderPreview}
            />
          </PreviewButton>
        ) : (
          <EmptyImageRail $compact={compact}>
            <EmptyImageLabel>{placeholder}</EmptyImageLabel>
            <EmptyImageHint>Source ready</EmptyImageHint>
          </EmptyImageRail>
        )}

        <ActionStack $compact={compact}>
          <ActionGrid $compact={compact}>
            {renderUploadAction(uploadAction, compact)}
            {renderStandardAction(clearAction, compact)}
            {renderStandardAction(chooseExistingAction, compact)}
            {renderStandardAction(processAction, compact)}
            {renderStandardAction(revertAction, compact)}
            {extraActions.map((action) => renderStandardAction(action, compact))}
          </ActionGrid>

          <RenderTokenControls
            renderTokens={renderTokens}
            renderTokenOptions={renderTokenOptions}
            renderTokenModeOptions={renderTokenModeOptions}
            onRenderTokenChange={onRenderTokenChange}
            disabled={renderTokensDisabled}
            compact={compact}
          />

        </ActionStack>
      </BodyRow>

      {lines.map((line) => {
        if (line.loading || line.badge) {
          return (
            <ActivityLine key={line.key} $tone={line.tone}>
              {line.loading ? <ActivitySpinner aria-hidden="true" /> : null}
              {line.badge ? <ActivityBadge $tone={line.tone}>{line.badge}</ActivityBadge> : null}
              <ActivityText>{line.text}</ActivityText>
            </ActivityLine>
          );
        }

        return (
          <StatusLine key={line.key} $tone={line.tone}>
            {line.text}
          </StatusLine>
        );
      })}

      {toTrimmed(hint) ? <StatusLine>{toTrimmed(hint)}</StatusLine> : null}

      <RetrievalImageLightbox
        isOpen={lightboxOpen && Boolean(lightboxUrl)}
        imageSrc={lightboxUrl}
        itemName={previewAlt}
        onClose={() => setLightboxOpen(false)}
      />
    </Field>
  );
}
