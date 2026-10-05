import { panelStyles, controlStyles, inputStyles } from '../../styles/primitives';
import BoxCompartmentSelect from '../BoxForms/BoxCompartmentSelect';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import IntakeBoxSelectorPanel from './IntakeBoxSelectorPanel';
import { getItemThumbnailUrl } from '../../util/itemImage';

const Panel = styled.section`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: 0.72rem;
  display: grid;
  gap: 0.55rem;

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
`;

const Heading = styled.h3`
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: #f0ddbf;
`;

const Hint = styled.p`
  margin: 0;
  color: #d0ba95;
  font-size: 0.78rem;
  line-height: 1.35;
`;

const Form = styled.form`
  display: grid;
  gap: 0.55rem;
`;

const Field = styled.div`
  display: grid;
  gap: 0.32rem;
`;

const Label = styled.div`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: #d4bf9f;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const PickerTrigger = styled.button`
  width: 100%;
  min-height: 48px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid ${({ $active }) => ($active ? 'rgba(236, 197, 133, 0.9)' : 'rgba(184, 151, 94, 0.55)')};
  background: ${({ $active }) => ($active ? 'rgba(44, 31, 16, 0.95)' : 'rgba(19, 14, 10, 0.9)')};
  color: #f7e6c9;
  text-align: left;
  padding: 0.48rem 0.62rem;
  display: grid;
  gap: 0.16rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  }

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;
`;

const PickerHeadline = styled.div`
  color: #f9ead2;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const PickerSubline = styled.div`
  color: #d3bc95;
  font-size: 0.72rem;
`;

const PickerPanel = styled.div`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: 0.5rem;
  display: grid;
  gap: 0.42rem;
