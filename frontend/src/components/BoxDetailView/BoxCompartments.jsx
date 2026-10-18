import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { updateBoxById as updateBox } from '../../api/boxes';
import { moveBoxedItem } from '../../api/boxedItems';
import { API_BASE } from '../../api/API_BASE';
import { getCompartments, getItemCompartment, getLeafCompartments, compartmentAddress, compartmentLabel } from '../../util/boxCompartments';
import CompartmentEditor from './CompartmentEditor';
import CompartmentMap from './CompartmentMap';
import useAtlasFullscreen from './useAtlasFullscreen';
import { Cabinet, SupportingControls, Row } from './BoxCompartments.styles';

export default function BoxCompartments({ box, selectedKey, onSelect, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const atlas = useAtlasFullscreen();
  const compartments = getCompartments(box);
  if (!compartments.length) return null;
  const leaves = getLeafCompartments(box);
  const items = (box.items || []).filter((item) => item && typeof item === 'object');
  const children = box.childBoxes || [];
  const placement = (child) => child.parentCompartmentKey || box.childBoxCompartments?.[child._id] || '';
  const perform = async (action) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); await onChanged?.(); }
    catch (failure) { setError(failure.message || 'Could not save the compartment change.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Cabinet ref={atlas.dialogRef} open role={atlas.fullscreen ? "dialog" : "region"} aria-modal={atlas.fullscreen || undefined} tabIndex={-1} onCancel={atlas.onCancel} data-atlas-fullscreen={atlas.fullscreen} aria-label={`Compartments in box ${box.box_id}`}>
    <CompartmentMap box={box} selectedKey={selectedKey} onSelect={onSelect} items={items} children={children} fullscreen={atlas.fullscreen} onToggleFullscreen={atlas.toggle} />
    <SupportingControls hidden={atlas.fullscreen}>
    {children.length ? <details><summary>Physical boxes inside</summary>
      {children.map((child) => <Row key={child._id}><Link to={`/boxes/${child.box_id}`}>{child.label} · #{child.box_id}</Link><span>{placement(child) ? `Shelf / compartment ${placement(child)}` : 'Placement unspecified'}</span></Row>)}
    </details> : null}
    <CompartmentEditor key={JSON.stringify(box.compartments)} box={box} busy={busy} onSave={(patch) => perform(() => updateBox(box._id, patch))} />
    {items.length ? <details>
      <summary>Sort items between compartments</summary>
      {items.map((item) => <Row as="label" key={item._id}>
        <span>{item.name || 'Untitled item'}</span>
        <select aria-label={`Compartment for ${item.name}`} disabled={busy} value={getItemCompartment(box, item)} onChange={(event) => {
          const compartmentKey = event.target.value;
          void perform(() => moveBoxedItem({ itemId: item._id, sourceBoxId: box._id, destBoxId: box._id, compartmentKey, baseUrl: API_BASE }));
        }}>
          {leaves.map((row) => <option key={row.key} value={row.key}>{compartmentAddress(box, row.key)} · {compartmentLabel(row)}</option>)}
        </select>
      </Row>)}
    </details> : null}
    </SupportingControls>
    {busy ? <p role="status">Saving…</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </Cabinet>;
}
