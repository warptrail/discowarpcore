import React, { useContext, useEffect, useMemo, useState } from 'react';

import { removeBoxImage, updateBoxDetails, uploadBoxImage } from '../api/boxes';
import useShortIdAvailability from '../hooks/useShortIdAvailability';
import useLocationRegistry from '../hooks/useLocationRegistry';
import { ToastContext } from './Toast';
import { cropImageToSquare } from '../util/cropImageToSquare';

import * as S from './BoxForms/BoxEditForm.styles';
import BoxIdentityFields from './BoxForms/BoxIdentityFields';
import BoxTagsField from './BoxForms/BoxTagsField';
import BoxFormActions from './BoxForms/BoxFormActions';
import ImageSourcePicker from './ImageSourcePicker';

const pickBoxImageUrl = (box) =>
  box?.image?.display?.url ||
  box?.image?.thumb?.url ||
  box?.image?.original?.url ||
  box?.image?.url ||
  box?.imagePath ||
  '';

export default function EditBoxDetailsForm({
  boxMongoId,
  initial,
  onSaved,
  onImageUpdated,
  onDestroy,
  onCancel,
  TagInputComponent,
  compact = false,
}) {
  const initialLocationId =
    initial?.locationId?._id ??
    initial?.locationId ??
    null;

  const [shortId, setShortId] = useState(initial?.box_id ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [locationId, setLocationId] = useState(
    initialLocationId ? String(initialLocationId) : '',
  );
  const [locationError, setLocationError] = useState('');
  const [locationCreateBusy, setLocationCreateBusy] = useState(false);
  const [tags, setTags] = useState(() =>
    Array.isArray(initial?.tags) ? initial.tags : [],
  );
  const [busy, setBusy] = useState(false);
  const [destroyBusy, setDestroyBusy] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(() => pickBoxImageUrl(initial));
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageStatus, setImageStatus] = useState('');
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const initialTagsKey = JSON.stringify(initial?.tags || []);

  const {
    locations: locationOptions,
    loading: locationsLoading,
    error: locationsError,
    createLocationInline,
  } = useLocationRegistry();

  useEffect(() => {
    setShortId(initial?.box_id ?? '');
    setLabel(initial?.label ?? '');
    const nextLocationId =
      initial?.locationId?._id ??
      initial?.locationId ??
      '';
    setLocationId(nextLocationId ? String(nextLocationId) : '');
    setLocationError('');
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    setImageUrl(pickBoxImageUrl(initial));
    setImageError('');
    setImageStatus('');
  }, [
    initial?._id,
    initial?.box_id,
    initial?.label,
    initial?.locationId,
    initial?.tags,
    initial?.image,
    initial?.imagePath,
    initialTagsKey,
  ]);

  const {
    inProgress,
    unchanged,
    shortIdValid,
    shortIdAvail,
    shortIdChecking,
    isValid,
    isInvalid,
  } = useShortIdAvailability({
    shortId,
    initialShortId: initial?.box_id ?? '',
    debounceMs: 200,
  });

  const changed = useMemo(() => {
    const sameId = String(shortId || '') === String(initial?.box_id || '');
    const sameLabel = String(label || '') === String(initial?.label || '');
    const sameLocation =
      String(locationId || '') === String(initial?.locationId?._id ?? initial?.locationId ?? '');
    const sameTags =
      JSON.stringify([...tags].sort()) ===
      JSON.stringify([...(initial?.tags || [])].sort());
    return !(sameId && sameLabel && sameLocation && sameTags);
  }, [shortId, label, locationId, tags, initial]);

  const canSave =
    !busy &&
    !destroyBusy &&
    changed &&
    shortIdValid &&
    shortIdAvail &&
    (label || '').trim().length > 0;

  const handleCreateLocation = async (rawValue) => {
    const normalized = String(rawValue || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      setLocationError('Location name is required');
      throw new Error('Location name is required');
    }

    setLocationCreateBusy(true);
    setLocationError('');
    try {
      const created = await createLocationInline(normalized);
      if (!created?._id) {
        throw new Error('Failed to create location');
      }
      setLocationId(String(created._id));
      showToast?.({
        variant: 'success',
        title: 'Location ready',
        message: `Assigned location "${created.name}".`,
        timeoutMs: 2600,
      });
      return created;
    } catch (createErr) {
      const msg = createErr?.message || 'Failed to create location';
      setLocationError(msg);
      showToast?.({
        variant: 'danger',
        title: 'Location create failed',
        message: msg,
        timeoutMs: 4200,
      });
      throw createErr;
    } finally {
      setLocationCreateBusy(false);
    }
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSave) return;

    setBusy(true);
    setError(null);

    try {
      const updated = await updateBoxDetails(boxMongoId, {
        box_id: shortId,
        label: label.trim(),
        locationId: locationId || null,
        tags,
      });
      onSaved?.(updated || { _id: boxMongoId, box_id: shortId, label, tags });
    } catch (e2) {
      setError(e2.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectedImage = async (file) => {
    if (!file || !boxMongoId) return;

    setImageBusy(true);
    setImageError('');
    setImageStatus('');

    try {
      const processedFile = await cropImageToSquare(file, { maxDimension: 1200 });
      const data = await uploadBoxImage(boxMongoId, processedFile);
      const nextUrl = data?.image?.display?.url || data?.urls?.display || '';
      setImageUrl(nextUrl);
      setImageStatus('Image uploaded.');
      await Promise.resolve(onImageUpdated?.({
        image: data?.image || null,
        imagePath: data?.image?.display?.url || data?.image?.original?.url || '',
      }));
    } catch (err) {
      setImageError(err?.message || 'Image upload failed');
    } finally {
      setImageBusy(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!boxMongoId || !imageUrl) return;

    setImageBusy(true);
    setImageError('');
    setImageStatus('');

    try {
      const data = await removeBoxImage(boxMongoId);
      setImageUrl('');
      setImageStatus('Image removed.');
      await Promise.resolve(onImageUpdated?.({
        image: data?.image || null,
        imagePath: '',
      }));
    } catch (err) {
      setImageError(err?.message || 'Image removal failed');
    } finally {
      setImageBusy(false);
    }
  };

  const handleDestroy = async () => {
    if (typeof onDestroy !== 'function' || destroyBusy || busy) return;
    setError(null);
    setDestroyBusy(true);
    try {
      await Promise.resolve(onDestroy());
    } catch (destroyError) {
      setError(destroyError?.message || 'Destroy failed');
    } finally {
      setDestroyBusy(false);
    }
  };

  return (
    <S.Card onSubmit={onSubmit} noValidate $compact={compact}>
      <BoxIdentityFields
        compact={compact}
        shortId={shortId}
        setShortId={setShortId}
        shortIdChecking={shortIdChecking}
        inProgress={inProgress}
        isValid={isValid}
        isInvalid={isInvalid}
        shortIdValid={shortIdValid}
        unchanged={unchanged}
        shortIdAvail={shortIdAvail}
        label={label}
        setLabel={setLabel}
        locationId={locationId}
        setLocationId={setLocationId}
        locationOptions={locationOptions}
        locationsLoading={locationsLoading}
        onCreateLocation={handleCreateLocation}
        locationCreateBusy={locationCreateBusy}
        locationError={locationError || locationsError}
        tags={tags}
        setTags={setTags}
        TagInputComponent={TagInputComponent}
      />

      {!compact ? (
        <BoxTagsField
          compact={compact}
          tags={tags}
          setTags={setTags}
          TagInputComponent={TagInputComponent}
        />
      ) : null}

      <S.Field style={{ marginTop: compact ? 6 : 10 }} $compact={compact}>
        <S.Label $compact={compact}>Image</S.Label>
        {compact ? (
          <S.ImageCompactGrid>
            {imageUrl ? (
              <S.ImagePreview
                src={imageUrl}
                alt={`${label || 'Box'} preview`}
                $compact
              />
            ) : (
              <S.FileStub $compact>No photo</S.FileStub>
            )}
            <S.ImageActionStack>
              <S.CompactPhotoActions>
                <ImageSourcePicker
                  disabled={busy || destroyBusy || imageBusy || !boxMongoId}
                  onFileSelected={handleSelectedImage}
                  label={imageUrl ? 'Replace Photo' : 'Upload Photo'}
                  renderAction={({ label: actionLabel, onClick, disabled: actionDisabled }) => (
                    <S.CompactPhotoButton
                      type="button"
                      onClick={onClick}
                      disabled={actionDisabled}
                    >
                      {actionLabel}
                    </S.CompactPhotoButton>
                  )}
                />
                {imageUrl ? (
                  <S.CompactPhotoButton
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={busy || destroyBusy || imageBusy}
                  >
                    Delete Photo
                  </S.CompactPhotoButton>
                ) : null}
              </S.CompactPhotoActions>
              {imageBusy ? <S.Hint $compact>Working…</S.Hint> : null}
              {imageStatus ? <S.Hint $success $compact>{imageStatus}</S.Hint> : null}
              {imageError ? <S.Hint $error $compact>{imageError}</S.Hint> : null}
            </S.ImageActionStack>
          </S.ImageCompactGrid>
        ) : (
          <>
            {imageUrl ? (
              <S.ImagePreview src={imageUrl} alt={`${label || 'Box'} preview`} />
            ) : (
              <S.FileStub>No box image uploaded.</S.FileStub>
            )}

            <S.Actions style={{ marginTop: 8, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              <ImageSourcePicker
                disabled={busy || destroyBusy || imageBusy || !boxMongoId}
                onFileSelected={handleSelectedImage}
                label={imageUrl ? 'Replace Photo' : 'Upload Photo'}
                renderAction={({ label: actionLabel, onClick, disabled: actionDisabled }) => (
                  <S.Ghost
                    type="button"
                    onClick={onClick}
                    disabled={actionDisabled}
                  >
                    {actionLabel}
                  </S.Ghost>
                )}
              />

              {imageUrl ? (
                <S.Ghost
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={busy || destroyBusy || imageBusy}
                >
                  Delete Photo
                </S.Ghost>
              ) : null}
            </S.Actions>
            {imageBusy ? <S.Hint>Working…</S.Hint> : null}
            {imageStatus ? <S.Hint $success>{imageStatus}</S.Hint> : null}
            {imageError ? <S.Hint $error>{imageError}</S.Hint> : null}
          </>
        )}
      </S.Field>

      {error && (
        <S.Hint $error $compact={compact} style={{ marginTop: compact ? 6 : 8 }}>
          {error}
        </S.Hint>
      )}

      <BoxFormActions
        onCancel={onCancel}
        busy={busy}
        canSave={canSave}
        onDestroy={onDestroy ? handleDestroy : null}
        destroyBusy={destroyBusy}
        compact={compact}
      />
    </S.Card>
  );
}
