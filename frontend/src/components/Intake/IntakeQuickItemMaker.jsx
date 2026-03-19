import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import ImageSourcePicker from '../ImageSourcePicker';
import { uploadCroppedItemImage } from './intakeImageHelpers';
import BoxTagsField from '../BoxForms/BoxTagsField';

const Panel = styled.section`
  border: 1px solid rgba(108, 171, 203, 0.45);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(12, 21, 31, 0.94) 0%, rgba(9, 16, 24, 0.96) 100%);
  padding: 0.62rem;
  display: grid;
  gap: 0.54rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.54rem;
    gap: 0.46rem;
  }
`;

const Heading = styled.h2`
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #d8eaf8;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Hint = styled.p`
  margin: 0;
  color: #a9c2dc;
  font-size: 0.76rem;
  line-height: 1.35;
`;

const Form = styled.form`
  display: grid;
  gap: 0.48rem;
`;

const TopRow = styled.div`
  display: grid;
  gap: 0.48rem;
  grid-template-columns: minmax(0, 1fr) 120px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 0.3rem;
  min-width: 0;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #98b4c8;
`;

const Input = styled.input`
  width: 100%;
  min-height: 38px;
  border-radius: 9px;
  border: 1px solid rgba(116, 145, 198, 0.5);
  background: rgba(7, 11, 18, 0.9);
  color: #eaf2ff;
  font-size: 0.92rem;
  padding: 0 0.62rem;

  &:focus {
    outline: none;
    border-color: rgba(145, 187, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(91, 141, 236, 0.22);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 62px;
  border-radius: 9px;
  border: 1px solid rgba(116, 145, 198, 0.5);
  background: rgba(7, 11, 18, 0.9);
  color: #eaf2ff;
  font-size: 0.86rem;
  line-height: 1.35;
  padding: 0.45rem 0.56rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(145, 187, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(91, 141, 236, 0.22);
  }
`;

const ImageRow = styled.div`
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 0.5rem;
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const Preview = styled.img`
  width: 84px;
  height: 84px;
  border-radius: 10px;
  border: 1px solid rgba(112, 164, 200, 0.52);
  object-fit: cover;
  background: rgba(9, 14, 21, 0.9);
`;

const PreviewStub = styled.div`
  width: 84px;
  height: 84px;
  border-radius: 10px;
  border: 1px dashed rgba(112, 164, 200, 0.48);
  background: rgba(9, 14, 21, 0.64);
  color: #8fa8bd;
  font-size: 0.66rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.35rem;
`;

const ImageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const ActionButton = styled.button`
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(203, 127, 127, 0.64)'
      : 'rgba(104, 168, 143, 0.58)'};
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(63, 24, 24, 0.92)'
      : 'rgba(14, 36, 30, 0.94)'};
  color: ${({ $tone }) => ($tone === 'danger' ? '#ffd7d7' : '#dff7ee')};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.6rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(100, 188, 151, 0.82);
  background: linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%);
  color: #e8fff5;
  font-size: 0.84rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const StateText = styled.div`
  min-height: 1.05rem;
  color: ${({ $error }) => ($error ? '#f2bebe' : '#9ac6b3')};
  font-size: 0.75rem;
`;

function tagsToPayload(tags = []) {
  return (Array.isArray(tags) ? tags : [])
    .map((t) => String(t || '').trim())
    .filter(Boolean);
}

export default function IntakeQuickItemMaker({ onItemCreated }) {
  const nameRef = useRef(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoSource, setPhotoSource] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return false;
    return !busy;
  }, [busy, name, quantity]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handlePhotoPick = (picked, meta = {}) => {
    if (!picked) return;
    setPhotoFile(picked);
    setPhotoSource(meta?.source || '');
    setStatus('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setStatus('');
    setError('');

    let createdItem = null;
    const orphanedAt = new Date().toISOString();

    try {
      const res = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          quantity: Number(quantity),
          description: description.trim(),
          notes: notes.trim(),
          tags: tagsToPayload(tags),
          orphanedAt,
          location: '',
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          body?.error || body?.message || `Create failed (${res.status})`,
        );
      }

      createdItem = body;
      if (!createdItem?._id) {
        throw new Error('Item created but no item id returned.');
      }

      let uploadedImage = null;
      if (photoFile) {
        const upload = await uploadCroppedItemImage(createdItem._id, photoFile);
        uploadedImage = upload?.image || null;
      }

      const sourceSuffix = photoSource ? ` via ${photoSource}` : '';
      const message = photoFile
        ? `Created orphan item "${name.trim()}" with photo${sourceSuffix}.`
        : `Created orphan item "${name.trim()}".`;
      const createdAt =
        createdItem?.createdAt || createdItem?.created_at || new Date().toISOString();

      onItemCreated?.({
        itemId: createdItem._id,
        item: {
          ...createdItem,
          createdAt,
          created_at: createdItem?.created_at || createdAt,
          orphanedAt: createdItem?.orphanedAt || orphanedAt,
          box: null,
          boxId: '',
          image: uploadedImage || createdItem?.image || null,
          imagePath:
            uploadedImage?.display?.url ||
            uploadedImage?.original?.url ||
            createdItem?.imagePath ||
            '',
        },
        message,
        refreshOrphaned: true,
      });

      setStatus(message);
      setName('');
      setQuantity(1);
      setDescription('');
      setNotes('');
      setTags([]);
      setPhotoFile(null);
      setPhotoSource('');
      window.setTimeout(() => {
        nameRef.current?.focus();
      }, 0);
    } catch (submitError) {
      if (createdItem?._id && photoFile) {
        const partial = submitError?.message || 'Item created but photo upload failed.';
        setError(partial);
        onItemCreated?.({
          itemId: createdItem._id,
          item: {
            ...createdItem,
            orphanedAt: createdItem?.orphanedAt || orphanedAt,
            box: null,
            boxId: '',
          },
          message: partial,
          refreshOrphaned: true,
        });
      } else {
        setError(submitError?.message || 'Failed to create orphan item.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <Heading>Quick Item Maker</Heading>
      <Hint>
        Fast orphan capture. Items created here are unassigned and can be organized into boxes later.
      </Hint>

      <Form onSubmit={handleSubmit}>
        <TopRow>
          <Field>
            <Label htmlFor="quick-maker-name">Item name</Label>
            <Input
              id="quick-maker-name"
              ref={nameRef}
              type="text"
              autoCapitalize="sentences"
              autoCorrect="on"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What are you capturing?"
              disabled={busy}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="quick-maker-qty">Quantity</Label>
            <Input
              id="quick-maker-qty"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value || '1', 10);
                setQuantity(Number.isFinite(next) && next > 0 ? next : 1);
              }}
              disabled={busy}
            />
          </Field>
        </TopRow>

        <Field>
          <Label htmlFor="quick-maker-description">Description</Label>
          <TextArea
            id="quick-maker-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short identifying details"
            disabled={busy}
          />
        </Field>

        <Field>
          <Label htmlFor="quick-maker-notes">Notes</Label>
          <TextArea
            id="quick-maker-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional context"
            disabled={busy}
          />
        </Field>

        <BoxTagsField
          compact
          tags={tags}
          setTags={setTags}
        />

        <Field>
          <Label>Image</Label>
          <ImageRow>
            {photoPreviewUrl ? (
              <Preview src={photoPreviewUrl} alt="Selected item preview" />
            ) : (
              <PreviewStub>No image selected</PreviewStub>
            )}

            <ImageActions>
              <ImageSourcePicker
                disabled={busy}
                label={photoFile ? 'Replace Photo' : 'Add Photo'}
                onFileSelected={handlePhotoPick}
                renderAction={({ label, onClick, disabled }) => (
                  <ActionButton
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                  >
                    {label}
                  </ActionButton>
                )}
              />
              <ActionButton
                type="button"
                $tone="danger"
                disabled={busy || !photoFile}
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoSource('');
                }}
              >
                Clear Photo
              </ActionButton>
            </ImageActions>
          </ImageRow>
        </Field>

        <SubmitButton type="submit" disabled={!canSubmit}>
          {busy ? 'Creating…' : 'Create Orphan Item'}
        </SubmitButton>
      </Form>

      <StateText $error={!!error}>{error || status || ' '}</StateText>
    </Panel>
  );
}
