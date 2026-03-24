import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { GONE_DISPOSITIONS } from '../api/itemLifecycle';

const Panel = styled.form`
  display: grid;
  gap: 0.58rem;
`;

const Body = styled.p`
  margin: 0;
  color: #e6ecef;
  font-size: 0.85rem;
  line-height: 1.35;
`;

const Label = styled.label`
  display: grid;
  gap: 0.3rem;
  color: #dbe6eb;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
`;

const Hint = styled.div`
  color: #cfdde6;
  font-size: 0.76rem;
`;

const Select = styled.select`
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid #496473;
  background: #13212c;
  color: #f2f6f9;
  padding: 0 0.56rem;
`;

const TextArea = styled.textarea`
  min-height: 88px;
  border-radius: 8px;
  border: 1px solid #496473;
  background: #13212c;
  color: #f2f6f9;
  padding: 0.46rem 0.56rem;
  resize: vertical;
`;

const Input = styled.input`
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid #745156;
  background: #241619;
  color: #ffe8ea;
  padding: 0 0.56rem;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.44rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0 0.78rem;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? '#5e2329'
      : $tone === 'primary'
        ? '#1f4d43'
        : '#1f262d'};
  border-color: ${({ $tone }) =>
    $tone === 'danger'
      ? '#a44752'
      : $tone === 'primary'
        ? '#3a8f7e'
        : '#3e4a56'};
  color: ${({ $tone }) =>
    $tone === 'danger' ? '#ffe4e7' : $tone === 'primary' ? '#dff8f1' : '#e7edf2'};

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }
`;

const dispositionLabelMap = {
  consumed: 'Consumed',
  lost: 'Lost',
  stolen: 'Stolen',
  trashed: 'Trashed',
  recycled: 'Recycled',
  gifted: 'Gifted',
  donated: 'Donated',
};

export function ItemHardDeleteConsolePanel({
  busy = false,
  itemName,
  onCancel,
  onConfirm,
}) {
  const [confirmText, setConfirmText] = useState('');
  const isValid = confirmText === 'delete';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || busy) return;
    await onConfirm?.();
  };

  return (
    <Panel onSubmit={handleSubmit}>
      <Body>
        Permanently delete <strong>{itemName || 'this item'}</strong> from the database.
      </Body>
      <Hint>
        This cannot be undone. Type exactly <strong>delete</strong> to continue.
      </Hint>
      <Input
        value={confirmText}
        onChange={(event) => setConfirmText(event.target.value)}
        placeholder="delete"
        disabled={busy}
      />

      <ActionRow>
        <Button type="submit" $tone="danger" disabled={busy || !isValid}>
          {busy ? 'Deleting…' : 'Delete Permanently'}
        </Button>
        <Button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </ActionRow>
    </Panel>
  );
}

export function ItemMarkGoneConsolePanel({
  busy = false,
  itemName,
  onCancel,
  onConfirm,
}) {
  const options = useMemo(
    () =>
      GONE_DISPOSITIONS.map((value) => ({
        value,
        label: dispositionLabelMap[value] || value,
      })),
    []
  );
  const [disposition, setDisposition] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!disposition || busy) return;
    await onConfirm?.({
      disposition,
      dispositionNotes: notes.trim(),
    });
  };

  return (
    <Panel onSubmit={handleSubmit}>
      <Body>
        Mark <strong>{itemName || 'this item'}</strong> as no longer owned.
      </Body>

      <Label>
        What happened?
        <Select
          value={disposition}
          onChange={(event) => setDisposition(event.target.value)}
          disabled={busy}
        >
          <option value="" disabled>
            Select a reason…
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Label>

      <Label>
        Notes or story (optional)
        <TextArea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
          placeholder="What happened to this item?"
        />
      </Label>

      <ActionRow>
        <Button type="submit" $tone="primary" disabled={busy || !disposition}>
          {busy ? 'Saving…' : 'Confirm Mark Gone'}
        </Button>
        <Button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </ActionRow>
    </Panel>
  );
}

export function ItemReclaimConsolePanel({
  busy = false,
  itemName,
  previousBoxLabel,
  onCancel,
  onConfirm,
}) {
  const hasPreviousBox = Boolean(String(previousBoxLabel || '').trim());

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    await onConfirm?.();
  };

  return (
    <Panel onSubmit={handleSubmit}>
      <Body>
        Reclaim <strong>{itemName || 'this item'}</strong> back into active inventory.
      </Body>
      <Hint>
        {hasPreviousBox
          ? `If still valid, this item will return to ${previousBoxLabel}. Otherwise it will be reclaimed as orphaned.`
          : 'If no previous box is available, this item will be reclaimed as orphaned.'}
      </Hint>

      <ActionRow>
        <Button type="submit" $tone="primary" disabled={busy}>
          {busy ? 'Reclaiming…' : 'Reclaim Item'}
        </Button>
        <Button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </ActionRow>
    </Panel>
  );
}
