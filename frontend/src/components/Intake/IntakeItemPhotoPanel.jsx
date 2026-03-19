import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import IntakeQuickAddPanel from './IntakeQuickAddPanel';
import IntakePhotoSourceButtons from './IntakePhotoSourceButtons';
import {
  pickImageUrl,
  removeExistingItemImage,
  uploadCroppedItemImage,
} from './intakeImageHelpers';

const Panel = styled.section`
  border: 1px solid rgba(99, 151, 123, 0.44);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(14, 25, 20, 0.94) 0%, rgba(10, 18, 14, 0.96) 100%);
  padding: 0.72rem;
  display: grid;
  gap: 0.56rem;
`;

const Heading = styled.h4`
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #dbefdf;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Hint = styled.p`
  margin: 0;
  color: #b6cfbc;
  font-size: 0.77rem;
  line-height: 1.35;
`;

const ModeRow = styled.div`
  display: flex;
  gap: 0.46rem;
  flex-wrap: wrap;
`;

const ModeButton = styled.button`
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(156, 226, 171, 0.86)' : 'rgba(112, 163, 124, 0.55)')};
  background: ${({ $active }) => ($active ? 'rgba(22, 64, 38, 0.95)' : 'rgba(13, 34, 20, 0.9)')};
  color: ${({ $active }) => ($active ? '#e8ffe8' : '#c3d9c8')};
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 0.62rem;
  cursor: pointer;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Field = styled.div`
  display: grid;
  gap: 0.32rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #b9d6c2;
`;

const Select = styled.select`
  width: 100%;
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid rgba(112, 169, 134, 0.55);
  background: rgba(10, 20, 14, 0.9);
  color: #e9f7ed;
  font-size: 0.98rem;
  padding: 0 0.7rem;

  &:focus {
    outline: none;
    border-color: rgba(145, 218, 169, 0.9);
    box-shadow: 0 0 0 2px rgba(94, 181, 128, 0.2);
  }
`;

const Preview = styled.div`
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(109, 166, 133, 0.46);
  max-width: 220px;
  background: rgba(12, 22, 15, 0.9);
`;

const PreviewImage = styled.img`
  width: 100%;
  display: block;
  aspect-ratio: 1 / 1;
  object-fit: cover;
`;

const PreviewStub = styled.div`
  border: 1px dashed rgba(111, 153, 123, 0.48);
  border-radius: 8px;
  padding: 0.45rem 0.5rem;
  color: #a7c4b0;
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
    opacity: 0.54;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const StateText = styled.div`
  min-height: 1.05rem;
  color: ${({ $error }) => ($error ? '#f2bcbc' : '#b2d0bb')};
  font-size: 0.75rem;
`;

const MissingState = styled.div`
  border: 1px dashed rgba(117, 160, 129, 0.5);
  border-radius: 8px;
  padding: 0.5rem;
  color: #b7cfbe;
  font-size: 0.76rem;
`;

export default function IntakeItemPhotoPanel({
  currentBox,
  recentItems = [],
  onItemPhotoUpdated,
}) {
  const [mode, setMode] = useState('new');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'recent') return;
    if (recentItems.length === 0) {
      setSelectedItemId('');
      return;
    }

    const exists = recentItems.some((item) => String(item?._id) === String(selectedItemId));
    if (!exists) {
      setSelectedItemId(String(recentItems[0]?._id || ''));
    }
  }, [mode, recentItems, selectedItemId]);

  const selectedItem = useMemo(
    () => recentItems.find((item) => String(item?._id) === String(selectedItemId)) || null,
    [recentItems, selectedItemId],
  );

  const basePreviewUrl = pickImageUrl(selectedItem);

  useEffect(() => {
    if (mode !== 'recent') return;
    setPreviewUrl(basePreviewUrl || '');
  }, [mode, basePreviewUrl, selectedItemId]);

  const hasImage = !!previewUrl;

  const handleRecentItemPhoto = async (file, meta = {}) => {
    if (!file || !selectedItem?._id) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const data = await uploadCroppedItemImage(selectedItem._id, file);
      const nextImage = data?.image || null;
      const nextPath = nextImage?.display?.url || nextImage?.original?.url || '';
      const nextUrl = nextImage?.display?.url || data?.urls?.display || nextPath;
      const sourceSuffix = meta?.source ? ` via ${meta.source}` : '';
      const message = hasImage
        ? `Photo replaced for ${selectedItem?.name || 'item'}${sourceSuffix}.`
        : `Photo added to ${selectedItem?.name || 'item'}${sourceSuffix}.`;

      if (nextUrl) setPreviewUrl(nextUrl);
      setStatus(message);
      onItemPhotoUpdated?.({
        itemId: selectedItem._id,
        image: nextImage,
        imagePath: nextPath,
        message,
      });
    } catch (uploadError) {
      setError(uploadError?.message || 'Item photo upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!selectedItem?._id || !hasImage) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      await removeExistingItemImage(selectedItem._id);
      const message = `Photo removed from ${selectedItem?.name || 'item'}.`;
      setPreviewUrl('');
      setStatus(message);
      onItemPhotoUpdated?.({
        itemId: selectedItem._id,
        image: null,
        imagePath: '',
        message,
      });
    } catch (removeError) {
      setError(removeError?.message || 'Failed to remove item photo.');
    } finally {
      setBusy(false);
    }
  };

  if (!currentBox?._id) {
    return <MissingState>Select a current box first to manage item photos.</MissingState>;
  }

  return (
    <Panel>
      <Heading>Add Item Photo</Heading>
      <Hint>
        Attach a photo either while creating a new item or to an existing recent
        item in box #{currentBox.box_id}.
      </Hint>

      <ModeRow>
        <ModeButton
          type="button"
          $active={mode === 'new'}
          onClick={() => setMode('new')}
        >
          New Item + Photo
        </ModeButton>
        <ModeButton
          type="button"
          $active={mode === 'recent'}
          onClick={() => setMode('recent')}
        >
          Recent Item Photo
        </ModeButton>
      </ModeRow>

      {mode === 'new' ? (
        <IntakeQuickAddPanel
          mode="photo"
          currentBox={currentBox}
          onItemCreated={onItemPhotoUpdated}
        />
      ) : null}

      {mode === 'recent' ? (
        recentItems.length === 0 ? (
          <MissingState>
            No recent items in this box yet. Use “New Item + Photo” to create one.
          </MissingState>
        ) : (
          <>
            <Field>
              <Label htmlFor="intake-item-photo-target">Target item</Label>
              <Select
                id="intake-item-photo-target"
                value={selectedItemId}
                onChange={(event) => setSelectedItemId(event.target.value)}
                disabled={busy}
              >
                {recentItems.map((item) => (
                  <option key={item?._id} value={item?._id}>
                    {item?.name || 'Unnamed item'} · qty {item?.quantity ?? 1}
                  </option>
                ))}
              </Select>
            </Field>

            {hasImage ? (
              <Preview>
                <PreviewImage src={previewUrl} alt={`${selectedItem?.name || 'Item'} preview`} />
              </Preview>
            ) : (
              <PreviewStub>Selected item has no photo yet.</PreviewStub>
            )}

            <IntakePhotoSourceButtons
              disabled={busy || !selectedItem?._id}
              onFileSelected={handleRecentItemPhoto}
            />

            {hasImage ? (
              <DeleteButton type="button" onClick={handleRemovePhoto} disabled={busy}>
                Remove Item Photo
              </DeleteButton>
            ) : null}

            <StateText $error={!!error}>{error || status || ' '}</StateText>
          </>
        )
      ) : null}
    </Panel>
  );
}
