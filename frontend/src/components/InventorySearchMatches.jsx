import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getOperationsItemPeekNavigation } from '../util/operationsItemNavigation';
import { controlStyles } from '../styles/primitives';
import styled from 'styled-components';
import { getItemHomeHref } from '../api/itemDetails';
import { getItemMicroThumbnailUrl } from '../util/itemImage';

const Results = styled.ul`
  list-style: none;
  margin: 0;
  padding: 10px;
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  background: var(--dw-surface);
  > li:nth-of-type(even) > a { background: var(--dw-surface-raised); }
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
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
`;
const ItemPageLink = styled(Link)`
  ${controlStyles}
  display: inline-flex; align-items: center; justify-self: end;
  text-decoration: none; font-size: 0.75rem; margin: 0.25rem 0;
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
  mark {
    background: var(--dw-surface);
    color: #b9f5ff;
    border-radius: 2px 2px 0 0;
    box-shadow: none;
    text-shadow: none;
  }
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

function highlight(text, terms) {
  const value = String(text || '');
  const lower = value.toLowerCase();
  const parts = [];
  let cursor = 0;
  while (cursor < value.length) {
    const hits = terms.map((term) => ({ index: lower.indexOf(term, cursor), term }))
      .filter(({ index }) => index >= 0)
      .sort((a, b) => a.index - b.index || b.term.length - a.term.length);
    if (!hits.length) { parts.push(value.slice(cursor)); break; }
    const { index, term } = hits[0];
    parts.push(value.slice(cursor, index));
    parts.push(<mark key={index}>{value.slice(index, index + term.length)}</mark>);
    cursor = index + term.length;
  }
  return parts;
}

function excerpt(text, terms) {
  const value = String(text || '');
  const positions = terms.map((term) => value.toLowerCase().indexOf(term)).filter((i) => i >= 0);
  const start = Math.max(0, Math.min(...positions) - 60);
  const end = Math.min(value.length, start + 220);
  return `${start ? '…' : ''}${value.slice(start, end)}${end < value.length ? '…' : ''}`;
}

export default function InventorySearchMatches({ items, query, label = 'Matching Items Adrift', nested = false, boxId = 'adrift' }) {
  const location = useLocation();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text) => terms.some((term) => String(text || '').toLowerCase().includes(term));
  return (
    <Results aria-label={label} $nested={nested}>
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
                <strong>{highlight(item.name || 'Untitled item', terms)}</strong>
              </ItemHeading>
              {fields.map(([label, value]) => (
                <Excerpt key={label} $isTags={label === 'Tags'}><MatchLabel $color={FIELD_COLORS[label]}>Matched in {label.toLowerCase()}</MatchLabel> {highlight(excerpt(value, terms), terms)}</Excerpt>
              ))}
            </ItemLink>
            <ItemPageLink to={getItemHomeHref(item._id)} aria-label={`Open item page for ${item.name || 'Untitled item'}`}>Open item page</ItemPageLink>
          </li>
        );
      })}
    </Results>
  );
}
