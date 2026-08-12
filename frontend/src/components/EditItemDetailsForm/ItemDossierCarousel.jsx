import React, { useEffect, useState } from 'react';

import QuantityInput from '../QuantityInput';
import TagContainer from '../TagContainer';
import ItemImageField from '../ImageFields/ItemImageField';
import {
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../../util/itemCategories';
import {
  KEEP_PRIORITY_REMOVAL_OPTIONS,
  KEEP_PRIORITY_SCALE_OPTIONS,
} from '../../util/keepPriority';
import { PRIMARY_OWNER_OPTIONS } from '../../util/itemOwners';
import { USD_DECIMAL_PATTERN } from '../../util/usdMoney';
import * as S from '../../styles/EditItemDetailsForm.styles';
import EditItemLifecycleSection from './EditItemLifecycleSection';

const CLUSTERS = [
  { id: 'identity', label: 'Identity', tone: 'teal' },
  { id: 'placement', label: 'Placement', tone: 'lilac' },
  { id: 'keep', label: 'Keep', tone: 'amber' },
  { id: 'activity', label: 'Activity', tone: 'coral' },
  { id: 'maintenance', label: 'Care', tone: 'mint' },
  { id: 'media', label: 'Media', tone: 'blue' },
];

function DateHistoryField({
  label,
  field,
  values,
  disabled = false,
  onHistoryDateChange,
  onAddHistoryDate,
  onRemoveHistoryDate,
}) {
  const rows = Array.isArray(values) ? values : [];
  return (
    <S.Field>
      <S.Label>{label}</S.Label>
      <S.HistoryRows>
        {rows.length ? rows.map((value, index) => (
          <S.HistoryRow key={`${field}-${index}`}>
            <S.Input
              type="date"
              value={value || ''}
              disabled={disabled}
              onChange={(event) => onHistoryDateChange(field, index, event.target.value)}
            />
            <S.HistoryRemoveButton
              type="button"
              disabled={disabled}
              onClick={() => onRemoveHistoryDate(field, index)}
            >
              Remove
            </S.HistoryRemoveButton>
          </S.HistoryRow>
        )) : <S.FieldHint>No entries yet.</S.FieldHint>}
      </S.HistoryRows>
      <S.HistoryAddButton
        type="button"
        disabled={disabled}
        onClick={() => onAddHistoryDate(field)}
      >
        + Add Date
      </S.HistoryAddButton>
    </S.Field>
  );
}

function IdentityCluster({ formData, onTextChange, onMetadataChange, onTagsChange, onQuantityChange }) {
  return <>
    <S.Field>
      <S.Label>Name</S.Label>
      <S.Input name="name" value={formData.name || ''} onChange={onTextChange} />
    </S.Field>
    <S.Field>
      <S.Label>Description</S.Label>
      <S.TextArea name="description" value={formData.description || ''} onChange={onTextChange} />
    </S.Field>
    <S.InlineGrid>
      <S.Field>
        <S.Label>Category</S.Label>
        <S.Select name="category" value={normalizeItemCategory(formData.category)} onChange={onMetadataChange}>
          {ITEM_CATEGORIES.map((category) => <option key={category} value={category}>{formatItemCategory(category)}</option>)}
        </S.Select>
      </S.Field>
      <S.Field>
        <S.Label>Quantity</S.Label>
        <QuantityInput value={formData.quantity} onChange={onQuantityChange} />
      </S.Field>
    </S.InlineGrid>
    <S.Field>
      <S.Label>Tags</S.Label>
      <TagContainer tags={formData.tags} onChange={onTagsChange} mode="edit" />
    </S.Field>
  </>;
}

function PlacementCluster({ formData, ownership, onTextChange, links, onLinkChange, onAddLink, onRemoveLink }) {
  const isBoxed = Boolean(ownership?.isBoxed);
  const inheritedLocation = ownership?.inheritedLocation || formData.location || '';
  const parentBoxLabel = ownership?.parentBoxLabel || 'No parent box';
  const rows = Array.isArray(links) ? links : [];
  return <>
    <S.InlineGrid>
      <S.Field>
        <S.Label>Parent Box</S.Label>
        <S.ReadOnlyValue>{parentBoxLabel}</S.ReadOnlyValue>
      </S.Field>
      <S.Field>
        <S.Label>Location</S.Label>
        <S.Input
          name="location"
          value={isBoxed ? inheritedLocation : formData.location || ''}
          onChange={onTextChange}
          disabled={isBoxed}
          readOnly={isBoxed}
          placeholder={isBoxed ? 'Inherited from parent box' : 'Room, shelf, area...'}
        />
        {isBoxed ? <S.FieldHint>Inherited from the parent box.</S.FieldHint> : null}
      </S.Field>
    </S.InlineGrid>
    <S.Field>
      <S.Label>Notes</S.Label>
      <S.TextArea name="notes" value={formData.notes || ''} onChange={onTextChange} />
    </S.Field>
    <S.Field>
      <S.Label>External Links</S.Label>
      <S.FieldHint>Add manuals, product pages, manufacturer sites, and docs.</S.FieldHint>
      {rows.length ? <S.LinkRows>
        {rows.map((row, index) => <S.LinkRow key={`item-link-${index}`}>
          <S.Input type="text" value={String(row?.label || '')} onChange={(event) => onLinkChange(index, 'label', event.target.value)} placeholder="Label" maxLength={80} aria-label={`Link ${index + 1} label`} />
          <S.Input type="url" value={String(row?.url || '')} onChange={(event) => onLinkChange(index, 'url', event.target.value)} placeholder="https://example.com" inputMode="url" aria-label={`Link ${index + 1} URL`} />
          <S.LinkRemoveButton type="button" onClick={() => onRemoveLink(index)}>Remove</S.LinkRemoveButton>
        </S.LinkRow>)}
      </S.LinkRows> : null}
      <S.AddInlineButton type="button" onClick={onAddLink}>+ Add Link</S.AddInlineButton>
    </S.Field>
  </>;
}

function KeepCluster({ formData, onMetadataChange }) {
  return <>
    <S.InlineGrid>
      <S.Field>
        <S.Label>Keep Priority</S.Label>
        <S.Select name="keepPriority" value={formData.keepPriority || ''} onChange={onMetadataChange}>
          <option value="">Unspecified</option>
          <optgroup label="Priority Scale">{KEEP_PRIORITY_SCALE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>
          <optgroup label="Removal Planning">{KEEP_PRIORITY_REMOVAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>
        </S.Select>
      </S.Field>
      <S.Field>
        <S.Label>Primary Owner</S.Label>
        <S.Select name="primaryOwnerName" value={formData.primaryOwnerName || ''} onChange={onMetadataChange}>
          {PRIMARY_OWNER_OPTIONS.map((option) => (
            <option key={option.value || 'shared'} value={option.value}>{option.label}</option>
          ))}
        </S.Select>
      </S.Field>
    </S.InlineGrid>
    <S.InlineGrid>
      <S.Field>
        <S.Label>Condition</S.Label>
        <S.Select name="condition" value={formData.condition || 'unknown'} onChange={onMetadataChange}>
          <option value="unknown">Unknown</option><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="needs_repair">Needs Repair</option>
        </S.Select>
      </S.Field>
      <S.Field>
        <S.Label>Acquisition Type</S.Label>
        <S.Select name="acquisitionType" value={formData.acquisitionType || 'unknown'} onChange={onMetadataChange}>
          <option value="unknown">Unknown</option><option value="purchase">Purchase</option><option value="gift">Gift</option><option value="found">Found</option><option value="made">Made</option><option value="inherited">Inherited</option>
        </S.Select>
      </S.Field>
    </S.InlineGrid>
    <S.Field>
      <S.Label>Consumable</S.Label>
      <S.CheckboxRow><S.Checkbox type="checkbox" name="isConsumable" checked={Boolean(formData.isConsumable)} onChange={onMetadataChange} />Track as consumable inventory</S.CheckboxRow>
    </S.Field>
    <S.Field>
      <S.Label>Gift Intent</S.Label>
      <S.CheckboxRow><S.Checkbox type="checkbox" name="isIntendedGift" checked={Boolean(formData.isIntendedGift)} onChange={onMetadataChange} />Intended as a future gift</S.CheckboxRow>
    </S.Field>
    <S.InlineGrid>
      <S.Field>
        <S.Label>Value (USD)</S.Label>
        <S.Input type="text" inputMode="decimal" name="valueUsd" pattern={USD_DECIMAL_PATTERN.source} placeholder="0.00" value={formData.valueUsd || ''} onChange={onMetadataChange} />
      </S.Field>
      <S.Field>
        <S.Label>Purchase Price (USD)</S.Label>
        <S.Input type="text" inputMode="decimal" name="purchasePriceUsd" pattern={USD_DECIMAL_PATTERN.source} placeholder="0.00" value={formData.purchasePriceUsd || ''} onChange={onMetadataChange} />
      </S.Field>
    </S.InlineGrid>
  </>;
}

function ActivityCluster({ formData, derivedDates, onMetadataChange, onHistoryDateChange, onAddHistoryDate, onRemoveHistoryDate }) {
  return <>
    <S.InlineGrid>
      <S.Field><S.Label>Date Acquired</S.Label><S.Input type="date" name="dateAcquired" value={formData.dateAcquired || ''} onChange={onMetadataChange} /></S.Field>
      <S.Field><S.Label>Last Used</S.Label><S.ReadOnlyValue>{derivedDates.lastUsedAt || '—'}</S.ReadOnlyValue><S.FieldHint>Derived from usage history.</S.FieldHint></S.Field>
    </S.InlineGrid>
    <DateHistoryField label="Usage History" field="usageHistory" values={formData.usageHistory} onHistoryDateChange={onHistoryDateChange} onAddHistoryDate={onAddHistoryDate} onRemoveHistoryDate={onRemoveHistoryDate} />
    <S.Field><S.Label>Last Checked</S.Label><S.ReadOnlyValue>{derivedDates.lastCheckedAt || '—'}</S.ReadOnlyValue><S.FieldHint>Derived from check history.</S.FieldHint></S.Field>
    <DateHistoryField label="Check History" field="checkHistory" values={formData.checkHistory} onHistoryDateChange={onHistoryDateChange} onAddHistoryDate={onAddHistoryDate} onRemoveHistoryDate={onRemoveHistoryDate} />
  </>;
}

function MaintenanceCluster({ formData, derivedDates, onMetadataChange, onHistoryDateChange, onAddHistoryDate, onRemoveHistoryDate, item, disabled, onMarkGoneRequest, onReclaimRequest }) {
  const maintenanceDisabled = Boolean(formData.isConsumable);
  return <>
    <S.InlineGrid>
      <S.Field><S.Label>Last Maintained</S.Label><S.ReadOnlyValue>{derivedDates.lastMaintainedAt || '—'}</S.ReadOnlyValue></S.Field>
      <S.Field><S.Label>Maintenance Interval</S.Label><S.ReadOnlyValue>{derivedDates.maintenanceIntervalDays ?? '—'}</S.ReadOnlyValue><S.FieldHint>Days between the two latest records.</S.FieldHint></S.Field>
    </S.InlineGrid>
    <DateHistoryField label="Maintenance History" field="maintenanceHistory" values={formData.maintenanceHistory} disabled={maintenanceDisabled} onHistoryDateChange={onHistoryDateChange} onAddHistoryDate={onAddHistoryDate} onRemoveHistoryDate={onRemoveHistoryDate} />
    <S.Field>
      <S.Label>Maintenance Notes</S.Label>
      <S.TextArea name="maintenanceNotes" value={formData.maintenanceNotes || ''} disabled={maintenanceDisabled} onChange={onMetadataChange} />
      {maintenanceDisabled ? <S.FieldHint>Maintenance tracking is disabled for consumables.</S.FieldHint> : null}
    </S.Field>
    <EditItemLifecycleSection item={item} disabled={disabled} onMarkGoneRequest={onMarkGoneRequest} onReclaimRequest={onReclaimRequest} />
  </>;
}

export default function ItemDossierCarousel(props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const moveTo = (index) => {
    const nextIndex = Math.max(0, Math.min(CLUSTERS.length - 1, index));
    setActiveIndex(nextIndex);
  };

  useEffect(() => setActiveIndex(0), [props.item?._id]);

  const activeCluster = CLUSTERS[activeIndex];
  const clusterProps = {
    formData: props.formData,
    derivedDates: props.derivedDates,
    ownership: props.ownership,
    onTextChange: props.onTextChange,
    onTagsChange: props.onTagsChange,
    onQuantityChange: props.onQuantityChange,
    onMetadataChange: props.onMetadataChange,
    onHistoryDateChange: props.onHistoryDateChange,
    onAddHistoryDate: props.onAddHistoryDate,
    onRemoveHistoryDate: props.onRemoveHistoryDate,
    links: props.formData.links,
    onLinkChange: props.onLinkChange,
    onAddLink: props.onAddLink,
    onRemoveLink: props.onRemoveLink,
  };

  return <S.CarouselShell aria-label="Item dossier sections">
    <S.CarouselCap $tone={activeCluster.tone}>
      <S.CarouselTitle>
        <span>{activeCluster.label}</span>
        <S.CarouselDirty $dirty={props.isDirty}>
          {props.isDirty ? 'Unsaved changes' : `${activeIndex + 1} of ${CLUSTERS.length}`}
        </S.CarouselDirty>
      </S.CarouselTitle>
      <S.CarouselControls>
        <S.CarouselArrow type="button" onClick={() => moveTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous item section">‹</S.CarouselArrow>
        <S.CarouselDots role="tablist" aria-label="Item dossier sections">
          {CLUSTERS.map((cluster, index) => <S.CarouselDot key={cluster.id} type="button" role="tab" aria-selected={index === activeIndex} aria-controls={`item-editor-section-${cluster.id}`} tabIndex={index === activeIndex ? 0 : -1} aria-label={`Show ${cluster.label} section`} $active={index === activeIndex} $tone={cluster.tone} onClick={() => moveTo(index)} />)}
        </S.CarouselDots>
        <S.CarouselArrow type="button" onClick={() => moveTo(activeIndex + 1)} disabled={activeIndex === CLUSTERS.length - 1} aria-label="Next item section">›</S.CarouselArrow>
      </S.CarouselControls>
    </S.CarouselCap>
    <S.CarouselTrack>
      <S.CarouselSlide key={activeCluster.id} id={`item-editor-section-${activeCluster.id}`} role="tabpanel" aria-label={`${activeCluster.label} section`}>
        <S.ClusterCard $tone={activeCluster.tone}>
          <S.ClusterBody>
            {activeCluster.id === 'identity' ? <IdentityCluster {...clusterProps} /> : null}
            {activeCluster.id === 'placement' ? <PlacementCluster {...clusterProps} /> : null}
            {activeCluster.id === 'keep' ? <KeepCluster {...clusterProps} /> : null}
            {activeCluster.id === 'activity' ? <ActivityCluster {...clusterProps} /> : null}
            {activeCluster.id === 'maintenance' ? <MaintenanceCluster {...clusterProps} item={props.item} disabled={props.disabled} onMarkGoneRequest={props.onMarkGoneRequest} onReclaimRequest={props.onReclaimRequest} /> : null}
            {activeCluster.id === 'media' ? <ItemImageField item={props.item} disabled={props.disabled} onItemImageUpdated={props.onItemImageUpdated} onProcessImage={props.onProcessImage} processImageStatus={props.processImageStatus} processImageBusy={props.processImageBusy} processImageError={props.processImageError} processImageProgressLabel={props.processImageProgressLabel} processImageProgressPercent={props.processImageProgressPercent} persistedRenderTokens={props.persistedRenderTokens} activeVariant={props.activeVariant} hasProcessedVariant={props.hasProcessedVariant} onSwitchActiveVariant={props.onSwitchActiveVariant} switchVariantBusy={props.switchVariantBusy} switchVariantError={props.switchVariantError} processedPreviewUrl={props.processedPreviewUrl} imageRefreshToken={props.imageRefreshToken} /> : null}
          </S.ClusterBody>
        </S.ClusterCard>
      </S.CarouselSlide>
    </S.CarouselTrack>
  </S.CarouselShell>;
}
