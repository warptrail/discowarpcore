import React from 'react';

import QuantityInput from './QuantityInput';
import TagEdit from './TagEdit';
import * as S from './ItemEditForm.styles';
import {
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../util/itemCategories';
import {
  KEEP_PRIORITY_REMOVAL_OPTIONS,
  KEEP_PRIORITY_SCALE_OPTIONS,
} from '../util/keepPriority';
import { USD_DECIMAL_PATTERN } from '../util/usdMoney';

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
    <S.HistoryFieldWrap>
      <S.Label>{label}:</S.Label>
      <S.DateHistoryRows>
        {rows.length ? (
          rows.map((value, index) => (
            <S.DateHistoryRow key={`${field}-${index}`}>
              <S.Input
                type="date"
                value={value || ''}
                disabled={disabled}
                onChange={(event) =>
                  onHistoryDateChange(field, index, event.target.value)
                }
              />
              <S.DateHistoryRemoveButton
                type="button"
                disabled={disabled}
                onClick={() => onRemoveHistoryDate(field, index)}
              >
                Remove
              </S.DateHistoryRemoveButton>
            </S.DateHistoryRow>
          ))
        ) : (
          <S.FieldHint>No dates yet.</S.FieldHint>
        )}
      </S.DateHistoryRows>
      <S.DateHistoryAddButton
        type="button"
        disabled={disabled}
        onClick={() => onAddHistoryDate(field)}
      >
        + Add Date
      </S.DateHistoryAddButton>
    </S.HistoryFieldWrap>
  );
}

