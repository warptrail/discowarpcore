import { useRef } from 'react';
import ImageSourcePicker from '../ImageSourcePicker';
import RenderTokenControls from '../Processing/RenderTokenControls';
import { RENDER_TOKEN_OPTIONS } from '../../constants/renderTokens';
import {
  PhotoControlPanel,
  PhotoCopy,
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
  const choosePhotoRef = useRef(null);
  const renderSourceAction = ({ label, onClick, disabled: actionDisabled, title }) => (
    <QuietButton type="button" ref={label === 'Choose photo' ? choosePhotoRef : undefined}
      onClick={onClick} disabled={actionDisabled} title={title}>
      {label}
    </QuietButton>
  );

  return (
    <PhotoControlPanel>
      <PhotoStage $hasPreview={Boolean(previewUrl)}>
        {previewUrl ? <PhotoPreview src={previewUrl} alt="New item preview" /> : null}
        <PhotoCopy>
          <SourceActions role="group" aria-label="Item photo sources">
            <ImageSourcePicker
              disabled={disabled}
              label="Take photo"
              capture="environment"
              source="camera"
              onFileSelected={onFileSelected}
              renderAction={renderSourceAction}
            />
            <ImageSourcePicker
              disabled={disabled}
              label="Choose photo"
              source="library"
              onFileSelected={onFileSelected}
              renderAction={renderSourceAction}
            />
          </SourceActions>
          {photoFile ? (
            <QuietButton type="button" onClick={() => {
              onRemove?.();
              choosePhotoRef.current?.focus();
            }} disabled={disabled}>
              Remove photo
            </QuietButton>
          ) : null}
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
