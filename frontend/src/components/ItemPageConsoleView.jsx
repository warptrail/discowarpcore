import { Fragment, memo } from 'react';
import { Link } from 'react-router-dom';

import ItemFieldEditor from './ItemFieldEditor/ItemFieldEditor';
import { getItemFieldDescriptor } from './ItemFieldEditor/itemFieldRegistry';
import { getItemOwnershipContext } from '../util/itemOwnership';
import { formatItemCategory, normalizeItemCategory } from '../util/itemCategories';
import { formatKeepPriorityLabel } from '../util/keepPriority';
import { getImportBatchHref } from '../api/intakeBatches';
import { getRetrievalTagHref } from './Retrieval/retrievalModel';
import * as S from '../styles/ItemPageConsoleView.styles';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const date = (value) => (value ? new Date(value).toLocaleDateString() : '—');
const dateTime = (value) => (value ? new Date(value).toLocaleString() : '—');
const money = (value) => Number.isFinite(value) ? usd.format(value) : '—';
const cents = (value) => Number.isFinite(value) ? usd.format(value / 100) : '—';
const text = (value) => String(value ?? '').trim() || '—';

function formatBox(box, fallback = '—') {
  const shortId = String(box?.box_id || '').trim();
  const label = String(box?.label || '').trim();
  return shortId && label ? `${label} (${shortId})` : label || (shortId ? `Box ${shortId}` : fallback);
}

function formatBatch(batch, fallback = '—') {
  const batchId = String(batch?.batchId || batch?.id || '').trim();
  const batchName = String(batch?.batchName || batch?.name || '').trim();
  return batchName && batchId ? `${batchName} (${batchId})` : batchName || batchId || fallback;
}

function DisplayValue({ value }) {
  if (value == null || value === '') return <S.Empty>—</S.Empty>;
  return value;
}

const TableRow = memo(function TableRow({
  domain,
  fieldEditor,
  fieldKey,
  first = false,
  item,
  label,
  locatorActive = false,
  onRequestDiscard,
  onRequestEdit,
  onSave,
  value,
}) {
  const descriptor = fieldKey
    ? getItemFieldDescriptor(fieldKey, item)
    : null;
  const isEditable = Boolean(descriptor);
  const isActive = Boolean(
    descriptor && fieldEditor?.descriptor?.key === descriptor.key,
  );
  const fieldModeActive = locatorActive || Boolean(fieldEditor?.descriptor);
  const tagValue = fieldKey === 'tags' && !isActive;

  return (
    <Fragment>
      <S.ConsoleRow
        $active={isActive}
        $dimmed={fieldModeActive && !isActive && !locatorActive}
        $editable={isEditable}
        $locator={locatorActive && isEditable}
        $sectionStart={first}
      >
        <S.DomainCell $first={first}>{first ? domain : ''}</S.DomainCell>
        <S.AttributeCell>{label}</S.AttributeCell>
        <S.ValueCell>
          {isEditable && tagValue ? (
            <S.TagValueEditorRow>
              <S.TagLinks>{value}</S.TagLinks>
              <S.EditableTagButton
                type="button"
                aria-label={`Edit ${descriptor.label}`}
                onClick={() => onRequestEdit?.(descriptor.key)}
              >
                EDIT
              </S.EditableTagButton>
            </S.TagValueEditorRow>
          ) : isEditable ? (
            <S.EditableValueButton
              type="button"
              $active={isActive}
              $locator={locatorActive}
              aria-expanded={isActive}
              aria-controls={isActive ? `item-field-editor-${descriptor.key}` : undefined}
              aria-label={`Edit ${descriptor.label}`}
              data-item-field={descriptor.key}
              onClick={() => onRequestEdit?.(descriptor.key)}
            >
              <S.EditableValueCopy>
                <DisplayValue value={value} />
              </S.EditableValueCopy>
              <S.EditableSignal aria-hidden="true">
                {isActive ? 'ACTIVE' : 'EDIT'}
              </S.EditableSignal>
            </S.EditableValueButton>
          ) : (
            <DisplayValue value={value} />
          )}
        </S.ValueCell>
      </S.ConsoleRow>
      {isActive ? (
        <S.FieldEditorRow>
          <S.FieldEditorCell colSpan="3">
            <div id={`item-field-editor-${descriptor.key}`}>
              <ItemFieldEditor
                descriptor={fieldEditor.descriptor}
                draft={fieldEditor.draft}
                error={fieldEditor.error}
                isDirty={fieldEditor.isDirty}
                saving={fieldEditor.saving}
                onChange={fieldEditor.setDraft}
                onSave={onSave}
                onRequestDiscard={onRequestDiscard}
              />
            </div>
          </S.FieldEditorCell>
        </S.FieldEditorRow>
      ) : null}
    </Fragment>
  );
});

