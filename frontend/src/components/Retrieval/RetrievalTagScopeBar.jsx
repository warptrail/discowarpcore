import TagCollectionChips from './TagCollectionChips';
import { useState } from 'react';
import RetrievalTagNebula from './RetrievalTagNebula';
import { getTagCollectionHref } from '../../util/tagCollection';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { tagReturnDistance } from '../../util/tagReturnNavigation';

const Bar = styled.div`
  display: grid; gap: 4px;
  grid-column: 1 / -1; grid-row: 1; min-width: 0;
  border-bottom: 1px solid var(--dw-border-soft); padding: 0 4px 3px;
  a { display: inline-flex; align-items: center; min-height: 44px; text-decoration: none; }
  a:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; border-radius: 4px; }
`;
const Rail = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0;
  > nav { display: flex; flex-shrink: 0; align-items: center; gap: 4px; }

`;
const EditButton = styled.button`
  min-width: 44px; min-height: 44px; padding: 0 8px; border: 1px solid var(--dw-border-soft);
  border-radius: 4px; background: var(--dw-surface-raised); color: var(--dw-text-secondary);
  font: 500 .75rem/1.3 var(--dw-font-ui); cursor: pointer;
  &:hover { color: var(--dw-text); border-color: var(--retrieval-mode-accent); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Editor = styled.div`
  padding-block: 4px 8px; min-width: 0;
  > p { margin: 4px 0; color: var(--dw-text-secondary); font: 400 .75rem/1.4 var(--dw-font-ui); }
`;
const Identity = styled(Link)`
  min-width: 0; flex-shrink: 0; padding: 0 2px;
  font: 500 .75rem/1.3 var(--dw-font-ui); color: var(--dw-text-secondary);
  &:hover { color: var(--dw-text); }
  @media (max-width: 400px) { display: none !important; }
`;
const ReturnLink = styled(Link)`
  flex-shrink: 0; gap: 6px; padding: 0 10px;
  color: var(--dw-text-secondary); font: 500 .75rem/1.3 var(--dw-font-ui);
  border: 1px solid var(--dw-border-soft); border-radius: 4px;
  background: var(--dw-surface-raised);
  svg { width: 16px; height: 16px; }
  @media (max-width: 400px) { width: 44px; padding: 0; justify-content: center; > span { display: none; } }
  &:hover { color: var(--dw-text); border-color: var(--retrieval-mode-accent); }
`;
export default function RetrievalTagScopeBar({ scope }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const tags = scope.tags || [scope.key];
  const operator = scope.operator || 'or';
  const title = tags.length > 1 ? tags.map(tag => '#' + tag).join(' ' + operator.toUpperCase() + ' ') : '#' + scope.label;
  const source = location.state?.tagReturn;
  const returnUrl = source?.url?.startsWith('/') && !source.url.startsWith('//') ? source.url : '/retrieval';
  const sourceLabel = returnUrl.startsWith('/operations') ? 'Operations' : /^\/tags?\//.test(returnUrl) ? 'previous tag' : returnUrl.startsWith('/retrieval') ? 'Retrieval' : returnUrl.startsWith('/items/') ? 'item page' : returnUrl.startsWith('/declutter') ? 'Declutter' : 'previous view';
  return <Bar data-tag-scope aria-label="Tag collection navigation">
    <Rail onClick={event => {
      if (scope.onChange && !event.target.closest('a, button')) setEditing(true);
    }}>
    <Identity to={getTagCollectionHref(tags, operator, location.search)} state={location.state} replace aria-label={`${tags.length > 1 ? 'Tags' : 'Tag'}: ${title}`}>{tags.length > 1 ? 'Tags:' : 'Tag:'}</Identity>
    <TagCollectionChips tags={tags} operator={operator} onChange={scope.onChange}
      onExpand={scope.onChange ? () => setEditing(true) : undefined} expanded={editing} />
    <nav aria-label="Tag collection actions">
    {scope.onChange && <EditButton type="button" aria-label="Edit collection tags" aria-expanded={editing} aria-controls="tag-collection-editor" onClick={() => setEditing(value => !value)}>Tags</EditButton>}
    <ReturnLink to={returnUrl} state={{ ...source?.state, tagRestore: source }} title={`Back to ${sourceLabel}`} aria-label={`Return to ${sourceLabel}`} onClick={event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const distance = tagReturnDistance(source, window.history.state?.idx);
      if (distance) { event.preventDefault(); navigate(-distance); }
    }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16" /></svg><span>{source ? 'Back' : 'Retrieval'}</span></ReturnLink>
    </nav></Rail>
    {editing && <Editor id="tag-collection-editor">
      <RetrievalTagNebula id="tag-collection-picker" options={scope.options || []} selectedKeys={tags}
        operator={operator} onOperatorChange={next => scope.onChange(tags, next)}
        onAdd={tag => scope.onChange([...tags, tag], operator)}
        onRemove={tag => { if (tags.length > 1) scope.onChange(tags.filter(value => value !== tag), operator); }} />
      <p>{operator === 'and' ? 'AND · Match every selected tag.' : 'OR · Match any selected tag.'} Keep at least one tag in this collection.</p>
    </Editor>}
  </Bar>;
}
