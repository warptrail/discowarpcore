import { useContext, useId, useState } from 'react';
import { ToastContext } from '../Toast';
import { getOccasion, occasionStyle } from './occasionPresets';
import { loadoutProgress, toggleChecklist } from './loadoutModel';
import LoadoutEntryRow from './LoadoutEntryRow';
import LoadoutGlyph from './LoadoutGlyph';
import * as S from './Loadouts.styles';

export default function LoadoutWorkspace({ loadout, busy, onUpdate, onPicker }) {
  const [editing, setEditing] = useState(false);
  const [reminder, setReminder] = useState('');
  const editControlsId = useId();
  const { showToast, hideToast } = useContext(ToastContext);
  const theme = getOccasion(loadout.occasion);
  const progress = loadoutProgress(loadout.entries);

  const updateEntries = async (entries, revision) => {
    try { return await onUpdate({ entries, ...(revision === undefined ? {} : { revision }) }); }
    catch { return null; }
  };
  const updateWithUndo = async (entries, message) => {
    const previous = loadout.entries;
    const saved = await updateEntries(entries);
    if (saved) showToast({
      title: 'Loadout updated', message, sticky: true,
      actions: [{ label: 'Undo', onClick: async () => { hideToast(); await updateEntries(previous, saved.revision); } }],
    });
    return saved;
  };
  const confirm = (title, message, action, label) => showToast({
    title, message, sticky: true, variant: 'warning',
    actions: [
      { label: 'Cancel', onClick: () => hideToast() },
      { label, kind: 'primary', onClick: async () => { hideToast(); await action(); } },
    ],
  });
  const addReminder = async event => {
    event.preventDefault();
    const label = reminder.trim();
    if (!label) return;
    const result = await updateEntries([...loadout.entries, { label, itemId: null, gathered: false, returned: false }]);
    if (result) setReminder('');
  };

  return (
    <S.Workspace style={occasionStyle(loadout.occasion)} aria-labelledby="loadout-title" aria-busy={busy}>
      <S.Hero>
        <LoadoutGlyph kind={theme.glyph} />
        <div><h2 id="loadout-title">{loadout.name}</h2><S.Muted>{theme.description}</S.Muted></div>
      </S.Hero>
      <S.Toolbar>
        <S.Muted>{progress.total} items</S.Muted>
        <S.Button type="button" $quiet aria-expanded={editing} aria-controls={editControlsId} onClick={() => setEditing(value => !value)}>
          {editing ? 'Done editing' : 'Edit items'}
        </S.Button>
      </S.Toolbar>
      <S.Body>
        {loadout.entries.length ? <S.List aria-label="Loadout contents">
          {loadout.entries.map(entry => <LoadoutEntryRow
            key={entry.id} entry={entry} editing={editing} busy={busy}
            onGather={() => updateEntries(toggleChecklist(loadout.entries, entry.id, 'gather'))}
            onReturn={() => updateEntries(toggleChecklist(loadout.entries, entry.id, 'return'))}
            onLink={() => onPicker(entry)}
            onUnlink={() => confirm('Unlink this inventory item?', `Keep “${entry.label}” as a reminder.`,
              () => updateWithUndo(loadout.entries.map(row => row.id === entry.id ? { ...row, itemId: null, gathered: false, returned: false } : row), 'Inventory link removed.'), 'Unlink')}
            onRemove={() => confirm('Remove this item from the kit?', `Remove “${entry.label}” from this loadout.`,
              () => updateWithUndo(loadout.entries.filter(row => row.id !== entry.id), 'Item removed from this loadout.'), 'Remove item')}
          />)}
        </S.List> : <S.Empty><p>No items in this kit yet. Use Edit items to add its contents.</p></S.Empty>}
        <div id={editControlsId} hidden={!editing}>
          <S.Actions style={{ marginTop: 16 }}>
            <S.Button type="button" $primary disabled={busy || loadout.entries.length >= 200} onClick={() => onPicker(null)}>＋ Add inventory item</S.Button>
          </S.Actions>
          <S.InlineForm onSubmit={addReminder}>
            <S.Label htmlFor="loadout-reminder">Add an unlinked item
              <S.Input id="loadout-reminder" value={reminder} onChange={event => setReminder(event.target.value)} maxLength={160} placeholder="Something you need to include" disabled={busy} required />
            </S.Label>
            <S.Button type="submit" disabled={busy || !reminder.trim() || loadout.entries.length >= 200}>Add item</S.Button>
          </S.InlineForm>
        </div>
      </S.Body>
      <S.Footer>
        <span aria-live="polite">{busy ? 'Saving…' : `${progress.gathered} gathered · ${progress.returned} put away`}</span>
        <S.Button type="button" $quiet disabled={busy || !progress.gathered} onClick={() => confirm('Reset these checks?', 'Clear the gathered and put-away checks for this kit.',
          () => updateWithUndo(loadout.entries.map(entry => ({ ...entry, gathered: false, returned: false })), 'Kit checks reset.'), 'Reset checks')}>Reset checks</S.Button>
      </S.Footer>
    </S.Workspace>
  );
}
