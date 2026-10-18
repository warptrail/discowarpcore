import { useId, useMemo, useState } from 'react';
import { compareBoxAddresses } from '../../util/boxAddress';
import { cabinetAccent } from '../../util/cabinetAccent';
import { countShelfItems, toggleShelfSelection } from '../../util/shelfSelection';
import * as S from './CabinetShelfPicker.styles';

export default function CabinetShelfPicker({ boxId, cabinetKey, parentLabel, ownerBox, shelves = [], selectedKeys = [], onChange }) {
  const [expanded, setExpanded] = useState(false);
  const gridId = useId();
  const cabinet = cabinetKey[0];
  const levels = [...shelves].sort((a, b) => compareBoxAddresses(a.key, b.key));
  const context = parentLabel || `Cabinet ${cabinet}`;
  const counts = useMemo(() => countShelfItems(ownerBox, cabinet, shelves), [ownerBox, cabinet, shelves]);
  const countLabel = key => counts ? `${counts[key]} ${counts[key] === 1 ? 'item' : 'items'}` : '…';
  const options = [{ key: cabinet, label: 'All shelves' }, ...levels.map((row, index) => ({
    key: row.key, label: levels.length === 3 ? ['Top', 'Middle', 'Bottom'][index] : `Shelf ${row.key.slice(1)}`,
  }))];

  return <S.Picker aria-label={`Shelf selection for ${boxId}${cabinet}`} style={cabinetAccent(cabinet)}>
    <S.Commands>
      {levels.length ? <S.Toggle type="button" aria-label={expanded ? 'Hide shelf selector' : 'Show shelf selector'}
        title={expanded ? 'Hide shelf selector' : 'Select shelves'} aria-expanded={expanded} aria-controls={gridId}
        onClick={() => setExpanded(current => !current)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM4 9h16M4 15h16" /></svg>
        {selectedKeys.length > 1 ? <span>{selectedKeys.length}</span> : null}
      </S.Toggle> : <S.SingleSpace>Single storage space</S.SingleSpace>}
      {expanded || !levels.length ? <S.Manage href={`/boxes/${boxId}`}>Manage owning box #{boxId} ↗</S.Manage> : null}
    </S.Commands>
    {levels.length ? <S.Levels id={gridId} hidden={!expanded} role="group" aria-label={`Shelves in ${context}`}>
      {options.map(({ key, label }) => {
        const all = key === cabinet;
        const selected = all ? !selectedKeys.length : selectedKeys.includes(key);
        return <S.Level type="button" key={key} aria-pressed={selected}
          aria-label={`${context} · ${label} · #${boxId}${key} · ${countLabel(key)}`}
          onClick={() => onChange(all ? [] : toggleShelfSelection(selectedKeys, key))}>
          <S.LevelName>{label}</S.LevelName>
          <S.Address>#{boxId}{key}</S.Address>
          <S.Count>{countLabel(key)}</S.Count>
          <S.Selection aria-hidden="true">{selected ? '✓' : ''}</S.Selection>
        </S.Level>;
      })}
    </S.Levels> : null}
  </S.Picker>;
}
