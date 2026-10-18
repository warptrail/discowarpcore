import InventorySearchCards from './InventorySearchCards';
import MissingStatus from './MissingItems/MissingStatus';
import CompactTagRow from './Tags/CompactTagRow';
import ItemThumbnailMedia from './ItemThumbnailMedia';
import { Link, useLocation } from 'react-router-dom';
import { getOperationsItemPeekNavigation } from '../util/operationsItemNavigation';
import styled from 'styled-components';
import { getItemHomeHref } from '../api/itemDetails';
import SearchHighlight from './SearchHighlight';
import { getSearchTerms } from '../util/searchHighlight';

const Results = styled.ul`
  list-style: none;
  margin: 0;
  padding: 10px;
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  background: var(--dw-surface);
  > li { position: relative; min-width: 0; }
  > li:nth-of-type(even) > a:first-child { background: var(--dw-surface-raised); }
  ${({ $nested }) => $nested && `
    margin: 4px 0 8px;
  `}
  @media (max-width: 480px) {
    padding: 8px 6px;
  }
  min-width: 0;
  font-family: var(--dw-font-ui);
  ${({ $compact, $terminal, $hasQuantities }) => $compact && `
    height: ${$terminal ? 'auto' : $hasQuantities ? '64px' : '56px'};
    box-sizing: border-box;
    padding: 2px 0;
    gap: 2px;
    overflow: auto;
    overscroll-behavior-x: contain;
    overscroll-behavior-y: auto;
    background: transparent;
    > li > a:first-child { min-height: 48px; box-sizing: border-box; padding: 3px 48px 3px 6px; gap: 2px; border: 0; border-radius: 2px; font-size: .8rem; line-height: 16px; }
    > li > a:last-child { top: 2px; right: 0; }
    > li > a:first-child > [data-match-footer] { margin-right: -38px; }
    strong { min-width: 0; white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
    > li > a:first-child > span:first-child { padding-right: 0; }
    > li > a:first-child > span:first-child > span:not(:first-child) { display: none; }
  `}
  mark {
    color: #7df3ff;
    background: rgba(39, 218, 244, .18);
    font-weight: 700;
    box-shadow: inset 0 -1px 0 #7df3ff;
  }
  ${({ $terminal }) => $terminal && `
    margin-left: 16px;
    padding-left: 8px;
    border-left: 1px solid rgba(var(--box-primary-rgb, 113, 210, 255), .18);
    > li:nth-of-type(even) > a:first-child { background: transparent; }
    > li > a:first-child { background: transparent; border-radius: 0; }
    > li > a:first-child > span:first-child > span:first-child {
      width: 30px; height: 30px; flex-basis: 30px; border-radius: 3px;
    }

    > li > a:first-child strong {
      color: var(--dw-text, #edf2ff);
      font-size: .94rem;
      font-weight: 750;
      line-height: 1.3;
    }
    > li > span [data-tag-chip] {
      padding-inline: 4px;
      color: var(--dw-text-secondary, #a9b7cb);
      border-color: rgba(var(--box-primary-rgb, 113, 210, 255), .2);
      background: transparent;
      font-size: .7rem;
      font-weight: 400;
    }
    > li > span [data-search-match='true'] {
      padding-inline: 6px;
      color: var(--box-primary, #b8d9e6);
      border-color: rgba(var(--box-primary-rgb, 113, 210, 255), .4);
      background: rgba(var(--box-primary-rgb, 113, 210, 255), .06);
      font-size: .75rem;
      font-weight: 500;
    }
  `}
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
`;
const ItemPageLink = styled(Link)`
  position: absolute; top: 10px; right: 6px;
  display: grid; place-items: center; width: 44px; height: 44px;
  padding: 0; margin: 0; border: 0; border-radius: 4px;
  background: transparent; color: var(--dw-cyan); text-decoration: none;
  svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  &:hover { background: rgba(128, 223, 255, .08); }
`;
const ItemLink = styled(Link)`
  display: grid;
  gap: 7px;
  padding: 14px;
  border: 1px solid var(--dw-border-soft);
  border-left: 3px solid var(--dw-violet);
  border-radius: 8px;
  background: var(--dw-surface);
  color: #edf2ff;
  text-decoration: none;
  overflow-wrap: anywhere;
  min-width: 0;
  @media (max-width: 480px) {
    padding: 12px 10px;
  }
  &:hover, &:focus-visible { background: var(--dw-surface-raised); outline: 2px solid var(--dw-cyan); }
`;
const ItemHeading = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding-right: 44px;
  strong { min-width: 0; }
`;
const Thumbnail = styled.span`
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--dw-surface);
  border: 1px solid var(--dw-border-soft);
  color: var(--dw-violet);
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const MatchedTags = styled(CompactTagRow)`grid-column: 1 / -1; margin: 0 4px 4px;`;

export default function InventorySearchMatches({ items, query, label = 'Matching Items Adrift', nested = false, boxId = 'adrift', compact = false, terminal = false }) {
  const location = useLocation();
  const compactRows = compact || terminal;
  const terms = getSearchTerms(query);
  const matches = (text) => terms.some((term) => String(text || '').toLowerCase().includes(term));
  if (!terminal) return <InventorySearchCards items={items} query={query} label={label} nested={nested} boxId={boxId} compact={compact}/>;
  return (
    <Results aria-label={label} $nested={nested} $compact={compactRows} $terminal={terminal} tabIndex={compactRows ? 0 : undefined}>
      {items.map((item) => {
        const visibleTags = terminal ? (item.tags || []).filter(matches) : item.tags;
        return (
          <li key={item._id}>
            <ItemLink {...getOperationsItemPeekNavigation({ search: location.search, state: location.state, boxId, itemId: item._id })}
              aria-label={`Quick peek at ${item.name || 'Untitled item'}`} aria-controls="operations-box-quick-peek">
              <ItemHeading>
                <Thumbnail aria-hidden="true"><ItemThumbnailMedia item={item} boxId={boxId} /></Thumbnail>
                <strong title={item.name || 'Untitled item'}><SearchHighlight text={item.name || 'Untitled item'} terms={terms} /></strong><MissingStatus item={item} home />
              </ItemHeading>

            </ItemLink>
            {(item.tags || []).some(matches) ? <MatchedTags tags={visibleTags} searchQuery={query} name={item.name} /> : null}
            <ItemPageLink to={getItemHomeHref(item._id)} aria-label={`Open item page for ${item.name || 'Untitled item'}`} title="Open full item page">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></svg>
            </ItemPageLink>
          </li>
        );
      })}
    </Results>
  );
}
