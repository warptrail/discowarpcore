import React from 'react';
import ImageSourcePicker from '../ImageSourcePicker';
import RenderTokenControls from '../Processing/RenderTokenControls';
import { RENDER_TOKEN_OPTIONS } from '../../constants/renderTokens';
import {
  PhotoControlPanel,
  PhotoButton,
  PhotoButtonLabel,
  PhotoCopy,
  PhotoGlyph,
  PhotoPreview,
  PhotoStage,
  QuietButton,
  SourceActions,
  GlowAddon,
} from './NewItemComposer.styles';

export default function NewItemPhotoControl({
  disabled = false,
  photoFile,
  previewUrl,
  onFileSelected,
  onRemove,
  glowEnabled = false,
  onGlowEnabledChange,
  renderTokens,
  onRenderTokenChange,
}) {
  const renderSourceAction = ({ label, onClick, disabled: actionDisabled }) => (
    <QuietButton type="button" onClick={onClick} disabled={actionDisabled}>
      {label}
    </QuietButton>
  );

  return (
    <PhotoControlPanel>
      <PhotoStage>
      {previewUrl ? (
        <PhotoPreview src={previewUrl} alt="New item preview" />
      ) : (
        <ImageSourcePicker
          disabled={disabled}
          label="Add photo"
          onFileSelected={onFileSelected}
          renderAction={({ onClick, disabled: actionDisabled }) => (
            <PhotoButton type="button" onClick={onClick} disabled={actionDisabled}>
              <PhotoGlyph aria-hidden="true">⌑</PhotoGlyph>
              <PhotoButtonLabel>Add photo</PhotoButtonLabel>
            </PhotoButton>
          )}
        />
      )}

      <PhotoCopy>
        <SourceActions>
          <ImageSourcePicker
            disabled={disabled}
            label={photoFile ? 'Change photo' : 'Take photo'}
            capture="environment"
            source="camera"
            onFileSelected={onFileSelected}
            renderAction={renderSourceAction}
          />
          <ImageSourcePicker
            disabled={disabled}
            label={photoFile ? 'Choose another' : 'Choose photo'}
            source="library"
            onFileSelected={onFileSelected}
            renderAction={renderSourceAction}
          />
          {photoFile ? (
            <QuietButton type="button" onClick={onRemove} disabled={disabled}>
              Remove
            </QuietButton>
          ) : null}
        </SourceActions>
      </PhotoCopy>
      </PhotoStage>
      {photoFile ? (
        <GlowAddon>
          <label>
            <input type="checkbox" checked={glowEnabled} onChange={(event) => onGlowEnabledChange?.(event.target.checked)} disabled={disabled} />
            <span>Process with Object Glow after adding</span>
          </label>
          {glowEnabled ? (
            <RenderTokenControls
              title="Glow profile"
              compact
              renderTokens={renderTokens}
              renderTokenOptions={RENDER_TOKEN_OPTIONS}
              onRenderTokenChange={onRenderTokenChange}
              disabled={disabled}
            />
          ) : null}
        </GlowAddon>
      ) : null}
    </PhotoControlPanel>
  );
}
