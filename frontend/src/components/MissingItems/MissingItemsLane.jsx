import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMissingItems } from './MissingItemsContext';
import MissingActions from './MissingActions';
import MissingStatus from './MissingStatus';
import { getOperationsItemPeekNavigation } from '../../util/operationsItemNavigation';
import ItemThumbnailMedia from '../ItemThumbnailMedia';
import { formatPrimaryOwner } from '../../util/itemOwners';
import { getMatchingInventoryItems } from '../../util/inventorySearch';
import * as S from './MissingItems.styles';
import { styledComponents as Box } from '../../styles/BoxList.styles';
export default function MissingItemsLane({ searchQuery = '', searchScope = 'all' }) {
  const { items, summary, loading, error, refresh } = useMissingItems();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const expanded = params.get('missing') === '1';
  const [query, setQuery] = useState('');
  const matchingItems = searchQuery.trim()
    ? getMatchingInventoryItems({ items }, searchQuery, searchScope)
    : items;
  const visible = matchingItems.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = () => { const next = new URLSearchParams(params); if (expanded) next.delete('missing'); else next.set('missing', '1'); setParams(next); };
  // Keep failed-load feedback reachable; a failure is not an empty inventory.
  if (!matchingItems.length && !error) return null;
  return <S.Lane aria-label="Missing Items">
    <S.Toggle as="button" type="button" aria-expanded={expanded} aria-controls="missing-items-list" onClick={toggle}
      aria-label={`Missing Items, ${loading ? 'loading' : `${summary.records} item records`}`}>
      <Box.BoxBodyRow $density="compact">
        <Box.OrphanedSignal aria-hidden="true" $density="compact" />
        <Box.OrphanedAttentionCopy>
          <S.VirtualKicker>Looking for</S.VirtualKicker>
          <Box.OrphanedAttentionTitle>Missing Items</Box.OrphanedAttentionTitle>
          <S.VirtualMeta>Reported missing; recorded homes stay intact</S.VirtualMeta>
        </Box.OrphanedAttentionCopy>
      </Box.BoxBodyRow>
      <Box.CardManifest aria-hidden="true" $isRoot $depth={0}>
        <span>{loading ? '…' : summary.records} {summary.records === 1 ? 'item' : 'items'}</span>
        <span>{expanded ? '▴' : '▾'}</span>
      </Box.CardManifest>
    </S.Toggle>
    {expanded && <S.LaneBody id="missing-items-list">
      <p>{summary.records} {summary.records === 1 ? 'item record' : 'item records'} · {summary.objects} {summary.objects === 1 ? 'object' : 'objects'} missing. Their recorded homes stay intact.</p>
      <S.Form as="div"><label>Search missing items<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label></S.Form>
      {loading && <p>Loading missing reports…</p>}
      {error && <><S.ErrorText role="alert">{error}</S.ErrorText><S.Button type="button" onClick={refresh}>Try again</S.Button></>}
      {!loading && !error && !visible.length && <p>{items.length ? 'No missing items match this search.' : 'No items are reported missing.'}</p>}
      <S.List>{visible.map(item => {
        const navigation = getOperationsItemPeekNavigation({ search: location.search, state: location.state, boxId: item.box?.box_id, itemId: item._id });
        return <S.Row key={item._id}>
          <div><S.ItemLink as={Link} to={navigation.to} state={navigation.state} aria-label={`Quick peek at ${item.name}`}>
            <ItemThumbnailMedia item={item} size={44} />
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
    </S.LaneBody>}
  </S.Lane>;
}
