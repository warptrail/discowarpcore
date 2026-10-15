import { locationLabel } from './locationHierarchy';
import * as S from './Location.styles';

export default function LocationList({ locations, busy, editingId, onEdit, onDelete }) {
  return <S.Registry aria-label="Saved locations">
    <S.PanelHeader><h2>Saved locations</h2></S.PanelHeader>
    <S.Text>Open a path to edit. Assigned locations are protected from deletion.</S.Text>
    {!locations.length ? <S.Text>No saved locations in this view. Add a room to begin.</S.Text>
      : <S.List>{locations.map((location) => {
        const label = locationLabel(location);
        return <S.Row key={location._id}>
          <S.EditPath type="button" disabled={busy} aria-label={`Edit ${label}`} aria-pressed={editingId === location._id} aria-haspopup="dialog" onClick={() => onEdit(location)}>
            <strong>{label}</strong><small>{location.exactSpot ? 'Exact spot' : location.specifics ? 'Specifics' : location.vicinity ? 'Vicinity' : 'Room'} · Edit path ↗</small>
          </S.EditPath>
          <S.DeleteButton type="button" disabled={busy} aria-label={`Delete ${label}`} title={`Delete ${label}`} onClick={() => onDelete(location)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /></svg>
          </S.DeleteButton>
        </S.Row>;
      })}</S.List>}
  </S.Registry>;
}
