import { consoleControlStyles, primaryCommandStyles } from './IntakeConsole.styles';
import CaptureGlyph from './CaptureGlyph';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Actions = styled.div`
  display: grid;
  grid-template-columns: ${({ $choosing }) => $choosing ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1.5fr) repeat(2, minmax(0, 1fr)) 44px'};
  gap: 4px;
  min-width: 0;
  padding-block: 12px;
  border-block: 1px solid var(--dw-border-soft);
`;

const Button = styled.button`
  ${consoleControlStyles}
  min-width: 0;
  padding: 8px;
  font-size: .75rem;
  ${({ $primary }) => $primary && primaryCommandStyles}
  &[aria-expanded='true'] {
    color: var(--dw-cyan);
    box-shadow: inset 0 -1px var(--dw-cyan);
  }
  > svg {
    flex-shrink: 0;
    color: var(--dw-cyan);
  }
  ${({ $primary }) => $primary && '> svg { color: inherit; }'}
`;

const OpenBox = styled(Link)`
  ${consoleControlStyles}
  color: var(--dw-cyan);
  padding: 8px;
  text-decoration: none;
`;

export default function IntakeDestinationActions({
  box,
  onAddItem,
  onChangeDestination,
  onEditBox,
  onCreateBox,
  chooseOpen = false,
  createOpen = false,
}) {
  if (!box?._id || chooseOpen || createOpen) {
    return (
      <Actions $choosing>
        <Button type="button" $choice $active={chooseOpen} aria-expanded={chooseOpen} onClick={onChangeDestination}><CaptureGlyph kind="item" /> Choose box</Button>
        <Button type="button" $createChoice $active={createOpen} aria-expanded={createOpen} onClick={onCreateBox}><CaptureGlyph kind="new" /> Create box</Button>
      </Actions>
    );
  }

  return (
    <Actions>
      <Button type="button" $primary onClick={onAddItem}><CaptureGlyph kind="plus" /> Add item</Button>
      <Button type="button" onClick={onChangeDestination}><CaptureGlyph kind="change" /> Change</Button>
      <Button type="button" onClick={onEditBox}><CaptureGlyph kind="edit" /> Edit</Button>
      <OpenBox
        to={`/boxes/${encodeURIComponent(box.box_id)}`}
        aria-label={`Open full workspace for ${box.label || 'current box'}`}
        title="Open full box workspace"
      >
        <CaptureGlyph kind="intake" />
      </OpenBox>
    </Actions>
  );
}
