import MissingStatus from './MissingItems/MissingStatus';
import CompactTagRow from './Tags/CompactTagRow';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getOperationsItemPeekNavigation } from '../util/operationsItemNavigation';
import styled from 'styled-components';
import { getItemHomeHref } from '../api/itemDetails';
import { getItemMicroThumbnailUrl } from '../util/itemImage';
import SearchHighlight from './SearchHighlight';
import { getSearchTerms, getSearchExcerpt } from '../util/searchHighlight';

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
  &::before {
    content: attr(aria-label);
    color: var(--box-primary, #a7b6ff);
    font: 600 0.75rem var(--dw-font-ui);
    text-transform: none;
    letter-spacing: normal;
  }
  @media (max-width: 480px) {
    padding: 8px 6px;
  }
  min-width: 0;
  font-family: var(--dw-font-ui);
  ${({ $compact }) => $compact && `
    height: 56px;
    box-sizing: border-box;
    padding: 2px 0;
    gap: 2px;
    overflow: auto;
    overscroll-behavior-x: contain;
    overscroll-behavior-y: auto;
    background: transparent;
    &::before { display: none; }
    > li > a:first-child { min-height: 48px; box-sizing: border-box; padding: 3px 48px 3px 6px; gap: 2px; border: 0; border-radius: 2px; font-size: .8rem; line-height: 16px; }
    > li > a:last-child { top: 2px; right: 0; }
    strong { min-width: 0; white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
    > li > a:first-child > span:first-child { padding-right: 0; }
    > li > a:first-child > span:first-child > span { display: none; }
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
const Excerpt = styled.span`
  color: #ccd7ed;
  font-family: var(--dw-font-ui);
  font-size: 0.85rem;
  line-height: 1.5;
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
const MatchLabel = styled.b`
  display: inline-block;
  font-family: var(--dw-font-ui);
  color: ${({ $color }) => $color};
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 0 5px;
  margin-right: 5px;
  font-size: 0.75rem;
  letter-spacing: normal;
`;
const CompactReason = styled.span`
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--dw-text-secondary); font: 400 .75rem/14px var(--dw-font-ui);
  b { font-weight: 500; color: var(--box-primary); }
`;
const FIELD_COLORS = {
  Details: '#83d9ff', Notes: '#e1b0ff', Tags: '#8ee4b2',
  Category: '#ffd391', Location: '#ffb4a1', Owner: '#ffc0dc',
  Label: '#b9c8ff', 'Keep priority': '#ffe49b',
};

function ItemThumbnail({ item }) {
  const [failed, setFailed] = React.useState(false);
  const imageUrl = getItemMicroThumbnailUrl(item);
  return (
    <Thumbnail aria-hidden="true">
      {imageUrl && !failed
        ? <img src={imageUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
        : <span>◇</span>}
    </Thumbnail>
  );
}

const MatchedTags = styled(CompactTagRow)`grid-column: 1 / -1; margin: 0 4px 4px;`;

export default function InventorySearchMatches({ items, query, label = 'Matching Items Adrift', nested = false, boxId = 'adrift', compact = false }) {
  const location = useLocation();
  const terms = getSearchTerms(query);
  const matches = (text) => terms.some((term) => String(text || '').toLowerCase().includes(term));
  return (
    <Results aria-label={label} $nested={nested} $compact={compact} tabIndex={compact ? 0 : undefined}>
      {items.map((item) => {
        const fields = [
          ['Details', item.description], ['Notes', item.notes],
          ['Label', item.label], ['Category', item.category],
          ['Tags', (item.tags || []).join(', ')], ['Location', item.location],
          ['Owner', item.primaryOwnerName], ['Keep priority', item.keepPriority],
        ].filter(([, value]) => matches(value));
        return (
          <li key={item._id}>
            <ItemLink {...getOperationsItemPeekNavigation({ search: location.search, state: location.state, boxId, itemId: item._id })}
              aria-label={`Quick peek at ${item.name || 'Untitled item'}`} aria-controls="operations-box-quick-peek">
              <ItemHeading>
                <ItemThumbnail item={item} />
                <strong title={item.name || 'Untitled item'}><SearchHighlight text={item.name || 'Untitled item'} terms={terms} /></strong><MissingStatus item={item} home />
              </ItemHeading>
              {compact && fields.length ? <CompactReason title={fields.map(([label, value]) => `${label}: ${value}`).join(' · ')}>
                <b>{fields.map(([label]) => label).join(' · ')}</b> · <SearchHighlight text={getSearchExcerpt(fields[0][1], terms, { length: 80, context: 24 })} terms={terms} />
              </CompactReason> : !compact && fields.map(([label, value]) => (
                <Excerpt key={label} $isTags={label === 'Tags'}><MatchLabel $color={FIELD_COLORS[label]}>Matched in {label.toLowerCase()}</MatchLabel> <SearchHighlight text={getSearchExcerpt(value, terms)} terms={terms} /></Excerpt>
              ))}
            </ItemLink>
            {fields.some(([field]) => field === 'Tags') ? <MatchedTags tags={item.tags} name={item.name} /> : null}
            <ItemPageLink to={getItemHomeHref(item._id)} aria-label={`Open item page for ${item.name || 'Untitled item'}`} title="Open full item page">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></svg>
            </ItemPageLink>
          </li>
        );
      })}
    </Results>
  );
}
