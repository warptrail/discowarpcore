import { useId, useState } from 'react';
import CustomSelect from '../CustomSelect';
import { DEFAULT_ITEM_CATEGORY, ITEM_CATEGORY_OPTIONS } from '../../util/itemCategories';
import * as Grid from '../../styles/InventoryGridHeader.styles';
import * as S from './QuickItemCaptureForm.styles';
import { QUICK_CAPTURE_DRAFT_STATE_KEY, buildQuickCaptureDraft } from './quickCaptureDraft';
import CaptureGlyph from './CaptureGlyph';

const FIELDS = [
  { id: 'description', label: 'Description' },
  { id: 'tags', label: 'Tags' },
  { id: 'notes', label: 'Note' },
  { id: 'category', label: 'Category' },
];
const CATEGORIES = ITEM_CATEGORY_OPTIONS.map((option) => option.value === DEFAULT_ITEM_CATEGORY
  ? { ...option, label: 'Category' } : option);

export default function QuickItemCaptureForm({ name, onNameChange, nameRef, description, onDescriptionChange,
  notes, onNotesChange, tags, onTagsChange, tagDraft, onTagDraftChange, onStageTag, category, onCategoryChange,
  busy, canSubmit, error, onSubmit, onCancel, mode, targetBoxId, quantity, variant }) {
  const [activeField, setActiveField] = useState('description');
  const consoleStyle = variant === 'console';
  const panelId = useId();
  const filled = { description: Boolean(description.trim()), tags: Boolean(tags.length || tagDraft.trim()),
    notes: Boolean(notes.trim()), category: category !== DEFAULT_ITEM_CATEGORY };
  const draft = buildQuickCaptureDraft({ name, description, notes, tags, tagDraft, category, quantity, mode, targetBoxId });
  return <S.Composer $console={consoleStyle} aria-label="Quick item capture">
    <S.Form onSubmit={onSubmit}>
      <S.NameStage>
      {consoleStyle ? <CaptureGlyph kind="item" /> : null}
      <S.Input data-field="name" id="quick-orphan-name" ref={nameRef} type="text" value={name}
        onChange={(event) => onNameChange(event.target.value)} placeholder="Item name" aria-label="Item name"
        autoCapitalize="sentences" disabled={busy} autoFocus required />
      </S.NameStage>
      <S.Switches role="group" aria-label="Quick item metadata">
        {FIELDS.map(({ id, label }) => <S.Switch key={id} type="button" $active={activeField === id}
          aria-expanded={activeField === id} aria-controls={panelId} data-filled={filled[id]} disabled={busy}
          title={`${label}${filled[id] ? ' — draft entered' : ''}`}
          onClick={() => setActiveField((current) => current === id ? null : id)}>
          {consoleStyle ? <CaptureGlyph kind={id} /> : null}<span>{label}</span>
        </S.Switch>)}
      </S.Switches>
      <S.Metadata id={panelId} hidden={!activeField}>
        {activeField === 'description' && <S.Input id="quick-orphan-description" type="text"
          value={description} onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Description" aria-label="Description" disabled={busy} />}
        {activeField === 'notes' && <S.Note id="quick-orphan-notes" value={notes}
          onChange={(event) => onNotesChange(event.target.value)} placeholder="Note" aria-label="Note" disabled={busy} />}
        {activeField === 'tags' && <>
          <S.TagRow><S.Input id="quick-orphan-tags" value={tagDraft} placeholder="Tags" aria-label="Tags" disabled={busy}
            onChange={(event) => onTagDraftChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onStageTag(); } }} />
            {tagDraft.trim() && <S.Action type="button" disabled={busy} onClick={() => onStageTag()} aria-label="Add tag" title="Add tag">
              {consoleStyle ? <CaptureGlyph kind="plus" /> : 'Add tag'}
            </S.Action>}
          </S.TagRow>
          {tags.length > 0 && <S.Tags>{tags.map((tag) => <S.Tag key={tag} type="button" aria-label={`Remove tag ${tag}`}
            disabled={busy} onClick={() => onTagsChange((current) => current.filter((entry) => entry !== tag))}>{tag} ×</S.Tag>)}</S.Tags>}
        </>}
        {activeField === 'category' && <CustomSelect value={category} options={CATEGORIES}
          onChange={onCategoryChange} ariaLabel="Category" disabled={busy} tone="var(--dw-cyan)"
          variant={consoleStyle ? 'prism' : 'default'} />}
      </S.Metadata>
      <S.Footer>
        <S.IntakeLink to="/intake" state={{ [QUICK_CAPTURE_DRAFT_STATE_KEY]: draft }} aria-disabled={busy}
          aria-label="Full item intake" title="Continue in full item intake"
          onClick={(event) => { if (busy) event.preventDefault(); }}>
          {consoleStyle ? <><CaptureGlyph kind="intake" /><span>Full intake</span></> : 'Full item intake'}
        </S.IntakeLink>
        <S.Actions>
          {onCancel && <S.Action type="button" onClick={onCancel} disabled={busy} aria-label="Cancel" title="Cancel">
            {consoleStyle ? <CaptureGlyph kind="cancel" /> : 'Cancel'}
          </S.Action>}
          <S.Action type="submit" $primary disabled={!canSubmit}>
            <span>{busy ? 'Saving…' : 'Capture'}</span>{consoleStyle ? <CaptureGlyph kind="capture" /> : null}
          </S.Action>
        </S.Actions>
      </S.Footer>
    </S.Form>
    {error && <Grid.QuickCaptureError role="alert">{error}</Grid.QuickCaptureError>}
  </S.Composer>;
}
