import BoxCompartmentSelect from '../BoxForms/BoxCompartmentSelect';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../../api/API_BASE';
import { enqueueItemImageProcessing } from '../../api/itemMedia';
import { DEFAULT_RENDER_TOKENS } from '../../constants/renderTokens';
import { DEFAULT_ITEM_CATEGORY } from '../../util/itemCategories';
import { uploadCroppedItemImage } from './intakeImageHelpers';
import NewItemPhotoControl from './NewItemPhotoControl';
import NewItemPostSaveDetails from './NewItemPostSaveDetails';
import NewItemQuantityControl from './NewItemQuantityControl';
import IntakeOptionalDetails from './IntakeOptionalDetails';
import * as GridStyles from '../../styles/InventoryGridHeader.styles';
import {
  Composer,
  CaptureRow,
  DestinationCopy,
  DestinationHint,
  DestinationIcon,
  WizardTitle,
  WizardIntro,
  WizardPrompt,
  DestinationKicker,
  DestinationLabel,
  DestinationStatusRow,
  DestinationMeta,
  DestinationRail,
  Field,
  Form,
  InlineMessage,
  Input,
  ItemTitle,
  Label,
  PrimaryButton,
  PhotoModule,
  PhotoEyebrow,
  PhotoToggle,
  PhotoAction,
  PhotoActionCopy,
  PhotoMiniPreview,
  PhotoExpanded,
  QuantityRow,
  QuietButton,
} from './NewItemComposer.styles';

function normalizeTags(values = []) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  ));
}

function normalizeCreatedItem(createdItem, {
  isInBoxMode,
  targetBoxId,
  targetBoxShortId,
  targetBoxLabel,
  orphanedAt,
}) {
  const createdAt = createdItem?.createdAt || createdItem?.created_at || new Date().toISOString();
  const normalized = {
    ...createdItem,
    createdAt,
    created_at: createdItem?.created_at || createdAt,
    category: createdItem?.category || DEFAULT_ITEM_CATEGORY,
    image: createdItem?.image || null,
    imagePath: createdItem?.imagePath || '',
  };

  if (isInBoxMode) {
    return {
      ...normalized,
      box: {
        _id: targetBoxId,
        box_id: targetBoxShortId || null,
        label: targetBoxLabel || '',
      },
      boxId: targetBoxId,
      orphanedAt: null,
    };
  }

  return {
    ...normalized,
    box: null,
    boxId: '',
    orphanedAt: createdItem?.orphanedAt || orphanedAt,
  };
}

