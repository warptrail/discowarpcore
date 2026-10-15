import { useId, useState } from 'react';
import styled from 'styled-components';

const Panel = styled.div`
  min-width: 0;
  padding: ${({ $compact }) => $compact ? '.15rem' : '.3rem'};
  border: 1px solid ${({ $accented }) => $accented ? 'color-mix(in srgb, var(--room-control-accent) 38%, transparent)' : 'rgba(127, 215, 255, .18)'};
  border-radius: var(--dw-radius-sm);
  background: ${({ $accented }) => $accented ? 'color-mix(in srgb, var(--room-control-accent) 8%, var(--dw-surface))' : 'rgba(8, 17, 27, .45)'};
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
  color: ${({ $accented }) => $accented ? 'var(--room-control-accent)' : 'var(--dw-text)'};
  > span { flex: 1; min-width: 0; overflow-wrap: anywhere; color: rgba(204, 220, 230, .7); font-weight: 450; }
  ${({ $dense }) => $dense && `
    > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `}
  > svg { flex-shrink: 0; }
  > svg:last-child { transform: rotate(${({ $open }) => $open ? '180deg' : '0deg'}); }
  ${({ $accented }) => $accented && `
    &:hover { background: color-mix(in srgb, var(--room-control-accent) 10%, transparent); }
  `}
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

export function RetrievalRoomOptions({ options = [], selectedKeys = [], onChange, multiple = true, id, ariaLabel = 'Filter by rooms' }) {
  return (
    <Track id={id} role="group" aria-label={ariaLabel}>
      {options.map(({ key, label }) => {
        const selected = selectedKeys.includes(key);
        return <Room key={key} type="button" aria-pressed={selected} $selected={selected}
          onClick={() => onChange?.(selected ? selectedKeys.filter((value) => value !== key) : multiple ? [...selectedKeys, key] : [key])}>
          {label}
        </Room>;
      })}
      {!options.length && <Control as="span">No rooms available</Control>}
    </Track>
  );
}

export default function RetrievalRoomCarousel({ options = [], selectedKeys = [], onChange, label = 'Rooms', summary: selectedSummary, defaultOpen = false, compact = false, dense = false, accent = null, icon = null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const labels = selectedKeys.map((key) => options.find((option) => option.key === key)?.label || key);
  const summary = selectedSummary ?? (labels.length ? labels.join(' · ') : 'All rooms');
  return (
    <Panel $compact={compact} $accented={Boolean(accent)} style={accent ? { '--room-control-accent': accent } : undefined}>
      <Heading>
        <Toggle type="button" aria-expanded={open} aria-controls={contentId}
          $open={open} $dense={dense} title={dense ? `${label}: ${summary}` : undefined}
          $accented={Boolean(accent)} onClick={() => setOpen((current) => !current)}>
          {icon}{label} <span>{summary}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Toggle>
        {selectedKeys.length > 0 && (
          <Control type="button" aria-label={`Clear selected ${label.toLowerCase()}`} title={`Clear selected ${label.toLowerCase()}`} onClick={() => onChange?.([])}>×</Control>
        )}
      </Heading>
      {open && (
        children ? <div id={contentId}>{children}</div> :
          <RetrievalRoomOptions id={contentId} options={options} selectedKeys={selectedKeys} onChange={onChange} />
      )}
    </Panel>
  );
}