export default function ItemEditFieldsForm({
  formData,
  ownership,
  onFieldChange,
  onQuantityChange,
  onTagsChange,
  onLinkChange,
  onAddLink,
  onRemoveLink,
  onHistoryDateChange,
  onAddHistoryDate,
  onRemoveHistoryDate,
  derivedDates,
  saveSuccess,
  savedTags,
  flashTagSet,
  onClose,
  onSave,
  isDisabled,
  buttonContent,
}) {
  const isBoxed = !!ownership?.isBoxed;
  const parentBoxLabel = ownership?.parentBoxLabel || '';
  const inheritedLocation = ownership?.inheritedLocation || formData.location || '';
  const maintenanceDisabled = !!formData.isConsumable;

  return (
    <>
      <S.Label>
        Name:
        <S.Input
          type="text"
          name="name"
          value={formData.name}
          onChange={onFieldChange}
        />
      </S.Label>

      <S.Label>
        Description:
        <S.TextArea
          name="description"
          value={formData.description || ''}
          onChange={onFieldChange}
        />
      </S.Label>

      <S.Label>
        Notes:
        <S.TextArea
          name="notes"
          value={formData.notes}
          onChange={onFieldChange}
        />
      </S.Label>

      <S.SectionTitle>External Links</S.SectionTitle>
      <S.LinksWrap>
        {(Array.isArray(formData.links) ? formData.links : []).map((row, index) => (
          <S.LinkRow key={`legacy-link-row-${index}`}>
            <S.LinkInput
              type="text"
              value={row?.label || ''}
              onChange={(event) =>
                onLinkChange(index, 'label', event.target.value)
              }
              placeholder="Label"
              maxLength={80}
              aria-label={`Link ${index + 1} label`}
            />
            <S.LinkInput
              type="url"
              value={row?.url || ''}
              onChange={(event) =>
                onLinkChange(index, 'url', event.target.value)
              }
              placeholder="https://example.com"
              inputMode="url"
              aria-label={`Link ${index + 1} URL`}
            />
            <S.LinkRemoveButton
              type="button"
              onClick={() => onRemoveLink(index)}
            >
              Remove
            </S.LinkRemoveButton>
          </S.LinkRow>
        ))}

        <S.LinkAddButton type="button" onClick={onAddLink}>
          + Add Link
        </S.LinkAddButton>
      </S.LinksWrap>

      <S.Label>
        Location:
        <S.Input
          type="text"
          name="location"
          value={isBoxed ? inheritedLocation : formData.location || ''}
          onChange={onFieldChange}
          disabled={isBoxed}
          readOnly={isBoxed}
          placeholder={isBoxed ? 'Inherited from parent box' : 'Room, shelf, area...'}
        />
        {isBoxed ? (
          <S.FieldHint>
            Location is inherited from parent box
            {parentBoxLabel ? ` (${parentBoxLabel})` : ''}.
          </S.FieldHint>
        ) : null}
      </S.Label>

      <S.Label>Tags:</S.Label>
      <TagEdit
        initialTags={formData.tags}
        onTagsChange={onTagsChange}
        justSaved={saveSuccess}
        newTagSet={new Set(formData.tags.filter((tag) => !savedTags.includes(tag)))}
        flashTagSet={flashTagSet}
      />

      <S.Label>Quantity:</S.Label>
      <QuantityInput value={formData.quantity} onChange={onQuantityChange} />

      <S.Label>
        Category:
        <S.Select
          name="category"
          value={normalizeItemCategory(formData.category)}
          onChange={onFieldChange}
        >
          {ITEM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatItemCategory(category)}
            </option>
          ))}
        </S.Select>
      </S.Label>

      <S.SectionTitle>Ownership / Retention</S.SectionTitle>
      <S.FieldGrid>
        <S.Label>
          Keep Priority:
          <S.Select
            name="keepPriority"
            value={formData.keepPriority || ''}
            onChange={onFieldChange}
          >
            <option value="">Unspecified</option>
            <optgroup label="Priority Scale">
              {KEEP_PRIORITY_SCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Removal Planning">
              {KEEP_PRIORITY_REMOVAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          </S.Select>
        </S.Label>

        <S.Label>
          Primary Owner:
          <S.Input
            type="text"
            name="primaryOwnerName"
            value={formData.primaryOwnerName || ''}
            onChange={onFieldChange}
          />
        </S.Label>
      </S.FieldGrid>

      <S.FieldGrid>
        <S.Label>
          Condition:
          <S.Select
            name="condition"
            value={formData.condition || 'unknown'}
            onChange={onFieldChange}
          >
            <option value="unknown">Unknown</option>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="needs_repair">Needs Repair</option>
          </S.Select>
        </S.Label>

        <S.Label>
          Acquisition Type:
          <S.Select
            name="acquisitionType"
            value={formData.acquisitionType || 'unknown'}
            onChange={onFieldChange}
          >
            <option value="unknown">Unknown</option>
            <option value="purchase">Purchase</option>
            <option value="gift">Gift</option>
            <option value="found">Found</option>
            <option value="made">Made</option>
            <option value="inherited">Inherited</option>
          </S.Select>
        </S.Label>
      </S.FieldGrid>

      <S.FieldGrid>
        <S.Label>
          Value (USD):
          <S.Input
            type="text"
            inputMode="decimal"
            name="valueUsd"
            pattern={USD_DECIMAL_PATTERN.source}
            placeholder="0.00"
            value={formData.valueUsd || ''}
            onChange={onFieldChange}
          />
          <S.FieldHint>Non-negative USD, max 2 decimals.</S.FieldHint>
        </S.Label>

        <S.Label>
          Purchase Price (USD):
          <S.Input
            type="text"
            inputMode="decimal"
            name="purchasePriceUsd"
            pattern={USD_DECIMAL_PATTERN.source}
            placeholder="0.00"
            value={formData.purchasePriceUsd || ''}
            onChange={onFieldChange}
          />
          <S.FieldHint>
            If value is blank, it defaults to purchase amount on save.
          </S.FieldHint>
        </S.Label>
      </S.FieldGrid>

      <S.SectionTitle>Dates / Usage</S.SectionTitle>
      <S.FieldGrid>
        <S.Label>
          Date Acquired:
          <S.Input
            type="date"
            name="dateAcquired"
            value={formData.dateAcquired || ''}
            onChange={onFieldChange}
          />
        </S.Label>

        <S.Label>
          Last Used (derived):
          <S.StaticValue>{derivedDates?.lastUsedAt || '—'}</S.StaticValue>
        </S.Label>
      </S.FieldGrid>

      <DateHistoryField
        label="Usage History"
        field="usageHistory"
        values={formData.usageHistory}
        onHistoryDateChange={onHistoryDateChange}
        onAddHistoryDate={onAddHistoryDate}
        onRemoveHistoryDate={onRemoveHistoryDate}
      />

      <S.FieldGrid>
        <S.Label>
          Last Checked (derived):
          <S.StaticValue>{derivedDates?.lastCheckedAt || '—'}</S.StaticValue>
        </S.Label>
      </S.FieldGrid>

      <DateHistoryField
        label="Check History"
        field="checkHistory"
        values={formData.checkHistory}
        onHistoryDateChange={onHistoryDateChange}
        onAddHistoryDate={onAddHistoryDate}
        onRemoveHistoryDate={onRemoveHistoryDate}
      />

      <S.CheckboxRow>
        <S.Checkbox
          type="checkbox"
          name="isConsumable"
          checked={!!formData.isConsumable}
          onChange={onFieldChange}
        />
        Track as consumable
      </S.CheckboxRow>

      <S.SectionTitle>Maintenance</S.SectionTitle>
      <S.FieldGrid>
        <S.Label>
          Last Maintained (derived):
          <S.StaticValue>{derivedDates?.lastMaintainedAt || '—'}</S.StaticValue>
        </S.Label>

        <S.Label>
          Maintenance Interval (days):
          <S.StaticValue>
            {derivedDates?.maintenanceIntervalDays ?? '—'}
          </S.StaticValue>
        </S.Label>
      </S.FieldGrid>

      <DateHistoryField
        label="Maintenance History"
        field="maintenanceHistory"
        values={formData.maintenanceHistory}
        disabled={maintenanceDisabled}
        onHistoryDateChange={onHistoryDateChange}
        onAddHistoryDate={onAddHistoryDate}
        onRemoveHistoryDate={onRemoveHistoryDate}
      />

      <S.Label>
        Maintenance Notes:
        <S.TextArea
          name="maintenanceNotes"
          value={formData.maintenanceNotes || ''}
          disabled={maintenanceDisabled}
          onChange={onFieldChange}
        />
        {maintenanceDisabled ? (
          <S.FieldHint>Maintenance tracking is disabled for consumables.</S.FieldHint>
        ) : null}
      </S.Label>

      <S.ButtonRow>
        <S.Button type="button" $variant="close" onClick={onClose}>
          Close
        </S.Button>

        <S.Button type="button" onClick={onSave} disabled={isDisabled}>
          {buttonContent}
        </S.Button>
      </S.ButtonRow>
    </>
  );
}
