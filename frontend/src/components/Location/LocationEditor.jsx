import { locationSuggestions } from '../../util/locationStructure';
import * as S from './Location.styles';

export default function LocationEditor({ locations, draft, editingId, busy, onChange, onSave, onCancel }) {
  return (
    <S.Panel>
      <S.PanelHeader><h2>{editingId ? 'Edit location' : 'Add location'}</h2></S.PanelHeader>
      <S.Text>Room is required. Add a vicinity for an area within the room, then specifics for a section and Exact Spot for precise placement.</S.Text>
      <S.Form onSubmit={onSave}>
        {[
          ['room', 'Room', 'Garage', 'The broadest level: a room or area of the house.'],
          ['vicinity', 'Vicinity', 'North shelf', 'Optional area within the room.'],
          ['specifics', 'Specifics', 'Rack B3', 'Optional section within the vicinity.'],
          ['exactSpot', 'Exact Spot', 'Behind the blue bin', 'Optional precise placement. Requires specifics.'],
        ].map(([name, label, placeholder, help]) => (
          <S.Label key={name} htmlFor={`location-${name}`}>
            {label}
            <S.Input id={`location-${name}`} value={draft[name]} required={name === 'room'} disabled={busy || (name === 'exactSpot' && !draft.specifics.trim())}
              placeholder={placeholder} list={`location-${name}-options`} aria-describedby={`location-${name}-help`}
              onChange={(event) => onChange(name, event.target.value)} />
            <small id={`location-${name}-help`}>{help}</small>
            <datalist id={`location-${name}-options`}>
              {[...new Set(locationSuggestions(locations, draft, name))].map((value) => <option key={value} value={value} />)}
            </datalist>
          </S.Label>
        ))}
        {editingId && <S.Text>This edits one saved location path. Boxes assigned to this location will use its updated name; other paths in the same room stay as they are.</S.Text>}
        <S.Actions>
          <S.Button type="submit" $primary disabled={busy || !draft.room.trim() || (Boolean(draft.specifics.trim()) && !draft.vicinity.trim()) || (Boolean(draft.exactSpot.trim()) && !draft.specifics.trim())}>
            {busy ? 'Saving…' : editingId ? 'Save location' : 'Add location'}
          </S.Button>
          <S.Button type="button" onClick={onCancel} disabled={busy}>{editingId ? 'Cancel edit' : 'Clear'}</S.Button>
        </S.Actions>
      </S.Form>
    </S.Panel>
  );
}
