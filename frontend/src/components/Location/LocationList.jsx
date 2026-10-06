import { locationLabel } from './locationHierarchy';
import * as S from './Location.styles';

export default function LocationList({ locations, busy, editingId, onEdit, onDelete }) {
  return (
    <S.Panel>
      <S.PanelHeader><h2>Saved locations</h2><S.Text>{locations.length} path{locations.length === 1 ? '' : 's'}</S.Text></S.PanelHeader>
      <S.Text>Select a path to edit its four levels. Locations assigned to boxes cannot be deleted.</S.Text>
      {!locations.length ? <S.Text>No saved locations in this view. Add a room to begin your house map.</S.Text> :
        <S.List>{locations.map((location) => (
          <S.Row key={location._id}>
            <strong>{locationLabel(location)}</strong>
            <span>{location.exactSpot ? 'Room · Vicinity · Specifics · Exact Spot' : location.specifics ? 'Room · Vicinity · Specifics' : location.vicinity ? 'Room · Vicinity' : 'Room only'}</span>
            <S.Actions>
              <S.Button type="button" disabled={busy} aria-label={`Edit ${locationLabel(location)}`} aria-pressed={editingId === location._id} onClick={() => onEdit(location)}>Edit</S.Button>
              <S.Button type="button" $danger disabled={busy} aria-label={`Delete ${locationLabel(location)}`} onClick={() => onDelete(location)}>Delete</S.Button>
            </S.Actions>
          </S.Row>
        ))}</S.List>}
    </S.Panel>
  );
}
