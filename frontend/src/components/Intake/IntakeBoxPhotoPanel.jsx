import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import IntakePhotoSourceButtons from './IntakePhotoSourceButtons';
import ImageSourcePicker from '../ImageSourcePicker';
import {
  pickImageUrl,
  removeExistingBoxImage,
  uploadCroppedBoxImage,
} from './intakeImageHelpers';

const Panel = styled.section`
  border: ${({ $compact }) => ($compact ? '1px dashed rgba(112, 168, 180, 0.48)' : '1px solid rgba(112, 168, 180, 0.5)')};
  border-radius: 10px;
  background: ${({ $compact }) => ($compact ? 'rgba(10, 18, 21, 0.82)' : 'linear-gradient(180deg, rgba(11, 21, 28, 0.94) 0%, rgba(10, 17, 23, 0.96) 100%)')};
  padding: ${({ $compact }) => ($compact ? '0.5rem' : '0.7rem')};
  display: grid;
  gap: 0.48rem;
`;

const Heading = styled.h4`
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #d7e9f0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Hint = styled.p`
  margin: 0;
  color: #a9c3ce;
  font-size: 0.76rem;
  line-height: 1.35;
`;

const ImageWrap = styled.div`
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(108, 154, 170, 0.5);
  max-width: 220px;
  background: rgba(11, 19, 25, 0.92);
`;

const Image = styled.img`
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
`;

const ImageStub = styled.div`
  border: 1px dashed rgba(103, 146, 160, 0.46);
  border-radius: 8px;
  padding: 0.45rem 0.5rem;
  color: #95aeb7;
  font-size: 0.75rem;
`;

const DeleteButton = styled.button`
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(206, 128, 128, 0.62);
  background: rgba(74, 30, 30, 0.92);
  color: #ffdcdc;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 0.62rem;
  cursor: pointer;
  width: fit-content;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const SinglePickerButton = styled.button`
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(103, 170, 189, 0.66);
  background: rgba(15, 35, 45, 0.94);
  color: #deeff7;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 0.62rem;
  cursor: pointer;
  width: fit-content;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const StateText = styled.div`
  min-height: 1.05rem;
  color: ${({ $error }) => ($error ? '#f2bcbc' : '#a8c5d2')};
  font-size: 0.75rem;
`;

const MissingBox = styled.div`
  border: 1px dashed rgba(123, 162, 177, 0.48);
  border-radius: 8px;
  padding: 0.5rem;
  color: #a2b9c5;
  font-size: 0.76rem;
`;

export default function IntakeBoxPhotoPanel({
  currentBox,
  onBoxPhotoUpdated,
  compact = false,
  showHeading = true,
  showPreview = true,
  singlePicker = false,
  showDelete = true,
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const imageUrl = pickImageUrl(currentBox);
  const hasImage = useMemo(() => !!imageUrl, [imageUrl]);

  const handleFileSelected = async (file, meta = {}) => {
    if (!file || !currentBox?._id) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const data = await uploadCroppedBoxImage(currentBox._id, file);
      const nextImage = data?.image || null;
      const nextPath = nextImage?.display?.url || nextImage?.original?.url || '';
      const sourceSuffix = meta?.source ? ` via ${meta.source}` : '';
      const message = hasImage
        ? `Box #${currentBox.box_id} photo replaced${sourceSuffix}.`
        : `Box #${currentBox.box_id} photo added${sourceSuffix}.`;

      setStatus(message);
      onBoxPhotoUpdated?.({
        boxId: currentBox._id,
        image: nextImage,
        imagePath: nextPath,
        message,
      });
    } catch (uploadError) {
      setError(uploadError?.message || 'Box photo upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentBox?._id || !hasImage) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const data = await removeExistingBoxImage(currentBox._id);
      const message = `Box #${currentBox.box_id} photo removed.`;

      setStatus(message);
      onBoxPhotoUpdated?.({
        boxId: currentBox._id,
        image: data?.image || null,
        imagePath: '',
        message,
      });
    } catch (removeError) {
      setError(removeError?.message || 'Failed to remove box photo.');
    } finally {
      setBusy(false);
    }
  };

  if (!currentBox?._id) {
    return <MissingBox>Select a box first to manage its photo.</MissingBox>;
  }

  return (
    <Panel $compact={compact}>
      {showHeading ? (
        <>
          <Heading>{hasImage ? 'Replace Box Photo' : 'Add Box Photo'}</Heading>
          <Hint>
            This upload applies only to current box #{currentBox.box_id}.
          </Hint>
        </>
      ) : null}

      {showPreview ? (
        hasImage ? (
          <ImageWrap>
            <Image src={imageUrl} alt={`${currentBox?.label || 'Box'} photo`} />
          </ImageWrap>
        ) : (
          <ImageStub>No box photo uploaded yet.</ImageStub>
        )
      ) : null}

      {singlePicker ? (
        <ImageSourcePicker
          disabled={busy}
          label={hasImage ? 'Replace Photo' : 'Add Box Photo'}
          onFileSelected={handleFileSelected}
          renderAction={({ label, onClick, disabled: actionDisabled }) => (
            <SinglePickerButton
              type="button"
              onClick={onClick}
              disabled={actionDisabled}
            >
              {label}
            </SinglePickerButton>
          )}
        />
      ) : (
        <IntakePhotoSourceButtons
          disabled={busy}
          compact={compact}
          onFileSelected={handleFileSelected}
        />
      )}

      {showDelete && hasImage ? (
        <DeleteButton type="button" onClick={handleRemovePhoto} disabled={busy}>
          Delete Photo
        </DeleteButton>
      ) : null}

      <StateText $error={!!error}>{error || status || ' '}</StateText>
    </Panel>
  );
}
