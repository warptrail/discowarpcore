import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ItemDecisionActions from './ItemDecisionActions';
import ItemNoteSheet from '../ItemNoteSheet';
import * as S from './ItemDossier.styles';
import CustomSelect from '../CustomSelect';
import QuantityInput from '../QuantityInput';
import {
  normalizeLinksForForm,
  sanitizeLinksForSave,
} from '../../util/itemLinks';
import {
  formatCentsToUsdInput,
  parseUsdInputToCents,
  sanitizeUsdInput,
  USD_DECIMAL_PATTERN,
} from '../../util/usdMoney';

function DisplayValue({ children, fallback = 'Not set' }) {
  if (React.isValidElement(children)) return children;
  const text = String(children ?? '').trim();
  return text && text !== '—' ? children : <S.EmptyDetail>{fallback}</S.EmptyDetail>;
}

function EditableField({
  label,
  value,
  fallback,
  onSave,
  children,
  note = false,
}) {
  const initialValue = String(value || '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) setDraft(initialValue);
  }, [editing, initialValue]);

  const cancel = () => {
    setDraft(initialValue);
    setError('');
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave?.(draft);
      setEditing(false);
    } catch (saveError) {
      setError(saveError?.message || 'Could not save this field.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <S.InlineFieldHeader>
        <S.CarouselDetailLabel>{label}</S.CarouselDetailLabel>
        <S.InlineEditButton
          type="button"
          aria-label={`Edit ${label.toLowerCase()}`}
          onClick={() => setEditing(true)}
          hidden={editing}
        >
          Edit
        </S.InlineEditButton>
      </S.InlineFieldHeader>
      {editing ? (
        <S.InlineEditor>
          <S.InlineTextarea
            value={draft}
            autoFocus
            rows={note ? 7 : 4}
            aria-label={`Edit ${label.toLowerCase()}`}
            onChange={(event) => setDraft(event.target.value)}
          />
          {error ? <S.InlineEditError role="alert">{error}</S.InlineEditError> : null}
          <S.InlineEditorActions>
            <S.InlineSaveButton type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving' : 'Save'}
            </S.InlineSaveButton>
            <S.InlineCancelButton type="button" onClick={cancel} disabled={saving}>
              Cancel
            </S.InlineCancelButton>
          </S.InlineEditorActions>
        </S.InlineEditor>
      ) : children || <S.CarouselDetailValue><DisplayValue fallback={fallback}>{value}</DisplayValue></S.CarouselDetailValue>}
    </>
  );
}

