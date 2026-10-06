import { useState } from 'react';
import styled from 'styled-components';

const Panel = styled.div`
  min-width: 0;
  padding: .3rem;
  border: 1px solid rgba(127, 215, 255, .18);
  border-radius: var(--dw-radius-sm);
  background: rgba(8, 17, 27, .45);
`;
const Heading = styled.div`
  display: flex;
  gap: .3rem;
  align-items: center;
`;
const Control = styled.button`
  min-height: 40px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dw-text);
  font: 650 .8rem/1.2 var(--dw-font-ui);
  cursor: pointer;
  padding: .45rem .65rem;
  &:hover { background: rgba(127, 215, 255, .08); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media (pointer: coarse) { min-height: 44px; }
`;
const Toggle = styled(Control)`
  display: flex;
  align-items: center;
  gap: .65rem;
  flex: 1;
  min-width: 0;
  text-align: left;
  > span { flex: 1; min-width: 0; overflow-wrap: anywhere; color: rgba(204, 220, 230, .7); font-weight: 450; }
  > svg { flex-shrink: 0; transform: rotate(${({ $open }) => $open ? '180deg' : '0deg'}); }
`;
const Track = styled.div`
  display: flex;
  gap: .35rem;
  overflow-x: auto;
  padding: .25rem .1rem .1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(127, 215, 255, .24) transparent;
  overscroll-behavior-x: contain;
`;
const Room = styled(Control)`
  flex-shrink: 0;
  border: 1px solid ${({ $selected }) => $selected ? 'rgba(127, 215, 255, .5)' : 'rgba(127, 215, 255, .12)'};
  color: ${({ $selected }) => $selected ? 'var(--dw-cyan)' : 'var(--dw-text)'};
  background: ${({ $selected }) => $selected ? 'rgba(127, 215, 255, .14)' : 'rgba(24, 39, 56, .65)'};
`;

export default function RetrievalRoomCarousel({ options = [], selectedKeys = [], onChange }) {
  const [open, setOpen] = useState(false);
  const labels = selectedKeys.map((key) => options.find((option) => option.key === key)?.label || key);
  const summary = labels.length ? labels.join(' · ') : 'All rooms';
  return (
    <Panel>
      <Heading>
        <Toggle type="button" aria-expanded={open} aria-controls="retrieval-room-carousel"
          $open={open} onClick={() => setOpen((current) => !current)}>
          Rooms <span>{summary}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Toggle>
        {selectedKeys.length > 0 && (
          <Control type="button" aria-label="Clear selected rooms" title="Clear selected rooms" onClick={() => onChange?.([])}>×</Control>
        )}
      </Heading>
      {open && (
        <Track id="retrieval-room-carousel" role="group" aria-label="Filter by rooms">
          {options.map(({ key, label }) => {
            const selected = selectedKeys.includes(key);
            return <Room key={key} type="button" aria-pressed={selected} $selected={selected}
              onClick={() => onChange?.(selected ? selectedKeys.filter((value) => value !== key) : [...selectedKeys, key])}>
              {label}
            </Room>;
          })}
          {!options.length && <Control as="span">No rooms available</Control>}
        </Track>
      )}
    </Panel>
  );
}
