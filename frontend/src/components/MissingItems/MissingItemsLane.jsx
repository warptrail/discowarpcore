import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMissingItems } from './MissingItemsContext';
import MissingActions from './MissingActions';
import MissingStatus from './MissingStatus';
import { getOperationsItemPeekNavigation } from '../../util/operationsItemNavigation';
import { getItemMicroThumbnailUrl } from '../../util/itemImage';
import { formatPrimaryOwner } from '../../util/itemOwners';
import * as S from './MissingItems.styles';
export default function MissingItemsLane() {
  const { items, summary, loading, error, refresh } = useMissingItems();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const expanded = params.get('missing') === '1';
  const [query, setQuery] = useState('');
  const visible = items.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = () => { const next = new URLSearchParams(params); if (expanded) next.delete('missing'); else next.set('missing', '1'); setParams(next); };
  return <S.Lane aria-label="Missing Items">
    <S.Toggle type="button" aria-expanded={expanded} aria-controls="missing-items-list" onClick={toggle}>
      <span>Missing Items</span><span>{loading ? '…' : summary.records} {expanded ? '▴' : '▾'}</span>
    </S.Toggle>
    {expanded && <div id="missing-items-list">
      <p>{summary.records} {summary.records === 1 ? 'item record' : 'item records'} · {summary.objects} {summary.objects === 1 ? 'object' : 'objects'} missing. Their recorded homes stay intact.</p>
      <S.Form as="div"><label>Search missing items<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label></S.Form>
      {loading && <p>Loading missing reports…</p>}
      {error && <><S.ErrorText role="alert">{error}</S.ErrorText><S.Button type="button" onClick={refresh}>Try again</S.Button></>}
      {!loading && !error && !visible.length && <p>{items.length ? 'No missing items match this search.' : 'No items are reported missing.'}</p>}
      <S.List>{visible.map(item => {
        const navigation = getOperationsItemPeekNavigation({ search: location.search, state: location.state, boxId: item.box?.box_id, itemId: item._id });
        const image = getItemMicroThumbnailUrl(item);
        return <S.Row key={item._id}>
          <div><S.ItemLink as={Link} to={navigation.to} state={navigation.state} aria-label={`Quick peek at ${item.name}`}>
            {image && <img src={image} alt="" loading="lazy" />}
            <div><strong>{item.name}</strong><br /><MissingStatus item={item} />
              <small>Recorded home: {item.box ? `#${item.box.placementLabel || item.box.box_id} · ${item.box.label}` : 'Items Adrift'}</small>
              <small>{item.inheritedLocation || item.box?.location || item.location || 'Location not recorded'}</small>
              <small>{formatPrimaryOwner(item.missing.reportedBy)} · {new Date(item.missing.reportedAt).toLocaleString()}</small>
              {item.missing.note && <small>{item.missing.note}</small>}
            </div>
          </S.ItemLink><S.AlertLink as={Link} to={`/items/${item._id}`}>Open item page</S.AlertLink></div>
          <MissingActions item={item} />
        </S.Row>;
      })}</S.List>
    </div>}
  </S.Lane>;
}
