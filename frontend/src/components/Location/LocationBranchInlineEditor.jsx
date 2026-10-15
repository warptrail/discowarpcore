import { useEffect, useId, useRef } from 'react';
import { locationSuggestions } from '../../util/locationStructure';
import { branchScope } from './locationBranchEditing';
import * as S from './Location.styles';
import * as A from './LocationBranchControls.styles';

export default function LocationBranchInlineEditor({ editor, locations }) {
  const input = useRef(null);
  const suggestionsId = useId();
  const { editing, busy } = editor;
  useEffect(() => {
    input.current?.focus({ preventScroll: true }); input.current?.select();
    input.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, []);
  const suggestions = locationSuggestions(locations, branchScope(editing.node), editing.tier.key);
  return <A.Editor onSubmit={editor.submit} aria-label={`${editing.mode === 'add' ? 'Add' : 'Rename'} ${editing.tier.label.toLowerCase()}`}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); editor.cancel(); } }}>
    <A.EditorRow>
      <S.Input ref={input} aria-label={editing.tier.label} required value={editing.value} disabled={busy} list={suggestionsId}
        placeholder={`New ${editing.tier.label.toLowerCase()}`} onChange={event => editor.change(event.target.value)} />
      <datalist id={suggestionsId}>{suggestions.map(value => <option key={value} value={value} />)}</datalist>
      <A.Command type="submit" disabled={busy || !editing.value.trim()} aria-label="Save branch change" title="Save">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
      </A.Command>
      <A.Command type="button" disabled={busy} onClick={editor.cancel} aria-label="Cancel branch change" title="Cancel">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
      </A.Command>
    </A.EditorRow>
    <A.Hint>{editing.mode === 'add' ? `Add ${editing.tier.label.toLowerCase()} under ${editing.node.label}`
      : `${editing.ids.length} saved ${editing.ids.length === 1 ? 'path' : 'paths'}${editing.ids.length > 1 ? ' · includes descendants' : ''}`}</A.Hint>
    {editing.error ? <S.Message $error role="alert">{editing.error}</S.Message> : null}
  </A.Editor>;
}
