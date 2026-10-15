import { useMissingItem, useMissingItems } from './MissingItemsContext';
import * as S from './MissingItems.styles';
export default function MissingActions({ item, onSaved }) {
  const current = useMissingItem(item);
  const { open } = useMissingItems();
  if (!item || item.item_status === 'gone') return null;
  const missing = Number(current?.missing?.quantity || 0) > 0;
  const launch = mode => event => { event.stopPropagation(); open(item, mode, onSaved); };
  return <S.Actions aria-label={`Missing item actions for ${item.name || 'item'}`}>
    {missing && <S.Button type="button" onClick={launch('found')}>Found</S.Button>}
    <S.Button type="button" onClick={launch('report')}>{missing ? 'Update missing count' : 'Mark missing'}</S.Button>
    {missing && <S.Button type="button" onClick={launch('correction')}>Correct report</S.Button>}
  </S.Actions>;
}
