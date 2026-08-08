import React, { useMemo, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { getItemThumbnailUrl } from '../../util/itemImage';

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

  ${({ $ready }) =>
    $ready &&
    css`
      animation: ${routeReadyPulse} 2.8s ease-in-out infinite;
    `}

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
  const destinationTheme = getBoxTheme(destinationId);
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
