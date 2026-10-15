import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ITEM_OWNERS, normalizePrimaryOwner } from '../../util/itemOwners';
import OwnerSymbol from '../OperationsFilters/OwnerSymbol';

const Field = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  display: grid;
  gap: .25rem;
  padding: .2rem 0;
`;
const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: .5rem;
  color: var(--dw-cyan);
  font: 650 .75rem/1.3 var(--dw-font-ui);
  > span { color: var(--dw-text-muted); font-weight: 450; }
`;
const Bar = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(44px, 1fr));
  min-width: 0;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  overflow-x: auto;
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
`;
const Choice = styled.button`
  position: relative;
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  padding: .2rem;
  border: 1px solid transparent;
  border-radius: 3px;
  color: var(--owner-accent);
  background: transparent;
  cursor: pointer;
  svg { width: 29px; height: 29px; }
  &[aria-pressed='true'] {
    border-color: var(--owner-accent);
    background: color-mix(in srgb, var(--owner-accent) 14%, transparent);
  }
  &[aria-pressed='true']::after {
    content: '';
    position: absolute;
    top: 4px; right: 4px;
    width: 4px; height: 4px;
    border-radius: 50%; background: var(--owner-accent);
  }
  &:hover { background: color-mix(in srgb, var(--owner-accent) 9%, transparent); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Tooltip = styled.div`
  position: fixed;
  z-index: 1100;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  transform: translateX(-50%);
  padding: .4rem .65rem;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  box-shadow: var(--dw-shadow);
  font: 500 .8rem/1.3 var(--dw-font-ui);
  pointer-events: none;
`;

// Operations selects one owner; Retrieval can retain multiple server-backed owners.
export default function OwnerFilterBar({ value = 'all', values, onChange, owners = ITEM_OWNERS }) {
  const options = [{ id: 'all', label: 'All owners', accent: 'var(--dw-cyan)' }, ...owners];
  const selected = values ? values.map(normalizePrimaryOwner) : [normalizePrimaryOwner(value)];
  const isSelected = (id) => id === 'all' ? !selected.length || selected.includes('all') : selected.includes(id);
  const [tooltip, setTooltip] = useState(null);
  const tooltipId = useId();
  const barRef = useRef(null);
  const timerRef = useRef(null);
  const hide = () => { window.clearTimeout(timerRef.current); setTooltip(null); };
  const show = (button, owner) => {
    window.clearTimeout(timerRef.current);
    const rect = button.getBoundingClientRect();
    setTooltip({ id: owner.id, label: owner.label, top: rect.bottom + 6,
      left: Math.max(68, Math.min(window.innerWidth - 68, rect.left + rect.width / 2)) });
  };

  useEffect(() => {
    const dismiss = () => { window.clearTimeout(timerRef.current); setTooltip(null); };
    const outside = (event) => { if (!barRef.current?.contains(event.target)) dismiss(); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.clearTimeout(timerRef.current);
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, []);

  return <Field>
    <Heading>Owner <span>{options.filter((owner) => isSelected(owner.id)).map((owner) => owner.label).join(' · ') || 'All owners'}</span></Heading>
    <Bar ref={barRef} role="group" aria-label="Filter by owner" $count={options.length}>
      {options.map((owner) => <Choice key={owner.id} type="button"
        style={{ '--owner-accent': owner.accent || 'var(--dw-violet)' }}
        aria-label={`Owner: ${owner.label}`} aria-pressed={isSelected(owner.id)}
        aria-describedby={tooltip?.id === owner.id ? tooltipId : undefined}
        onPointerEnter={(event) => { if (event.pointerType !== 'touch') show(event.currentTarget, owner); }}
        onPointerLeave={(event) => { if (event.pointerType !== 'touch') hide(); }}
        onPointerDown={(event) => { if (event.pointerType === 'touch') show(event.currentTarget, owner); }}
        onPointerCancel={hide} onFocus={(event) => show(event.currentTarget, owner)} onBlur={hide}
        onKeyDown={(event) => { if (event.key === 'Escape') hide(); }}
        onClick={(event) => {
          onChange?.(owner.id);
          show(event.currentTarget, owner);
          timerRef.current = window.setTimeout(() => setTooltip(null), 2000);
        }}>
        <OwnerSymbol owner={owner.id} />
      </Choice>)}
    </Bar>
    {tooltip && createPortal(<Tooltip id={tooltipId} role="tooltip" $top={tooltip.top} $left={tooltip.left}>{tooltip.label}</Tooltip>, document.body)}
  </Field>;
}
