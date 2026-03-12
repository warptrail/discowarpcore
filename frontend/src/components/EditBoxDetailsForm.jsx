import React, { useEffect, useMemo, useState } from 'react';

import { updateBoxDetails } from '../api/boxes';
import useShortIdAvailability from '../hooks/useShortIdAvailability';

import * as S from './BoxForms/BoxEditForm.styles';
import BoxIdentityFields from './BoxForms/BoxIdentityFields';
import BoxTagsField from './BoxForms/BoxTagsField';
import BoxFormActions from './BoxForms/BoxFormActions';

export default function EditBoxDetailsForm({
  boxMongoId,
  initial,
  onSaved,
  onCancel,
  TagInputComponent,
}) {
  const [shortId, setShortId] = useState(initial?.box_id ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [tags, setTags] = useState(() =>
    Array.isArray(initial?.tags) ? initial.tags : [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const initialTagsKey = JSON.stringify(initial?.tags || []);

  useEffect(() => {
    setShortId(initial?.box_id ?? '');
    setLabel(initial?.label ?? '');
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
  }, [initial?._id, initial?.box_id, initial?.label, initial?.tags, initialTagsKey]);

  const {
    inProgress,
    unchanged,
    shortIdValid,
    shortIdAvail,
    shortIdChecking,
    isValid,
    isInvalid,
  } = useShortIdAvailability({
    shortId,
    initialShortId: initial?.box_id ?? '',
    debounceMs: 200,
  });

  const changed = useMemo(() => {
    const sameId = String(shortId || '') === String(initial?.box_id || '');
    const sameLabel = String(label || '') === String(initial?.label || '');
    const sameTags =
      JSON.stringify([...tags].sort()) ===
      JSON.stringify([...(initial?.tags || [])].sort());
    return !(sameId && sameLabel && sameTags);
  }, [shortId, label, tags, initial]);

  const canSave =
    !busy &&
    changed &&
    shortIdValid &&
    shortIdAvail &&
    (label || '').trim().length > 0;

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSave) return;

    setBusy(true);
    setError(null);

    try {
      const updated = await updateBoxDetails(boxMongoId, {
        box_id: shortId,
        label: label.trim(),
        tags,
      });
      onSaved?.(updated || { _id: boxMongoId, box_id: shortId, label, tags });
    } catch (e2) {
      setError(e2.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <S.Card onSubmit={onSubmit} noValidate>
      <BoxIdentityFields
        shortId={shortId}
        setShortId={setShortId}
        shortIdChecking={shortIdChecking}
        inProgress={inProgress}
        isValid={isValid}
        isInvalid={isInvalid}
        shortIdValid={shortIdValid}
        unchanged={unchanged}
        shortIdAvail={shortIdAvail}
        label={label}
        setLabel={setLabel}
      />

      <BoxTagsField
        tags={tags}
        setTags={setTags}
        TagInputComponent={TagInputComponent}
      />

      <S.Field style={{ marginTop: 10 }}>
        <S.Label>Image</S.Label>
        <S.FileStub>
          Image upload coming soon. (This is a placeholder — file selection
          disabled.)
        </S.FileStub>
      </S.Field>

      {error && (
        <S.Hint $error style={{ marginTop: 8 }}>
          {error}
        </S.Hint>
      )}

      <BoxFormActions onCancel={onCancel} busy={busy} canSave={canSave} />
    </S.Card>
  );
}
