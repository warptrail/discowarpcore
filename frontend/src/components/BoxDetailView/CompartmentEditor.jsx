import { useState } from 'react';
import { getCompartments, getItemCompartment, getLeafCompartments } from '../../util/boxCompartments';
import { Drawer, Row } from './BoxCompartments.styles';

export default function CompartmentEditor({ box, busy, onSave }) {
  const [draft, setDraft] = useState(() => structuredClone(getCompartments(box)));
  const [assignments, setAssignments] = useState({ items: {}, boxes: {} });
  const leaves = getLeafCompartments({ ...box, compartments: draft });
  const originalLeaves = getLeafCompartments(box);
  const affected = [
    ...(box.items || []).map((item) => ({ kind: 'items', id: String(item._id), name: item.name, key: getItemCompartment(box, item) })),
    ...(box.childBoxes || []).map((child) => ({ kind: 'boxes', id: String(child._id), name: child.label, key: child.parentCompartmentKey || box.childBoxCompartments?.[child._id] || '' })),
  ].filter((entry) => entry.key && originalLeaves.some((row) => row.key === entry.key) && !leaves.some((row) => row.key === entry.key));

  const rename = (key, label) => setDraft((rows) => rows.map((row) => row.key === key ? { ...row, label } : {
    ...row, ...(row.children ? { children: row.children.map((child) => child.key === key ? { ...child, label } : child) } : {}),
  }));
  const addShelf = (key) => setDraft((rows) => rows.map((row) => row.key !== key ? row : {
    ...row, children: [...(row.children || []), { key: `${key}${(row.children?.length || 0) + 1}`, label: '' }],
  }));
  const field = (row, shelf = false) => <Row as="label" key={row.key}>
    <span>#{box.box_id}{row.key}{shelf ? ' · Shelf' : ''}</span>
    <input aria-label={`Name for ${box.box_id}${row.key}`} value={row.label} onChange={(event) => rename(row.key, event.target.value)} maxLength={80} disabled={busy} />
  </Row>;

  return <details>
    <summary>Name or add compartments and shelves</summary>
    <form onSubmit={(event) => { event.preventDefault(); onSave({ compartments: draft, compartmentReassignments: assignments }); }}>
      <p>Three layers maximum: box → compartment → shelf. Physical boxes can nest deeper.</p>
      {draft.map((row) => <div key={row.key}>
        {field(row)}
        {(row.children || []).map((child) => field(child, true))}
        {(row.children?.length || 0) < 99 ? <Drawer type="button" disabled={busy} onClick={() => addShelf(row.key)}>
          {row.children?.length ? `Add shelf to ${row.key}` : `Subdivide ${row.key} into shelves`}
        </Drawer> : null}
      </div>)}
      {draft.length < 26 ? <Drawer type="button" disabled={busy} onClick={() => setDraft((rows) => [...rows, { key: String.fromCharCode(65 + rows.length), label: '' }])}>Add compartment {String.fromCharCode(65 + draft.length)}</Drawer> : null}
      {affected.length ? <fieldset><legend>Assign contents to shelves before saving</legend>
        {affected.map((entry) => <Row as="label" key={`${entry.kind}:${entry.id}`}>
          <span>{entry.name}</span>
          <select required aria-label={`Shelf for ${entry.name}`} value={assignments[entry.kind][entry.id] || ''} disabled={busy} onChange={(event) => setAssignments((current) => ({ ...current, [entry.kind]: { ...current[entry.kind], [entry.id]: event.target.value } }))}>
            <option value="">Choose shelf…</option>
            {leaves.filter((leaf) => leaf.key.startsWith(entry.key)).map((leaf) => <option key={leaf.key} value={leaf.key}>{leaf.key} · {leaf.label || 'Shelf'}</option>)}
          </select>
        </Row>)}
      </fieldset> : null}
      <Drawer type="submit" disabled={busy}>Save compartments</Drawer>
    </form>
  </details>;
}
