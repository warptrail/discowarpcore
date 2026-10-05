import { controlStyles } from '../../styles/primitives';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.36rem;
  align-items: stretch;
  padding-top: 0.6rem;
  border-top: 1px solid var(--dw-border);

  ${({ $choosing }) => $choosing && `
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 0;
    padding-top: 0.15rem;
  `}

`;

const Button = styled.button`
  min-height: 42px;
  grid-column: ${({ $primary, $fullRow }) => ($primary || $fullRow ? '1 / -1' : 'auto')};
  border: 1px solid ${({ $primary }) =>
    $primary ? 'rgba(var(--box-primary-rgb), 0.78)' : 'rgba(var(--box-secondary-rgb), 0.48)'};
  border-radius: var(--dw-radius-sm);
  background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(110deg, rgba(var(--box-primary-rgb), 0.25), rgba(var(--box-secondary-rgb), 0.1))'
      : 'transparent'};
  color: ${({ $primary }) =>
    $primary ? 'var(--box-neon)' : 'rgba(var(--box-secondary-rgb), 0.84)'};
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  padding: 0.35rem 0.65rem;
  text-transform: none;

  &:hover:not(:disabled) { background: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: 2px; }

  ${({ $choice }) => $choice && `
    grid-column: auto;
    min-height: 48px;
    border-color: rgba(85, 213, 241, 0.62);
    background: var(--dw-surface);
    color: #9fe8ff;
    font-size: 0.7rem;
    text-align: left;
  `}

  ${({ $createChoice }) => $createChoice && `
    grid-column: auto;
    min-height: 48px;
    border-color: rgba(91, 219, 178, 0.58);
    background: var(--dw-surface);
    color: #9df1cf;
    font-size: 0.7rem;
    text-align: left;
  `}

  ${({ $active, $createChoice }) => $active && `
    border-color: ${$createChoice ? '#57ecc0' : '#6cddf9'};
    box-shadow: inset 0 0 0 1px ${$createChoice ? 'rgba(87,236,192,.32)' : 'rgba(108,221,249,.32)'},
      0 0 15px ${$createChoice ? 'rgba(87,236,192,.25)' : 'rgba(108,221,249,.25)'};
  `}

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;

  color: ${({ $tone, $primary, $secondary }) => $tone === 'danger' ? 'var(--dw-coral)' : ($tone === 'primary' || $primary) ? 'var(--dw-cyan)' : $secondary ? 'var(--dw-violet)' : 'var(--dw-text)'};
`;

const ChoiceIcon = styled.span`
  display: inline-block;
  margin-right: 0.35rem;
  font-size: 1rem;
  line-height: 0;
  vertical-align: -0.06em;
`;

const OpenBox = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  color: var(--box-neon);
  text-decoration: none;

  &:hover { background: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: 2px; }
`;

const WorkspaceArrow = styled.svg`
  width: 1.2rem;
  height: 1.2rem;
  overflow: visible;
  filter: none;
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
        <Button type="button" $choice $active={chooseOpen} aria-expanded={chooseOpen} onClick={onChangeDestination}><ChoiceIcon aria-hidden="true">▣</ChoiceIcon> Choose box</Button>
        <Button type="button" $createChoice $active={createOpen} aria-expanded={createOpen} onClick={onCreateBox}><ChoiceIcon aria-hidden="true">＋</ChoiceIcon> Create box</Button>
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
