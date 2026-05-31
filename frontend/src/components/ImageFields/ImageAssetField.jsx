import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { keyframes } from 'styled-components';
import ImageSourcePicker from '../ImageSourcePicker';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';
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
import RenderTokenControls from '../Processing/RenderTokenControls';

const Field = styled.section`
  border: 1px solid rgba(105, 154, 176, 0.44);
  border-radius: 14px;
  background:
    radial-gradient(circle at 18% 18%, rgba(74, 185, 207, 0.1), transparent 38%),
    linear-gradient(180deg, rgba(11, 22, 30, 0.92) 0%, rgba(9, 17, 24, 0.96) 100%);
  padding: ${({ $compact }) => ($compact ? '0.48rem' : '0.72rem')};
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.4rem' : '0.62rem')};
  min-width: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
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
  grid-template-columns: ${({ $compact }) =>
    ($compact ? 'minmax(112px, 150px) minmax(0, 1fr)' : 'minmax(220px, 0.34fr) minmax(0, 1fr)')};
  gap: ${({ $compact }) => ($compact ? '0.5rem' : '0.8rem')};
  align-items: stretch;
  min-width: 0;

  @media (max-width: 860px) {
    grid-template-columns: ${({ $compact, $mobileHeaderPreview }) =>
      $mobileHeaderPreview ? '1fr' : ($compact ? 'minmax(96px, 128px) minmax(0, 1fr)' : 'minmax(180px, 0.38fr) minmax(0, 1fr)')};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const previewFrameStyles = `
  width: 100%;
  min-height: ${({ $compact }) => ($compact ? '136px' : '232px')};
  height: 100%;
  max-height: ${({ $compact }) => ($compact ? '172px' : '320px')};
  aspect-ratio: ${({ $compact }) => ($compact ? '1 / 1' : '4 / 3')};
  border-radius: 14px;
  border: 1px solid rgba(99, 154, 175, 0.54);
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(56, 104, 126, 0.22), transparent 48%),
    rgba(7, 13, 19, 0.96);
  display: grid;
  place-items: center;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.035),
    0 12px 22px rgba(0, 0, 0, 0.2);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${({ $compact, $mobileHeaderPreview }) =>
      ($mobileHeaderPreview ? '180px' : ($compact ? '132px' : '168px'))};
    max-height: ${({ $mobileHeaderPreview }) => ($mobileHeaderPreview ? '240px' : '220px')};
    border-radius: 12px;
  }
`;

const PreviewFrame = styled.div`
  ${previewFrameStyles}
`;

const PreviewButton = styled.button`
  ${previewFrameStyles}
  appearance: none;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 0;
  margin: 0;
  cursor: zoom-in;
  line-height: 0;
  transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;

  &:hover {
    border-color: rgba(120, 196, 226, 0.8);
    box-shadow: 0 0 0 1px rgba(120, 196, 226, 0.16);
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(120, 196, 226, 0.92);
    box-shadow: 0 0 0 2px rgba(120, 196, 226, 0.22);
  }

  &:active {
    transform: scale(0.985);
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  background: rgba(5, 10, 16, 0.96);
`;

const Placeholder = styled.div`
  color: #93adbe;
  font-size: ${({ $compact }) => ($compact ? '0.62rem' : '0.7rem')};
  line-height: 1.25;
  text-align: center;
  padding: ${({ $compact }) => ($compact ? '0.4rem' : '0.72rem')};
  text-transform: uppercase;
`;

const ActionStack = styled.div`
  display: grid;
  gap: ${({ $compact }) => ($compact ? '0.42rem' : '0.62rem')};
  min-width: 0;
  align-content: start;
  container-type: inline-size;
`;

const ActionGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ $compact }) => ($compact ? '0.32rem' : '0.42rem')};
  align-items: center;
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
  border-radius: 999px;
  border: 2px solid rgba(151, 189, 210, 0.25);
  border-top-color: rgba(224, 244, 255, 0.96);
  animation: ${spin} 0.8s linear infinite;
  flex: 0 0 auto;
`;

const ActivityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 0.08rem 0.34rem;
  border-radius: 999px;
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
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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

      <BodyRow $compact={compact} $mobileHeaderPreview={mobileHeaderPreview}>
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
          <PreviewFrame $compact={compact} $mobileHeaderPreview={mobileHeaderPreview}>
            <Placeholder $compact={compact}>{placeholder}</Placeholder>
          </PreviewFrame>
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
