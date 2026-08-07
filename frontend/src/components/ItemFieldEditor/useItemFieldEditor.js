import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { editItem } from '../../api/editItem';
import {
  buildItemFieldPayload,
  cloneDraft,
  getItemFieldDescriptor,
  getItemFieldDraft,
  itemFieldDraftsEqual,
} from './itemFieldRegistry';

export default function useItemFieldEditor({
  item,
  fieldKey,
  onSaved,
}) {
  const itemId = String(item?._id || item?.id || '');
  const descriptor = useMemo(
    () => getItemFieldDescriptor(fieldKey, item),
    [fieldKey, item],
  );
  const activeIdentity = descriptor && itemId
    ? `${itemId}:${descriptor.key}`
    : '';
  const sourceRef = useRef({ descriptor, item });
  const onSavedRef = useRef(onSaved);
  const requestIdRef = useRef(0);
  const [baseline, setBaseline] = useState(null);
  const [draft, setDraftState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  sourceRef.current = { descriptor, item };
  onSavedRef.current = onSaved;

  useEffect(() => {
    requestIdRef.current += 1;
    const source = sourceRef.current;
    const nextDraft = getItemFieldDraft(source.descriptor, source.item);
    setBaseline(cloneDraft(nextDraft));
    setDraftState(cloneDraft(nextDraft));
    setSaving(false);
    setError('');

    return () => {
      requestIdRef.current += 1;
    };
  }, [activeIdentity]);

  const isDirty = useMemo(
    () => Boolean(descriptor) && !itemFieldDraftsEqual(draft, baseline),
    [baseline, descriptor, draft],
  );

  const setDraft = useCallback((nextDraft) => {
    setError('');
    setDraftState((current) => {
      const resolved = typeof nextDraft === 'function'
        ? nextDraft(current)
        : nextDraft;
      return cloneDraft(resolved);
    });
  }, []);

  const reset = useCallback(() => {
    if (saving) return false;
    setDraftState(cloneDraft(baseline));
    setError('');
    return true;
  }, [baseline, saving]);

  const save = useCallback(async () => {
    if (!descriptor || !itemId || saving || !isDirty) return null;

    let payload;
    let undoPayload;
    try {
      payload = buildItemFieldPayload(descriptor, draft);
      undoPayload = buildItemFieldPayload(descriptor, baseline);
    } catch (validationError) {
      setError(validationError?.message || 'This field could not be validated.');
      return null;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setSaving(true);
    setError('');

    try {
      const updated = await editItem(itemId, payload);
      if (requestIdRef.current !== requestId) return null;

      setBaseline(getItemFieldDraft(descriptor, updated));
      setDraftState(getItemFieldDraft(descriptor, updated));
      await onSavedRef.current?.({
        descriptor,
        fieldKey: descriptor.key,
        itemId,
        payload,
        undoPayload,
        updated,
      });
      return updated;
    } catch (saveError) {
      if (requestIdRef.current === requestId) {
        setError(saveError?.message || 'The field patch failed.');
      }
      return null;
    } finally {
      if (requestIdRef.current === requestId) setSaving(false);
    }
  }, [baseline, descriptor, draft, isDirty, itemId, saving]);

  return {
    activeIdentity,
    baseline,
    descriptor,
    draft,
    error,
    isActive: Boolean(descriptor),
    isDirty,
    reset,
    save,
    saving,
    setDraft,
  };
}
