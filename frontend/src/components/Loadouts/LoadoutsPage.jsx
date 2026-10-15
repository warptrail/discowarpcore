import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useLoadouts from './useLoadouts';
import LoadoutGallery from './LoadoutGallery';
import LoadoutWorkspace from './LoadoutWorkspace';
import LoadoutInventoryPicker from './LoadoutInventoryPicker';
import * as S from './Loadouts.styles';

export default function LoadoutsPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('loadout');
  const controller = useLoadouts(selectedId);
  const [picker, setPicker] = useState(null);
  const { selected, loading, error, busy } = controller;

  const linkItem = async item => {
    const record = picker.loadout;
    const entries = picker.entry
      ? record.entries.map(entry => entry.id === picker.entry.id && entry.itemId !== item.id
        ? { ...entry, itemId: item.id, gathered: false, returned: false }
        : entry)
      : [...record.entries, { label: item.name, itemId: item.id, gathered: false, returned: false }];
    const result = await controller.saveRecord(record, { entries });
    if (result) setParams({ loadout: result.id });
    return result;
  };

  return (
    <S.Page>
      <S.Heading>
        <div>
          <h1>Loadouts</h1>
          <p>Six kits. Keep each item connected to its source box.</p>
        </div>
        {selectedId && <S.Button as={Link} to="/loadouts">← All loadouts</S.Button>}
      </S.Heading>
      {error && <S.Error role="alert">
        {error} <S.Button type="button" $quiet onClick={() => controller.reload()}>Reload loadouts</S.Button>
      </S.Error>}
      {loading ? <S.Muted role="status">Loading your loadouts…</S.Muted>
        : selectedId ? selected?.id === selectedId
          ? <LoadoutWorkspace
              key={selected.id}
              loadout={selected}
              busy={busy}
              onUpdate={controller.update}
              onPicker={entry => setPicker({ entry, loadout: selected })}
            />
          : !error && <S.Empty><p>This kit could not be found. Return to your six loadouts.</p></S.Empty>
        : <LoadoutGallery loadouts={controller.loadouts} />}
      {picker && <LoadoutInventoryPicker
        loadout={picker.loadout}
        entry={picker.entry}
        busy={busy}
        onSelect={linkItem}
        onClose={() => setPicker(null)}
      />}
    </S.Page>
  );
}
