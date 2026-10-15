import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ViewModeToggle from '../ViewModeToggle';
import { controlStyles } from '../../styles/primitives';

const Panel = styled.div`
  position: relative; grid-area: utility; justify-self: center;
  display: flex; align-items: stretch; min-width: 0;
  border: 1px solid var(--dw-border); border-radius: 5px;
  background: var(--dw-surface-raised);
  > [role='group'] { border: 0; border-radius: 4px 0 0 4px; box-shadow: none; }
  @media (min-width: 561px) { justify-self: start; }
`;
const ActionsButton = styled.button`
  ${controlStyles}
  display: grid; place-items: center; width: 44px; min-height: 44px; padding: 0;
  border: 0; border-left: 1px solid var(--dw-border); border-radius: 0 4px 4px 0;
  color: ${({ $active }) => $active ? 'var(--dw-cyan)' : 'var(--dw-text-secondary)'};
  background: ${({ $active }) => $active ? 'rgba(113, 210, 255, .1)' : 'transparent'};
  svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -3px; }
`;
const Menu = styled.div`
  position: absolute; z-index: 60; top: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  display: grid; gap: 4px; width: 190px; padding: 5px;
  border: 1px solid var(--dw-border); border-radius: 5px;
  background: var(--dw-surface-raised); box-shadow: var(--dw-shadow);
  @media (min-width: 561px) { left: 0; transform: none; }
`;
const Command = styled.button`
  ${controlStyles}
  display: flex; align-items: center; gap: .65rem; min-height: 44px; padding: .35rem .6rem;
  border: 0; background: ${({ $active }) => $active ? 'rgba(113, 210, 255, .1)' : 'transparent'};
  font: 550 .8rem/1.2 var(--dw-font-ui); text-align: left;
  svg { width: 20px; height: 20px; fill: none; stroke: var(--dw-cyan); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
`;

export default function OperationsConsoleControls({ viewMode, onViewModeChange, quickPanel, onToggleBox, onToggleItem }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = () => { setOpen(false); triggerRef.current?.focus(); };
    const pointer = (event) => { if (!panelRef.current?.contains(event.target)) setOpen(false); };
    const keyboard = (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
    document.addEventListener('pointerdown', pointer);
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('pointerdown', pointer); document.removeEventListener('keydown', keyboard); };
  }, [open]);
  const run = (action) => { setOpen(false); action(); triggerRef.current?.focus(); };
  return <Panel ref={panelRef} role="group" aria-label="Operations view and actions">
    <ViewModeToggle mode={viewMode} onChange={onViewModeChange} ariaLabel="Box list view mode" />
    <ActionsButton ref={triggerRef} type="button" $active={open || Boolean(quickPanel)} aria-label="Inventory actions" title="Inventory actions"
      aria-expanded={open} aria-controls="operations-actions-panel" onClick={() => setOpen((value) => !value)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M17.5 14v7M14 17.5h7" /></svg>
    </ActionsButton>
    {open ? <Menu id="operations-actions-panel" role="group" aria-label="Inventory creation actions">
      <Command type="button" $active={quickPanel === 'box'} onClick={() => run(onToggleBox)} aria-expanded={quickPanel === 'box'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 8-4 8 4-8 4-8-4v10l8 4V11m0 10 5-2m3-9v5m-3 3h6m-3-3v6" /></svg>{quickPanel === 'box' ? 'Close new box form' : 'New box'}
      </Command>
      <Command type="button" $active={quickPanel === 'orphan'} onClick={() => run(onToggleItem)} aria-expanded={quickPanel === 'orphan'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="14" height="18" rx="2" /><path d="M8 8h6m-6 4h6m-3 5h6m-3-3v6" /></svg>{quickPanel === 'orphan' ? 'Close new item form' : 'New item'}
      </Command>
    </Menu> : null}
  </Panel>;
}