function AllDataView({
  fieldEditor,
  item,
  itemId,
  locatorActive,
  onRequestDiscard,
  onRequestEdit,
  onSave,
}) {
  const ownership = getItemOwnershipContext(item);
  const box = ownership.box || item?.box || null;
  const tags = Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [];
  const links = Array.isArray(item?.links) ? item.links.filter((entry) => entry?.label && entry?.url) : [];
  const usageHistory = Array.isArray(item?.usageHistory) ? item.usageHistory : [];
  const checkHistory = Array.isArray(item?.checkHistory) ? item.checkHistory : [];
  const maintenanceHistory = Array.isArray(item?.maintenanceHistory) ? item.maintenanceHistory : [];
  const sourceBatch = item?.sourceBatch || null;
  const sourceBatchId = sourceBatch?.batchId || sourceBatch?.id || item?.sourceBatchId || '';
  const batchHref = sourceBatchId ? getImportBatchHref(sourceBatchId) : '';
  const domains = [
    {
      key: 'identity',
      label: 'IDENTITY',
      tone: 'violet',
      rows: [
        { fieldKey: 'name', label: 'Name', value: text(item?.name) },
        { fieldKey: 'description', label: 'Description', value: text(item?.description) },
        { fieldKey: 'category', label: 'Category', value: formatItemCategory(normalizeItemCategory(item?.category)) },
        {
          fieldKey: 'tags',
          label: 'Tags',
          value: tags.length ? (
            <S.TagLinks aria-label="Item tags">
              {tags.map((tag, index) => {
                const label = String(tag).trim();
                return (
                  <S.TagLink
                    key={`${label}-${index}`}
                    to={getRetrievalTagHref(label)}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {label}
                  </S.TagLink>
                );
              })}
            </S.TagLinks>
          ) : <S.Empty>—</S.Empty>,
        },
      ],
    },
    {
      key: 'notes',
      label: 'NOTES',
      tone: 'lilac',
      rows: [
        { fieldKey: 'notes', label: 'Item notes', value: text(item?.notes) },
      ],
    },
    {
      key: 'references',
      label: 'REFERENCES',
      tone: 'cyan',
      rows: [
        {
          fieldKey: 'external-links',
          label: 'External links',
          value: links.length ? (
            <S.ExternalLinksList>
              {links.map((link, index) => (
                <S.ExternalLink
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </S.ExternalLink>
              ))}
            </S.ExternalLinksList>
          ) : '—',
        },
      ],
    },
    {
      key: 'inventory',
      label: 'INVENTORY',
      tone: 'amber',
      rows: [
        { label: 'Inventory status', value: String(item?.item_status || '').toLowerCase() === 'gone' ? 'gone' : 'active' },
        { fieldKey: 'quantity', label: 'Quantity', value: item?.quantity ?? '—' },
        { fieldKey: 'value', label: 'Value', value: Number.isFinite(item?.value) ? money(item.value) : cents(item?.valueCents) },
        { fieldKey: 'purchase-price', label: 'Purchase price', value: cents(item?.purchasePriceCents) },
        { fieldKey: 'consumable', label: 'Consumable', value: item?.isConsumable ? 'Yes' : 'No' },
      ],
    },
    {
      key: 'placement',
      label: 'PLACEMENT',
      tone: 'teal',
      rows: [
        { label: 'Assignment', value: String(item?.item_status || '').toLowerCase() === 'gone' ? 'No longer have' : ownership.isOrphaned ? 'Orphaned' : 'Assigned' },
        { label: 'Box', value: formatBox(box) },
        { fieldKey: 'location', label: 'Location', value: ownership.effectiveLocation || item?.location || '—' },
        { label: 'Box group', value: ownership.effectiveBoxGroup || '—' },
        { label: 'Depth', value: item?.depth ?? '—' },
        { label: 'Top box', value: formatBox(item?.topBox) },
      ],
    },
    {
      key: 'retention',
      label: 'RETENTION',
      tone: 'rose',
      rows: [
        { fieldKey: 'keep-priority', label: 'Keep priority', value: formatKeepPriorityLabel(item?.keepPriority) || '—' },
        { fieldKey: 'primary-owner', label: 'Primary owner', value: text(item?.primaryOwnerName) },
        { fieldKey: 'condition', label: 'Condition', value: text(item?.condition) },
        { fieldKey: 'acquisition-type', label: 'Acquisition type', value: text(item?.acquisitionType) },
      ],
    },
    {
      key: 'activity',
      label: 'ACTIVITY',
      tone: 'green',
      rows: [
        { fieldKey: 'date-acquired', label: 'Date acquired', value: date(item?.dateAcquired) },
        { label: 'Last used', value: date(item?.dateLastUsed) },
        { label: 'Last checked', value: date(item?.lastCheckedAt) },
        { fieldKey: 'usage-history', label: 'Usage history', value: usageHistory.length ? usageHistory.map(date).join(' · ') : '—' },
        { fieldKey: 'check-history', label: 'Check history', value: checkHistory.length ? checkHistory.map(date).join(' · ') : '—' },
        { label: 'Average interval (days)', value: item?.avgUseIntervalDays ?? '—' },
      ],
    },
    {
      key: 'care',
      label: 'CARE',
      tone: 'blue',
      rows: [
        { label: 'Last maintained', value: date(item?.lastMaintainedAt) },
        { label: 'Maintenance interval (days)', value: item?.maintenanceIntervalDays ?? '—' },
        { fieldKey: 'maintenance-history', label: 'Maintenance history', value: maintenanceHistory.length ? maintenanceHistory.map(date).join(' · ') : '—' },
        { fieldKey: 'maintenance-notes', label: 'Maintenance notes', value: text(item?.maintenanceNotes) },
      ],
    },
    {
      key: 'lifecycle',
      label: 'LIFECYCLE',
      tone: 'red',
      rows: [
        { label: 'Disposition', value: text(item?.disposition) },
        { label: 'Disposition at', value: date(item?.disposition_at) },
        { label: 'Disposition notes', value: text(item?.disposition_notes) },
        { label: 'Orphaned at', value: date(item?.orphanedAt) },
      ],
    },
    {
      key: 'provenance',
      label: 'PROVENANCE',
      tone: 'orange',
      rows: [
        { label: 'Source batch', value: formatBatch(sourceBatch) },
        { label: 'Source batch record', value: text(item?.sourceBatchId) },
        { label: 'Batch status', value: text(sourceBatch?.archiveStatus) },
        { label: 'Batch imported', value: date(sourceBatch?.importedAt) },
        { label: 'Batch archived', value: date(sourceBatch?.archivedAt) },
        { label: 'Batch view', value: batchHref ? <S.ConsoleLink to={batchHref}>Open batch</S.ConsoleLink> : '—' },
      ],
    },
    {
      key: 'media',
      label: 'MEDIA',
      tone: 'indigo',
      rows: [
        { label: 'Image path', value: text(item?.imagePath) },
      ],
    },
    {
      key: 'admin',
      label: 'ADMIN',
      tone: 'neutral',
      rows: [
        { label: 'Item ID', value: item?._id || itemId || '—' },
        { label: 'Created', value: dateTime(item?.createdAt || item?.created_at) },
        { label: 'Updated', value: dateTime(item?.updatedAt || item?.updated_at) },
      ],
    },
  ];

  return (
    <S.ConsoleFrame $fieldMode={locatorActive || Boolean(fieldEditor?.descriptor)}>
      {locatorActive ? (
        <S.FieldLocatorStatus role="status">
          <strong>FIELD LOCATOR //</strong>
          <span>Choose an illuminated value to open a focused editor.</span>
        </S.FieldLocatorStatus>
      ) : null}
      <S.ConsoleTable>
        <thead><tr><th>Domain</th><th>Attribute</th><th>Value</th></tr></thead>
        {domains.map((domain) => (
          <S.DomainGroup
            key={domain.key}
            $tone={domain.tone}
            $active={Boolean(
              fieldEditor?.descriptor
              && domain.rows.some((row) => row.fieldKey === fieldEditor.descriptor.key),
            )}
          >
            {domain.rows.map((row, index) => (
              <TableRow
                key={`${domain.key}-${row.fieldKey || row.label}`}
                {...row}
                domain={domain.label}
                fieldEditor={fieldEditor}
                first={index === 0}
                item={item}
                locatorActive={locatorActive}
                onRequestDiscard={onRequestDiscard}
                onRequestEdit={onRequestEdit}
                onSave={onSave}
              />
            ))}
          </S.DomainGroup>
        ))}
      </S.ConsoleTable>
    </S.ConsoleFrame>
  );
}

