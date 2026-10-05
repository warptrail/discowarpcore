import { controlStyles } from '../../styles/primitives';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { updateBoxById as updateBox } from '../../api/boxes';
import { moveBoxedItem } from '../../api/boxedItems';
import { API_BASE } from '../../api/API_BASE';
import { getCompartments, getItemCompartment, compartmentAddress } from '../../util/boxCompartments';

const Cabinet = styled.section`
  margin: 1rem 0; padding: 1rem; border: 1px solid rgba(230, 237, 243, 0.12);
  border-radius: var(--dw-radius); background: var(--dw-surface); color: var(--dw-text);
  display: grid; gap: 0.65rem;
  h2 { margin: 0; font-size: 1rem; }
  p { margin: 0; color: var(--dw-text-secondary); font-size: 0.85rem; }
  button, input, select { font: inherit; min-height: 44px; }
  button { cursor: pointer; }
  button:disabled { cursor: wait; opacity: 0.55; }
  input, select { color: var(--dw-text); background: var(--dw-background); border: 1px solid rgba(230, 237, 243, 0.2); border-radius: var(--dw-radius); padding: 0.5rem; min-width: 0; }
  input:focus-visible, select:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  summary { cursor: pointer; padding: 0.7rem 0; }
  summary:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;
const Drawer = styled.button`
  ${controlStyles}
  width: 100%; border: 1px solid ${({ $active }) => $active ? 'var(--dw-cyan)' : 'rgba(230, 237, 243, 0.14)'};
  border-radius: var(--dw-radius); padding: 0.85rem 1rem; color: var(--dw-text);
  background: var(--dw-surface-raised);
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  strong { display: block; text-align: left; }
  small { display: block; margin-top: 0.25rem; color: var(--dw-text-secondary); text-align: left; }
`;
const Row = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(90px, 0.5fr);
  align-items: center; gap: 0.65rem; margin: 0.4rem 0;
  span { overflow-wrap: anywhere; }
  @media (max-width: 420px) { grid-template-columns: minmax(0, 1fr); }
`;

export default function BoxCompartments({ box, selectedKey, onSelect, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const compartments = getCompartments(box);
  if (!compartments.length) return null;
  const items = (box.items || []).filter((item) => item && typeof item === 'object');
  const perform = async (action) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); await onChanged?.(); }
    catch (failure) { setError(failure.message || 'Could not save the compartment change.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const saveNames = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform(() => updateBox(box._id, { compartments: compartments.map((row) => ({ key: row.key, label: data.get(row.key) })) }));
  };
  return (
    <Cabinet aria-label={`Compartments in box ${box.box_id}`}>
      <h2>One box · {compartments.length} compartments</h2>
      <p>Select a drawer to browse or add items there. New items go into A unless you choose another compartment.</p>
      <Drawer type="button" $active={!selectedKey} aria-pressed={!selectedKey} onClick={() => onSelect('')}>
        <strong>#{box.box_id} · All compartments</strong><span>{items.length} direct items</span>
      </Drawer>
      {compartments.map((row) => {
        const count = items.filter((item) => getItemCompartment(box, item) === row.key).length;
        return <Drawer key={row.key} type="button" $active={selectedKey === row.key} aria-pressed={selectedKey === row.key} onClick={() => onSelect(row.key)}>
          <span><strong>#{compartmentAddress(box, row.key)}</strong><small>{row.label || `Compartment ${row.key}`}</small></span>
          <span>{count} {count === 1 ? 'item' : 'items'}</span>
        </Drawer>;
      })}
      <details>
        <summary>Name or add compartments</summary>
        <form onSubmit={saveNames} key={JSON.stringify(compartments)}>
          {compartments.map((row) => <Row as="label" key={row.key}>
            <span>#{compartmentAddress(box, row.key)}</span>
            <input name={row.key} aria-label={`Name for ${compartmentAddress(box, row.key)}`} defaultValue={row.label} placeholder="e.g. Top drawer" maxLength={80} disabled={busy} />
          </Row>)}
          <Drawer type="submit" disabled={busy}>Save names</Drawer>
        </form>
        {compartments.length < 26 ? <Drawer type="button" disabled={busy} onClick={() => perform(() => updateBox(box._id, {
          compartments: [...compartments, { key: String.fromCharCode(65 + compartments.length), label: '' }],
        }))}>Add compartment {String.fromCharCode(65 + compartments.length)}</Drawer> : null}
      </details>
      {items.length ? <details>
        <summary>Sort items between compartments</summary>
        {items.map((item) => <Row as="label" key={item._id}>
          <span>{item.name || 'Untitled item'}</span>
          <select aria-label={`Compartment for ${item.name}`} disabled={busy} value={getItemCompartment(box, item)} onChange={(event) => {
            const compartmentKey = event.target.value;
            void perform(() => moveBoxedItem({ itemId: item._id, sourceBoxId: box._id, destBoxId: box._id, compartmentKey, baseUrl: API_BASE }));
          }}>
            {compartments.map((row) => <option key={row.key} value={row.key}>{compartmentAddress(box, row.key)}{row.label ? ` · ${row.label}` : ''}</option>)}
          </select>
        </Row>)}
      </details> : null}
      {busy ? <p role="status">Saving…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </Cabinet>
  );
}
