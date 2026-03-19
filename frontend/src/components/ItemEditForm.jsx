import React, { useEffect, useMemo, useState } from 'react';

import { editItem } from '../api/editItem';
import MoveItemBar from './MoveItemBar';
import ItemEditFieldsForm from './ItemEditFieldsForm';
import * as S from './ItemEditForm.styles';
import { normalizeItemCategory } from '../util/itemCategories';
import { getItemOwnershipContext } from '../util/itemOwnership';
import {
  buildEditableDateHistory,
  getIntervalDaysFromHistory,
  getLatestDateFromHistory,
  normalizeDateHistoryForSave,
  normalizeDateInputValue,
} from '../util/itemHistory';
import {
  formatCentsToUsdInput,
  parseUsdInputToCents,
} from '../util/usdMoney';

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

const normalizeLinksForForm = (links) => {
  if (!Array.isArray(links)) return [];
  return links
    .map((row) => ({
      label: String(row?.label || '').trim(),
      url: String(row?.url || '').trim(),
    }))
    .filter((row) => row.label || row.url);
};

const isValidExternalUrl = (value) => {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const sanitizeLinksForSave = (links) => {
  if (!Array.isArray(links)) return [];

  const normalized = [];
  for (let i = 0; i < links.length; i += 1) {
    const row = links[i];
    const label = String(row?.label || '').trim();
    const url = String(row?.url || '').trim();

    if (!label && !url) continue;
    if (!label) throw new Error(`Link ${i + 1}: label is required.`);
    if (label.length > 80) {
      throw new Error(`Link ${i + 1}: label must be 80 characters or fewer.`);
    }
    if (!url) throw new Error(`Link ${i + 1}: url is required.`);
    if (!isValidExternalUrl(url)) {
      throw new Error(`Link ${i + 1}: url must be a valid http/https URL.`);
    }

    normalized.push({ label, url });
  }

  return normalized;
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
  dateAcquired: item?.dateAcquired ? String(item.dateAcquired).slice(0, 10) : '',
  usageHistory: buildEditableDateHistory(item?.usageHistory, item?.dateLastUsed),
  checkHistory: buildEditableDateHistory(item?.checkHistory, item?.lastCheckedAt),
  maintenanceHistory: buildEditableDateHistory(
    item?.maintenanceHistory,
    item?.lastMaintainedAt
  ),
  isConsumable: !!item?.isConsumable,
  minimumDesiredQuantity: toNullableNonNegativeInteger(
    item?.minimumDesiredQuantity
  ),
  acquisitionType: item?.acquisitionType || 'unknown',
  valueUsd: formatCentsToUsdInput(item?.valueCents),
  purchasePriceUsd: formatCentsToUsdInput(item?.purchasePriceCents),
  maintenanceNotes: item?.maintenanceNotes || '',
  links: normalizeLinksForForm(item?.links),
  location: item?.location || '',
});

export default function ItemEditForm({
  initialItem,
  sourceBoxId,
  sourceBoxLabel,
  sourceBoxShortId,
  onClose,
  refreshBox,
  onItemUpdated,
  onMoveRequest,
  onOrphanRequest,
}) {
  const ownership = getItemOwnershipContext({
    ...initialItem,
    sourceBoxId,
    parentBoxLabel: initialItem?.parentBoxLabel || sourceBoxLabel,
    parentBoxId: initialItem?.parentBoxId || sourceBoxShortId,
  });
  const [formData, setFormData] = useState(() => buildFormData(initialItem));

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedTags, setSavedTags] = useState(initialItem.tags || []);
  const [flashTagSet, setFlashTagSet] = useState(new Set());

  const derivedDates = useMemo(() => {
    const lastUsedAt = getLatestDateFromHistory(formData.usageHistory);
    const lastCheckedAt = getLatestDateFromHistory(formData.checkHistory);
    const lastMaintainedAt = getLatestDateFromHistory(
      formData.maintenanceHistory
    );
    const maintenanceIntervalDays = getIntervalDaysFromHistory(
      formData.maintenanceHistory
    );

    return {
      lastUsedAt,
      lastCheckedAt,
      lastMaintainedAt,
      maintenanceIntervalDays,
    };
  }, [formData.checkHistory, formData.maintenanceHistory, formData.usageHistory]);

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

  const handleHistoryDateChange = (field, index, value) => {
    setFormData((prev) => {
      const next = Array.isArray(prev[field]) ? [...prev[field]] : [];
      next[index] = normalizeDateInputValue(value);
      return {
        ...prev,
        [field]: next,
      };
    });
    markDirty();
  };

  const handleAddHistoryDate = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(Array.isArray(prev[field]) ? prev[field] : []), ''],
    }));
    markDirty();
  };

  const handleRemoveHistoryDate = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (Array.isArray(prev[field]) ? prev[field] : []).filter(
        (_, i) => i !== index
      ),
    }));
    markDirty();
  };

  const handleLinkChange = (index, field, value) => {
    setFormData((prev) => {
      const nextLinks = Array.isArray(prev.links) ? [...prev.links] : [];
      const row = nextLinks[index] || { label: '', url: '' };
      nextLinks[index] = {
        ...row,
        [field]: value,
      };
      return {
        ...prev,
        links: nextLinks,
      };
    });
    markDirty();
  };

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...(Array.isArray(prev.links) ? prev.links : []), { label: '', url: '' }],
    }));
    markDirty();
  };

  const handleRemoveLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      links: (Array.isArray(prev.links) ? prev.links : []).filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const purchasePriceCents = parseUsdInputToCents(formData.purchasePriceUsd, {
        fieldLabel: 'Purchase price',
      });
      const explicitValueCents = parseUsdInputToCents(formData.valueUsd, {
        fieldLabel: 'Value',
      });
      const valueCents =
        explicitValueCents ??
        purchasePriceCents ??
        (Number.isFinite(initialItem?.valueCents) ? initialItem.valueCents : 0);

      const payload = {
        ...formData,
        keepPriority: formData.keepPriority || null,
        primaryOwnerName: toNullableTrimmedString(formData.primaryOwnerName),
        minimumDesiredQuantity: toNullableNonNegativeInteger(
          formData.minimumDesiredQuantity
        ),
        valueCents,
        purchasePriceCents,
        dateAcquired: formData.dateAcquired || null,
        usageHistory: normalizeDateHistoryForSave(formData.usageHistory),
        checkHistory: normalizeDateHistoryForSave(formData.checkHistory),
        maintenanceHistory: normalizeDateHistoryForSave(
          formData.maintenanceHistory
        ),
        maintenanceNotes: String(formData.maintenanceNotes || '').trim(),
        links: sanitizeLinksForSave(formData.links),
        category: normalizeItemCategory(formData.category),
        isConsumable: !!formData.isConsumable,
        location: String(formData.location || '').trim(),
      };

      if (ownership.isBoxed) {
        delete payload.location;
      }

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
        ownership={ownership}
        onFieldChange={handleChange}
        onNumberFieldChange={handleNumberFieldChange}
        onQuantityChange={handleQuantityChange}
        onTagsChange={handleTagsChange}
        onLinkChange={handleLinkChange}
        onAddLink={handleAddLink}
        onRemoveLink={handleRemoveLink}
        onHistoryDateChange={handleHistoryDateChange}
        onAddHistoryDate={handleAddHistoryDate}
        onRemoveHistoryDate={handleRemoveHistoryDate}
        derivedDates={derivedDates}
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
