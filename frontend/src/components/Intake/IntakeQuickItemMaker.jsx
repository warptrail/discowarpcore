import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../../api/API_BASE';
import { DEFAULT_ITEM_CATEGORY } from '../../util/itemCategories';
import { uploadCroppedItemImage } from './intakeImageHelpers';
import NewItemPhotoControl from './NewItemPhotoControl';
import NewItemPostSaveDetails from './NewItemPostSaveDetails';
import NewItemQuantityControl from './NewItemQuantityControl';
import * as GridStyles from '../../styles/InventoryGridHeader.styles';
import {
  Composer,
  DestinationKicker,
  DestinationLabel,
  DestinationMeta,
  DestinationRail,
  Field,
  Form,
  InlineMessage,
  Input,
  ItemTitle,
  Label,
  PrimaryButton,
  ProgressContent,
  ProgressDisclosure,
  ProgressToggle,
  QuickDetails,
  QuantityRow,
  QuietButton,
  TagChip,
  TagComposer,
  TagDraftInput,
  TagStageButton,
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
  const targetBoxId = String(targetBox?._id || targetBox?.id || '').trim();
  const targetBoxShortId = String(targetBox?.box_id || targetBox?.shortId || '').trim();
  const targetBoxLabel = String(targetBox?.label || targetBox?.name || '').trim();
  const hasTargetBox = !isInBoxMode || !!targetBoxId;
  const hasSelectedBox = isInBoxMode && !!targetBoxId;
  const nameRef = useRef(null);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
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
  const [detailsOpen, setDetailsOpen] = useState(false);

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
          name: trimmedName,
          quantity: normalizedQuantity,
          category: DEFAULT_ITEM_CATEGORY,
          description: normalizedDescription,
          tags: normalizedTags,
        }
      : {
          name: trimmedName,
          quantity: normalizedQuantity,
          category: DEFAULT_ITEM_CATEGORY,
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
    setTags([]);
    setTagDraft('');
    setPhotoFile(null);
    setPhotoSource('');
    setPhotoError('');
    setError('');
    setPhotoOpen(false);
    setDetailsOpen(false);
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
      <DestinationRail>
        <div>
          <DestinationKicker>Going to</DestinationKicker>
          <DestinationLabel>
            {destinationLabel}
            {targetBoxShortId ? <DestinationMeta> #{targetBoxShortId}</DestinationMeta> : null}
          </DestinationLabel>
        </div>
        {onChangeTargetBox ? (
          <QuietButton type="button" onClick={onChangeTargetBox} disabled={busy}>
            Change
          </QuietButton>
        ) : null}
      </DestinationRail>

      <Form onSubmit={handleSubmit}>
        <ProgressDisclosure>
          <ProgressToggle
            type="button"
            aria-expanded={photoOpen}
            aria-controls="new-item-photo-controls"
            onClick={() => setPhotoOpen((value) => !value)}
          >
            <span>{photoFile ? 'Photo ready' : 'Add photo'}</span>
            <span aria-hidden="true">{photoOpen ? '−' : '+'}</span>
          </ProgressToggle>
          {photoOpen ? (
            <ProgressContent id="new-item-photo-controls">
              <NewItemPhotoControl
                disabled={busy}
                photoFile={photoFile}
                previewUrl={photoPreviewUrl}
                onFileSelected={handlePhotoPick}
                onRemove={() => {
                  setPhotoFile(null);
                  setPhotoSource('');
                  setPhotoError('');
                }}
              />
            </ProgressContent>
          ) : null}
        </ProgressDisclosure>

        <Field>
          <Label htmlFor="new-item-name">Whaychya got there?</Label>
          <Input
            id="new-item-name"
            ref={nameRef}
            type="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Extension cord, blue bowl…"
            disabled={busy}
            required
          />
        </Field>

        <QuantityRow>
          <Label htmlFor="new-item-quantity">How many?</Label>
          <NewItemQuantityControl
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={9999}
            disabled={busy}
          />
        </QuantityRow>

        <ProgressDisclosure>
          <ProgressToggle
            type="button"
            aria-expanded={detailsOpen}
            aria-controls="new-item-optional-details"
            onClick={() => setDetailsOpen((value) => !value)}
          >
            <span>Details <em>optional</em></span>
            <span aria-hidden="true">{detailsOpen ? '−' : '+'}</span>
          </ProgressToggle>
          {detailsOpen ? (
            <ProgressContent id="new-item-optional-details">
              <QuickDetails>
                <Field>
                  <Label htmlFor="new-item-description">Description</Label>
                  <Input
                    id="new-item-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="A little identifying detail"
                    disabled={busy}
                  />
                </Field>
                <Field>
                  <Label htmlFor="new-item-tags">Tags</Label>
                  <TagComposer>
                    {tags.map((tag) => (
                      <TagChip
                        key={tag}
                        type="button"
                        onClick={() => setTags((current) => current.filter((entry) => entry !== tag))}
                        disabled={busy}
                        aria-label={`Remove ${tag}`}
                      >
                        {tag} ×
                      </TagChip>
                    ))}
                    <TagDraftInput
                      id="new-item-tags"
                      value={tagDraft}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        stageTag();
                      }}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        if (/\s{2}$/.test(nextValue)) {
                          stageTag(nextValue);
                          return;
                        }
                        setTagDraft(nextValue);
                      }}
                      placeholder="Add a tag"
                      disabled={busy}
                    />
                    {tagDraft.trim() ? (
                      <TagStageButton type="button" onClick={() => stageTag()} disabled={busy}>
                        Stage
                      </TagStageButton>
                    ) : null}
                  </TagComposer>
                </Field>
              </QuickDetails>
            </ProgressContent>
          ) : null}
        </ProgressDisclosure>

        {error ? <InlineMessage $error>{error}</InlineMessage> : null}
        <PrimaryButton type="submit" disabled={!canSubmit}>
          {busy ? 'Adding…' : resolvedSubmitLabel}
        </PrimaryButton>
      </Form>
    </Composer>
  );
}
