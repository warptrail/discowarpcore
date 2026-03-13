import React from 'react';

import QuantityInput from './QuantityInput';
import TagEdit from './TagEdit';
import * as S from './ItemEditForm.styles';

const asInputValue = (v) => (v == null ? '' : String(v));

export default function ItemEditFieldsForm({
  formData,
  onFieldChange,
  onNumberFieldChange,
  onQuantityChange,
  onTagsChange,
  saveSuccess,
  savedTags,
  flashTagSet,
  onClose,
  onSave,
  isDisabled,
  buttonContent,
}) {
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
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="essential">Essential</option>
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
          Purchase Price (cents):
          <S.Input
            type="number"
            min="0"
            step="1"
            value={asInputValue(formData.purchasePriceCents)}
            onChange={(e) =>
              onNumberFieldChange('purchasePriceCents', e.target.value)
            }
          />
        </S.Label>

        <S.Label>
          Minimum Desired Quantity:
          <S.Input
            type="number"
            min="0"
            step="1"
            value={asInputValue(formData.minimumDesiredQuantity)}
            onChange={(e) =>
              onNumberFieldChange('minimumDesiredQuantity', e.target.value)
            }
          />
        </S.Label>
      </S.FieldGrid>

      <S.FieldGrid>
        <S.Label>
          Last Checked:
          <S.Input
            type="date"
            name="lastCheckedAt"
            value={formData.lastCheckedAt || ''}
            onChange={onFieldChange}
          />
        </S.Label>
      </S.FieldGrid>

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
          Last Maintained:
          <S.Input
            type="date"
            name="lastMaintainedAt"
            value={formData.lastMaintainedAt || ''}
            onChange={onFieldChange}
          />
        </S.Label>

        <S.Label>
          Maintenance Interval (days):
          <S.Input
            type="number"
            min="0"
            step="1"
            value={asInputValue(formData.maintenanceIntervalDays)}
            onChange={(e) =>
              onNumberFieldChange('maintenanceIntervalDays', e.target.value)
            }
          />
        </S.Label>
      </S.FieldGrid>

      <S.Label>
        Maintenance Notes:
        <S.TextArea
          name="maintenanceNotes"
          value={formData.maintenanceNotes || ''}
          onChange={onFieldChange}
        />
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
