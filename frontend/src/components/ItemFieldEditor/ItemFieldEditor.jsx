import { useEffect, useRef, useState } from 'react';

import EditItemExternalLinksSection from '../EditItemDetailsForm/EditItemExternalLinksSection';
import EditItemTagsSection from '../EditItemDetailsForm/EditItemTagsSection';
import CustomSelect from '../CustomSelect';
import QuantityInput from '../QuantityInput';
import {
  ITEM_CATEGORIES,
  formatItemCategory,
} from '../../util/itemCategories';
import {
  KEEP_PRIORITY_REMOVAL_OPTIONS,
  KEEP_PRIORITY_SCALE_OPTIONS,
} from '../../util/keepPriority';
import { normalizeDateInputValue } from '../../util/itemHistory';
import * as FormS from '../../styles/EditItemDetailsForm.styles';
import * as S from '../../styles/ItemFieldEditor.styles';

const CONDITION_OPTIONS = [
  ['unknown', 'Unknown'],
  ['new', 'New'],
  ['good', 'Good'],
  ['fair', 'Fair'],
  ['poor', 'Poor'],
  ['needs_repair', 'Needs repair'],
];

const ACQUISITION_OPTIONS = [
  ['unknown', 'Unknown'],
  ['purchase', 'Purchase'],
  ['gift', 'Gift'],
  ['found', 'Found'],
  ['made', 'Made'],
  ['inherited', 'Inherited'],
];

const toCustomSelectOptions = (options) => options.map(([value, label]) => ({ value, label }));

