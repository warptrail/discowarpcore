import { consoleControlStyles } from './IntakeConsole.styles';
import React from 'react';
import styled from 'styled-components';
import IntakeCurrentBoxImagePanel from './IntakeCurrentBoxImagePanel';

const Disclosure = styled.section`
  border-top: 1px solid var(--dw-border);
`;

const Toggle = styled.button`
  ${consoleControlStyles}
  width: 100%;
  justify-content: space-between;
  font-size: .75rem;
  text-align: left;
  padding-inline: 0;
  span:last-child {
    color: var(--dw-cyan);
  }
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
