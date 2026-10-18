import styled from 'styled-components';
import { getSearchTerms } from '../util/searchHighlight';
import TagNavigationLink from './TagNavigationLink';
import { getTagHref, normalizeTagName } from '../util/tagNavigation';

const List = styled.span`
  display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px; min-width: 0; max-width: 100%;
`;
const Hashtag = styled(TagNavigationLink)`
  display: inline-flex; align-items: center; min-height: 28px; min-width: 0; max-width: 100%; padding: 0 6px;
  border: 1px solid rgba(var(--box-primary-rgb,113,210,255),.18); border-radius: 5px;
  color: var(--box-primary,var(--dw-cyan)); background: rgba(var(--box-primary-rgb,113,210,255),.05);
  font: 400 .75rem/1.4 var(--dw-font-ui); overflow-wrap: anywhere; text-decoration: none;
  ${({ $searchMatch }) => $searchMatch && `
    padding: 0 9px;
    color: #7df3ff;
    border-color: #7df3ff;
    background: rgba(39, 218, 244, .18);
    font-size: .875rem;
    font-weight: 600;
  `}
  &:hover { color: var(--dw-text); border-color: var(--box-primary,var(--dw-cyan)); background: rgba(var(--box-primary-rgb,113,210,255),.12); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const ChipFrame = styled.span`position: relative; display: inline-flex; min-width: 0; max-width: 100%; > a { padding-right: 24px; }`;
const Remove = styled.button`
  position: absolute; right: 1px; top: 50%; transform: translateY(-50%); width: 22px; height: 24px; min-height: 24px;
  padding: 0; border: 0; background: transparent; color: var(--dw-text-secondary); cursor: pointer;
  &:hover { color: var(--dw-coral); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export default function TagLinks({ tags = [], className, editable = false, onRemove, disabled = false, searchQuery = '' }) {
  const terms = getSearchTerms(searchQuery);
  const matches = tag => terms.some(term => tag.toLowerCase().includes(term));
  const source = [...new Set((Array.isArray(tags) ? tags : [tags]).map(normalizeTagName).filter(Boolean))];
  const values = terms.length ? [...source.filter(matches), ...source.filter(tag => !matches(tag))] : source;
  if (!values.length) return null;
  return <List className={className} aria-label="Tags">{values.map(tag => {
    const link = <Hashtag key={tag} $searchMatch={matches(tag)} data-search-match={matches(tag) || undefined} data-tag-chip={editable ? undefined : true} to={getTagHref(tag)}
      onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>#{tag}</Hashtag>;
    return editable ? <ChipFrame key={tag} data-tag-chip>{link}{onRemove && <Remove type="button" disabled={disabled}
      aria-label={`Remove ${tag} tag`} onClick={event => { event.stopPropagation(); onRemove(tag); }}>×</Remove>}</ChipFrame> : link;
  })}</List>;
}
