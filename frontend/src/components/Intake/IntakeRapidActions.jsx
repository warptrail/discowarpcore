import { controlStyles } from '../../styles/primitives';
import React, { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import { getItemThumbnailUrl } from '../../util/itemImage';

const ROUTING_COMMAND_THEME = {
  primaryRgb: '0, 223, 214',
  secondaryRgb: '143, 101, 255',
  neonRgb: '215, 235, 255',
  neon: '#d7ebff',
};


const Command = styled.section`
  --route-primary-rgb: ${({ $primaryRgb }) => $primaryRgb || '100, 220, 213'};
  --route-secondary-rgb: ${({ $secondaryRgb }) => $secondaryRgb || '167, 182, 255'};
  --route-neon-rgb: ${({ $neonRgb }) => $neonRgb || '217, 255, 250'};
  --route-neon: ${({ $neon }) => $neon || '#d9fffa'};
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
  width: min(100%, 390px);
  min-width: 0;
  padding: 0.42rem;
  border: 1px solid var(--dw-border);
  border-left: 4px solid rgb(var(--route-secondary-rgb));
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  box-shadow: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
  }
`;

const ItemContext = styled.div`
  display: grid;
  grid-template-columns: ${({ $hasImage }) => ($hasImage ? '32px minmax(0, 1fr)' : 'minmax(0, 1fr)')};
  gap: 0.42rem;
  align-items: center;
  min-width: 0;
`;

const Thumb = styled.div`
  width: 32px;
  height: 32px;
  overflow: hidden;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: rgba(164, 214, 211, 0.74);
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-transform: none;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ContextText = styled.div`
  display: grid;
  gap: 0.14rem;
  min-width: 0;
`;

const ContextLabel = styled.div`
  color: #ae99ff;
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
`;

const ItemName = styled.div`
  overflow: hidden;
  color: #e8f5f2;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemMeta = styled.div`
  overflow: hidden;
  color: rgba(var(--route-secondary-rgb), 0.9);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  min-width: 116px;
  min-height: 44px;
  padding: 0.45rem 0.65rem;
  border: 1px solid ${({ $ready }) =>
    $ready ? 'rgba(var(--route-primary-rgb), 0.94)' : 'rgba(var(--route-primary-rgb), 0.38)'};
  border-radius: var(--dw-radius-sm);
  background: ${({ $ready }) =>
    $ready
      ? 'var(--dw-surface-raised)'
      : 'rgba(12, 24, 30, 0.72)'};
  color: ${({ $ready }) => ($ready ? 'var(--route-neon)' : 'rgba(var(--route-secondary-rgb), 0.68)')};
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.055em;
  line-height: 1.1;
  text-transform: none;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;

  ${({ $ready }) =>
    $ready &&
    css`
      animation: none;
    `}

  &:hover:not(:disabled) {
    border-color: rgba(var(--route-neon-rgb), 0.98);
    background: var(--dw-surface);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #a78bfa;
    outline-offset: 2px;
  }

  &:disabled {
    border-color: rgba(123, 154, 157, 0.34);
    background: var(--dw-surface-raised);
    color: rgba(185, 207, 207, 0.54);
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }

  ${controlStyles}
`;

const StateText = styled.div`
  grid-column: 1 / -1;
  color: ${({ $error }) => ($error ? '#ffc4ce' : '#a9e6db')};
  font-size: 0.75rem;
  line-height: 1.25;
`;

function getItemImageUrl(item) {
  return getItemThumbnailUrl(item);
}

function getCurrentBoxLabel(item) {
  const breadcrumb = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const leaf = breadcrumb[breadcrumb.length - 1] || null;
  const label = String(item?.box?.label || leaf?.label || '').trim();
  const boxId = String(item?.box?.box_id || leaf?.box_id || '').trim();
  if (label && boxId) return `${label} · #${boxId}`;
  if (label) return label;
  if (boxId) return `#${boxId}`;
  return 'Orphaned';
}

function getSourceBox(item) {
  if (item?.box && typeof item.box === 'object') return item.box;
  const breadcrumb = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const leaf = breadcrumb[breadcrumb.length - 1];
  return leaf && typeof leaf === 'object' ? leaf : null;
}

