import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';

const Section = styled.section`
  display: grid;
  gap: 0.46rem;
  min-width: 0;
  width: 100%;
  max-width: 100%;
`;

const Panel = styled.section`
  border: 1px solid rgba(177, 134, 75, 0.45);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(33, 25, 16, 0.94) 0%, rgba(23, 18, 13, 0.96) 100%);
  padding: 0.58rem;
  display: grid;
  gap: 0.44rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
`;

const Hint = styled.p`
  margin: 0;
  color: #d0ba95;
  font-size: 0.74rem;
  line-height: 1.35;
`;

const Card = styled.div`
  border: 1px solid rgba(177, 145, 91, 0.48);
  border-radius: 10px;
  background: rgba(19, 13, 8, 0.85);
  padding: 0.44rem;
  display: grid;
  gap: 0.36rem;
  min-width: 0;
`;

const CardLabel = styled.div`
  margin: 0;
  font-size: 0.67rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #d4bf9f;
`;

const SelectedItemRow = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 0.42rem;
  align-items: start;
  min-width: 0;
`;

const Thumb = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(167, 132, 84, 0.5);
  overflow: hidden;
  background: rgba(27, 20, 12, 0.95);
  display: grid;
  place-items: center;
  color: #bd9f71;
  font-size: 0.58rem;
  text-transform: uppercase;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SelectedBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.12rem;
`;

const SelectedName = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: #f7e8cf;
  overflow-wrap: anywhere;
`;

const SelectedMeta = styled.div`
  font-size: 0.68rem;
  color: #d2b98f;
  line-height: 1.25;
`;

const EmptyState = styled.div`
  border: 1px dashed rgba(191, 155, 94, 0.52);
  border-radius: 10px;
  padding: 0.52rem;
  font-size: 0.76rem;
  color: #d6c39f;
`;

const ActionButton = styled.button`
  width: 100%;
  min-height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(228, 176, 92, 0.76);
  background: linear-gradient(180deg, rgba(116, 74, 25, 0.92) 0%, rgba(83, 53, 19, 0.95) 100%);
  color: #fff0d7;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: 0.54;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#f6c3c3' : '#d6c39e')};
  font-size: 0.74rem;
  min-height: 0.96rem;
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
  if (label && boxId) return `${label} (#${boxId})`;
  if (label) return label;
  if (boxId) return `#${boxId}`;
  return 'Orphaned';
}

export default function IntakeRapidActions({
  currentBox,
  selectedItem = null,
  onItemMoved,
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const selectedItemId = String(selectedItem?._id || '').trim();
  const currentBoxId = String(currentBox?._id || '').trim();
  const itemInCurrentBox = useMemo(
    () => String(selectedItem?.box?._id || selectedItem?.boxId || '') === currentBoxId,
    [currentBoxId, selectedItem?.box?._id, selectedItem?.boxId],
  );
  const canMove = !!selectedItemId && !!currentBoxId && !busy && !itemInCurrentBox;
  const destinationLabel = currentBox?.box_id
    ? `${currentBox?.label || 'Unnamed Box'} (#${currentBox.box_id})`
    : 'No current box selected';
  const imageUrl = getItemImageUrl(selectedItem);

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
    } catch (moveError) {
      setError(moveError?.message || 'Failed to move item.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section>
      <Panel>
        <Hint>
          Route selected intake items into the current box.
        </Hint>

        <Card>
          <CardLabel>Selected Item</CardLabel>
          {selectedItemId ? (
            <SelectedItemRow>
              <Thumb>
                {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : 'No Img'}
              </Thumb>
              <SelectedBody>
                <SelectedName>{selectedItem?.name || 'Unnamed item'}</SelectedName>
                <SelectedMeta>Current: {getCurrentBoxLabel(selectedItem)}</SelectedMeta>
              </SelectedBody>
            </SelectedItemRow>
          ) : (
            <EmptyState>Select an item from recent activity to move it.</EmptyState>
          )}
        </Card>

        <Card>
          <CardLabel>Destination</CardLabel>
          <SelectedMeta>{destinationLabel}</SelectedMeta>
        </Card>

        <ActionButton type="button" disabled={!canMove} onClick={handleMoveToCurrent}>
          {busy
            ? 'Moving…'
            : itemInCurrentBox
              ? 'Already In Current Box'
              : 'Move To Current Box'}
        </ActionButton>

        <StateText $error={!!error}>{error || status || ' '}</StateText>
      </Panel>
    </Section>
  );
}
