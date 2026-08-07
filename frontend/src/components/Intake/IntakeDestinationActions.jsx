import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.36rem;
  align-items: stretch;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(var(--box-primary-rgb), 0.28);

`;

const Button = styled.button`
  min-height: 42px;
  grid-column: ${({ $primary, $fullRow }) => ($primary || $fullRow ? '1 / -1' : 'auto')};
  border: 1px solid ${({ $primary }) =>
    $primary ? 'rgba(var(--box-primary-rgb), 0.78)' : 'rgba(var(--box-secondary-rgb), 0.48)'};
  border-radius: 5px;
  background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(110deg, rgba(var(--box-primary-rgb), 0.25), rgba(var(--box-secondary-rgb), 0.1))'
      : 'transparent'};
  color: ${({ $primary }) =>
    $primary ? 'var(--box-neon)' : 'rgba(var(--box-secondary-rgb), 0.84)'};
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  padding: 0.35rem 0.65rem;
  text-transform: uppercase;

  &:hover { background: ${({ $primary }) => ($primary ? 'linear-gradient(110deg, rgba(var(--box-primary-rgb), 0.34), rgba(var(--box-secondary-rgb), 0.16))' : 'rgba(var(--box-primary-rgb), 0.13)')}; }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: 2px; }
`;

const OpenBox = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 1px solid rgba(var(--box-secondary-rgb), 0.56);
  border-radius: 5px;
  color: var(--box-neon);
  text-decoration: none;

  &:hover { background: rgba(var(--box-primary-rgb), 0.13); }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: 2px; }
`;

const WorkspaceArrow = styled.svg`
  width: 1.2rem;
  height: 1.2rem;
  overflow: visible;
  filter: drop-shadow(0 0 6px rgba(var(--box-primary-rgb), 0.3));
`;

export default function IntakeDestinationActions({
  box,
  onAddItem,
  onChangeDestination,
  onEditBox,
  onCreateBox,
}) {
  if (!box?._id) {
    return (
      <Actions>
        <Button type="button" $primary onClick={onChangeDestination}>Choose box</Button>
        <Button type="button" $fullRow onClick={onCreateBox}>Create a box</Button>
      </Actions>
    );
  }

  return (
    <Actions>
      <Button type="button" $primary onClick={onAddItem}>Add item</Button>
      <Button type="button" onClick={onChangeDestination}>Change</Button>
      <Button type="button" onClick={onEditBox}>Edit</Button>
      <OpenBox
        to={`/boxes/${encodeURIComponent(box.box_id)}`}
        aria-label={`Open full workspace for ${box.label || 'current box'}`}
        title="Open full box workspace"
      >
        <WorkspaceArrow viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M7 17 17 7M10 7h7v7"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.9"
          />
        </WorkspaceArrow>
      </OpenBox>
    </Actions>
  );
}
