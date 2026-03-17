import { useEffect, useMemo, useState } from 'react';
import { editItem } from '../../api/editItem';
import { normalizeTags } from '../../util/normalizeTags';
import { normalizeItemCategory } from '../../util/itemCategories';
import { getItemOwnershipContext } from '../../util/itemOwnership';

const toNullableNonNegativeInteger = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
};

const toNullableTrimmedString = (value) => {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
};

const buildFormState = (item) => ({
  ...item,
  keepPriority: item?.keepPriority || '',
  primaryOwnerName: item?.primaryOwnerName || '',
  condition: item?.condition || 'unknown',
  category: normalizeItemCategory(item?.category),
  isConsumable: !!item?.isConsumable,
  minimumDesiredQuantity: toNullableNonNegativeInteger(
    item?.minimumDesiredQuantity
  ),
  lastCheckedAt: item?.lastCheckedAt
    ? String(item.lastCheckedAt).slice(0, 10)
    : '',
  acquisitionType: item?.acquisitionType || 'unknown',
  purchasePriceCents: toNullableNonNegativeInteger(item?.purchasePriceCents),
  lastMaintainedAt: item?.lastMaintainedAt
    ? String(item.lastMaintainedAt).slice(0, 10)
    : '',
  maintenanceIntervalDays: toNullableNonNegativeInteger(
    item?.maintenanceIntervalDays
  ),
  maintenanceNotes: item?.maintenanceNotes || '',
  location: item?.location || '',
  tags: normalizeTags(item?.tags),
});

export default function useEditItemDetailsFormState({ item, triggerFlash, onSaved }) {
  const ownership = useMemo(() => getItemOwnershipContext(item), [item]);
  const [formData, setFormData] = useState(() => buildFormState(item));
  const [initialData, setInitialData] = useState(() => buildFormState(item));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(buildFormState(item));
    setInitialData(buildFormState(item));
  }, [item]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialData),
    [formData, initialData]
  );

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags) => {
    setFormData((prev) => ({
      ...prev,
      tags: normalizeTags(tags),
    }));
  };

  const handleQuantityChange = (num) => {
    setFormData((prev) => ({
      ...prev,
      quantity: num,
    }));
  };

  const handleMetadataChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMetadataNumberChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: toNullableNonNegativeInteger(value),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        minimumDesiredQuantity: toNullableNonNegativeInteger(
          formData.minimumDesiredQuantity
        ),
        purchasePriceCents: toNullableNonNegativeInteger(
          formData.purchasePriceCents
        ),
        maintenanceIntervalDays: toNullableNonNegativeInteger(
          formData.maintenanceIntervalDays
        ),
        lastCheckedAt: formData.lastCheckedAt || null,
        lastMaintainedAt: formData.lastMaintainedAt || null,
        keepPriority: formData.keepPriority || null,
        primaryOwnerName: toNullableTrimmedString(formData.primaryOwnerName),
        maintenanceNotes: String(formData.maintenanceNotes || '').trim(),
        category: normalizeItemCategory(formData.category),
        isConsumable: !!formData.isConsumable,
        location: String(formData.location || '').trim(),
        tags: normalizeTags(formData.tags)
          .filter((t) => t.status !== 'deleted')
          .map((t) => t.value),
      };

      if (ownership.isBoxed) {
        delete payload.location;
      }

      // Image management is handled by dedicated upload/remove endpoints.
      delete payload.image;
      delete payload.imagePath;

      const updated = await editItem(item._id, payload);
      triggerFlash?.(item._id, 'yellow');
      onSaved?.(updated);

      setInitialData(buildFormState(updated));
      setFormData(buildFormState(updated));
    } catch (err) {
      console.error('Update failed:', err);
      triggerFlash?.(item._id, 'red');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = (e) => {
    e.preventDefault();
    setFormData(buildFormState(initialData));
    triggerFlash?.(item._id, 'blue');
  };

  return {
    formData,
    ownership,
    saving,
    isDirty,
    handleTextChange,
    handleTagsChange,
    handleQuantityChange,
    handleMetadataChange,
    handleMetadataNumberChange,
    handleSave,
    handleRevert,
  };
}
