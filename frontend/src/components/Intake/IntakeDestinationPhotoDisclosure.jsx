import { controlStyles } from '../../styles/primitives';
import React from 'react';
import styled from 'styled-components';
import IntakeCurrentBoxImagePanel from './IntakeCurrentBoxImagePanel';

const Disclosure = styled.section`
  border-top: 1px solid var(--dw-border);
`;

const Toggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 42px;
  border: 0;
  background: transparent;
  color: rgba(var(--box-secondary-rgb), 0.8);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  padding: 0.3rem 0;
  text-align: left;
  text-transform: none;

  span:last-child { color: var(--box-neon); font-size: 0.85rem; }
  &:hover { color: var(--box-neon); }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: -2px; }

  ${controlStyles}
`;

const Content = styled.div`
  padding: 0.2rem 0 0.55rem;
`;

function hasImage(box) {
  return Boolean(
    box?.imagePath || box?.image?.display?.url || box?.image?.thumb?.url || box?.image?.original?.url || box?.image?.url,
  );
}

export default function IntakeDestinationPhotoDisclosure({ box, onBoxPhotoUpdated }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [box?._id]);

  if (!box?._id) return null;

  const imageLabel = hasImage(box) ? 'Photo & appearance' : 'Add photo & appearance';

  return (
    <Disclosure>
      <Toggle
        type="button"
        aria-expanded={open}
        aria-controls="intake-current-box-photo-controls"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{imageLabel}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </Toggle>
      {open ? (
        <Content id="intake-current-box-photo-controls">
          <IntakeCurrentBoxImagePanel currentBox={box} onBoxPhotoUpdated={onBoxPhotoUpdated} />
        </Content>
      ) : null}
    </Disclosure>
  );
}
