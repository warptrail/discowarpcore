import React from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';
import {
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../../util/itemCategories';
import {
  KEEP_PRIORITY_REMOVAL_OPTIONS,
  KEEP_PRIORITY_SCALE_OPTIONS,
} from '../../util/keepPriority';
import { USD_DECIMAL_PATTERN } from '../../util/usdMoney';

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
        {rows.length ? (
          rows.map((value, index) => (
            <S.HistoryRow key={`${field}-${index}`}>
              <S.Input
                type="date"
                value={value || ''}
                disabled={disabled}
                onChange={(event) =>
                  onHistoryDateChange(field, index, event.target.value)
                }
              />
              <S.HistoryRemoveButton
                type="button"
                disabled={disabled}
                onClick={() => onRemoveHistoryDate(field, index)}
              >
                Remove
              </S.HistoryRemoveButton>
            </S.HistoryRow>
          ))
        ) : (
          <S.FieldHint>No entries yet.</S.FieldHint>
        )}
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

export default function EditItemStructuredFieldsSection({
  formData,
  derivedDates,
  onMetadataChange,
  onHistoryDateChange,
  onAddHistoryDate,
  onRemoveHistoryDate,
}) {
  const maintenanceDisabled = !!formData.isConsumable;

  return (
    <>
      <S.InlineGrid>
        <S.Field>
          <S.Label>Category</S.Label>
          <S.Select
            name="category"
            value={normalizeItemCategory(formData.category)}
            onChange={onMetadataChange}
          >
            {ITEM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatItemCategory(category)}
              </option>
            ))}
          </S.Select>
        </S.Field>

        <S.Field>
          <S.Label>Keep Priority</S.Label>
          <S.Select
            name="keepPriority"
            value={formData.keepPriority || ''}
            onChange={onMetadataChange}
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
        </S.Field>

        <S.Field>
          <S.Label>Primary Owner</S.Label>
          <S.Input
            type="text"
            name="primaryOwnerName"
            value={formData.primaryOwnerName || ''}
            onChange={onMetadataChange}
            placeholder="Shared, Mom, Erelas..."
          />
        </S.Field>

        <S.Field>
          <S.Label>Consumable</S.Label>
          <S.CheckboxRow>
            <S.Checkbox
              type="checkbox"
              name="isConsumable"
              checked={!!formData.isConsumable}
              onChange={onMetadataChange}
            />
            Track as consumable inventory
          </S.CheckboxRow>
        </S.Field>
      </S.InlineGrid>

      <S.InlineGrid>
        <S.Field>
          <S.Label>Date Acquired</S.Label>
          <S.Input
            type="date"
            name="dateAcquired"
            value={formData.dateAcquired || ''}
            onChange={onMetadataChange}
          />
        </S.Field>

        <S.Field>
          <S.Label>Last Used (derived)</S.Label>
          <S.ReadOnlyValue>{derivedDates.lastUsedAt || '—'}</S.ReadOnlyValue>
          <S.FieldHint>Calculated from usage history.</S.FieldHint>
        </S.Field>
      </S.InlineGrid>

      <DateHistoryField
        label="Usage History"
        field="usageHistory"
        values={formData.usageHistory}
        onHistoryDateChange={onHistoryDateChange}
        onAddHistoryDate={onAddHistoryDate}
        onRemoveHistoryDate={onRemoveHistoryDate}
      />

      <S.InlineGrid>
        <S.Field>
          <S.Label>Last Checked (derived)</S.Label>
          <S.ReadOnlyValue>{derivedDates.lastCheckedAt || '—'}</S.ReadOnlyValue>
          <S.FieldHint>Calculated from check history.</S.FieldHint>
        </S.Field>
      </S.InlineGrid>

      <DateHistoryField
        label="Check History"
        field="checkHistory"
        values={formData.checkHistory}
        onHistoryDateChange={onHistoryDateChange}
        onAddHistoryDate={onAddHistoryDate}
        onRemoveHistoryDate={onRemoveHistoryDate}
      />

      <S.InlineGrid>
        <S.Field>
          <S.Label>Last Maintained (derived)</S.Label>
          <S.ReadOnlyValue>{derivedDates.lastMaintainedAt || '—'}</S.ReadOnlyValue>
          <S.FieldHint>Calculated from maintenance history.</S.FieldHint>
        </S.Field>

        <S.Field>
          <S.Label>Maintenance Interval (days)</S.Label>
          <S.ReadOnlyValue>
            {derivedDates.maintenanceIntervalDays ?? '—'}
          </S.ReadOnlyValue>
          <S.FieldHint>
            Calculated from the two most recent maintenance dates.
          </S.FieldHint>
        </S.Field>
      </S.InlineGrid>

      <DateHistoryField
        label="Maintenance History"
        field="maintenanceHistory"
        values={formData.maintenanceHistory}
        disabled={maintenanceDisabled}
        onHistoryDateChange={onHistoryDateChange}
        onAddHistoryDate={onAddHistoryDate}
        onRemoveHistoryDate={onRemoveHistoryDate}
      />

      <S.Field>
        <S.Label>Maintenance Notes</S.Label>
        <S.TextArea
          name="maintenanceNotes"
          value={formData.maintenanceNotes || ''}
          disabled={maintenanceDisabled}
          onChange={onMetadataChange}
        />
        {maintenanceDisabled ? (
          <S.FieldHint>Maintenance tracking is disabled for consumables.</S.FieldHint>
        ) : null}
      </S.Field>

      <S.InlineGrid>
        <S.Field>
          <S.Label>Condition</S.Label>
          <S.Select
            name="condition"
            value={formData.condition || 'unknown'}
            onChange={onMetadataChange}
          >
            <option value="unknown">Unknown</option>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="needs_repair">Needs Repair</option>
          </S.Select>
        </S.Field>

        <S.Field>
          <S.Label>Acquisition Type</S.Label>
          <S.Select
            name="acquisitionType"
            value={formData.acquisitionType || 'unknown'}
            onChange={onMetadataChange}
          >
            <option value="unknown">Unknown</option>
            <option value="purchase">Purchase</option>
            <option value="gift">Gift</option>
            <option value="found">Found</option>
            <option value="made">Made</option>
            <option value="inherited">Inherited</option>
          </S.Select>
        </S.Field>
      </S.InlineGrid>

      <S.InlineGrid>
        <S.Field>
          <S.Label>Value (USD)</S.Label>
          <S.Input
            type="text"
            inputMode="decimal"
            name="valueUsd"
            pattern={USD_DECIMAL_PATTERN.source}
            placeholder="0.00"
            value={formData.valueUsd || ''}
            onChange={onMetadataChange}
          />
          <S.FieldHint>Non-negative USD, max 2 decimals.</S.FieldHint>
        </S.Field>

        <S.Field>
          <S.Label>Purchase Price (USD)</S.Label>
          <S.Input
            type="text"
            inputMode="decimal"
            name="purchasePriceUsd"
            pattern={USD_DECIMAL_PATTERN.source}
            placeholder="0.00"
            value={formData.purchasePriceUsd || ''}
            onChange={onMetadataChange}
          />
          <S.FieldHint>
            If value is blank, it will default to purchase amount on save.
          </S.FieldHint>
        </S.Field>
      </S.InlineGrid>

    </>
  );
}
