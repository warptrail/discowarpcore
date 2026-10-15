import { useContext, useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import CompactTagRow from '../Tags/CompactTagRow';
import { ToastContext } from '../Toast';
import { editItem } from '../../api/editItem';
import { fetchRetrievalItemsPage, fetchRetrievalBoxesPage } from '../../api/retrieval';
import { addQuickPeekTag, removeQuickPeekTag, quickPeekTagRows } from './quickPeekTagModel';

const Shell = styled.div`min-width: 0; display: grid; gap: 4px;`;
const AddRow = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) 44px 44px; gap: 2px; align-items: center;
  input { box-sizing: border-box; min-width: 0; width: 100%; height: 36px; padding: 0 8px;
    border: 1px solid rgba(var(--box-primary-rgb), .24); border-radius: 4px;
    background: var(--dw-background); color: var(--dw-text); font: 400 .8rem var(--dw-font-ui); }
  button { min-width: 44px; min-height: 44px; padding: 0; border: 0; border-radius: 4px; background: transparent;
    color: var(--box-primary); cursor: pointer; }
  button[aria-pressed='true'] { background: var(--dw-surface-raised); box-shadow: inset 0 -1px var(--box-primary); }
  button:hover:not(:disabled) { background: var(--dw-surface-raised); }
  button:disabled { opacity: .45; cursor: default; }
  input:focus-visible, button:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  svg { width: 16px; height: 16px; vertical-align: middle; }
`;
const Hint = styled.span`color: var(--dw-text-secondary); font: 400 .7rem/1.3 var(--dw-font-ui);`;

let knownTagsRequest;
let knownTagsRequestedAt = 0;
function getKnownTags() {
  if (Date.now() - knownTagsRequestedAt > 60000) knownTagsRequest = null;
  if (!knownTagsRequest) {
    knownTagsRequestedAt = Date.now(); knownTagsRequest = Promise.allSettled([
    fetchRetrievalItemsPage({ limit: 1 }), fetchRetrievalBoxesPage({ limit: 1, tagSource: 'box' }),
  ]).then(results => {
    const successful = results.filter(result => result.status === 'fulfilled');
    if (!successful.length) { knownTagsRequest = null; throw new Error('Tag suggestions unavailable. You can still add a tag.'); }
    return [...new Set(successful.flatMap(result => result.value.filters?.tags || []).map(tag => tag.label || tag.key).filter(Boolean))];
  });
  }
  return knownTagsRequest;
}

export default function QuickPeekItemTags({ item, tags, name, description, onSaved }) {
  const [removing, setRemoving] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState('');
  const [options, setOptions] = useState([]);
  const busy = useRef(false);
  const listId = useId();
  useEffect(() => {
    let alive = true;
    getKnownTags().then(values => { if (alive) setOptions(values); }).catch(error => { if (alive) setHint(error.message); });
    return () => { alive = false; };
  }, []);
  const save = async (next, message) => {
    if (!next || busy.current) return;
    busy.current = true; setSaving(true); setHint('');
    try {
      const updated = await editItem(item._id || item.id, { tags: next });
      onSaved?.(updated); setValue(''); knownTagsRequest = null; setOptions(current => [...new Set([...current, ...next])]);
      showToast?.({ variant: 'success', title: 'UPDATED', message, timeoutMs: 2200 });
    } catch (error) {
      setHint(error.message || 'Could not save tags. Try again.');
      showToast?.({ variant: 'danger', title: 'SAVE FAILED', message: error.message || 'Could not save tags. Try again.', timeoutMs: 0 });
    } finally { busy.current = false; setSaving(false); }
  };
  const { showToast } = useContext(ToastContext) || {};
  const add = (inputValue = value) => {
    const next = addQuickPeekTag(tags, inputValue);
    if (!next) { if (inputValue.trim()) setHint('That tag is already recorded.'); return; }
    return save(next, 'Tag added.');
  };
  return <Shell>
    {tags.length > 0 && <CompactTagRow returnKey={`operations-item:${item._id || item.id}`} tags={tags} name={name}
      maxRows={quickPeekTagRows(description)} editable onRemove={removing ? tag => save(removeQuickPeekTag(tags, tag), 'Tag removed.') : undefined}
      disabled={saving} />}
    <AddRow as="form" onSubmit={event => {
      event.preventDefault();
      return add(event.currentTarget.querySelector('input').value);
    }}>
      <input aria-label="Add item tag" placeholder="Add tag…" value={value} list={listId} disabled={saving}
        onChange={event => { setValue(event.target.value); setHint(''); }}
        onFocus={() => { getKnownTags().then(setOptions).catch(error => setHint(error.message)); }} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Enter') event.stopPropagation();
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setValue(''); setRemoving(false); }
        }} />
      <datalist id={listId}>{options.map(tag => <option key={tag} value={tag} />)}</datalist>
      <button type="button" disabled={saving || !value.trim()} aria-label="Add tag" onClick={() => add()}>+</button>
      <button type="button" disabled={saving || !tags.length} aria-label="Toggle tag removal" aria-pressed={removing} title={removing ? 'Finish removing tags' : 'Remove tags'} onClick={() => setRemoving(current => !current)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 16 11-11 4 4-11 11-5 1zM13 7l4 4" /></svg>
      </button>
    </AddRow>
    {saving ? <Hint role="status">Saving tags…</Hint> : hint ? <Hint role="status">{hint}</Hint> : null}
  </Shell>;
}