function EditableReferencesField({ links, onSave }) {
  const normalizedLinks = normalizeLinksForForm(links);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(normalizedLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) setDraft(normalizeLinksForForm(links));
  }, [editing, links]);

  const updateLink = (index, field, value) => {
    setDraft((current) => current.map((link, rowIndex) => (
      rowIndex === index ? { ...link, [field]: value } : link
    )));
  };

  const cancel = () => {
    setDraft(normalizeLinksForForm(links));
    setError('');
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave?.(sanitizeLinksForSave(draft));
      setEditing(false);
    } catch (saveError) {
      setError(saveError?.message || 'Could not save references.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <S.CarouselDetailField $wide>
      <S.InlineFieldHeader>
        <S.CarouselDetailLabel>References</S.CarouselDetailLabel>
        <S.InlineEditButton
          type="button"
          aria-label="Edit references"
          onClick={() => setEditing(true)}
          hidden={editing}
        >
          Edit
        </S.InlineEditButton>
      </S.InlineFieldHeader>
      {editing ? (
        <S.InlineEditor>
          <S.ReferenceRows>
            {draft.map((link, index) => (
              <S.ReferenceRow key={`reference-${index}`}>
                <S.ReferenceInput
                  type="text"
                  value={link.label}
                  maxLength={80}
                  placeholder="Label"
                  aria-label={`Reference ${index + 1} label`}
                  onChange={(event) => updateLink(index, 'label', event.target.value)}
                />
                <S.ReferenceInput
                  type="url"
                  value={link.url}
                  placeholder="https://example.com"
                  inputMode="url"
                  aria-label={`Reference ${index + 1} URL`}
                  onChange={(event) => updateLink(index, 'url', event.target.value)}
                />
                <S.RemoveReferenceButton
                  type="button"
                  aria-label={`Remove reference ${index + 1}`}
                  onClick={() => setDraft((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Remove
                </S.RemoveReferenceButton>
              </S.ReferenceRow>
            ))}
          </S.ReferenceRows>
          <S.AddReferenceButton
            type="button"
            onClick={() => setDraft((current) => [...current, { label: '', url: '' }])}
          >
            + Add reference
          </S.AddReferenceButton>
          {error ? <S.InlineEditError role="alert">{error}</S.InlineEditError> : null}
          <S.InlineEditorActions>
            <S.InlineSaveButton type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving' : 'Save'}
            </S.InlineSaveButton>
            <S.InlineCancelButton type="button" onClick={cancel} disabled={saving}>
              Cancel
            </S.InlineCancelButton>
          </S.InlineEditorActions>
        </S.InlineEditor>
      ) : (
        <S.CarouselDetailValue><ExternalLinks links={normalizedLinks} /></S.CarouselDetailValue>
      )}
    </S.CarouselDetailField>
  );
}

function ItemPageReference({ itemId }) {
  const [copied, setCopied] = useState(false);
  const href = itemId ? `/items/${encodeURIComponent(itemId)}` : '';

  const copyLink = async () => {
    if (!href || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(new URL(href, window.location.origin).href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!itemId) return null;

  return (
    <S.ItemPageReference>
      <S.ItemPageReferenceId>
        <S.CarouselDetailLabel>Mongo ID</S.CarouselDetailLabel>
        <code>{itemId}</code>
      </S.ItemPageReferenceId>
      <S.ItemPageReferenceActions>
        <S.ItemPageLink href={href}>Open item ↗</S.ItemPageLink>
        <S.CopyItemLinkButton type="button" onClick={copyLink}>
          {copied ? 'Copied' : 'Copy link'}
        </S.CopyItemLinkButton>
      </S.ItemPageReferenceActions>
    </S.ItemPageReference>
  );
}

function DetailField({ label, value, wide = false, editableValue, fallback, onSave, children }) {
  return (
    <S.CarouselDetailField $wide={wide}>
      {onSave ? (
        <EditableField label={label} value={editableValue} fallback={fallback} onSave={onSave}>
          {children}
        </EditableField>
      ) : (
        <>
          <S.CarouselDetailLabel>{label}</S.CarouselDetailLabel>
          <S.CarouselDetailValue><DisplayValue>{value}</DisplayValue></S.CarouselDetailValue>
        </>
      )}
    </S.CarouselDetailField>
  );
}

function ExternalLinks({ links = [] }) {
  if (!Array.isArray(links) || !links.length) {
    return <S.EmptyDetail>No references saved</S.EmptyDetail>;
  }

  return (
    <S.ExternalLinks>
      {links.map((link, index) => (
        <S.ExternalLink
          key={`${link.url}-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </S.ExternalLink>
      ))}
    </S.ExternalLinks>
  );
}

export function OverviewSlide({
  itemName,
  thumbnailUrl,
  canOpenImageLightbox,
  onOpenImageLightbox,
  categoryLabel,
  tags,
  boxId,
  boxLabel,
  location,
  description,
  inDeclutterDeck,
  declutterPending,
  onDeclutter,
  onMove,
  onEdit,
}) {
  const tagList = Array.isArray(tags) ? tags.filter(Boolean) : [];

  return (
    <S.CarouselOverview>
      <S.OverviewPhotoMax>
        {thumbnailUrl ? (
          <S.OverviewPhotoStage aria-hidden="true">
            <S.OverviewPhotoBackdrop src={thumbnailUrl} alt="" />
            <S.OverviewPhoto src={thumbnailUrl} alt="" />
          </S.OverviewPhotoStage>
        ) : (
          <S.OverviewPhotoPlaceholder aria-hidden="true">NO VISUAL RECORD</S.OverviewPhotoPlaceholder>
        )}
        <S.OverviewPhotoScrim aria-hidden="true" />

        {canOpenImageLightbox ? (
          <S.OverviewPhotoOpen
            type="button"
            onClick={onOpenImageLightbox}
            aria-label={`Open full-size image for ${itemName || 'item'}`}
          >
            Photo max <span aria-hidden="true">↗</span>
          </S.OverviewPhotoOpen>
        ) : null}

        <S.OverviewOverlay>
          <S.OverviewIdentity>
            <S.OverviewTitle>{itemName || 'Untitled item'}</S.OverviewTitle>
            <S.OverviewFactRail>
              <S.OverviewFact>
                <span>Location</span>
                <strong>{location || 'Not set'}</strong>
              </S.OverviewFact>
              <S.OverviewFact>
                <span>Box</span>
                <strong>
                  {boxId ? <S.OverviewBoxId>#{boxId}</S.OverviewBoxId> : null}
                  {boxLabel ? <S.OverviewBoxLabel>{boxLabel}</S.OverviewBoxLabel> : null}
                  {!boxId && !boxLabel ? 'Not assigned' : null}
                </strong>
              </S.OverviewFact>
              {categoryLabel && categoryLabel !== '—' ? (
                <S.OverviewCategory>{categoryLabel}</S.OverviewCategory>
              ) : null}
            </S.OverviewFactRail>
            {description ? <S.OverviewDescription>{description}</S.OverviewDescription> : null}
            {tagList.length ? (
              <S.OverviewTags aria-label="Item tags">
                {tagList.map((tag) => (
                  <S.OverviewTagLink
                    key={tag}
                    as={Link}
                    to={`/tags/${encodeURIComponent(tag)}`}
                  >
                    #{tag}
                  </S.OverviewTagLink>
                ))}
              </S.OverviewTags>
            ) : null}
          </S.OverviewIdentity>

          <S.OverviewCommandDeck>
            <ItemDecisionActions
              inDeclutterDeck={inDeclutterDeck}
              declutterPending={declutterPending}
              onDeclutter={onDeclutter}
              onMove={onMove}
              onEdit={onEdit}
            />
          </S.OverviewCommandDeck>
        </S.OverviewOverlay>
      </S.OverviewPhotoMax>
    </S.CarouselOverview>
  );
}

export function NotesSlide({
  itemName,
  description,
  notes,
  externalLinks = [],
  onSaveNotes,
  onSaveDescription,
  onSaveReferences,
}) {
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const noteText = String(notes || '').trim();
  const noteIsLong = noteText.length > 360 || noteText.split(/\r?\n/).length > 8;

  return (
    <S.CarouselSection>
      <S.CarouselSectionIntro>
        <S.CarouselSectionKicker>Words & references</S.CarouselSectionKicker>
        <S.CarouselSectionTitle>Notes</S.CarouselSectionTitle>
        <S.CarouselSectionCopy>
          The memory, context, and links that make this item recognizable later.
        </S.CarouselSectionCopy>
      </S.CarouselSectionIntro>

      <S.CarouselNoteCard>
        <EditableField label="Item notes" value={notes} fallback="No notes yet" onSave={onSaveNotes} note>
          {noteIsLong ? (
            <S.CarouselNoteOpen
              type="button"
              onClick={() => setNoteSheetOpen(true)}
              aria-label="Open full item note"
            >
              <S.CarouselNoteText>
                <DisplayValue fallback="No notes yet">{notes}</DisplayValue>
              </S.CarouselNoteText>
            </S.CarouselNoteOpen>
          ) : (
            <S.CarouselNoteText>
              <DisplayValue fallback="No notes yet">{notes}</DisplayValue>
            </S.CarouselNoteText>
          )}
        </EditableField>
      </S.CarouselNoteCard>

      <S.CarouselDetailGrid>
        <DetailField
          label="Description"
          editableValue={description}
          fallback="No description yet"
          onSave={onSaveDescription}
          wide
        >
          <S.CarouselDetailValue><DisplayValue fallback="No description yet">{description}</DisplayValue></S.CarouselDetailValue>
        </DetailField>
        <EditableReferencesField links={externalLinks} onSave={onSaveReferences} />
      </S.CarouselDetailGrid>

      {noteSheetOpen ? (
        <ItemNoteSheet
          itemName={itemName}
          note={noteText}
          onClose={() => setNoteSheetOpen(false)}
        />
      ) : null}
    </S.CarouselSection>
  );
}

export function DetailsSlide({
  itemId,
  boxGroup,
  keepPriority,
  keepPriorityLabel,
  primaryOwnerName,
  condition,
  acquisitionType,
  dateAcquired,
  dateAcquiredLabel,
  sourceBatchLabel,
  isIntendedGift,
  maintenanceIntervalDays,
  onSaveField,
}) {
  const [editingKey, setEditingKey] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const facts = [
    ['Box group', boxGroup],
    ['Keep priority', keepPriorityLabel, 'keepPriority', keepPriority || ''],
    ['Owner', primaryOwnerName, 'primaryOwnerName', primaryOwnerName || ''],
    ['Condition', condition, 'condition', condition || 'unknown'],
    ['Acquired as', acquisitionType, 'acquisitionType', acquisitionType || 'unknown'],
    ['Date acquired', dateAcquiredLabel, 'dateAcquired', dateAcquired || ''],
    ['Source batch', sourceBatchLabel],
    ['Intended gift', isIntendedGift ? 'Yes' : 'No', 'isIntendedGift', Boolean(isIntendedGift)],
    [
      'Maintenance interval',
      Number.isFinite(maintenanceIntervalDays) && maintenanceIntervalDays > 0
        ? `${maintenanceIntervalDays} days`
        : 'Not set',
    ],
  ];

  const startEdit = (fieldKey, value) => {
    if (saving) return;
    setEditingKey(fieldKey);
    setDraft(value);
    setError('');
  };

  const cancelEdit = () => {
    if (saving) return;
    setEditingKey('');
    setError('');
  };

  const saveEdit = async () => {
    if (!editingKey || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSaveField?.({ [editingKey]: draft });
      setEditingKey('');
    } catch (saveError) {
      setError(saveError?.message || 'Could not save this detail.');
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = (fieldKey) => {
    if (fieldKey === 'keepPriority') {
      return (
        <CustomSelect
          value={draft}
          ariaLabel="Keep priority"
          variant="prism"
          onChange={setDraft}
          options={[
            { value: '', label: 'Not set' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'essential', label: 'Essential' },
            { value: 'decommissioned', label: 'Decommissioned' },
          ]}
        />
      );
    }

    if (fieldKey === 'condition') {
      return (
        <CustomSelect
          value={draft}
          ariaLabel="Condition"
          variant="prism"
          onChange={setDraft}
          options={[
            { value: 'unknown', label: 'Unknown' },
            { value: 'new', label: 'New' },
            { value: 'good', label: 'Good' },
            { value: 'fair', label: 'Fair' },
            { value: 'poor', label: 'Poor' },
            { value: 'needs_repair', label: 'Needs repair' },
          ]}
        />
      );
    }

    if (fieldKey === 'acquisitionType') {
      return (
        <CustomSelect
          value={draft}
          ariaLabel="Acquisition type"
          variant="prism"
          onChange={setDraft}
          options={[
            { value: 'unknown', label: 'Unknown' },
            { value: 'purchase', label: 'Purchase' },
            { value: 'gift', label: 'Gift' },
            { value: 'found', label: 'Found' },
            { value: 'made', label: 'Made' },
            { value: 'inherited', label: 'Inherited' },
          ]}
        />
      );
    }

    if (fieldKey === 'isIntendedGift') {
      return (
        <CustomSelect
          value={String(draft)}
          ariaLabel="Intended gift"
          variant="prism"
          onChange={(value) => setDraft(value === 'true')}
          options={[
            { value: 'false', label: 'No' },
            { value: 'true', label: 'Yes' },
          ]}
        />
      );
    }

    return (
      <S.QuickFactInput
        type={fieldKey === 'dateAcquired' ? 'date' : 'text'}
        value={draft}
        aria-label={`Edit ${fieldKey}`}
        onChange={(event) => setDraft(event.target.value)}
      />
    );
  };

  return (
    <S.CarouselSection $compact>
      <ItemPageReference itemId={itemId} />
      <S.QuickFacts aria-label="Additional item details">
        {facts.map(([label, value, fieldKey, rawValue]) => (
          <S.QuickFact key={label}>
            <S.QuickFactHeader>
              <S.CarouselDetailLabel>{label}</S.CarouselDetailLabel>
              {fieldKey ? (
                <S.QuickFactEditButton
                  type="button"
                  aria-label={`Edit ${label.toLowerCase()}`}
                  onClick={() => startEdit(fieldKey, rawValue)}
                  hidden={editingKey === fieldKey}
                >
                  ✎
                </S.QuickFactEditButton>
              ) : null}
            </S.QuickFactHeader>
            {editingKey === fieldKey ? (
              <S.QuickFactEditor>
                {renderEditor(fieldKey)}
                <S.QuickFactEditorActions>
                  <S.QuickFactSaveButton type="button" onClick={saveEdit} disabled={saving}>Save</S.QuickFactSaveButton>
                  <S.QuickFactCancelButton type="button" onClick={cancelEdit} disabled={saving}>Cancel</S.QuickFactCancelButton>
                </S.QuickFactEditorActions>
                {error ? <S.QuickFactError role="alert">{error}</S.QuickFactError> : null}
              </S.QuickFactEditor>
            ) : (
              <S.QuickFactValue><DisplayValue>{value}</DisplayValue></S.QuickFactValue>
            )}
          </S.QuickFact>
        ))}
      </S.QuickFacts>

    </S.CarouselSection>
  );
}

export function CostsSlide({
  quantity,
  statusLabel,
  valueCents,
  purchasePriceCents,
  onSaveField,
}) {
  const [editingKey, setEditingKey] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const facts = [
    ['Estimated value', valueCents == null ? 'Not set' : `$${formatCentsToUsdInput(valueCents)}`, 'valueCents', formatCentsToUsdInput(valueCents)],
    ['Purchase price', purchasePriceCents == null ? 'Not set' : `$${formatCentsToUsdInput(purchasePriceCents)}`, 'purchasePriceCents', formatCentsToUsdInput(purchasePriceCents)],
    ['Quantity', quantity, 'quantity', String(quantity ?? 1)],
    ['Inventory status', statusLabel],
  ];

  const startEdit = (fieldKey, value) => {
    if (saving) return;
    setEditingKey(fieldKey);
    setDraft(value);
    setError('');
  };

  const cancelEdit = () => {
    if (saving) return;
    setEditingKey('');
    setError('');
  };

  const saveEdit = async () => {
    if (!editingKey || saving) return;
    setSaving(true);
    setError('');
    try {
      let value = draft;
      if (editingKey === 'quantity') {
        value = Number(draft);
        if (!Number.isInteger(value) || value < 1 || value > 99) {
          throw new Error('Quantity must be a whole number from 1 to 99.');
        }
      } else {
        value = parseUsdInputToCents(draft, {
          fieldLabel: editingKey === 'valueCents' ? 'Value' : 'Purchase price',
        });
        if (editingKey === 'valueCents') value = value ?? 0;
      }
      await onSaveField?.({ [editingKey]: value });
      setEditingKey('');
    } catch (saveError) {
      setError(saveError?.message || 'Could not save this cost.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <S.CarouselSection $compact>
      <S.QuickFacts aria-label="Inventory and value">
        {facts.map(([label, value, fieldKey, rawValue]) => (
          <S.QuickFact key={label}>
            <S.QuickFactHeader>
              <S.CarouselDetailLabel>{label}</S.CarouselDetailLabel>
              {fieldKey ? (
                <S.QuickFactEditButton
                  type="button"
                  aria-label={`Edit ${label.toLowerCase()}`}
                  onClick={() => startEdit(fieldKey, rawValue)}
                  hidden={editingKey === fieldKey}
                >
                  ✎
                </S.QuickFactEditButton>
              ) : null}
            </S.QuickFactHeader>
            {editingKey === fieldKey ? (
              <S.QuickFactEditor>
                {fieldKey === 'quantity' ? (
                  <QuantityInput
                    compact
                    value={Number(draft) || 1}
                    min={1}
                    max={99}
                    ariaLabel="Quantity"
                    onChange={(value) => setDraft(String(value))}
                  />
                ) : (
                  <S.QuickFactInput
                    type="text"
                    inputMode="decimal"
                    pattern={USD_DECIMAL_PATTERN.source}
                    value={draft}
                    aria-label={`Edit ${label.toLowerCase()}`}
                    onChange={(event) => setDraft(
                      sanitizeUsdInput(event.target.value),
                    )}
                  />
                )}
                <S.QuickFactEditorActions>
                  <S.QuickFactSaveButton type="button" onClick={saveEdit} disabled={saving}>Save</S.QuickFactSaveButton>
                  <S.QuickFactCancelButton type="button" onClick={cancelEdit} disabled={saving}>Cancel</S.QuickFactCancelButton>
                </S.QuickFactEditorActions>
                {error ? <S.QuickFactError role="alert">{error}</S.QuickFactError> : null}
              </S.QuickFactEditor>
            ) : (
              <S.QuickFactValue><DisplayValue>{value}</DisplayValue></S.QuickFactValue>
            )}
          </S.QuickFact>
        ))}
      </S.QuickFacts>
    </S.CarouselSection>
  );
}

export function ActivitySlide({
  activityActions = [],
  activityTimestamps = {},
  maintenanceNotes,
  isConsumable,
  consumablePending,
  onConsumableToggle,
}) {
  return (
    <S.CarouselSection>
      <S.CarouselSectionIntro>
        <S.CarouselSectionKicker>One-tap history</S.CarouselSectionKicker>
        <S.CarouselSectionTitle>Actions & activity</S.CarouselSectionTitle>
        <S.CarouselSectionCopy>
          Log what happened now; the latest saved moment stays visible on each action.
        </S.CarouselSectionCopy>
      </S.CarouselSectionIntro>

      <S.CarouselActivityGrid>
        {activityActions.map((action) => (
          <S.CarouselActivityButton
            key={action.id}
            type="button"
            $tone={action.tone}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <S.CarouselActivityCommand>{action.label}</S.CarouselActivityCommand>
            <S.CarouselActivityTime>
              {activityTimestamps?.[action.id] || 'Not logged yet'}
            </S.CarouselActivityTime>
            <S.CarouselActivityArrow aria-hidden="true">↗</S.CarouselActivityArrow>
          </S.CarouselActivityButton>
        ))}
      </S.CarouselActivityGrid>

      <S.ActivityModeButton
        type="button"
        role="switch"
        aria-checked={Boolean(isConsumable)}
        aria-label="Track as consumable inventory"
        $active={Boolean(isConsumable)}
        disabled={consumablePending}
        onClick={onConsumableToggle}
      >
        <S.ActivityModeCopy>
          <strong>Consumable inventory</strong>
          <span>Use consumption instead of maintenance tracking</span>
        </S.ActivityModeCopy>
        <S.ActivityModeState $active={Boolean(isConsumable)}>
          {consumablePending ? 'Saving' : isConsumable ? 'On' : 'Off'}
        </S.ActivityModeState>
      </S.ActivityModeButton>

      <S.CarouselDetailGrid>
        <DetailField label="Maintenance notes" value={maintenanceNotes} wide />
      </S.CarouselDetailGrid>
    </S.CarouselSection>
  );
}
