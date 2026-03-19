import React from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';

function formatDisposition(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function EditItemLifecycleSection({
  item,
  disabled = false,
  onMarkGoneRequest,
  onDeletePermanentlyRequest,
  onReclaimRequest,
}) {
  const isGone = String(item?.item_status || '').toLowerCase() === 'gone';
  const statusLabel = isGone ? 'No Longer Have' : 'Active';

  return (
    <S.LifecycleSection>
      <S.LifecycleHeader>Inventory Lifecycle</S.LifecycleHeader>

      <S.LifecycleMetaGrid>
        <S.LifecycleMetaRow>
          <S.LifecycleMetaLabel>Status</S.LifecycleMetaLabel>
          <S.LifecycleMetaValue>{statusLabel}</S.LifecycleMetaValue>
        </S.LifecycleMetaRow>
        <S.LifecycleMetaRow>
          <S.LifecycleMetaLabel>Reason</S.LifecycleMetaLabel>
          <S.LifecycleMetaValue>{formatDisposition(item?.disposition)}</S.LifecycleMetaValue>
        </S.LifecycleMetaRow>
        <S.LifecycleMetaRow>
          <S.LifecycleMetaLabel>Timestamp</S.LifecycleMetaLabel>
          <S.LifecycleMetaValue>{formatTimestamp(item?.disposition_at)}</S.LifecycleMetaValue>
        </S.LifecycleMetaRow>
        <S.LifecycleMetaRow>
          <S.LifecycleMetaLabel>Notes</S.LifecycleMetaLabel>
          <S.LifecycleMetaValue>{item?.disposition_notes || '—'}</S.LifecycleMetaValue>
        </S.LifecycleMetaRow>
      </S.LifecycleMetaGrid>

      <S.FieldHint>
        Lifecycle changes are restricted to this item page edit form and confirmed in
        the console.
      </S.FieldHint>

      <S.InlineActions>
        {!isGone && typeof onMarkGoneRequest === 'function' ? (
          <S.SmallActionButton
            type="button"
            disabled={disabled}
            onClick={onMarkGoneRequest}
          >
            Mark Gone
          </S.SmallActionButton>
        ) : null}

        {isGone && typeof onReclaimRequest === 'function' ? (
          <S.SmallActionButton
            type="button"
            disabled={disabled}
            onClick={onReclaimRequest}
          >
            Reclaim Item
          </S.SmallActionButton>
        ) : null}

        {typeof onDeletePermanentlyRequest === 'function' ? (
          <S.SmallActionButton
            type="button"
            $tone="danger"
            disabled={disabled}
            onClick={onDeletePermanentlyRequest}
          >
            Delete Permanently
          </S.SmallActionButton>
        ) : null}
      </S.InlineActions>
    </S.LifecycleSection>
  );
}
