import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
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
    grid-template-columns: ${({ $compact, $mobileHeaderPreview }) =>
      $mobileHeaderPreview ? '1fr' : ($compact ? '62px minmax(0, 1fr)' : '68px minmax(0, 1fr)')};
  }
`;

const previewFrameStyles = `
  width: ${({ $compact }) => ($compact ? '66px' : '74px')};
  height: ${({ $compact }) => ($compact ? '66px' : '74px')};
  border-radius: 10px;
  border: 1px solid rgba(99, 154, 175, 0.54);
  overflow: hidden;
  background: rgba(10, 17, 23, 0.92);
  display: grid;
  place-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: ${({ $compact, $mobileHeaderPreview }) => $mobileHeaderPreview ? '100%' : ($compact ? '62px' : '68px')};
    height: ${({ $compact, $mobileHeaderPreview }) => $mobileHeaderPreview ? '132px' : ($compact ? '62px' : '68px')};
    border-radius: ${({ $mobileHeaderPreview }) => ($mobileHeaderPreview ? '12px' : '10px')};
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
  object-fit: ${({ $mobileHeaderPreview }) => ($mobileHeaderPreview ? 'cover' : 'contain')};
  object-position: center;
  background: rgba(5, 10, 16, 0.96);
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
            <Placeholder>{placeholder}</Placeholder>
          </PreviewFrame>
        )}

        <ActionStack>
          <ActionGrid>
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

      {lines.map((line) => (
        <StatusLine key={line.key} $tone={line.tone}>
          {line.text}
        </StatusLine>
      ))}

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
