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
  onError,
  sourceVersion = '',
}) {
  const itemId = String(item?._id || item?.id || '');
  const descriptor = useMemo(
    () => getItemFieldDescriptor(fieldKey, item),
    [fieldKey, item],
  );
  const activeIdentity = descriptor && itemId
    ? `${itemId}:${descriptor.key}:${sourceVersion}`
    : '';
  const sourceRef = useRef({ descriptor, item });
  const onSavedRef = useRef(onSaved);
  const onErrorRef = useRef(onError);
  const requestIdRef = useRef(0);
  const [initializedIdentity, setInitializedIdentity] = useState('');
  const [storedBaseline, setBaseline] = useState(null);
  const [storedDraft, setDraftState] = useState(null);
  // A route can switch editors before the reset effect runs. Never expose the
  // previous field's scalar draft to an array editor (Tags, links or history).
  const initialDraft = initializedIdentity === activeIdentity
    ? null : getItemFieldDraft(descriptor, item);
  const baseline = initializedIdentity === activeIdentity ? storedBaseline : initialDraft;
  const draft = initializedIdentity === activeIdentity ? storedDraft : initialDraft;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  sourceRef.current = { descriptor, item };
  onSavedRef.current = onSaved;
  onErrorRef.current = onError;

  useEffect(() => {
    requestIdRef.current += 1;
    const source = sourceRef.current;
    const nextDraft = getItemFieldDraft(source.descriptor, source.item);
    setBaseline(cloneDraft(nextDraft));
    setDraftState(cloneDraft(nextDraft));
    setInitializedIdentity(activeIdentity);
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

  const save = useCallback(async ({ value = draft, commitSelection = false, quiet = false } = {}) => {
    if (!descriptor || !itemId || saving || (!isDirty && !commitSelection)) return null;

    let payload;
    let undoPayload;
    try {
      payload = buildItemFieldPayload(descriptor, value);
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
        quiet,
      });
      return updated;
    } catch (saveError) {
      if (requestIdRef.current === requestId) {
        setError(saveError?.message || 'The field patch failed.');
        onErrorRef.current?.(saveError);
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
