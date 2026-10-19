import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import CompactTagRow from './Tags/CompactTagRow';
import ItemThumbnailMedia from './ItemThumbnailMedia';
import SearchHighlight from './SearchHighlight';
import MissingStatus from './MissingItems/MissingStatus';
import { getSearchTerms, getSearchExcerpt } from '../util/searchHighlight';
import { getOperationsItemPeekNavigation } from '../util/operationsItemNavigation';
import { getItemHomeHref } from '../api/itemDetails';

const Results = styled.ul`
  list-style: none; margin: ${({ $nested }) => $nested ? '4px 0 8px' : '0'};
  padding: ${({ $compact }) => $compact ? '0' : '8px 6px'};
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; min-width: 0;
  ${({ $compact }) => $compact && 'height: 144px; overflow-y: auto; overscroll-behavior: contain;'}
`;
const Card = styled.li`
  position: relative; min-width: 0; box-sizing: border-box;
  height: 144px;
  display: grid; grid-template-rows: minmax(0, 1fr) 28px; gap: 6px; padding: 10px;
  border: 1px solid var(--dw-border-soft); border-left: 3px solid var(--dw-violet);
  border-radius: 8px; background: var(--dw-surface); color: #edf2ff;
  &:nth-of-type(even) { background: var(--dw-surface-raised); }
  mark { color: #7df3ff; background: rgba(39,218,244,.18); font-weight: 700; box-shadow: inset 0 -1px 0 #7df3ff; }
  & :is(a,button):focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const ItemLink = styled(Link)`
  display: grid; grid-template-rows: 40px minmax(0, 1fr); gap: 6px;
  min-width: 0; min-height: 0; color: inherit; text-decoration: none;
  &:hover { color: var(--dw-text, #edf2ff); }
`;
const Heading = styled.span`
  display: flex; align-items: center; gap: 10px; min-width: 0; padding-right: 44px;
  strong { min-width: 0; font: 700 .9rem/18px var(--dw-font-ui); display: -webkit-box;
    -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; overflow-wrap: anywhere; }
`;
const Thumbnail = styled.span`
  width: 40px; height: 40px; flex: 0 0 40px; overflow: hidden; border-radius: 6px;
`;
const Excerpt = styled.span`
  min-width: 0; min-height: 0; align-self: start; color: #ccd7ed;
  font: 400 .8rem/18px var(--dw-font-ui); overflow-wrap: anywhere;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
`;
const Footer = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 8px;
  min-width: 0; min-height: 0; height: 28px;
`;
const TagSlot = styled.div`min-width: 0; height: 28px;`;
const Quantity = styled.span`
  font: 300 .75rem/18px var(--dw-font-data); color: var(--dw-text-secondary, #a9b7cb); white-space: nowrap;
`;
const ItemPageLink = styled(Link)`
  position: absolute; top: 10px; right: 6px;
  display: grid; place-items: center; width: 44px; height: 44px;
  color: var(--dw-cyan); text-decoration: none; background: transparent;
  &:hover { background: rgba(128,223,255,.08); }
  svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.5; }
`;

function getCardMatchExcerpt(item, terms) {
  const fields = [['Details',item.description],['Notes',item.notes],['Label',item.label],['Category',item.category],['Location',item.location],['Owner',item.primaryOwnerName],['Keep priority',item.keepPriority]];
  const match = fields.find(([,value]) => terms.some(term => String(value || '').toLowerCase().includes(term)));
  const [label,text] = match || ['Details',item.description || ''];
  return { label, text, excerpt: getSearchExcerpt(text,terms,{length:150,context:24}) };
}

export default function InventorySearchCards({items,query,label,nested,boxId,compact}) {
  const location = useLocation();
  const terms = getSearchTerms(query);
  return <Results aria-label={label} $nested={nested} $compact={compact} tabIndex={compact ? 0 : undefined}>
    {items.map(item => {
      const count = Number(item.quantity);
      const quantity = Number.isInteger(count) && count > 1 ? count : null;
      const snippet = getCardMatchExcerpt(item,terms);
      return <Card key={item._id} $compact={compact} data-item-match-card onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
        <ItemLink {...getOperationsItemPeekNavigation({search:location.search,state:location.state,boxId,itemId:item._id})}
          aria-label={`Quick peek at ${item.name || 'Untitled item'}`} aria-description={quantity ? `Quantity: ${quantity}` : undefined} aria-controls="operations-box-quick-peek">
          <Heading><Thumbnail aria-hidden="true"><ItemThumbnailMedia item={item} boxId={boxId}/></Thumbnail>
            <strong title={item.name || 'Untitled item'}><SearchHighlight text={item.name || 'Untitled item'} terms={terms}/></strong>
            <MissingStatus item={item} home/>
          </Heading>
          <Excerpt title={snippet.text ? `${snippet.label}: ${snippet.text}` : undefined}><SearchHighlight text={snippet.excerpt} terms={terms}/></Excerpt>
        </ItemLink>
        <Footer data-card-tag-footer><TagSlot>{item.tags?.length ? <CompactTagRow tags={item.tags} searchQuery={query} name={item.name} maxRows={1}/> : null}</TagSlot>
          {quantity ? <Quantity aria-label={`Quantity: ${quantity}`}>×{quantity}</Quantity> : null}
        </Footer>
        <ItemPageLink to={getItemHomeHref(item._id)} aria-label={`Open item page for ${item.name || 'Untitled item'}`} title="Open full item page">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg>
        </ItemPageLink>
      </Card>;
    })}
  </Results>;
}
