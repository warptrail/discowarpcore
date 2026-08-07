import React, { useEffect, useState } from 'react';
import { patchItem } from '../../api/itemDetails';
import {
  DetailEditor,
  DetailList,
  DetailRow,
  DetailToggle,
  EditorActions,
  InlineMessage,
  QuietButton,
  SaveButton,
  Select,
  SuccessArea,
  SuccessCopy,
  SuccessHeading,
  TextArea,
} from './NewItemComposer.styles';
import {
  DEFAULT_ITEM_CATEGORY,
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../../util/itemCategories';

const FIELD_ORDER = [
  ['notes', 'Add a note', 'Notes'],
  ['category', 'Choose a category', 'Category'],
];

function rowLabel(field, idleLabel, item) {
  if (field === 'category') {
    const category = normalizeItemCategory(item?.category || DEFAULT_ITEM_CATEGORY);
    return category === DEFAULT_ITEM_CATEGORY ? idleLabel : formatItemCategory(category);
  }
  return String(item?.[field] || '').trim() || idleLabel;
}

export default function NewItemPostSaveDetails({
  item,
  photoError = '',
  photoRetrying = false,
  onRetryPhoto,
  onItemUpdated,
  onAddAnother,
}) {
  const [openField, setOpenField] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(DEFAULT_ITEM_CATEGORY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setOpenField('');
    setNotes(String(item?.notes || ''));
    setCategory(normalizeItemCategory(item?.category || DEFAULT_ITEM_CATEGORY));
    setError('');
  }, [item]);

  const selectField = (field) => {
    setError('');
    setOpenField((current) => (current === field ? '' : field));
  };

  const saveField = async (field) => {
    if (!item?._id || saving) return;
    const valueByField = {
      notes: notes.trim(),
      category: normalizeItemCategory(category),
    };

    setSaving(true);
    setError('');
    try {
      const updated = await patchItem(item._id, { [field]: valueByField[field] });
      onItemUpdated?.(updated);
      setOpenField('');
    } catch (saveError) {
      setError(saveError?.message || 'Could not save this detail. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = (field) => {
    if (field === 'category') {
      return (
        <Select
          aria-label="Item category"
          value={category}
          onChange={(event) => setCategory(normalizeItemCategory(event.target.value))}
          disabled={saving}
        >
          {ITEM_CATEGORIES.map((value) => (
            <option key={value} value={value}>{formatItemCategory(value)}</option>
          ))}
        </Select>
      );
    }

    return (
      <TextArea
        aria-label="Item notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Anything worth remembering"
        disabled={saving}
      />
    );
  };

  return (
    <SuccessArea aria-live="polite">
      <SuccessHeading>Added ✓</SuccessHeading>
      <SuccessCopy>
        {item?.name || 'Your item'} is in the inventory. Add any details now, or keep going.
      </SuccessCopy>

      {photoError ? (
        <InlineMessage $error>
          Item added; photo could not upload.{' '}
          <QuietButton type="button" onClick={onRetryPhoto} disabled={photoRetrying}>
            {photoRetrying ? 'Retrying…' : 'Retry photo'}
          </QuietButton>
        </InlineMessage>
      ) : null}

      <DetailList>
        {FIELD_ORDER.map(([field, idleLabel, editorLabel]) => (
          <DetailRow key={field}>
            <DetailToggle
              type="button"
              onClick={() => selectField(field)}
              aria-expanded={openField === field}
            >
              <span>{rowLabel(field, idleLabel, item)}</span>
              <span>{openField === field ? 'Close' : '›'}</span>
            </DetailToggle>
            {openField === field ? (
              <DetailEditor>
                {renderEditor(field)}
                {error ? <InlineMessage $error>{error}</InlineMessage> : null}
                <EditorActions>
                  <SaveButton type="button" onClick={() => saveField(field)} disabled={saving}>
                    {saving ? 'Saving…' : `Save ${editorLabel}`}
                  </SaveButton>
                  <QuietButton type="button" onClick={() => setOpenField('')} disabled={saving}>
                    Cancel
                  </QuietButton>
                </EditorActions>
              </DetailEditor>
            ) : null}
          </DetailRow>
        ))}
      </DetailList>

      <PrimaryAddAnother onClick={onAddAnother}>Add another</PrimaryAddAnother>
    </SuccessArea>
  );
}

const PrimaryAddAnother = ({ onClick, children }) => (
  <SaveButton type="button" onClick={onClick}>{children}</SaveButton>
);
