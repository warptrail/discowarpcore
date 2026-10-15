import { DEFAULT_ITEM_CATEGORY, normalizeItemCategory } from '../../util/itemCategories.js';

export const QUICK_CAPTURE_DRAFT_STATE_KEY = 'quickCaptureDraft';

export function buildQuickCaptureDraft(draft = {}) {
  const quantity = Number(draft.quantity);
  return {
    version: 1,
    name: String(draft.name || ''),
    description: String(draft.description || ''),
    notes: String(draft.notes || ''),
    category: normalizeItemCategory(draft.category || DEFAULT_ITEM_CATEGORY),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    tags: [...new Set([...(Array.isArray(draft.tags) ? draft.tags : []), draft.tagDraft]
      .map((tag) => String(tag || '').trim()).filter(Boolean))],
    mode: draft.mode === 'inBox' ? 'inBox' : 'orphan',
    targetBoxId: draft.mode === 'inBox' ? String(draft.targetBoxId || '') : '',
  };
}

export function readQuickCaptureDraft(value) {
  return value && typeof value === 'object' && value.version === 1 ? buildQuickCaptureDraft(value) : null;
}
