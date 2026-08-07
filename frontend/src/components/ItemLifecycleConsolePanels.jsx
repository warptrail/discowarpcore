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
  border-radius: 3px;
  border: 1px solid #496473;
  background: #13212c;
  color: #f2f6f9;
  padding: 0 0.56rem;
`;

const TextArea = styled.textarea`
  min-height: 88px;
  border-radius: 3px;
  border: 1px solid #496473;
  background: #13212c;
  color: #f2f6f9;
  padding: 0.46rem 0.56rem;
  resize: vertical;
`;

const ReadOnlyDisposition = styled.div`
  min-height: 36px;
  display: flex;
  align-items: center;
  padding: 0 0.56rem;
  border: 1px solid rgba(240, 138, 123, 0.58);
  border-radius: 3px;
  color: #ffe7e1;
  background: rgba(94, 35, 41, 0.34);
  font-size: 0.82rem;
`;

const Verification = styled.label`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.5rem;
  padding: 0.55rem 0.58rem;
  border: 1px solid rgba(240, 138, 123, 0.48);
  border-radius: 3px;
  color: #ffe5df;
  background: rgba(94, 35, 41, 0.2);
  font-size: 0.78rem;
  line-height: 1.35;

  input {
    margin-top: 0.12rem;
    accent-color: #f08a7b;
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.44rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  min-height: 36px;
  border-radius: 3px;
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
  sold: 'Sold',
};

export function ItemMarkGoneConsolePanel({
  busy = false,
  itemName,
  initialDisposition = '',
  lockDisposition = false,
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
  const normalizedInitialDisposition = GONE_DISPOSITIONS.includes(initialDisposition)
    ? initialDisposition
    : '';
  const [disposition, setDisposition] = useState(normalizedInitialDisposition);
  const [notes, setNotes] = useState('');
  const [verified, setVerified] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!disposition || !verified || busy) return;
    await onConfirm?.({
      disposition,
      dispositionNotes: notes.trim(),
    });
  };

  return (
    <Panel onSubmit={handleSubmit}>
      <Body>
        Confirm that <strong>{itemName || 'this item'}</strong> has physically left the household.
      </Body>

      <Hint>
        This completes the departure job, removes active box placement, and archives the item under No Longer Have.
      </Hint>

      <Label>
        What happened?
        {lockDisposition && disposition ? (
          <ReadOnlyDisposition>
            {dispositionLabelMap[disposition] || disposition}
          </ReadOnlyDisposition>
        ) : (
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
        )}
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

      <Verification>
        <input
          type="checkbox"
          checked={verified}
          disabled={busy}
          onChange={(event) => setVerified(event.target.checked)}
        />
        <span>Yes, I am sure this item is no longer in our possession.</span>
      </Verification>

      <ActionRow>
        <Button type="submit" $tone="danger" disabled={busy || !disposition || !verified}>
          {busy ? 'Archiving…' : 'Archive as No Longer Have'}
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
