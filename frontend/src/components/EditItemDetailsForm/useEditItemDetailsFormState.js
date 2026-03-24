import { useEffect, useMemo, useState } from 'react';
import { editItem } from '../../api/editItem';
import { normalizeTags } from '../../util/normalizeTags';
import { normalizeItemCategory } from '../../util/itemCategories';
import { normalizeKeepPriority } from '../../util/keepPriority';
import { getItemOwnershipContext } from '../../util/itemOwnership';
import {
  buildEditableDateHistory,
  getIntervalDaysFromHistory,
  getLatestDateFromHistory,
  normalizeDateHistoryForSave,
  normalizeDateInputValue,
} from '../../util/itemHistory';
import {
  formatCentsToUsdInput,
  parseUsdInputToCents,
} from '../../util/usdMoney';

const toNullableTrimmedString = (value) => {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
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

const buildFormState = (item) => ({
  ...item,
  dateAcquired: item?.dateAcquired ? String(item.dateAcquired).slice(0, 10) : '',
  usageHistory: buildEditableDateHistory(item?.usageHistory, item?.dateLastUsed),
  checkHistory: buildEditableDateHistory(item?.checkHistory, item?.lastCheckedAt),
  maintenanceHistory: buildEditableDateHistory(
    item?.maintenanceHistory,
    item?.lastMaintainedAt
  ),
  keepPriority: normalizeKeepPriority(item?.keepPriority),
  primaryOwnerName: item?.primaryOwnerName || '',
  condition: item?.condition || 'unknown',
  category: normalizeItemCategory(item?.category),
  isConsumable: !!item?.isConsumable,
  acquisitionType: item?.acquisitionType || 'unknown',
  valueUsd: formatCentsToUsdInput(item?.valueCents),
  purchasePriceUsd: formatCentsToUsdInput(item?.purchasePriceCents),
  maintenanceNotes: item?.maintenanceNotes || '',
  links: normalizeLinksForForm(item?.links),
  location: item?.location || '',
  tags: normalizeTags(item?.tags),
});

export default function useEditItemDetailsFormState({ item, triggerFlash, onSaved }) {
  const ownership = useMemo(() => getItemOwnershipContext(item), [item]);
  const [formData, setFormData] = useState(() => buildFormState(item));
  const [initialData, setInitialData] = useState(() => buildFormState(item));
  const [saving, setSaving] = useState(false);

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
  }, [
    formData.checkHistory,
    formData.maintenanceHistory,
    formData.usageHistory,
  ]);

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

  const handleHistoryDateChange = (field, index, value) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[field]) ? [...prev[field]] : [];
      current[index] = normalizeDateInputValue(value);
      return {
        ...prev,
        [field]: current,
      };
    });
  };

  const handleAddHistoryDate = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(Array.isArray(prev[field]) ? prev[field] : []), ''],
    }));
  };

  const handleRemoveHistoryDate = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (Array.isArray(prev[field]) ? prev[field] : []).filter(
        (_, i) => i !== index
      ),
    }));
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
  };

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...(Array.isArray(prev.links) ? prev.links : []), { label: '', url: '' }],
    }));
  };

  const handleRemoveLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      links: (Array.isArray(prev.links) ? prev.links : []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

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
        (Number.isFinite(item?.valueCents) ? item.valueCents : 0);

      const payload = {
        ...formData,
        valueCents,
        purchasePriceCents,
        dateAcquired: formData.dateAcquired || null,
        usageHistory: normalizeDateHistoryForSave(formData.usageHistory),
        checkHistory: normalizeDateHistoryForSave(formData.checkHistory),
        maintenanceHistory: normalizeDateHistoryForSave(
          formData.maintenanceHistory
        ),
        keepPriority: formData.keepPriority || null,
        primaryOwnerName: toNullableTrimmedString(formData.primaryOwnerName),
        maintenanceNotes: String(formData.maintenanceNotes || '').trim(),
        links: sanitizeLinksForSave(formData.links),
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
    derivedDates,
    ownership,
    saving,
    isDirty,
    handleTextChange,
    handleTagsChange,
    handleQuantityChange,
    handleMetadataChange,
    handleHistoryDateChange,
    handleAddHistoryDate,
    handleRemoveHistoryDate,
    handleLinkChange,
    handleAddLink,
    handleRemoveLink,
    handleSave,
    handleRevert,
  };
}