export default function IntakeQuickItemMaker({
  onItemCreated,
  mode = 'orphan',
  targetBox = null,
  title = 'New item',
  showTitle = true,
  hint = '',
  submitLabel,
  onChangeTargetBox,
  onDraftNameChange,
  compact = false,
  onItemError,
  onCancel,
}) {
  const normalizedMode = mode === 'inBox' ? 'inBox' : 'orphan';
  const isInBoxMode = normalizedMode === 'inBox';
  const [chosenCompartment, setChosenCompartment] = useState('A');
  const compartmentKey = targetBox?.isComplexBox ? (targetBox.compartmentKey || chosenCompartment) : undefined;
  const targetBoxId = String(targetBox?._id || targetBox?.id || '').trim();
  const targetBoxShortId = String(targetBox?.box_id || targetBox?.shortId || '').trim();
  const targetBoxLabel = String(targetBox?.label || targetBox?.name || '').trim();
  const hasTargetBox = !isInBoxMode || !!targetBoxId;
  const hasSelectedBox = isInBoxMode && !!targetBoxId;
  const nameRef = useRef(null);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(DEFAULT_ITEM_CATEGORY);
  const [condition, setCondition] = useState('unknown');
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoSource, setPhotoSource] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdItem, setCreatedItem] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [photoRetrying, setPhotoRetrying] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [glowEnabled, setGlowEnabled] = useState(false);
  const [renderTokens, setRenderTokens] = useState({ ...DEFAULT_RENDER_TOKENS });
  const [glowStatus, setGlowStatus] = useState('');
  const [glowError, setGlowError] = useState('');
  const [glowQueuing, setGlowQueuing] = useState(false);

  useEffect(() => {
    onDraftNameChange?.(createdItem ? '' : name);
  }, [createdItem, name, onDraftNameChange]);

  useEffect(
    () => () => onDraftNameChange?.(''),
    [onDraftNameChange],
  );

  const destinationLabel = hasSelectedBox
    ? (targetBoxLabel || `Box #${targetBoxShortId || '---'}`)
    : 'Items Adrift';
  const defaultSubmitLabel = hasSelectedBox
    ? `Add to ${targetBoxLabel || `box #${targetBoxShortId || '---'}`}`
    : 'Add to Items Adrift';
  const resolvedSubmitLabel = submitLabel || defaultSubmitLabel;
  const canSubmit = useMemo(() => {
    const normalizedQuantity = Number(quantity);
    return hasTargetBox && !!name.trim() && Number.isFinite(normalizedQuantity)
      && normalizedQuantity > 0 && !busy;
  }, [busy, hasTargetBox, name, quantity]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const emitItem = (item, message) => {
    onItemCreated?.({
      itemId: item?._id,
      item,
      message,
      ...(isInBoxMode ? {} : { refreshOrphaned: true }),
    });
  };

  const applyUploadedPhoto = async (item, file) => {
    const upload = await uploadCroppedItemImage(item._id, file);
    return {
      ...item,
      image: upload?.image || item.image || null,
      imagePath:
        upload?.image?.display?.url ||
        upload?.image?.original?.url ||
        item.imagePath ||
        '',
    };
  };

  const handlePhotoPick = (picked, meta = {}) => {
    if (!picked || busy) return;
    setPhotoFile(picked);
    setPhotoSource(meta?.source || '');
    setPhotoError('');
    setError('');
    setPhotoOpen(true);
  };

  const queueGlow = async (item) => {
    if (!glowEnabled || !item?._id || glowQueuing) return;
    setGlowError('');
    setGlowQueuing(true);
    try {
      await enqueueItemImageProcessing(item._id, { renderTokens });
      setGlowStatus('Glow processing queued.');
    } catch (processingError) {
      setGlowError(processingError?.message || 'Could not queue Glow processing.');
    } finally {
      setGlowQueuing(false);
    }
  };

  const stageTag = (value = tagDraft) => {
    const nextTag = String(value || '').trim();
    if (!nextTag) return;
    setTags((current) => normalizeTags([...current, nextTag]));
    setTagDraft('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError('');
    setPhotoError('');

    const trimmedName = name.trim();
    const normalizedQuantity = Number(quantity);
    const normalizedTags = normalizeTags([...tags, tagDraft]);
    const normalizedDescription = description.trim();
    const orphanedAt = new Date().toISOString();
    const endpoint = isInBoxMode
      ? `${API_BASE}/api/boxed-items/boxes/${encodeURIComponent(targetBoxId)}/items`
      : `${API_BASE}/api/items`;
    const requestBody = isInBoxMode
      ? {
          compartmentKey,
          name: trimmedName,
          quantity: normalizedQuantity,
          category,
          condition,
          notes: notes.trim(),
          description: normalizedDescription,
          tags: normalizedTags,
        }
      : {
          compartmentKey,
          name: trimmedName,
          quantity: normalizedQuantity,
          category,
          condition,
          notes: notes.trim(),
          description: normalizedDescription,
          tags: normalizedTags,
          orphanedAt,
          location: '',
        };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || body?.message || `Create failed (${response.status})`);

      const returnedItem = isInBoxMode ? body?.item || body : body;
      if (!returnedItem?._id) throw new Error('Item created but no item id returned.');

      const normalizedItem = normalizeCreatedItem(returnedItem, {
        isInBoxMode,
        targetBoxId,
        targetBoxShortId,
        targetBoxLabel,
        orphanedAt,
      });
      const placement = hasSelectedBox ? `in ${destinationLabel}` : 'to Items Adrift';
      emitItem(normalizedItem, `Added "${trimmedName}" ${placement}.`);
      setCreatedItem(normalizedItem);

      if (photoFile) {
        try {
          const withPhoto = await applyUploadedPhoto(normalizedItem, photoFile);
          setCreatedItem(withPhoto);
          emitItem(withPhoto, `Added "${trimmedName}" ${placement} with photo${photoSource ? ` via ${photoSource}` : ''}.`);
          await queueGlow(withPhoto);
        } catch (uploadError) {
          setPhotoError(uploadError?.message || 'Photo upload failed.');
        }
      }
    } catch (submitError) {
      const message = submitError?.message || 'Could not add this item. Try again.';
      setError(message);
      onItemError?.(submitError);
    } finally {
      setBusy(false);
    }
  };

  const handleRetryPhoto = async () => {
    if (!createdItem?._id || !photoFile || photoRetrying) return;
    setPhotoRetrying(true);
    setPhotoError('');
    try {
      const withPhoto = await applyUploadedPhoto(createdItem, photoFile);
      setCreatedItem(withPhoto);
      emitItem(withPhoto, `Photo added to "${withPhoto.name || 'item'}".`);
      await queueGlow(withPhoto);
    } catch (uploadError) {
      setPhotoError(uploadError?.message || 'Photo upload failed.');
    } finally {
      setPhotoRetrying(false);
    }
  };

  const handleItemUpdated = (updatedItem) => {
    const normalized = normalizeCreatedItem(updatedItem, {
      isInBoxMode,
      targetBoxId,
      targetBoxShortId,
      targetBoxLabel,
      orphanedAt: createdItem?.orphanedAt || new Date().toISOString(),
    });
    setCreatedItem(normalized);
    emitItem(normalized, `Updated "${normalized.name || 'item'}".`);
  };

  const handleAddAnother = () => {
    setCreatedItem(null);
    setName('');
    setQuantity(1);
    setDescription('');
    setNotes('');
    setCategory(DEFAULT_ITEM_CATEGORY);
    setCondition('unknown');
    setTags([]);
    setTagDraft('');
    setPhotoFile(null);
    setPhotoSource('');
    setPhotoError('');
    setError('');
    setPhotoOpen(false);
    setGlowEnabled(false);
    setRenderTokens({ ...DEFAULT_RENDER_TOKENS });
    setGlowStatus('');
    setGlowError('');
    setGlowQueuing(false);
    window.setTimeout(() => nameRef.current?.focus(), 0);
  };

  if (createdItem) {
    return (
      <Composer>
        <NewItemPostSaveDetails
          item={createdItem}
          photoError={photoError}
          photoRetrying={photoRetrying}
          onRetryPhoto={handleRetryPhoto}
          glowStatus={glowStatus}
          glowError={glowError}
          glowQueuing={glowQueuing}
          onRetryGlow={() => queueGlow(createdItem)}
          onItemUpdated={handleItemUpdated}
          onAddAnother={handleAddAnother}
        />
      </Composer>
    );
  }

  if (compact) {
    return (
      <GridStyles.QuickCaptureComposer>
        <GridStyles.QuickCaptureForm onSubmit={handleSubmit}>
          <GridStyles.QuickCaptureField>
            Item name
            <GridStyles.QuickCaptureInput
              id="quick-orphan-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What do you need to remember?"
              disabled={busy}
              autoFocus
              required
            />
          </GridStyles.QuickCaptureField>
          <GridStyles.QuickCaptureField>
            Description
            <GridStyles.QuickCaptureInput
              id="quick-orphan-description"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A little identifying detail"
              disabled={busy}
            />
          </GridStyles.QuickCaptureField>
          <GridStyles.QuickCaptureActions>
            {onCancel ? (
              <GridStyles.QuickCaptureButton type="button" onClick={onCancel} disabled={busy}>
                Cancel
              </GridStyles.QuickCaptureButton>
            ) : null}
            <GridStyles.QuickCaptureButton type="submit" $primary disabled={!canSubmit}>
              {busy ? 'Saving…' : 'Capture'}
            </GridStyles.QuickCaptureButton>
          </GridStyles.QuickCaptureActions>
        </GridStyles.QuickCaptureForm>
        {error ? <GridStyles.QuickCaptureError role="alert">{error}</GridStyles.QuickCaptureError> : null}
      </GridStyles.QuickCaptureComposer>
    );
  }

  return (
    <Composer>
      {showTitle || hint ? (
        <div>
          {showTitle ? <ItemTitle>{title}</ItemTitle> : null}
          {hint ? <InlineMessage>{hint}</InlineMessage> : null}
        </div>
      ) : null}
      <WizardIntro $inBox={hasSelectedBox}>
        <WizardTitle $inBox={hasSelectedBox}>A new item enters the inventory.</WizardTitle>
        <WizardPrompt>Where should it go?</WizardPrompt>
      </WizardIntro>
      <DestinationRail $inBox={hasSelectedBox}>
        <DestinationIcon $inBox={hasSelectedBox} aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M16 3 27 9v14l-11 6L5 23V9L16 3Z" />
            <path d="m5 9 11 6 11-6M16 15v14" />
          </svg>
        </DestinationIcon>
        <DestinationCopy>
          <DestinationKicker>Destination</DestinationKicker>
          <DestinationStatusRow>
            <DestinationLabel>
              {destinationLabel}
              {targetBoxShortId ? <DestinationMeta> #{targetBoxShortId}{compartmentKey || ''}</DestinationMeta> : null}
            </DestinationLabel>
            {onChangeTargetBox ? (
              <QuietButton $destination type="button" onClick={onChangeTargetBox} disabled={busy}>
                Change
              </QuietButton>
            ) : null}
          </DestinationStatusRow>
          <DestinationHint>{hasSelectedBox ? 'Current box' : 'Temporary holding area'}</DestinationHint>
        </DestinationCopy>
      </DestinationRail>
      {isInBoxMode && !targetBox?.compartmentKey ? <BoxCompartmentSelect box={targetBox} value={chosenCompartment} onChange={setChosenCompartment} disabled={busy} /> : null}

      <Form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="new-item-name">Item name</Label>
          <Input
            id="new-item-name"
            ref={nameRef}
            type="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Whatchya got there??"
            disabled={busy}
            required
          />
        </Field>

        <CaptureRow>
          <PhotoModule>
            <PhotoEyebrow>Item photo</PhotoEyebrow>
            <PhotoToggle
              type="button"
              aria-expanded={photoOpen}
              aria-controls="new-item-photo-controls"
              onClick={() => setPhotoOpen((value) => !value)}
            >
              {photoPreviewUrl ? (
                <PhotoMiniPreview src={photoPreviewUrl} alt="" />
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 7h4l1.5-2h5L16 7h4v12H4z" />
                  <circle cx="12" cy="13" r="3.2" />
                </svg>
              )}
              <PhotoActionCopy>
                <PhotoAction>{photoFile ? 'Photo ready' : 'Add photo'}</PhotoAction>
                <small>{photoFile ? 'Change or remove' : 'Tap to upload'}</small>
              </PhotoActionCopy>
              <span aria-hidden="true">{photoOpen ? '−' : '+'}</span>
            </PhotoToggle>
          </PhotoModule>

          <QuantityRow>
            <Label htmlFor="new-item-quantity">Quantity</Label>
            <NewItemQuantityControl
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={9999}
              disabled={busy}
            />
          </QuantityRow>
          {photoOpen ? (
            <PhotoExpanded id="new-item-photo-controls">
              <NewItemPhotoControl
                disabled={busy}
                photoFile={photoFile}
                previewUrl={photoPreviewUrl}
                onFileSelected={handlePhotoPick}
                  onRemove={() => {
                    setPhotoFile(null);
                    setPhotoSource('');
                    setPhotoError('');
                    setGlowEnabled(false);
                    setGlowError('');
                  }}
                  glowEnabled={glowEnabled}
                  onGlowEnabledChange={setGlowEnabled}
                  renderTokens={renderTokens}
                  onRenderTokenChange={(field, value) => setRenderTokens((current) => ({ ...current, [field]: value }))}
              />
            </PhotoExpanded>
          ) : null}
        </CaptureRow>

        <IntakeOptionalDetails
          description={description}
          onDescriptionChange={setDescription}
          tags={tags}
          onTagsChange={setTags}
          tagDraft={tagDraft}
          onTagDraftChange={setTagDraft}
          onStageTag={stageTag}
          notes={notes}
          onNotesChange={setNotes}
          category={category}
          onCategoryChange={setCategory}
          condition={condition}
          onConditionChange={setCondition}
          disabled={busy}
        />

        {error ? <InlineMessage $error>{error}</InlineMessage> : null}
        <PrimaryButton type="submit" disabled={!canSubmit}>
          {busy ? 'Adding…' : resolvedSubmitLabel}
        </PrimaryButton>
      </Form>
    </Composer>
  );
}
