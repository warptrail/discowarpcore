import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import {
  DEFAULT_ITEM_CATEGORY,
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../../util/itemCategories';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import ImageSourcePicker from '../ImageSourcePicker';
import { uploadCroppedItemImage } from './intakeImageHelpers';

const Panel = styled.section`
  border: 1px solid rgba(89, 121, 198, 0.4);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(16, 24, 36, 0.9) 0%, rgba(12, 17, 28, 0.94) 100%);
  padding: 0.72rem;
  display: grid;
  gap: 0.6rem;
`;

const Heading = styled.h3`
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #dbe8ff;
`;

const Hint = styled.p`
  margin: 0;
  color: #a9bddf;
  font-size: 0.78rem;
  line-height: 1.35;
`;

const Form = styled.form`
  display: grid;
  gap: 0.58rem;
`;

const Field = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #a7bdd8;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Input = styled.input`
  width: 100%;
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid rgba(116, 145, 198, 0.52);
  background: rgba(9, 13, 22, 0.9);
  color: #eff5ff;
  font-size: 1rem;
  padding: 0 0.72rem;

  &:focus {
    outline: none;
    border-color: rgba(152, 188, 255, 0.95);
    box-shadow: 0 0 0 2px rgba(111, 156, 240, 0.2);
  }
`;

const CompactInput = styled(Input)`
  max-width: 132px;
`;

const Select = styled.select`
  width: 100%;
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid rgba(116, 145, 198, 0.52);
  background: rgba(9, 13, 22, 0.9);
  color: #eff5ff;
  font-size: 1rem;
  padding: 0 0.72rem;

  &:focus {
    outline: none;
    border-color: rgba(152, 188, 255, 0.95);
    box-shadow: 0 0 0 2px rgba(111, 156, 240, 0.2);
  }
`;

const InlineRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid ${({ $tone }) => ($tone === 'photo' ? 'rgba(126, 188, 144, 0.58)' : 'rgba(87, 129, 209, 0.6)')};
  background: ${({ $tone }) => ($tone === 'photo' ? 'rgba(16, 46, 35, 0.92)' : 'rgba(14, 29, 57, 0.95)')};
  color: ${({ $tone }) => ($tone === 'photo' ? '#d9f8e4' : '#e2edff')};
  font-size: 0.84rem;
  letter-spacing: 0.04em;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0 0.82rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  min-height: 52px;
  border-radius: 12px;
  border: 1px solid rgba(96, 184, 151, 0.8);
  background: linear-gradient(180deg, rgba(25, 75, 60, 0.96) 0%, rgba(17, 52, 42, 0.96) 100%);
  color: #e8fff5;
  font-size: 0.92rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.54;
    cursor: not-allowed;
  }
`;

const FileMeta = styled.div`
  color: #bfdfc8;
  font-size: 0.76rem;
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#f5bcbc' : '#aac4e6')};
  font-size: 0.78rem;
  min-height: 1.1rem;
`;

const MissingBox = styled.div`
  border: 1px dashed rgba(134, 167, 226, 0.5);
  border-radius: 10px;
  padding: 0.62rem;
  color: #b5c6e1;
  font-size: 0.78rem;
`;

export default function IntakeQuickAddPanel({
  currentBox,
  onItemCreated,
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState(DEFAULT_ITEM_CATEGORY);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoSource, setPhotoSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    if (!currentBox?._id) return false;
    if (!name.trim()) return false;
    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) return false;
    return !busy;
  }, [busy, currentBox?._id, name, quantity]);

  const handlePhotoPick = (picked, meta = {}) => {
    if (!picked) return;
    setPhotoFile(picked);
    setPhotoSource(meta?.source || '');
    setStatus('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || !currentBox?._id) return;

    setBusy(true);
    setStatus('');
    setError('');

    let createdItem = null;

    try {
      const createResponse = await fetch(
        `${API_BASE}/api/boxed-items/boxes/${encodeURIComponent(currentBox._id)}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            quantity: Number(quantity),
            category: normalizeItemCategory(category),
          }),
        },
      );

      const createBody = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok) {
        throw new Error(
          createBody?.error ||
            createBody?.message ||
            `Create failed (${createResponse.status})`,
        );
      }

      createdItem = createBody?.item || createBody;

      if (!createdItem?._id) {
        throw new Error('Item was created but no item id was returned.');
      }

      if (photoFile) {
        await uploadCroppedItemImage(createdItem._id, photoFile);
      }

      const sourceSuffix = photoSource ? ` via ${photoSource}` : '';
      const resultMessage = photoFile
        ? `Added ${name.trim()} with photo${sourceSuffix} to box #${currentBox.box_id}.`
        : `Added ${name.trim()} to box #${currentBox.box_id}.`;
      const createdAt =
        createdItem?.createdAt ||
        createdItem?.created_at ||
        new Date().toISOString();
      const intakeItem = {
        ...createdItem,
        createdAt,
        created_at: createdItem?.created_at || createdAt,
        boxId: currentBox._id,
        box: {
          _id: currentBox._id,
          box_id: currentBox.box_id,
          label: currentBox.label,
        },
      };

      setStatus(resultMessage);
      setName('');
      setQuantity(1);
      setCategory(DEFAULT_ITEM_CATEGORY);
      setPhotoFile(null);
      setPhotoSource('');

      onItemCreated?.({
        itemId: createdItem._id,
        item: intakeItem,
        message: resultMessage,
      });
    } catch (submitError) {
      if (createdItem?._id && photoFile) {
        const partialMessage =
          submitError?.message ||
          'Item was created, but photo upload failed.';
        setError(partialMessage);
        onItemCreated?.({
          itemId: createdItem._id,
          item: {
            ...createdItem,
            createdAt:
              createdItem?.createdAt ||
              createdItem?.created_at ||
              new Date().toISOString(),
            created_at:
              createdItem?.created_at ||
              createdItem?.createdAt ||
              new Date().toISOString(),
            boxId: currentBox._id,
            box: {
              _id: currentBox._id,
              box_id: currentBox.box_id,
              label: currentBox.label,
            },
          },
          message: partialMessage,
        });
      } else {
        setError(submitError?.message || 'Failed to add item.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!currentBox?._id) {
    return <MissingBox>Select a box first to use this intake action.</MissingBox>;
  }

  return (
    <Panel>
      <Heading>Add Item</Heading>
      <Hint>
        Create directly in the selected box. Optionally attach a photo using one
        upload button.
      </Hint>

      <Form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="intake-item-name">Item name</Label>
          <Input
            id="intake-item-name"
            type="text"
            inputMode="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="What are you adding?"
            disabled={busy}
            required
          />
        </Field>

        <InlineRow>
          <Field>
            <Label htmlFor="intake-item-qty">Quantity</Label>
            <CompactInput
              id="intake-item-qty"
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

          <Field style={{ minWidth: '0', flex: '1 1 170px' }}>
            <Label htmlFor="intake-item-category">Category</Label>
            <Select
              id="intake-item-category"
              value={category}
              onChange={(event) => setCategory(normalizeItemCategory(event.target.value))}
              disabled={busy}
            >
              {ITEM_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {formatItemCategory(value)}
                </option>
              ))}
            </Select>
          </Field>
        </InlineRow>

        <Field>
          <Label>Photo (optional)</Label>
          <InlineRow>
            <ImageSourcePicker
              disabled={busy}
              label={photoFile ? 'Replace Image' : 'Upload Image'}
              onFileSelected={handlePhotoPick}
              renderAction={({ label, onClick, disabled: actionDisabled }) => (
                <ActionButton
                  type="button"
                  onClick={onClick}
                  disabled={actionDisabled}
                >
                  {label}
                </ActionButton>
              )}
            />

            <ActionButton
              type="button"
              disabled={busy || !photoFile}
              onClick={() => {
                setPhotoFile(null);
                setPhotoSource('');
              }}
            >
              Clear Photo
            </ActionButton>
          </InlineRow>

          <FileMeta>
            {photoFile
              ? `Selected: ${photoFile.name}${photoSource ? ` (${photoSource})` : ''}`
              : 'No photo selected.'}
          </FileMeta>
        </Field>

        <SubmitButton type="submit" disabled={!canSubmit}>
          {busy ? 'Saving…' : `Add To #${currentBox.box_id}`}
        </SubmitButton>

        <StateText $error={!!error}>{error || status || ' '}</StateText>
      </Form>
    </Panel>
  );
}
