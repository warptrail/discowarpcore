import { useState } from 'react';
import useLocationRegistry from '../../hooks/useLocationRegistry';
import BoxLocationField from '../BoxForms/BoxLocationField';
import { EMPTY_LOCATION } from '../../util/locationStructure';
import * as S from './QuickPeekItemEditor.styles';

export default function QuickPeekBoxLocationField({ box, saving, onSave, onClose }) {
  const { locations, loading, error, createLocationInline } = useLocationRegistry();
  const [locationId, setLocationId] = useState(String(box.locationId?._id || box.locationId || ''));
  const [draft, setDraft] = useState(EMPTY_LOCATION);
  const [changed, setChanged] = useState(false);
  return <form onSubmit={(event) => {
    event.preventDefault();
    void onSave(async () => {
      if (loading || error) throw new Error(error || 'Wait for locations to load.');
      if (draft.specifics && !draft.vicinity || draft.exactSpot && !draft.specifics) {
        throw new Error('Complete each location level before adding the next.');
      }
      if (String(draft.room || '').trim()) {
        const resolved = await createLocationInline(draft);
        return { locationId: resolved._id };
      }
      if (locationId) throw new Error('Room is required. Clear the assigned location to unassign it.');
      return { locationId: null };
    });
  }}>
    <S.Fields disabled={saving} onChange={() => setChanged(true)}>
      <S.Field>Registered location
        <S.Select data-field-autofocus value={locationId} disabled={loading || saving || Boolean(error)}
          onChange={(event) => { setLocationId(event.target.value); setChanged(true); }}>
          <option value="">{box.location && !box.locationId ? `Current: ${box.location} (choose to replace)` : 'Choose or enter a location'}</option>
          {locationId && !locations.some((entry) => String(entry._id) === locationId)
            ? <option value={locationId}>Current assigned location</option> : null}
          {locations.map((entry) => <option key={entry._id} value={entry._id}>
            {[entry.room, entry.vicinity, entry.specifics, entry.exactSpot].filter(Boolean).join(' · ')}
          </option>)}
        </S.Select>
      </S.Field>
      <BoxLocationField key={locationId} compact locationId={locationId} setLocationId={(value) => {
        setLocationId(value); setChanged(true);
      }} locationOptions={locations} locationsLoading={loading} createBusy={saving}
        hideAssignAction onLocationDraftChange={setDraft} errorMessage={error || ''} />
    </S.Fields>
    <S.Hint>Room → vicinity → specifics → exact spot.</S.Hint>
    <S.Actions><S.Button type="button" disabled={saving} onClick={onClose}>Cancel</S.Button>
      <S.Button type="submit" $primary disabled={!changed || saving || loading || Boolean(error)}>{saving ? 'Saving…' : 'Save location'}</S.Button></S.Actions>
  </form>;
}