function HierarchyView({ item }) {
  const ownership = getItemOwnershipContext(item);
  const nodes = Array.isArray(item?.breadcrumb) && item.breadcrumb.length ? item.breadcrumb : ownership.box ? [ownership.box] : [];
  const sourceBatch = item?.sourceBatch || null;
  const sourceBatchId = sourceBatch?.batchId || sourceBatch?.id || item?.sourceBatchId || '';
  const batchHref = sourceBatchId ? getImportBatchHref(sourceBatchId) : '';
  const status = String(item?.item_status || '').toLowerCase() === 'gone' ? 'No longer have' : ownership.isOrphaned ? 'Orphaned' : 'Assigned';

  return <S.HierarchyFrame>
    <S.HierarchyBranch>
      <S.NodeLabel>CONTAINMENT</S.NodeLabel>
      {nodes.length ? nodes.map((node, index) => <S.HierarchyLine key={node?._id || `${node?.box_id}-${index}`} $kind="box"><S.NodeKind>{index === nodes.length - 1 ? 'DIRECT BOX' : 'PARENT BOX'}</S.NodeKind><S.NodeValue>{node?.box_id ? <S.BoxLink to={`/boxes/${encodeURIComponent(node.box_id)}`}><S.BoxShortId><S.BoxShortIdMarker>#</S.BoxShortIdMarker><S.BoxShortIdDigits>{node.box_id}</S.BoxShortIdDigits></S.BoxShortId><S.BoxLabel>{node.label || 'Box'}</S.BoxLabel></S.BoxLink> : text(node?.label)}</S.NodeValue></S.HierarchyLine>) : <S.HierarchyLine $kind="system"><S.NodeKind>DIRECT BOX</S.NodeKind><S.NodeValue>Unassigned</S.NodeValue></S.HierarchyLine>}
      <S.HierarchyLine $kind="box"><S.NodeKind>LOCATION</S.NodeKind><S.NodeValue>{ownership.effectiveLocation || '—'}</S.NodeValue></S.HierarchyLine>
      <S.HierarchyLine $kind="box"><S.NodeKind>BOX GROUP</S.NodeKind><S.NodeValue>{ownership.effectiveBoxGroup || '—'}</S.NodeValue></S.HierarchyLine>
      <S.HierarchyLine $kind="box"><S.NodeKind>TOP BOX</S.NodeKind><S.NodeValue>{formatBox(item?.topBox)}</S.NodeValue></S.HierarchyLine>
    </S.HierarchyBranch>
    <S.HierarchyBranch>
      <S.NodeLabel>PROVENANCE</S.NodeLabel>
      <S.HierarchyLine $kind="provenance"><S.NodeKind>SOURCE BATCH</S.NodeKind><S.NodeValue>{batchHref ? <S.ConsoleLink to={batchHref}>{sourceBatchId || 'Open batch'}</S.ConsoleLink> : text(sourceBatchId)}</S.NodeValue></S.HierarchyLine>
      <S.HierarchyLine $kind="provenance"><S.NodeKind>STATUS</S.NodeKind><S.NodeValue>{text(sourceBatch?.archiveStatus)}</S.NodeValue></S.HierarchyLine>
    </S.HierarchyBranch>
    <S.HierarchyBranch>
      <S.NodeLabel>LIFECYCLE</S.NodeLabel>
      <S.HierarchyLine $kind="lifecycle"><S.NodeKind>CURRENT STATE</S.NodeKind><S.NodeValue>{status}</S.NodeValue></S.HierarchyLine>
      <S.HierarchyLine $kind="lifecycle"><S.NodeKind>DISPOSITION</S.NodeKind><S.NodeValue>{text(item?.disposition)}</S.NodeValue></S.HierarchyLine>
      <S.HierarchyLine $kind="lifecycle"><S.NodeKind>LAST CHECKED</S.NodeKind><S.NodeValue>{date(item?.lastCheckedAt)}</S.NodeValue></S.HierarchyLine>
    </S.HierarchyBranch>
  </S.HierarchyFrame>;
}

export default function ItemPageConsoleView({
  fieldEditor = null,
  item,
  itemId,
  locatorActive = false,
  onRequestDiscard,
  onRequestEdit,
  onSave,
  viewMode = 'all',
}) {
  return viewMode === 'hierarchy'
    ? <HierarchyView item={item} />
    : (
      <AllDataView
        fieldEditor={fieldEditor}
        item={item}
        itemId={itemId}
        locatorActive={locatorActive}
        onRequestDiscard={onRequestDiscard}
        onRequestEdit={onRequestEdit}
        onSave={onSave}
      />
    );
}
