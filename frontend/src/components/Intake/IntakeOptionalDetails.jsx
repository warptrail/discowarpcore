import { useState } from 'react';
import { ITEM_CATEGORY_OPTIONS } from '../../util/itemCategories';
import {
  TagChip,
  TagComposer,
  TagDraftInput,
  TagStageButton,
} from './NewItemComposer.styles';
import * as S from './IntakeOptionalDetails.styles';

const DETAIL_FIELDS = [
  { id: 'description', label: 'Description', symbol: '≡' },
  { id: 'tags', label: 'Tags', symbol: '#' },
  { id: 'notes', label: 'Notes', symbol: '✎' },
];

const CONDITION_OPTIONS = [
  ['unknown', 'Unknown'],
  ['new', 'New'],
  ['good', 'Good'],
  ['fair', 'Fair'],
  ['poor', 'Poor'],
  ['needs_repair', 'Needs repair'],
];

export default function IntakeOptionalDetails({
  description,
  onDescriptionChange,
  tags,
  onTagsChange,
  tagDraft,
  onTagDraftChange,
  onStageTag,
  notes,
  onNotesChange,
  category,
  onCategoryChange,
  condition,
  onConditionChange,
  disabled = false,
}) {
  const [openFields, setOpenFields] = useState([]);
  const [finerOpen, setFinerOpen] = useState(false);
  const isOpen = (field) => openFields.includes(field);
  const toggleField = (field) => setOpenFields((current) => current.includes(field)
    ? current.filter((entry) => entry !== field)
    : [...current, field]);

  return (
    <S.Section aria-label="Optional item details">
      <S.Switches>
        {DETAIL_FIELDS.map(({ id, label, symbol }) => (
          <S.Switch
            key={id}
            type="button"
            $tone={id}
            $active={isOpen(id)}
            aria-expanded={isOpen(id)}
            aria-controls={`new-item-${id}-panel`}
            onClick={() => toggleField(id)}
          >
            <span aria-hidden="true">{symbol}</span>{label}
          </S.Switch>
        ))}
      </S.Switches>

      {isOpen('description') ? (
        <S.DetailPanel id="new-item-description-panel" $tone="description">
          <S.FieldLabel htmlFor="new-item-description">Description</S.FieldLabel>
          <S.TextArea
            id="new-item-description"
            rows={2}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="What makes it recognizable?"
            disabled={disabled}
          />
        </S.DetailPanel>
      ) : null}

      {isOpen('tags') ? (
        <S.DetailPanel id="new-item-tags-panel" $tone="tags">
          <S.FieldLabel htmlFor="new-item-tags">Tags</S.FieldLabel>
          <TagComposer>
            {tags.map((tag) => (
              <TagChip
                key={tag}
                type="button"
                onClick={() => onTagsChange((current) => current.filter((entry) => entry !== tag))}
                disabled={disabled}
                aria-label={`Remove ${tag}`}
              >
                {tag} ×
              </TagChip>
            ))}
            <TagDraftInput
              id="new-item-tags"
              value={tagDraft}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                onStageTag();
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (/\s{2}$/.test(nextValue)) {
                  onStageTag(nextValue);
                  return;
                }
                onTagDraftChange(nextValue);
              }}
              placeholder="Add a tag"
              disabled={disabled}
            />
            {tagDraft.trim() ? (
              <TagStageButton type="button" onClick={() => onStageTag()} disabled={disabled}>
                Add
              </TagStageButton>
            ) : null}
          </TagComposer>
        </S.DetailPanel>
      ) : null}

      {isOpen('notes') ? (
        <S.DetailPanel id="new-item-notes-panel" $tone="notes">
          <S.FieldLabel htmlFor="new-item-notes">Notes</S.FieldLabel>
          <S.TextArea
            id="new-item-notes"
            rows={2}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Anything useful later"
            disabled={disabled}
          />
        </S.DetailPanel>
      ) : null}

      <S.FinerButton
        type="button"
        aria-expanded={finerOpen}
        aria-controls="new-item-finer-details"
        onClick={() => setFinerOpen((current) => !current)}
      >
        <span>Finer details</span><span aria-hidden="true">{finerOpen ? '−' : '+'}</span>
      </S.FinerButton>
      {finerOpen ? (
        <S.FinerGrid id="new-item-finer-details">
          <S.FinerField>
            <S.FieldLabel htmlFor="new-item-category">Category</S.FieldLabel>
            <S.Select id="new-item-category" value={category} onChange={(event) => onCategoryChange(event.target.value)} disabled={disabled}>
              {ITEM_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </S.Select>
          </S.FinerField>
          <S.FinerField>
            <S.FieldLabel htmlFor="new-item-condition">Condition</S.FieldLabel>
            <S.Select id="new-item-condition" value={condition} onChange={(event) => onConditionChange(event.target.value)} disabled={disabled}>
              {CONDITION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </S.Select>
          </S.FinerField>
        </S.FinerGrid>
      ) : null}
    </S.Section>
  );
}