export default function IntakeRapidActions({
  currentBox,
  selectedItem = null,
  onItemMoved,
  onComplete,
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const selectedItemId = String(selectedItem?._id || '').trim();
  const currentBoxId = String(currentBox?._id || '').trim();
  const itemInCurrentBox = useMemo(
    () =>
      Boolean(currentBoxId) &&
      String(selectedItem?.box?._id || selectedItem?.boxId || '') === currentBoxId,
    [currentBoxId, selectedItem?.box?._id, selectedItem?.boxId],
  );
  const sourceBox = getSourceBox(selectedItem);
  const sourceBoxId = String(sourceBox?._id || selectedItem?.boxId || '').trim();
  const itemAlreadyAdrift = !sourceBoxId;
  const canMove = Boolean(
    selectedItemId &&
    !busy &&
    (currentBoxId ? !itemInCurrentBox : !itemAlreadyAdrift),
  );
  const imageUrl = getItemImageUrl(selectedItem);
  const destinationId = String(currentBox?.box_id || '').trim();
  const destinationTheme = ROUTING_COMMAND_THEME;
  const destinationLabel = destinationId ? `#${destinationId}` : 'Items Adrift';
  const buttonLabel = busy
    ? 'Moving…'
    : !selectedItemId
      ? 'Choose item'
      : !currentBoxId && itemAlreadyAdrift
        ? 'Already adrift'
        : itemInCurrentBox
          ? 'Already there'
          : currentBoxId
            ? `Move to ${destinationLabel}`
            : 'Cast adrift';
  const contextName = selectedItemId
    ? selectedItem?.name || 'Unnamed item'
    : 'Choose an activity item';
  const contextMeta = selectedItemId
    ? `${getCurrentBoxLabel(selectedItem)} → ${destinationLabel}`
    : currentBoxId
      ? `Destination ${destinationLabel}`
      : currentBoxId
        ? `Destination ${destinationLabel}`
        : 'No box selected // route to Items Adrift';

  const handleMoveToCurrent = async () => {
    if (!canMove) return;
    setBusy(true);
    setStatus('');
    setError('');

    try {
      const endpoint = currentBoxId
        ? `${API_BASE}/api/boxed-items/moveItem`
        : `${API_BASE}/api/boxed-items/${encodeURIComponent(sourceBoxId)}/removeItem`;
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          currentBoxId
            ? { itemId: selectedItemId, destBoxId: currentBoxId }
            : { itemId: selectedItemId },
        ),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || body?.message || `Move failed (${response.status})`);
      }

      const movedMessage = currentBoxId
        ? `Moved ${selectedItem?.name || 'item'} to box #${currentBox?.box_id || '---'}.`
        : `Cast ${selectedItem?.name || 'item'} adrift.`;
      setStatus(movedMessage);
      onItemMoved?.({
        itemId: selectedItemId,
        destBoxId: currentBoxId,
        sourceBoxId,
        sourceBox: sourceBox
          ? {
              _id: sourceBox._id,
              box_id: sourceBox.box_id,
              label: sourceBox.label,
            }
          : null,
        item: {
          ...selectedItem,
          boxId: currentBoxId,
          box: currentBoxId
            ? {
                _id: currentBoxId,
                box_id: currentBox?.box_id,
                label: currentBox?.label,
              }
            : null,
        },
        message: movedMessage,
      });
      onComplete?.();
    } catch (moveError) {
      setError(moveError?.message || 'Failed to move item.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Command
      aria-label="Move selected item to current box"
      $primaryRgb={destinationTheme.primaryRgb}
      $secondaryRgb={destinationTheme.secondaryRgb}
      $neonRgb={destinationTheme.neonRgb}
      $neon={destinationTheme.neon}
    >
      <ItemContext $hasImage={Boolean(imageUrl)}>
        {imageUrl ? (
          <Thumb aria-hidden="true">
            <ThumbImage src={imageUrl} alt="" />
          </Thumb>
        ) : null}
        <ContextText>
          <ContextLabel>Selected item</ContextLabel>
          <ItemName title={contextName}>{contextName}</ItemName>
          <ItemMeta title={contextMeta}>{contextMeta}</ItemMeta>
        </ContextText>
      </ItemContext>
      <ActionButton type="button" $ready={canMove} disabled={!canMove} onClick={handleMoveToCurrent}>
        {buttonLabel}
      </ActionButton>
      {error || status ? <StateText $error={Boolean(error)}>{error || status}</StateText> : null}
    </Command>
  );
}
