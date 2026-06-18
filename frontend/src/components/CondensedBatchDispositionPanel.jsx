import React, { useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { markItemGone } from '../api/itemLifecycle';
import { ToastContext } from './Toast';

const DISPOSITION_OPTIONS = Object.freeze([
  { value: 'trashed', label: 'Trash' },
  { value: 'donated', label: 'Donate' },
  { value: 'gifted', label: 'Gift' },
  { value: 'sold', label: 'Sell' },
  { value: 'lost', label: 'Lost' },
]);

function getItemId(item) {
  return String(item?._id ?? item?.id ?? '').trim();
}

export default function CondensedBatchDispositionPanel({
  selectedItems,
  isOpen,
  onOpenChange,
  onDisposed,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const [disposition, setDisposition] = useState(DISPOSITION_OPTIONS[0].value);
  const [isSaving, setIsSaving] = useState(false);

  const dispositionTargets = useMemo(() => {
    return (Array.isArray(selectedItems) ? selectedItems : [])
      .map((item) => ({
        item,
        itemId: getItemId(item),
      }))
      .filter((entry) => entry.itemId);
  }, [selectedItems]);

  const selectedCount = dispositionTargets.length;
  if (!isOpen || !selectedCount) return null;

  const selectedOption =
    DISPOSITION_OPTIONS.find((option) => option.value === disposition) ||
    DISPOSITION_OPTIONS[0];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving || !selectedOption?.value) return;

    try {
      setIsSaving(true);
      const results = await Promise.allSettled(
        dispositionTargets.map((entry) =>
          markItemGone(entry.itemId, {
            disposition: selectedOption.value,
            dispositionNotes: `Batch disposition: ${selectedOption.label}`,
          }),
        ),
      );

      const failed = results.filter((result) => result.status === 'rejected');
      const disposedCount = results.length - failed.length;

      if (failed.length) {
        showToast?.({
          variant: disposedCount ? 'warning' : 'danger',
          title: disposedCount ? 'Disposition partially completed' : 'Disposition failed',
          message: disposedCount
            ? `${disposedCount} marked ${selectedOption.label.toLowerCase()}, ${failed.length} failed.`
            : failed[0]?.reason?.message || 'Could not dispose of the selected items.',
          timeoutMs: 6200,
        });
      } else {
        showToast?.({
          variant: 'success',
          title: 'Items disposed',
          message: `${disposedCount} ${
            disposedCount === 1 ? 'item' : 'items'
          } marked ${selectedOption.label.toLowerCase()}.`,
          timeoutMs: 3800,
        });
      }

      await onDisposed?.();
      onOpenChange?.(false);
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Disposition failed',
        message: error?.message || 'Could not dispose of the selected items.',
        timeoutMs: 5200,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel onSubmit={handleSubmit}>
      <WorkspaceHeader>
        <WorkspaceTitle>
          Dispose of {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
        </WorkspaceTitle>
        {isSaving ? <StatusText>Saving...</StatusText> : null}
      </WorkspaceHeader>

      <DispositionGrid role="radiogroup" aria-label="Disposition reason">
        {DISPOSITION_OPTIONS.map((option) => (
          <DispositionOption key={option.value}>
            <DispositionRadio
              type="radio"
              name="condensed-batch-disposition"
              value={option.value}
              checked={disposition === option.value}
              onChange={() => setDisposition(option.value)}
              disabled={isSaving}
            />
            <DispositionLabel>{option.label}</DispositionLabel>
          </DispositionOption>
        ))}
      </DispositionGrid>

      <ActionRow>
        <ConfirmButton type="submit" disabled={isSaving || !selectedOption?.value}>
          {isSaving ? 'Saving...' : `Confirm ${selectedOption.label}`}
        </ConfirmButton>
        <CancelButton
          type="button"
          onClick={() => onOpenChange?.(false)}
          disabled={isSaving}
        >
          Cancel
        </CancelButton>
      </ActionRow>
    </Panel>
  );
}

const Panel = styled.form`
  display: grid;
  gap: 0.7rem;
  margin: 0 0 0.75rem;
  padding: 0.72rem;
  border: 1px solid rgba(240, 180, 104, 0.34);
  border-radius: 10px;
  background: rgba(32, 20, 10, 0.72);
`;

const WorkspaceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const WorkspaceTitle = styled.h4`
  margin: 0;
  color: #fff2df;
  font-size: 0.96rem;
  line-height: 1.2;
`;

const StatusText = styled.span`
  color: rgba(255, 242, 223, 0.72);
  font-size: 0.78rem;
`;

const DispositionGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const DispositionOption = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  min-height: 34px;
  border: 1px solid rgba(240, 180, 104, 0.32);
  border-radius: 999px;
  background: rgba(240, 180, 104, 0.1);
  color: #ffe9cc;
  padding: 0 0.62rem;
  cursor: pointer;
`;

const DispositionRadio = styled.input`
  accent-color: #f0b468;
`;

const DispositionLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 760;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const ConfirmButton = styled.button`
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(240, 180, 104, 0.62);
  background: rgba(116, 67, 21, 0.78);
  color: #fff2df;
  padding: 0 0.72rem;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #e7edf2;
  padding: 0 0.72rem;
  font-size: 0.78rem;
  font-weight: 760;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