function HistoryEditor({ descriptor, draft, onChange }) {
  const rows = Array.isArray(draft) ? draft : [];

  const updateDate = (index, value) => {
    onChange((current) => {
      const next = Array.isArray(current) ? [...current] : [];
      next[index] = normalizeDateInputValue(value);
      return next;
    });
  };

  const removeDate = (index) => {
    onChange((current) =>
      (Array.isArray(current) ? current : []).filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const addDate = () => {
    onChange((current) => [
      ...(Array.isArray(current) ? current : []),
      '',
    ]);
  };

  return (
    <FormS.Field>
      <FormS.Label>{descriptor.label}</FormS.Label>
      {rows.length ? (
        <FormS.HistoryRows>
          {rows.map((value, index) => (
            <FormS.HistoryRow key={`${descriptor.key}-${index}`}>
              <FormS.Input
                type="date"
                value={value || ''}
                aria-label={`${descriptor.label} date ${index + 1}`}
                onChange={(event) => updateDate(index, event.target.value)}
              />
              <FormS.HistoryRemoveButton
                type="button"
                onClick={() => removeDate(index)}
              >
                Remove
              </FormS.HistoryRemoveButton>
            </FormS.HistoryRow>
          ))}
        </FormS.HistoryRows>
      ) : (
        <S.HistoryEmpty>No history entries</S.HistoryEmpty>
      )}
      <FormS.HistoryAddButton type="button" onClick={addDate}>
        + Add date
      </FormS.HistoryAddButton>
    </FormS.Field>
  );
}

function LinksEditor({ draft, onChange }) {
  const links = Array.isArray(draft) ? draft : [];

  const updateLink = (index, field, value) => {
    onChange((current) => {
      const next = Array.isArray(current) ? [...current] : [];
      next[index] = {
        ...(next[index] || { label: '', url: '' }),
        [field]: value,
      };
      return next;
    });
  };

  const addLink = () => {
    onChange((current) => [
      ...(Array.isArray(current) ? current : []),
      { label: '', url: '' },
    ]);
  };

  const removeLink = (index) => {
    onChange((current) =>
      (Array.isArray(current) ? current : []).filter((_, rowIndex) => rowIndex !== index),
    );
  };

  return (
    <EditItemExternalLinksSection
      links={links}
      onLinkChange={updateLink}
      onAddLink={addLink}
      onRemoveLink={removeLink}
    />
  );
}

function FieldControl({ descriptor, draft, onChange }) {
  if (descriptor.editor === 'textarea') {
    return (
      <FormS.TextArea
        value={draft || ''}
        placeholder={descriptor.placeholder}
        aria-label={descriptor.label}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (descriptor.editor === 'notes') {
    return (
      <S.NotesTextArea
        value={draft || ''}
        placeholder={descriptor.placeholder}
        aria-label={descriptor.label}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (descriptor.editor === 'category') {
    return (
      <CustomSelect
        value={draft || ''}
        ariaLabel={descriptor.label}
        options={ITEM_CATEGORIES.map((category) => ({
          value: category,
          label: formatItemCategory(category),
        }))}
        onChange={onChange}
      />
    );
  }

  if (descriptor.editor === 'keep-priority') {
    const priorityOptions = [
      { value: '', label: 'Unspecified' },
      ...KEEP_PRIORITY_SCALE_OPTIONS.map((option) => ({
        value: option.value,
        label: `Priority // ${option.label}`,
      })),
      ...KEEP_PRIORITY_REMOVAL_OPTIONS.map((option) => ({
        value: option.value,
        label: `Removal // ${option.label}`,
      })),
    ];

    return (
      <CustomSelect
        value={draft || ''}
        ariaLabel={descriptor.label}
        options={priorityOptions}
        onChange={onChange}
      />
    );
  }

  if (descriptor.editor === 'condition') {
    return (
      <CustomSelect
        value={draft || 'unknown'}
        ariaLabel={descriptor.label}
        options={toCustomSelectOptions(CONDITION_OPTIONS)}
        onChange={onChange}
      />
    );
  }

  if (descriptor.editor === 'acquisition-type') {
    return (
      <CustomSelect
        value={draft || 'unknown'}
        ariaLabel={descriptor.label}
        options={toCustomSelectOptions(ACQUISITION_OPTIONS)}
        onChange={onChange}
      />
    );
  }

  if (descriptor.editor === 'quantity') {
    return (
      <QuantityInput
        value={draft ?? 1}
        onChange={onChange}
        min={1}
        max={99}
        ariaLabel={descriptor.label}
        fullWidth
      />
    );
  }

  if (descriptor.editor === 'money') {
    return (
      <S.MoneyShell>
        <S.MoneyPrefix aria-hidden="true">USD</S.MoneyPrefix>
        <FormS.Input
          type="text"
          inputMode="decimal"
          value={draft || ''}
          placeholder={descriptor.placeholder}
          aria-label={`${descriptor.label} in US dollars`}
          onChange={(event) => onChange(event.target.value)}
        />
      </S.MoneyShell>
    );
  }

  if (descriptor.editor === 'boolean') {
    return (
      <S.ChoiceGrid role="group" aria-label={descriptor.label}>
        <S.ChoiceButton
          type="button"
          $active={!draft}
          aria-pressed={!draft}
          onClick={() => onChange(false)}
        >
          Durable item
        </S.ChoiceButton>
        <S.ChoiceButton
          type="button"
          $active={Boolean(draft)}
          aria-pressed={Boolean(draft)}
          onClick={() => onChange(true)}
        >
          Consumable
        </S.ChoiceButton>
      </S.ChoiceGrid>
    );
  }

  if (descriptor.editor === 'date') {
    return (
      <FormS.Input
        type="date"
        value={draft || ''}
        aria-label={descriptor.label}
        onChange={(event) => onChange(normalizeDateInputValue(event.target.value))}
      />
    );
  }

  if (descriptor.editor === 'tags') {
    return <EditItemTagsSection tags={draft || []} onTagsChange={onChange} />;
  }

  if (descriptor.editor === 'links') {
    return <LinksEditor draft={draft} onChange={onChange} />;
  }

  if (descriptor.editor === 'history') {
    return (
      <HistoryEditor descriptor={descriptor} draft={draft} onChange={onChange} />
    );
  }

  return (
    <FormS.Input
      type="text"
      value={draft || ''}
      placeholder={descriptor.placeholder}
      autoComplete={descriptor.autoComplete}
      aria-label={descriptor.label}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function ItemFieldEditor({
  descriptor,
  draft,
  error = '',
  isDirty = false,
  saving = false,
  onChange,
  onSave,
  onRequestDiscard,
}) {
  const rootRef = useRef(null);
  const [notesEditing, setNotesEditing] = useState(false);
  const titleId = `item-field-editor-${descriptor.key}-title`;

  useEffect(() => {
    setNotesEditing(false);
  }, [descriptor.key]);

  useEffect(() => {
    const root = rootRef.current;
    const focusTarget = root?.querySelector(
      'textarea, input:not([type="hidden"]), select, button',
    );
    focusTarget?.focus({ preventScroll: true });
  }, [descriptor.key]);

  useEffect(() => {
    if (!notesEditing || descriptor.editor !== 'notes') return;
    rootRef.current?.querySelector('textarea')?.focus({ preventScroll: true });
  }, [descriptor.editor, notesEditing]);

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void onSave?.();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onRequestDiscard?.();
    }
  };

  return (
    <S.EditorShell
      ref={rootRef}
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      <S.EditorHeader>
        <S.EditorHeadingGroup>
          <S.EditorKicker>{descriptor.domain} // Field focus</S.EditorKicker>
          <S.EditorTitle id={titleId}>{descriptor.label}</S.EditorTitle>
        </S.EditorHeadingGroup>
        <S.EditorState $dirty={isDirty} $saving={saving} aria-live="polite">
          {saving ? 'Patching' : isDirty ? 'Unsaved' : 'Synchronized'}
        </S.EditorState>
      </S.EditorHeader>

      <S.EditorBody>
        {descriptor.editor === 'notes' ? (
          <S.NotesWorkspace>
            <S.NotesModeBar>
              <S.NotesModeLabel>{notesEditing ? 'TEXT EDITOR' : 'FULL NOTE'}</S.NotesModeLabel>
              <S.NotesModeButton
                type="button"
                aria-pressed={notesEditing}
                onClick={() => setNotesEditing((current) => !current)}
              >
                {notesEditing ? 'VIEW NOTE' : 'EDIT NOTE'}
              </S.NotesModeButton>
            </S.NotesModeBar>
            {notesEditing ? (
              <S.NotesTextArea
                value={draft || ''}
                placeholder={descriptor.placeholder}
                aria-label={descriptor.label}
                onChange={(event) => onChange(event.target.value)}
              />
            ) : (
              <S.NotesReader tabIndex="0" aria-label="Full item note">
                {String(draft || '').trim() || 'No item notes recorded.'}
              </S.NotesReader>
            )}
          </S.NotesWorkspace>
        ) : (
          <FieldControl
            descriptor={descriptor}
            draft={draft}
            onChange={onChange}
          />
        )}
        {descriptor.hint ? <S.EditorHint>{descriptor.hint}</S.EditorHint> : null}
        {error ? <S.EditorError role="alert">{error}</S.EditorError> : null}
      </S.EditorBody>
    </S.EditorShell>
  );
}
