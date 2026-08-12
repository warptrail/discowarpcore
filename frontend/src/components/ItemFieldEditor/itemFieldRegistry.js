import { normalizeItemCategory } from '../../util/itemCategories';
import {
  buildEditableDateHistory,
  normalizeDateHistoryForSave,
  normalizeDateInputValue,
} from '../../util/itemHistory';
import { normalizeLinksForForm, sanitizeLinksForSave } from '../../util/itemLinks';
import { getItemOwnershipContext } from '../../util/itemOwnership';
import { normalizeKeepPriority } from '../../util/keepPriority';
import { normalizeTags } from '../../util/normalizeTags';
import { normalizePrimaryOwner } from '../../util/itemOwners';
import {
  formatCentsToUsdInput,
  parseUsdInputToCents,
} from '../../util/usdMoney';

const CONDITION_VALUES = new Set([
  'unknown',
  'new',
  'good',
  'fair',
  'poor',
  'needs_repair',
]);

const ACQUISITION_VALUES = new Set([
  'unknown',
  'purchase',
  'gift',
  'found',
  'made',
  'inherited',
]);

const cloneDraft = (value) => {
  if (value == null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
};

const toText = (value) => String(value ?? '');

const toNullableTrimmedString = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

const buildTagPayload = (draft) => {
  const seen = new Set();

  return normalizeTags(draft)
    .filter((tag) => tag.status !== 'deleted')
    .map((tag) => String(tag.value || '').trim())
    .filter((value) => {
      const key = value.toLocaleLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const buildHistoryDescriptor = ({ key, label, itemField, fallbackField }) => ({
  key,
  label,
  domain: 'ACTIVITY',
  editor: 'history',
  itemField,
  getDraft: (item) =>
    buildEditableDateHistory(item?.[itemField], item?.[fallbackField]),
  buildPayload: (draft) => ({
    [itemField]: normalizeDateHistoryForSave(draft),
  }),
});

const FIELD_DESCRIPTORS = [
  {
    key: 'name',
    label: 'Name',
    domain: 'IDENTITY',
    editor: 'text',
    autoComplete: 'off',
    getDraft: (item) => toText(item?.name),
    buildPayload: (draft) => {
      const name = toText(draft).trim();
      if (!name) throw new Error('Name is required.');
      return { name };
    },
  },
  {
    key: 'description',
    label: 'Description',
    domain: 'IDENTITY',
    editor: 'textarea',
    placeholder: 'A compact visual or functional description…',
    getDraft: (item) => toText(item?.description),
    buildPayload: (draft) => ({ description: toText(draft) }),
  },
  {
    key: 'notes',
    label: 'Notes',
    domain: 'IDENTITY',
    editor: 'notes',
    placeholder: 'Record history, meaning, repairs, memories, or handling details…',
    hint: 'Long-form item record. Line breaks and paragraphs are preserved.',
    getDraft: (item) => toText(item?.notes),
    buildPayload: (draft) => ({ notes: toText(draft) }),
  },
  {
    key: 'category',
    label: 'Category',
    domain: 'IDENTITY',
    editor: 'category',
    getDraft: (item) => normalizeItemCategory(item?.category),
    buildPayload: (draft) => ({ category: normalizeItemCategory(draft) }),
  },
  {
    key: 'tags',
    label: 'Tags',
    domain: 'IDENTITY',
    editor: 'tags',
    hint: 'Enter adds a tag. Selecting an existing tag marks it for removal.',
    getDraft: (item) => normalizeTags(item?.tags),
    buildPayload: (draft) => ({ tags: buildTagPayload(draft) }),
  },
  {
    key: 'quantity',
    label: 'Quantity',
    domain: 'INVENTORY',
    editor: 'quantity',
    getDraft: (item) => {
      const value = Number(item?.quantity);
      return Number.isFinite(value) ? value : 1;
    },
    buildPayload: (draft) => {
      const quantity = Number(draft);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error('Quantity must be a whole number from 1 to 99.');
      }
      return { quantity };
    },
  },
  {
    key: 'value',
    label: 'Value',
    domain: 'INVENTORY',
    editor: 'money',
    placeholder: '0.00',
    getDraft: (item) => formatCentsToUsdInput(item?.valueCents),
    buildPayload: (draft) => ({
      valueCents:
        parseUsdInputToCents(draft, { fieldLabel: 'Value' }) ?? 0,
    }),
  },
  {
    key: 'purchase-price',
    label: 'Purchase price',
    domain: 'INVENTORY',
    editor: 'money',
    placeholder: '0.00',
    getDraft: (item) => formatCentsToUsdInput(item?.purchasePriceCents),
    buildPayload: (draft) => ({
      purchasePriceCents: parseUsdInputToCents(draft, {
        fieldLabel: 'Purchase price',
      }),
    }),
  },
  {
    key: 'consumable',
    label: 'Consumable',
    domain: 'INVENTORY',
    editor: 'boolean',
    hint: 'Consumables use the consume lifecycle action instead of maintenance tracking.',
    getDraft: (item) => Boolean(item?.isConsumable),
    buildPayload: (draft) => ({ isConsumable: Boolean(draft) }),
  },
  {
    key: 'location',
    label: 'Location',
    domain: 'PLACEMENT',
    editor: 'text',
    placeholder: 'Room, shelf, area…',
    canEdit: (item) => !getItemOwnershipContext(item).isBoxed,
    hint: 'Boxed items inherit location from their container.',
    getDraft: (item) => toText(item?.location),
    buildPayload: (draft) => ({ location: toText(draft).trim() }),
  },
  {
    key: 'keep-priority',
    label: 'Keep priority',
    domain: 'RETENTION',
    editor: 'keep-priority',
    getDraft: (item) => normalizeKeepPriority(item?.keepPriority),
    buildPayload: (draft) => ({
      keepPriority: normalizeKeepPriority(draft) || null,
    }),
  },
  {
    key: 'primary-owner',
    label: 'Primary owner',
    domain: 'RETENTION',
    editor: 'primary-owner',
    getDraft: (item) => normalizePrimaryOwner(item?.primaryOwnerName),
    buildPayload: (draft) => ({
      primaryOwnerName: toNullableTrimmedString(draft),
    }),
  },
  {
    key: 'condition',
    label: 'Condition',
    domain: 'RETENTION',
    editor: 'condition',
    getDraft: (item) =>
      CONDITION_VALUES.has(item?.condition) ? item.condition : 'unknown',
    buildPayload: (draft) => {
      const condition = CONDITION_VALUES.has(draft) ? draft : 'unknown';
      return { condition };
    },
  },
  {
    key: 'acquisition-type',
    label: 'Acquisition type',
    domain: 'RETENTION',
    editor: 'acquisition-type',
    getDraft: (item) =>
      ACQUISITION_VALUES.has(item?.acquisitionType)
        ? item.acquisitionType
        : 'unknown',
    buildPayload: (draft) => ({
      acquisitionType: ACQUISITION_VALUES.has(draft) ? draft : 'unknown',
    }),
  },
  {
    key: 'date-acquired',
    label: 'Date acquired',
    domain: 'ACTIVITY',
    editor: 'date',
    getDraft: (item) => normalizeDateInputValue(item?.dateAcquired),
    buildPayload: (draft) => ({ dateAcquired: draft || null }),
  },
  buildHistoryDescriptor({
    key: 'usage-history',
    label: 'Usage history',
    itemField: 'usageHistory',
    fallbackField: 'dateLastUsed',
  }),
  buildHistoryDescriptor({
    key: 'check-history',
    label: 'Check history',
    itemField: 'checkHistory',
    fallbackField: 'lastCheckedAt',
  }),
  {
    ...buildHistoryDescriptor({
      key: 'maintenance-history',
      label: 'Maintenance history',
      itemField: 'maintenanceHistory',
      fallbackField: 'lastMaintainedAt',
    }),
    domain: 'CARE',
    canEdit: (item) => !item?.isConsumable,
  },
  {
    key: 'maintenance-notes',
    label: 'Maintenance notes',
    domain: 'CARE',
    editor: 'textarea',
    canEdit: (item) => !item?.isConsumable,
    hint: 'Maintenance tracking is unavailable while this item is consumable.',
    getDraft: (item) => toText(item?.maintenanceNotes),
    buildPayload: (draft) => ({
      maintenanceNotes: toText(draft).trim(),
    }),
  },
  {
    key: 'external-links',
    label: 'References',
    domain: 'MEDIA',
    editor: 'links',
    getDraft: (item) => normalizeLinksForForm(item?.links),
    buildPayload: (draft) => ({ links: sanitizeLinksForSave(draft) }),
  },
];

const FIELD_DESCRIPTOR_MAP = new Map(
  FIELD_DESCRIPTORS.map((descriptor) => [descriptor.key, descriptor]),
);

function getItemFieldDescriptor(fieldKey, item) {
  const key = String(fieldKey || '').trim().toLocaleLowerCase();
  const descriptor = FIELD_DESCRIPTOR_MAP.get(key) || null;
  if (!descriptor) return null;
  if (descriptor.canEdit && !descriptor.canEdit(item)) return null;
  return descriptor;
}

function isKnownItemFieldKey(fieldKey) {
  return FIELD_DESCRIPTOR_MAP.has(
    String(fieldKey || '').trim().toLocaleLowerCase(),
  );
}

function getItemFieldDraft(descriptor, item) {
  if (!descriptor) return null;
  return cloneDraft(descriptor.getDraft(item));
}

function buildItemFieldPayload(descriptor, draft) {
  if (!descriptor) throw new Error('This item field is not editable.');
  return descriptor.buildPayload(cloneDraft(draft));
}

function itemFieldDraftsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export {
  FIELD_DESCRIPTORS,
  buildItemFieldPayload,
  cloneDraft,
  getItemFieldDescriptor,
  getItemFieldDraft,
  isKnownItemFieldKey,
  itemFieldDraftsEqual,
};
