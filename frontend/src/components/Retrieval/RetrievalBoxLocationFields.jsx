import { useState } from 'react';
import styled from 'styled-components';
import BoxLocationField from '../BoxForms/BoxLocationField';
import * as Box from '../BoxForms/BoxEditForm.styles';

const Fields = styled.div`
  display: grid; gap: 8px; min-width: 0;
  label { color: var(--dw-text-secondary); font-size: .75rem; }
  select { width: 100%; min-height: 44px; padding: 6px 8px; font: inherit; }
  p { margin: 0; font-size: .75rem; color: var(--dw-text-muted); }
  ${Box.LocationSubform} { padding: 0; border: 0; background: transparent; }
  ${Box.LocationSubformHeader} { display: none; }
  ${Box.LocationStructureGrid} { margin: 0; }
  ${Box.LocationInput} { min-height: 44px; }
  input { font: 400 1rem/1.3 var(--dw-font-ui); }
  [role='alert'] { color: var(--dw-coral); }
  @media (max-width: 600px) {
    gap: 6px;
    ${Box.LocationStructureGrid} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
    ${Box.LocationStructureGrid} > :first-child, ${Box.LocationStructureGrid} > :last-child { grid-column: 1 / -1; }
  }
`;

export default function RetrievalBoxLocationFields({ editing }) {
  const [locationId, setLocationId] = useState(editing.session.locationId);
  return <Fields onKeyDown={(event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault(); void editing.save();
    }
  }}>
    <p>Changes the box location for all its items.</p>
    <label>Saved path
      <select aria-label="Saved box location" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
        <option value="">Unassigned / enter a new path</option>
        {locationId && !editing.locations.some((entry) => String(entry._id) === locationId)
          ? <option value={locationId}>Current assigned location</option> : null}
        {editing.locations.map((entry) => <option key={entry._id} value={entry._id}>
          {[entry.room, entry.vicinity, entry.specifics, entry.exactSpot].filter(Boolean).join(' · ')}
        </option>)}
      </select>
    </label>
    <BoxLocationField key={locationId} compact locationId={locationId} setLocationId={setLocationId}
      locationOptions={editing.locations} hideAssignAction showHierarchyHint={false}
      createBusy={editing.saving} onLocationDraftChange={editing.setDraft} />
    {editing.error ? <p role="alert">{editing.error}</p> : null}
  </Fields>;
}
