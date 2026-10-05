import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { updateBoxDetails } from '../api/boxes';
import useShortIdAvailability from '../hooks/useShortIdAvailability';
import useLocationRegistry from '../hooks/useLocationRegistry';
import { ToastContext } from './Toast';

import * as S from './BoxForms/BoxEditForm.styles';
import BoxIdentityFields from './BoxForms/BoxIdentityFields';
import BoxTagsField from './BoxForms/BoxTagsField';
import BoxComplexField from './BoxForms/BoxComplexField';
import BoxDeclutterFields from './BoxForms/BoxDeclutterFields';
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
  processImageProgressPercent = null,
  processImageJobId = '',
  processImageMediaId = '',
  persistedRenderTokens = null,
  processedPreviewUrl = '',
  imageRefreshToken = 0,
  onDestroy,
  onCancel,
  TagInputComponent,
  compact = false,
  flat = false,
  autoSave = false,
  onAutoSaved,
}) {
  const initialLocationId =
    initial?.locationId?._id ??
    initial?.locationId ??
    null;

  const [shortId, setShortId] = useState(initial?.box_id ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [locationId, setLocationId] = useState(
    initialLocationId ? String(initialLocationId) : '',
  );
  const [locationError, setLocationError] = useState('');
  const [locationCreateBusy, setLocationCreateBusy] = useState(false);
  const [tags, setTags] = useState(() =>
    Array.isArray(initial?.tags) ? initial.tags : [],
  );
  const [declutterPurpose, setDeclutterPurpose] = useState(initial?.declutterPurpose || 'standard');
  const [declutterIsDefault, setDeclutterIsDefault] = useState(Boolean(initial?.declutterIsDefault));
  const [isComplexBox, setIsComplexBox] = useState(Boolean(initial?.isComplexBox));
  const [isGiftBox, setIsGiftBox] = useState(Boolean(initial?.isGiftBox));
  const [busy, setBusy] = useState(false);
  const [destroyBusy, setDestroyBusy] = useState(false);
  const [error, setError] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
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
    setDescription(initial?.description ?? '');
    setNotes(initial?.notes ?? '');
    const nextLocationId =
      initial?.locationId?._id ??
      initial?.locationId ??
      '';
    setLocationId(nextLocationId ? String(nextLocationId) : '');
    setLocationError('');
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    setDeclutterPurpose(initial?.declutterPurpose || 'standard');
    setDeclutterIsDefault(Boolean(initial?.declutterIsDefault));
    setIsComplexBox(Boolean(initial?.isComplexBox));
    setIsGiftBox(Boolean(initial?.isGiftBox));
  }, [
    initial?._id,
    initial?.box_id,
    initial?.label,
    initial?.description,
    initial?.notes,
    initial?.locationId,
    initial?.tags,
    initial?.declutterPurpose,
    initial?.declutterIsDefault,
    initial?.isComplexBox,
    initial?.isGiftBox,
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
    const sameDescription =
      String(description || '').trim() === String(initial?.description || '').trim();
    const sameNotes =
      String(notes || '').trim() === String(initial?.notes || '').trim();
    const sameLocation =
      String(locationId || '') === String(initial?.locationId?._id ?? initial?.locationId ?? '');
    const sameTags =
      JSON.stringify([...tags].sort()) ===
      JSON.stringify([...(initial?.tags || [])].sort());
    const sameDeclutterPurpose = declutterPurpose === (initial?.declutterPurpose || 'standard');
    const sameDeclutterDefault = declutterIsDefault === Boolean(initial?.declutterIsDefault);
    const sameGiftBox = isGiftBox === Boolean(initial?.isGiftBox);
    return !(
      sameId &&
      sameLabel &&
      sameDescription &&
      sameNotes &&
      sameLocation &&
      sameTags &&
      sameDeclutterPurpose &&
      sameDeclutterDefault &&
      sameGiftBox &&
      isComplexBox === Boolean(initial?.isComplexBox)
    );
  }, [shortId, label, description, notes, locationId, tags, declutterPurpose, declutterIsDefault, isGiftBox, isComplexBox, initial]);

  const canSave =
    !busy &&
    !destroyBusy &&
    changed &&
    shortIdValid &&
    shortIdAvail &&
    (label || '').trim().length > 0;

  const handleCreateLocation = async (location) => {
    const normalized = {
      room: String(location?.room || '').trim().replace(/\s+/g, ' '),
      vicinity: String(location?.vicinity || '').trim().replace(/\s+/g, ' '),
      specifics: String(location?.specifics || '').trim().replace(/\s+/g, ' '),
    };
    if (!normalized.room) {
      setLocationError('Room is required');
      throw new Error('Room is required');
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

  const saveBoxDetails = useCallback(async () => {
    if (!canSave) return false;

    setBusy(true);
    setError(null);
    if (autoSave) {
      setAutoSaveStatus('saving');
      showToast?.({
        id: `box-autosave-${boxMongoId}`,
        variant: 'info',
        title: 'Saving box updates',
        message: 'Your changes are being saved.',
        loading: true,
        sticky: true,
      });
    }

    try {
      const updated = await updateBoxDetails(boxMongoId, {
        box_id: shortId,
        label: label.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        locationId: locationId || null,
        tags,
        declutterPurpose,
        declutterIsDefault,
        isComplexBox,
        isGiftBox,
      });
      const persistedShortId = String(updated?.box_id ?? updated?.shortId ?? '').trim();
      if (persistedShortId !== String(shortId).trim()) {
        throw new Error('The server did not persist the new box number. Please try again.');
      }
      if (autoSave) {
        setAutoSaveStatus('saved');
        showToast?.({
          id: `box-autosave-${boxMongoId}`,
          variant: 'success',
          title: 'Box updated',
          message: 'Your latest changes are saved.',
          timeoutMs: 2400,
        });
        Promise.resolve(onAutoSaved?.(updated)).catch((syncError) => {
          console.error('[EditBoxDetailsForm] refresh after autosave failed:', syncError);
        });
      } else {
        onSaved?.(updated);
      }
      return true;
    } catch (e2) {
      const message = e2.message || 'Update failed';
      setError(message);
      if (autoSave) {
        setAutoSaveStatus('error');
        showToast?.({
          id: `box-autosave-${boxMongoId}`,
          variant: 'danger',
          title: 'Box update failed',
          message,
          sticky: true,
        });
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [
    autoSave,
    boxMongoId,
    canSave,
    declutterIsDefault,
    declutterPurpose,
    description,
    isGiftBox,
    isComplexBox,
    label,
    locationId,
    notes,
    onAutoSaved,
    onSaved,
    shortId,
    showToast,
    tags,
  ]);

  const onSubmit = (event) => {
    event?.preventDefault?.();
    if (!autoSave) void saveBoxDetails();
  };

  useEffect(() => {
    if (!autoSave || !changed || busy || !canSave) return undefined;
    setAutoSaveStatus('pending');
    const timer = window.setTimeout(() => {
      void saveBoxDetails();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [autoSave, busy, canSave, changed, saveBoxDetails]);

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
    locationId,
    setLocationId,
    locationOptions,
    locationsLoading,
    onCreateLocation: handleCreateLocation,
    locationCreateBusy,
    locationError: locationError || locationsError,
    autoSave,
    tags,
    setTags,
    TagInputComponent,
  };

  return (
    <S.Card onSubmit={onSubmit} noValidate $compact={compact} $flat={flat}>
      {!compact ? (
        <>
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
                  <S.SectionHint>Location, tags</S.SectionHint>
                </S.SectionHeader>
                <S.SectionBody>
                  <BoxIdentityFields
                    compact={compact}
                    showIdentity={false}
                    {...identityFieldProps}
                  />
                  <S.Field $compact={compact}>
                    <S.Label htmlFor="box-description" $compact={compact}>
                      Physical Description
                    </S.Label>
                    <S.Textarea
                      id="box-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the physical box, color, size, markings, or condition..."
                      $compact={compact}
                    />
                  </S.Field>
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
                  <BoxComplexField value={isComplexBox} onChange={setIsComplexBox} />
                  <BoxDeclutterFields
                    purpose={declutterPurpose}
                    setPurpose={setDeclutterPurpose}
                    isDefault={declutterIsDefault}
                    setIsDefault={setDeclutterIsDefault}
                    isGiftBox={isGiftBox}
                    setIsGiftBox={setIsGiftBox}
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
                    processImageProgressPercent={processImageProgressPercent}
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
          <BoxComplexField value={isComplexBox} onChange={setIsComplexBox} />
          <BoxDeclutterFields
            compact
            purpose={declutterPurpose}
            setPurpose={setDeclutterPurpose}
            isDefault={declutterIsDefault}
            setIsDefault={setDeclutterIsDefault}
            isGiftBox={isGiftBox}
            setIsGiftBox={setIsGiftBox}
          />

          <S.CompactContextGrid>
            <S.Field $compact>
              <S.Label htmlFor="box-description-compact" $compact>
                Physical description
              </S.Label>
              <S.Textarea
                id="box-description-compact"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the physical box, color, size, markings, or condition..."
                $compact
              />
            </S.Field>
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
          </S.CompactContextGrid>

          <S.CompactMediaRegion>
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
              processImageProgressPercent={processImageProgressPercent}
              processImageJobId={processImageJobId}
              processImageMediaId={processImageMediaId}
              persistedRenderTokens={persistedRenderTokens}
              processedPreviewUrl={processedPreviewUrl}
              imageRefreshToken={imageRefreshToken}
            />
          </S.CompactMediaRegion>
        </>
      )}

      {error && (
        <S.Hint $error $compact={compact} style={{ marginTop: compact ? 6 : 8 }}>
          {error}
        </S.Hint>
      )}

      {autoSave ? (
        <S.AutoSaveStatus $status={autoSaveStatus} role="status" aria-live="polite">
          {autoSaveStatus === 'saving'
            ? 'Saving…'
            : autoSaveStatus === 'pending'
              ? 'Changes queued to save'
              : autoSaveStatus === 'saved'
                ? 'All changes saved'
                : autoSaveStatus === 'error'
                  ? 'Could not save changes'
                  : 'Changes save automatically'}
        </S.AutoSaveStatus>
      ) : (
        <BoxFormActions
          onCancel={onCancel}
          busy={busy}
          canSave={canSave}
          onDestroy={onDestroy ? handleDestroy : null}
          destroyBusy={destroyBusy}
          compact={compact}
        />
      )}
    </S.Card>
  );
}
