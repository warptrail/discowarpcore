import React, { useContext, useEffect, useMemo, useState } from 'react';

import { updateBoxDetails } from '../api/boxes';
import useShortIdAvailability from '../hooks/useShortIdAvailability';
import useLocationRegistry from '../hooks/useLocationRegistry';
import useBoxGroupRegistry from '../hooks/useBoxGroupRegistry';
import { ToastContext } from './Toast';

import * as S from './BoxForms/BoxEditForm.styles';
import BoxIdentityFields from './BoxForms/BoxIdentityFields';
import BoxTagsField from './BoxForms/BoxTagsField';
import BoxFormActions from './BoxForms/BoxFormActions';
import BoxImageField from './ImageFields/BoxImageField';

export default function EditBoxDetailsForm({
  boxMongoId,
  initial,
  onSaved,
  onImageUpdated,
  onProcessImage,
  processImageStatus = 'idle',
  processImageBusy = false,
  processImageError = '',
  processImageProgressLabel = '',
  processImageJobId = '',
  processImageMediaId = '',
  persistedRenderTokens = null,
  processedPreviewUrl = '',
  imageRefreshToken = 0,
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
  const [group, setGroup] = useState(initial?.group ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
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
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const initialTagsKey = JSON.stringify(initial?.tags || []);

  const {
    locations: locationOptions,
    loading: locationsLoading,
    error: locationsError,
    createLocationInline,
  } = useLocationRegistry();
  const {
    groups: groupOptions,
    loading: groupsLoading,
    error: groupsError,
  } = useBoxGroupRegistry();

  useEffect(() => {
    setShortId(initial?.box_id ?? '');
    setLabel(initial?.label ?? '');
    setGroup(initial?.group ?? '');
    setNotes(initial?.notes ?? '');
    const nextLocationId =
      initial?.locationId?._id ??
      initial?.locationId ??
      '';
    setLocationId(nextLocationId ? String(nextLocationId) : '');
    setLocationError('');
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
  }, [
    initial?._id,
    initial?.box_id,
    initial?.label,
    initial?.group,
    initial?.notes,
    initial?.locationId,
    initial?.tags,
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
    const sameGroup =
      String(group || '').trim() === String(initial?.group || '').trim();
    const sameNotes =
      String(notes || '').trim() === String(initial?.notes || '').trim();
    const sameLocation =
      String(locationId || '') === String(initial?.locationId?._id ?? initial?.locationId ?? '');
    const sameTags =
      JSON.stringify([...tags].sort()) ===
      JSON.stringify([...(initial?.tags || [])].sort());
    return !(sameId && sameLabel && sameGroup && sameNotes && sameLocation && sameTags);
  }, [shortId, label, group, notes, locationId, tags, initial]);

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
        group: group.trim() || null,
        notes: notes.trim() || null,
        locationId: locationId || null,
        tags,
      });
      onSaved?.(updated || {
        _id: boxMongoId,
        box_id: shortId,
        label,
        group,
        notes,
        tags,
      });
    } catch (e2) {
      setError(e2.message || 'Update failed');
    } finally {
      setBusy(false);
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

  const identityFieldProps = {
    shortId,
    setShortId,
    shortIdChecking,
    inProgress,
    isValid,
    isInvalid,
    shortIdValid,
    unchanged,
    shortIdAvail,
    label,
    setLabel,
    group,
    setGroup,
    locationId,
    setLocationId,
    locationOptions,
    locationsLoading,
    onCreateLocation: handleCreateLocation,
    locationCreateBusy,
    locationError: locationError || locationsError,
    groupOptions,
    groupsLoading,
    groupError: groupsError,
    tags,
    setTags,
    TagInputComponent,
  };

  return (
    <S.Card onSubmit={onSubmit} noValidate $compact={compact}>
      {!compact ? (
        <>
          <S.ConsoleHeader>
            <S.ConsoleKicker>Box Action Panel</S.ConsoleKicker>
            <S.ConsoleTitle>Edit Console</S.ConsoleTitle>
            <S.ConsoleHint>
              Update identity, organization metadata, tags, and photo in one place.
            </S.ConsoleHint>
          </S.ConsoleHeader>

          <S.ConsoleGrid>
            <S.ConsoleMain>
              <S.SectionCard $tone="teal">
                <S.SectionHeader>
                  <S.SectionLabel>Section 1</S.SectionLabel>
                  <S.SectionTitle>Box Identity</S.SectionTitle>
                  <S.SectionHint>Code + label</S.SectionHint>
                </S.SectionHeader>
                <S.SectionBody>
                  <BoxIdentityFields
                    compact={compact}
                    showOrganization={false}
                    {...identityFieldProps}
                  />
                </S.SectionBody>
              </S.SectionCard>

              <S.SectionCard $tone="lilac">
                <S.SectionHeader>
                  <S.SectionLabel>Section 2</S.SectionLabel>
                  <S.SectionTitle>Organization</S.SectionTitle>
                  <S.SectionHint>Location, group, tags</S.SectionHint>
                </S.SectionHeader>
                <S.SectionBody>
                  <BoxIdentityFields
                    compact={compact}
                    showIdentity={false}
                    {...identityFieldProps}
                  />
                  <S.Field $compact={compact}>
                    <S.Label htmlFor="box-notes" $compact={compact}>Notes</S.Label>
                    <S.Textarea
                      id="box-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add contextual notes for this box..."
                      $compact={compact}
                    />
                  </S.Field>
                  <BoxTagsField
                    compact={compact}
                    inline
                    tags={tags}
                    setTags={setTags}
                    TagInputComponent={TagInputComponent}
                  />
                </S.SectionBody>
              </S.SectionCard>
            </S.ConsoleMain>

            <S.ConsoleSide>
              <S.SectionCard $tone="amber">
                <S.SectionHeader>
                  <S.SectionLabel>Section 3</S.SectionLabel>
                  <S.SectionTitle>Photo</S.SectionTitle>
                  <S.SectionHint>Preview + media actions</S.SectionHint>
                </S.SectionHeader>
                <S.SectionBody>
                  <BoxImageField
                    box={initial}
                    boxId={boxMongoId}
                    disabled={busy || destroyBusy}
                    mobileHeaderPreview
                    title="Box Image"
                    showVariantLabel={false}
                    placeholder="No box image uploaded."
                    messageSubject="Image"
                    clearLabel="Delete Photo"
                    onBoxImageUpdated={({ image, imagePath }) => {
                      void Promise.resolve(
                        onImageUpdated?.({
                          image: image || null,
                          imagePath: imagePath || '',
                        })
                      );
                    }}
                    onProcessImage={onProcessImage}
                    processImageStatus={processImageStatus}
                    processImageBusy={processImageBusy}
                    processImageError={processImageError}
                    processImageProgressLabel={processImageProgressLabel}
                    processImageJobId={processImageJobId}
                    processImageMediaId={processImageMediaId}
                    persistedRenderTokens={persistedRenderTokens}
                    processedPreviewUrl={processedPreviewUrl}
                    imageRefreshToken={imageRefreshToken}
                  />
                </S.SectionBody>
              </S.SectionCard>
            </S.ConsoleSide>
          </S.ConsoleGrid>
        </>
      ) : (
        <>
          <BoxIdentityFields compact {...identityFieldProps} />

          <S.SectionCard $tone="lilac">
            <S.SectionHeader>
              <S.SectionLabel>Notes</S.SectionLabel>
              <S.SectionTitle>Context</S.SectionTitle>
            </S.SectionHeader>
            <S.SectionBody>
              <S.Field $compact>
                <S.Label htmlFor="box-notes-compact" $compact>Notes</S.Label>
                <S.Textarea
                  id="box-notes-compact"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add contextual notes for this box..."
                  $compact
                />
              </S.Field>
            </S.SectionBody>
          </S.SectionCard>

          <S.SectionCard $tone="amber">
            <S.SectionHeader>
              <S.SectionLabel>Photo</S.SectionLabel>
              <S.SectionTitle>Media</S.SectionTitle>
            </S.SectionHeader>
            <S.SectionBody>
              <BoxImageField
                box={initial}
                boxId={boxMongoId}
                compact
                disabled={busy || destroyBusy}
                mobileHeaderPreview
                title="Box Image"
                showVariantLabel={false}
                placeholder="No photo"
                messageSubject="Image"
                clearLabel="Delete Photo"
                onBoxImageUpdated={({ image, imagePath }) => {
                  void Promise.resolve(
                    onImageUpdated?.({
                      image: image || null,
                      imagePath: imagePath || '',
                    })
                  );
                }}
                onProcessImage={onProcessImage}
                processImageStatus={processImageStatus}
                processImageBusy={processImageBusy}
                processImageError={processImageError}
                processImageProgressLabel={processImageProgressLabel}
                processImageJobId={processImageJobId}
                processImageMediaId={processImageMediaId}
                persistedRenderTokens={persistedRenderTokens}
                processedPreviewUrl={processedPreviewUrl}
                imageRefreshToken={imageRefreshToken}
              />
            </S.SectionBody>
          </S.SectionCard>
        </>
      )}

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