`;

const SearchInput = styled.input`
  width: 100%;
  min-height: 40px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface);
  color: #f8e8cb;
  font-size: 0.86rem;
  padding: 0 0.58rem;

  &:focus {
    outline: none;
    border-color: rgba(236, 197, 133, 0.94);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
`;

const OptionList = styled.div`
  max-height: min(34vh, 280px);
  overflow: auto;
  display: grid;
  gap: 0.34rem;
`;

const OptionButton = styled.button`
  width: 100%;
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(236, 197, 133, 0.92)' : 'rgba(163, 131, 81, 0.5)')};
  border-radius: var(--dw-radius-sm);
  background: ${({ $selected }) => ($selected ? 'rgba(57, 39, 16, 0.94)' : 'rgba(24, 17, 10, 0.9)')};
  padding: 0.42rem 0.5rem;
  text-align: left;
  color: #f8e8cc;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 0.46rem;
  align-items: center;
  cursor: pointer;

  &:hover {
    filter: brightness(1.05);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 36px minmax(0, 1fr);
  }

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;
`;

const Thumb = styled.div`
  width: 40px;
  height: 40px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  overflow: hidden;
  background: var(--dw-surface);
  display: grid;
  place-items: center;
  color: #bd9f71;
  font-size: 0.75rem;
  text-transform: none;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const OptionTitle = styled.div`
  font-size: 0.84rem;
  font-weight: 700;
  color: #f7e8cf;
  overflow-wrap: anywhere;
`;

const OptionMeta = styled.div`
  font-size: 0.75rem;
  color: #d2b98f;
  line-height: 1.25;
`;

const SubmitButton = styled.button`
  width: 100%;
  min-height: 52px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface);
  color: #fff0d7;
  font-size: 0.91rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;
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

  ${controlStyles}
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#f6c3c3' : '#d6c39e')};
  font-size: 0.78rem;
  min-height: 1.1rem;
`;

const MissingState = styled.div`
  border: 1px dashed var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0.6rem;
  font-size: 0.78rem;
  color: #d6c39f;
`;

async function readMoveError(response, fallbackMessage) {
  const text = await response.text().catch(() => '');
  if (!text) return fallbackMessage;

  try {
    const parsed = JSON.parse(text);
    return parsed?.error || parsed?.message || fallbackMessage;
  } catch {
    return text;
  }
}

function getItemImageUrl(item) {
  return getItemThumbnailUrl(item);
}

function getCurrentBoxLabel(item) {
  const label = String(item?.box?.label || '').trim();
  const boxId = String(item?.box?.box_id || '').trim();
  if (label && boxId) return `${label} (Box #${boxId})`;
  if (label) return label;
  if (boxId) return `Box #${boxId}`;
  return 'Current box unknown';
}

export default function IntakeMoveItemPanel({
  currentBox,
  boxes = [],
  recentItems = [],
  seedItemId = '',
  onItemMoved,
}) {
  const [sourceItemId, setSourceItemId] = useState(seedItemId || '');
  const [compartmentKey, setCompartmentKey] = useState('A');
  const [destBoxId, setDestBoxId] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (seedItemId) {
      setSourceItemId(seedItemId);
    }
  }, [seedItemId]);

  useEffect(() => {
    if (recentItems.length === 0) {
      setSourceItemId('');
      return;
    }

    const exists = recentItems.some((item) => String(item?._id) === String(sourceItemId));
    if (!exists) {
      setSourceItemId(String(recentItems[0]?._id || ''));
    }
  }, [recentItems, sourceItemId]);

  const destinationBoxes = useMemo(
    () =>
      boxes.filter(
        (box) =>
          String(box?._id || '') &&
          String(box._id) !== String(currentBox?._id || ''),
      ),
    [boxes, currentBox?._id],
  );

  useEffect(() => {
    if (destinationBoxes.length === 0) {
      setDestBoxId('');
      return;
    }

    const exists = destinationBoxes.some((box) => String(box._id) === String(destBoxId));
    if (!exists) {
      setDestBoxId(String(destinationBoxes[0]?._id || ''));
    }
  }, [destinationBoxes, destBoxId]);

  const selectedItem = useMemo(
    () => recentItems.find((item) => String(item?._id || '') === String(sourceItemId || '')) || null,
    [recentItems, sourceItemId],
  );

  const selectedDestination = useMemo(
    () => destinationBoxes.find((box) => String(box?._id || '') === String(destBoxId || '')) || null,
    [destBoxId, destinationBoxes],
  );

  const filteredRecentItems = useMemo(() => {
    const q = String(itemSearch || '').trim().toLowerCase();
    if (!q) return recentItems;

    return recentItems.filter((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags.join(' ') : '';
      const haystack = [
        item?.name || '',
        item?.category || '',
        tags,
        item?.box?.label || '',
        item?.box?.box_id || '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [itemSearch, recentItems]);

  const canMove = !!currentBox?._id && !!sourceItemId && !!destBoxId && !busy;

  const handleMove = async (event) => {
    event.preventDefault();
    if (!canMove || !currentBox?._id) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/boxed-items/moveItem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: sourceItemId,
          sourceBoxId: currentBox._id,
          destBoxId,
          compartmentKey: selectedDestination?.isComplexBox ? compartmentKey : undefined,
        }),
      });

      if (!response.ok) {
        const message = await readMoveError(response, `Move failed (${response.status})`);
        throw new Error(message);
      }

      const message = `Moved ${selectedItem?.name || 'item'} to box #${selectedDestination?.box_id || '---'}.`;
      setStatus(message);
      onItemMoved?.({
        itemId: sourceItemId,
        destBoxId,
        sourceBoxId: String(selectedItem?.box?._id || selectedItem?.boxId || currentBox?._id || ''),
        sourceBox: selectedItem?.box
          ? {
              _id: selectedItem.box._id,
              box_id: selectedItem.box.box_id,
              label: selectedItem.box.label,
            }
          : currentBox
            ? {
                _id: currentBox._id,
                box_id: currentBox.box_id,
                label: currentBox.label,
              }
            : null,
        item: selectedItem
          ? {
              ...selectedItem,
              boxId: destBoxId,
              box: {
                _id: selectedDestination?._id,
                box_id: selectedDestination?.box_id,
                label: selectedDestination?.label,
              },
            }
          : undefined,
        message,
      });
    } catch (moveError) {
      setError(moveError?.message || 'Failed to move item.');
    } finally {
      setBusy(false);
    }
  };

  if (!currentBox?._id) {
    return <MissingState>Select a current box first to move items out of it.</MissingState>;
  }

  if (recentItems.length === 0) {
    return <MissingState>No recent items yet. Add an item first, then move it if needed.</MissingState>;
  }

  if (destinationBoxes.length === 0) {
    return <MissingState>No destination boxes are available yet.</MissingState>;
  }

  return (
    <Panel>
      <Heading>Move Item</Heading>
      <Hint>
        Quick correction workflow: pick a recent intake item, then send it to the
        right destination box.
      </Hint>

      <Form onSubmit={handleMove}>
        <Field>
          <Label>Recent Item</Label>
          <PickerTrigger
            type="button"
            $active={itemPickerOpen}
            onClick={() => {
              setItemPickerOpen((prev) => !prev);
              setDestinationPickerOpen(false);
            }}
            disabled={busy}
          >
            <PickerHeadline>{selectedItem?.name || 'Select item'}</PickerHeadline>
            <PickerSubline>
              {selectedItem
                ? `qty ${selectedItem?.quantity ?? 1} • ${selectedItem?.category || 'uncategorized'}`
                : 'Choose a recent item'}
            </PickerSubline>
          </PickerTrigger>

          {itemPickerOpen ? (
            <PickerPanel>
              <SearchInput
                type="text"
                value={itemSearch}
                onChange={(event) => setItemSearch(event.target.value)}
                placeholder="Search recent items"
                aria-label="Search recent items"
                disabled={busy}
              />

              <OptionList>
                {filteredRecentItems.length === 0 ? (
                  <StateText>No matching recent items.</StateText>
                ) : (
                  filteredRecentItems.map((item) => {
                    const id = String(item?._id || '');
                    const imageUrl = getItemImageUrl(item);
                    const isSelected = id === String(sourceItemId || '');

                    return (
                      <OptionButton
                        key={id || `${item?.name || 'item'}-${item?.createdAt || ''}`}
                        type="button"
                        $selected={isSelected}
                        onClick={() => {
                          setSourceItemId(id);
                          setItemPickerOpen(false);
                        }}
                      >
                        <Thumb>
                          {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : 'No Img'}
                        </Thumb>
                        <div>
                          <OptionTitle>{item?.name || 'Unnamed item'}</OptionTitle>
                          <OptionMeta>
                            qty {item?.quantity ?? 1} • {item?.category || 'uncategorized'}
                          </OptionMeta>
                          <OptionMeta>{getCurrentBoxLabel(item)}</OptionMeta>
                        </div>
                      </OptionButton>
                    );
                  })
                )}
              </OptionList>
            </PickerPanel>
          ) : null}
        </Field>

        <Field>
          <Label>Destination Box</Label>
          <PickerTrigger
            type="button"
            $active={destinationPickerOpen}
            onClick={() => {
              setDestinationPickerOpen((prev) => !prev);
              setItemPickerOpen(false);
            }}
            disabled={busy}
          >
            <PickerHeadline>
              {selectedDestination
                ? `${selectedDestination?.label || 'Unnamed Box'} (Box #${selectedDestination?.box_id || '---'})`
                : 'Select destination box'}
            </PickerHeadline>
            <PickerSubline>
              {selectedDestination?.location
                ? `Location: ${selectedDestination.location}`
                : 'Choose where the item should move'}
            </PickerSubline>
          </PickerTrigger>

          {destinationPickerOpen ? (
            <PickerPanel>
              <IntakeBoxSelectorPanel
                boxes={destinationBoxes}
                selectedBoxId={destBoxId}
                title="Select Destination Box"
                onSelectBox={(nextBoxId) => {
                  setDestBoxId(String(nextBoxId || ''));
                  setDestinationPickerOpen(false);
                }}
                onClose={() => setDestinationPickerOpen(false)}
              />
            </PickerPanel>
          ) : null}
        </Field>

        <BoxCompartmentSelect box={selectedDestination} value={compartmentKey} onChange={setCompartmentKey} disabled={busy} />
        <SubmitButton type="submit" disabled={!canMove}>
          {busy ? 'Moving…' : 'Move Item'}
        </SubmitButton>

        <StateText $error={!!error}>{error || status || ' '}</StateText>
      </Form>
    </Panel>
  );
}
