import React from 'react';
import ImageSourcePicker from '../ImageSourcePicker';
import {
  PhotoButton,
  PhotoButtonLabel,
  PhotoCopy,
  PhotoGlyph,
  PhotoPreview,
  PhotoStage,
  QuietButton,
  SourceActions,
} from './NewItemComposer.styles';

export default function NewItemPhotoControl({
  disabled = false,
  photoFile,
  previewUrl,
  onFileSelected,
  onRemove,
}) {
  const renderSourceAction = ({ label, onClick, disabled: actionDisabled }) => (
    <QuietButton type="button" onClick={onClick} disabled={actionDisabled}>
      {label}
    </QuietButton>
  );

  return (
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
  );
}
