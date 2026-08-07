import React, { useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

const routeReadyPulse = keyframes`
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgba(var(--route-secondary-rgb), 0.34),
      0 0 0 1px rgba(var(--route-primary-rgb), 0.2),
      0 0 10px rgba(var(--route-primary-rgb), 0.18);
  }

  50% {
    box-shadow:
      inset 0 1px 0 rgba(var(--route-secondary-rgb), 0.5),
      0 0 0 1px rgba(var(--route-primary-rgb), 0.46),
      0 0 16px rgba(var(--route-primary-rgb), 0.34);
  }
`;

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
  padding: 0.38rem 0.42rem;
  border: 1px solid rgba(var(--route-primary-rgb), 0.56);
  border-left: 3px solid rgb(var(--route-primary-rgb));
  border-radius: 5px;
  background:
    linear-gradient(
      106deg,
      rgba(var(--route-primary-rgb), 0.16),
      rgba(var(--route-secondary-rgb), 0.075) 48%,
      rgba(5, 10, 16, 0.72) 88%
    );
  box-shadow: inset 0 1px 0 rgba(var(--route-secondary-rgb), 0.16);

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
  border: 1px solid rgba(var(--route-primary-rgb), 0.46);
  border-radius: 6px;
  background: rgba(9, 17, 24, 0.86);
  color: rgba(164, 214, 211, 0.74);
  display: grid;
  place-items: center;
  font-size: 0.54rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ContextText = styled.div`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.64rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  min-width: 132px;
  min-height: 40px;
  padding: 0.45rem 0.65rem;
  border: 1px solid ${({ $ready }) =>
    $ready ? 'rgba(var(--route-primary-rgb), 0.94)' : 'rgba(var(--route-primary-rgb), 0.38)'};
  border-radius: 5px;
  background: ${({ $ready }) =>
    $ready
      ? 'linear-gradient(112deg, rgba(var(--route-primary-rgb), 0.3), rgba(var(--route-secondary-rgb), 0.18))'
      : 'rgba(12, 24, 30, 0.72)'};
  color: ${({ $ready }) => ($ready ? 'var(--route-neon)' : 'rgba(var(--route-secondary-rgb), 0.68)')};
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.055em;
  line-height: 1.1;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;

  ${({ $ready }) => ($ready ? `animation: ${routeReadyPulse} 2.8s ease-in-out infinite;` : '')}

  &:hover:not(:disabled) {
    border-color: rgba(var(--route-neon-rgb), 0.98);
    background: linear-gradient(112deg, rgba(var(--route-primary-rgb), 0.4), rgba(var(--route-secondary-rgb), 0.24));
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #a78bfa;
    outline-offset: 2px;
  }

  &:disabled {
    border-color: rgba(123, 154, 157, 0.34);
    background: rgba(20, 30, 34, 0.66);
    color: rgba(185, 207, 207, 0.54);
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
`;

const StateText = styled.div`
  grid-column: 1 / -1;
  color: ${({ $error }) => ($error ? '#ffc4ce' : '#a9e6db')};
  font-size: 0.68rem;
  line-height: 1.25;
`;

function getItemImageUrl(item) {
  return (
    item?.image?.thumb?.url ||
    item?.image?.display?.url ||
    item?.image?.original?.url ||
    item?.image?.url ||
    item?.imagePath ||
    ''
  );
}

function getCurrentBoxLabel(item) {
  const label = String(item?.box?.label || '').trim();
  const boxId = String(item?.box?.box_id || '').trim();
  if (label && boxId) return `${label} · #${boxId}`;
  if (label) return label;
  if (boxId) return `#${boxId}`;
  return 'Orphaned';
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
  const canMove = Boolean(selectedItemId && currentBoxId && !busy && !itemInCurrentBox);
  const imageUrl = getItemImageUrl(selectedItem);
  const destinationId = String(currentBox?.box_id || '').trim();
  const destinationTheme = getBoxTheme(destinationId);
  const destinationLabel = destinationId ? `#${destinationId}` : 'No destination';
  const buttonLabel = busy
    ? 'Moving…'
    : !selectedItemId
      ? 'Choose item'
      : !currentBoxId
        ? 'Choose box'
        : itemInCurrentBox
          ? 'Already there'
          : `Move to ${destinationLabel}`;
  const contextName = selectedItemId
    ? selectedItem?.name || 'Unnamed item'
    : 'Choose an activity item';
  const contextMeta = selectedItemId
    ? `${getCurrentBoxLabel(selectedItem)} → ${destinationLabel}`
    : currentBoxId
      ? `Destination ${destinationLabel}`
      : 'Select a box, then an activity item';

  const handleMoveToCurrent = async () => {
    if (!canMove) return;
    setBusy(true);
    setStatus('');
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/boxed-items/moveItem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItemId,
          destBoxId: currentBoxId,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || body?.message || `Move failed (${response.status})`);
      }

      const movedMessage = `Moved ${selectedItem?.name || 'item'} to box #${currentBox?.box_id || '---'}.`;
      setStatus(movedMessage);
      onItemMoved?.({
        itemId: selectedItemId,
        destBoxId: currentBoxId,
        sourceBoxId: String(selectedItem?.box?._id || selectedItem?.boxId || ''),
        sourceBox: selectedItem?.box
          ? {
              _id: selectedItem.box._id,
              box_id: selectedItem.box.box_id,
              label: selectedItem.box.label,
            }
          : null,
        item: {
          ...selectedItem,
          boxId: currentBoxId,
          box: {
            _id: currentBoxId,
            box_id: currentBox?.box_id,
            label: currentBox?.label,
          },
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
      style={getBoxThemeCssVars(destinationTheme)}
    >
      <ItemContext $hasImage={Boolean(imageUrl)}>
        {imageUrl ? (
          <Thumb aria-hidden="true">
            <ThumbImage src={imageUrl} alt="" />
          </Thumb>
        ) : null}
        <ContextText>
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
