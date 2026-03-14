import React, { useEffect, useState } from 'react';

import { editItem } from '../api/editItem';
import MoveItemBar from './MoveItemBar';
import ItemEditFieldsForm from './ItemEditFieldsForm';
import * as S from './ItemEditForm.styles';
import { normalizeItemCategory } from '../util/itemCategories';

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

const normalizeKeepPriority = (value) => {
  if (value == null || value === '') return '';
  const v = String(value).trim().toLowerCase();
  return v === 'normal' ? 'medium' : v;
};

const buildFormData = (item) => ({
  name: item?.name || '',
  description: item?.description || '',
  notes: item?.notes || '',
  quantity: item?.quantity || 1,
  tags: item?.tags || [],
  keepPriority: normalizeKeepPriority(item?.keepPriority),
  primaryOwnerName: item?.primaryOwnerName || '',
  condition: item?.condition || 'unknown',
  category: normalizeItemCategory(item?.category),
  isConsumable: !!item?.isConsumable,
  minimumDesiredQuantity: toNullableNonNegativeInteger(
    item?.minimumDesiredQuantity
  ),
  lastCheckedAt: item?.lastCheckedAt ? String(item.lastCheckedAt).slice(0, 10) : '',
  acquisitionType: item?.acquisitionType || 'unknown',
  purchasePriceCents: toNullableNonNegativeInteger(item?.purchasePriceCents),
  lastMaintainedAt: item?.lastMaintainedAt
    ? String(item.lastMaintainedAt).slice(0, 10)
    : '',
  maintenanceIntervalDays: toNullableNonNegativeInteger(
    item?.maintenanceIntervalDays
  ),
  maintenanceNotes: item?.maintenanceNotes || '',
});

export default function ItemEditForm({
  initialItem,
  sourceBoxId,
  onClose,
  refreshBox,
  onItemUpdated,
  onMoveRequest,
  onOrphanRequest,
}) {
  const [formData, setFormData] = useState(() => buildFormData(initialItem));

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedTags, setSavedTags] = useState(initialItem.tags || []);
  const [flashTagSet, setFlashTagSet] = useState(new Set());

  const markDirty = () => setDirty(true);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    markDirty();
  };

  const handleQuantityChange = (newQty) => {
    setFormData((prev) => ({
      ...prev,
      quantity: newQty,
    }));
    markDirty();
  };

  const handleTagsChange = (newTags) => {
    setFormData((prev) => ({
      ...prev,
      tags: newTags,
    }));
    markDirty();
  };

  const handleNumberFieldChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: toNullableNonNegativeInteger(value),
    }));
    markDirty();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...formData,
        keepPriority: formData.keepPriority || null,
        primaryOwnerName: toNullableTrimmedString(formData.primaryOwnerName),
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
        maintenanceNotes: String(formData.maintenanceNotes || '').trim(),
        category: normalizeItemCategory(formData.category),
        isConsumable: !!formData.isConsumable,
      };

      const updatedItem = await editItem(initialItem._id, payload);

      if (onItemUpdated) {
        onItemUpdated(updatedItem);
      }

      const newFlashTags = formData.tags.filter((tag) => !savedTags.includes(tag));
      setFlashTagSet(new Set(newFlashTags));
      setSavedTags([...formData.tags]);
      setSaveSuccess(true);

      await refreshBox();

      setDirty(false);
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveRequestProxy = ({ destBoxId, destLabel, destShortId }) => {
    onMoveRequest({
      itemId: initialItem._id,
      itemName: initialItem.name,
      itemQuantity: initialItem.quantity,
      sourceBoxId,
      destBoxId,
      destLabel,
      destShortId,
    });
  };

  const handleOrphanRequestProxy = () => {
    onOrphanRequest({
      boxMongoId: sourceBoxId,
      itemId: initialItem._id,
    });
  };

  const isDisabled = saving || !dirty;

  let buttonContent;
  if (saving) {
    buttonContent = 'Saving...';
  } else if (saveSuccess && !dirty) {
    buttonContent = <S.SaveFlash $isVisible={true}>✅ Saved</S.SaveFlash>;
  } else {
    buttonContent = 'Save';
  }

  const allBoxes = ['this is a box'];

  useEffect(() => {
    setFormData(buildFormData(initialItem));
    setDirty(false);
    setSavedTags(initialItem.tags || []);
  }, [initialItem?._id]);

  useEffect(() => {
    if (saveSuccess) {
      const timeout = setTimeout(() => {
        setSaveSuccess(false);
        setFlashTagSet(new Set());
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [saveSuccess]);

  return (
    <S.FormContainer>
      <ItemEditFieldsForm
        formData={formData}
        onFieldChange={handleChange}
        onNumberFieldChange={handleNumberFieldChange}
        onQuantityChange={handleQuantityChange}
        onTagsChange={handleTagsChange}
        saveSuccess={saveSuccess}
        savedTags={savedTags}
        flashTagSet={flashTagSet}
        onClose={onClose}
        onSave={(e) => {
          handleSave(e);
        }}
        isDisabled={isDisabled}
        buttonContent={buttonContent}
      />

      <MoveItemBar
        itemId={initialItem._id}
        initialItem={initialItem}
        boxes={allBoxes}
        sourceBoxId={sourceBoxId}
        refreshBox={refreshBox}
        onMoveRequest={handleMoveRequestProxy}
        onOrphanRequest={handleOrphanRequestProxy}
      />
    </S.FormContainer>
  );
}
