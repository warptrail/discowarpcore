import React from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';
import {
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../../util/itemCategories';

const asInputValue = (value) => (value == null ? '' : String(value));

export default function EditItemStructuredFieldsSection({
  formData,
  onMetadataChange,
  onMetadataNumberChange,
}) {
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
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="essential">Essential</option>
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
      </S.InlineGrid>

      <S.InlineGrid>
        <S.Field>
          <S.Label>Last Maintained</S.Label>
          <S.Input
            type="date"
            name="lastMaintainedAt"
            value={formData.lastMaintainedAt || ''}
            onChange={onMetadataChange}
          />
        </S.Field>

        <S.Field>
          <S.Label>Maintenance Interval (days)</S.Label>
          <S.Input
            type="number"
            min="0"
            step="1"
            value={asInputValue(formData.maintenanceIntervalDays)}
            onChange={(e) =>
              onMetadataNumberChange('maintenanceIntervalDays', e.target.value)
            }
          />
        </S.Field>
      </S.InlineGrid>

      <S.Field>
        <S.Label>Maintenance Notes</S.Label>
        <S.TextArea
          name="maintenanceNotes"
          value={formData.maintenanceNotes || ''}
          onChange={onMetadataChange}
        />
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
          <S.Label>Purchase Price (cents)</S.Label>
          <S.Input
            type="number"
            min="0"
            step="1"
            value={asInputValue(formData.purchasePriceCents)}
            onChange={(e) =>
              onMetadataNumberChange('purchasePriceCents', e.target.value)
            }
          />
        </S.Field>

        <S.Field>
          <S.Label>Last Checked</S.Label>
          <S.Input
            type="date"
            name="lastCheckedAt"
            value={formData.lastCheckedAt || ''}
            onChange={onMetadataChange}
          />
        </S.Field>
      </S.InlineGrid>

      <S.InlineGrid>
        <S.Field>
          <S.Label>Minimum Desired Quantity</S.Label>
          <S.Input
            type="number"
            min="0"
            step="1"
            value={asInputValue(formData.minimumDesiredQuantity)}
            onChange={(e) =>
              onMetadataNumberChange('minimumDesiredQuantity', e.target.value)
            }
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
    </>
  );
}
