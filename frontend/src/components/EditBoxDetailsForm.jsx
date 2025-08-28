import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

/* ========================= Styled ========================= */

const Card = styled.form`
  background: #171717;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 12px;
`;

const Row = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  @media (min-width: 640px) {
    grid-template-columns: ${({ $cols2 }) => ($cols2 ? '1fr 1fr' : '1fr')};
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 12px;
  color: #bdbdbd;
  margin-bottom: 6px;
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #2f2f2f;
  background: #101010;
  color: #eaeaea;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: #4ec77b;
    box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.2);
  }

  ${({ $invalid }) =>
    $invalid &&
    css`
      border-color: #ff4d4f;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    `}
`;
const statusColor = ($status) =>
  $status === 'inProgress'
    ? '#ffd400' // yellow
    : $status === 'valid'
    ? '#4ec77b' // green
    : $status === 'invalid'
    ? '#ff4d4f' // red
    : '#2f2f2f'; // default gray

const ShortIdInput = styled.input`
  font-family: monospace;
  text-align: center;
  width: 4.5em; /* ~3 digits wide */
  margin: 0 auto;
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid ${({ $status }) => statusColor($status)};
  background: #101010;
  color: #eaeaea;
  font-size: 18px;
  letter-spacing: 2px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${({ $status }) => statusColor($status)};
    box-shadow: 0 0 0 2px
      ${({ $status }) =>
        $status === 'inProgress'
          ? 'rgba(255,212,0,0.30)'
          : $status === 'valid'
          ? 'rgba(78,199,123,0.30)'
          : $status === 'invalid'
          ? 'rgba(255,77,79,0.30)'
          : 'rgba(180,180,180,0.15)'};
  }
`;

const Hint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: ${({ $error, $success }) =>
    $error ? '#ffbdbd' : $success ? '#9BE2B5' : '#bdbdbd'};
`;

const TagWrap = styled.div`
  padding: 8px;
  border-radius: 8px;
  border: 1px dashed #2f2f2f;
  background: #101010;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  font-size: 12px;
  color: #eaeaea;
`;

const RemoveX = styled.button`
  border: none;
  background: transparent;
  color: #bdbdbd;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  &:hover {
    color: #ff8080;
  }
`;

const TagAdder = styled.input`
  padding: 6px 8px;
  min-width: 140px;
  border-radius: 999px;
  border: 1px dashed #2a2a2a;
  background: #0f0f0f;
  color: #eaeaea;
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: #4ec77b;
    box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.2);
  }
`;

const FileStub = styled.div`
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed #2a2a2a;
  background: #101010;
  color: #bdbdbd;
  font-size: 12px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
`;

const Ghost = styled.button`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #2f2f2f;
  background: #141414;
  color: #eaeaea;
  cursor: pointer;
  &:hover {
    border-color: #4ec77b;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Primary = styled.button`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #2a3e30;
  background: #1b2a1f;
  color: #d9f2e6;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    border-color: #4ec77b;
    box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.15) inset;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* ========================= Helpers ========================= */

// 3-digit numeric string
const isThreeDigit = (v) => /^\d{3}$/.test(v || '');

// Debounce helper
const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// Default availability checker (adjust the URL shape if yours differs)
async function checkShortIdAvailable(shortId) {
  if (!/^\d{3}$/.test(shortId)) return false;
  const res = await fetch(
    `http://localhost:5002/api/boxes/check-id/${shortId}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to check availability');
  return !!data?.available;
}

/* ========================= Component ========================= */

/**
 * EditBoxDetailsForm
 *
 * Props:
 * - boxMongoId: string
 * - initial: { _id, box_id, label, tags?: string[] }
 * - onSaved: (updatedBox) => void
 * - onCancel: () => void
 * - TagInputComponent?: ReactComponent  // optional: reuse your existing tag component
 *      Receives props: { value: string[], onChange: (next: string[]) => void }
 */
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
    Array.isArray(initial?.tags) ? initial.tags : []
  );
  const [busy, setBusy] = useState(false);

  // validation state
  const [shortIdValid, setShortIdValid] = useState(
    isThreeDigit(initial?.box_id)
  );
  const [shortIdAvail, setShortIdAvail] = useState(true);
  const [shortIdChecking, setShortIdChecking] = useState(false);
  const [error, setError] = useState(null);

  const debouncedCheckRef = useRef(
    debounce(async (value) => {
      try {
        const ok = await checkShortIdAvailable(value);
        setShortIdAvail(ok);
      } catch {
        setShortIdAvail(false);
      } finally {
        setShortIdChecking(false);
      }
    }, 200)
  );

  const inProgress = shortId.length > 0 && shortId.length < 3;
  const unchanged = shortId === (initial?.box_id ?? '');
  const isValid = (unchanged && shortIdValid) || (shortIdValid && shortIdAvail);
  const isInvalid = shortId.length === 3 && !shortIdChecking && !isValid;
  // Only “invalid” when 3 digits AND NOT checking AND not valid

  // Kick availability check whenever shortId changes (and it’s different from initial)
  useEffect(() => {
    const valid = /^\d{3}$/.test(shortId);
    setShortIdValid(valid);

    // If unchanged from initial, treat as available and skip API
    if (shortId === (initial?.box_id ?? '')) {
      setShortIdAvail(true);
      setShortIdChecking(false);
      return;
    }

    if (valid) {
      // 🔑 Immediately mark as "checking" so the UI turns yellow right away
      setShortIdChecking(true);
      debouncedCheckRef.current(shortId); // this will later set avail + set checking=false
    } else {
      // 1–2 digits or empty: "in progress"
      setShortIdChecking(false);
      setShortIdAvail(false);
    }
  }, [shortId, initial?.box_id]);

  // EditBoxDetailsForm.jsx
  useEffect(() => {
    // If parent sends a new initial, sync local fields
    setShortId(initial?.box_id ?? '');
    setLabel(initial?.label ?? '');
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    // Re-evaluate validation too if you like:
    setShortIdValid(/^\d{3}$/.test(initial?.box_id ?? ''));
    setShortIdAvail(true); // unchanged value is always ok
    setShortIdChecking(false);
  }, [
    initial?._id,
    initial?.box_id,
    initial?.label,
    JSON.stringify(initial?.tags || []),
  ]);

  // Derived — is anything different?
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
      const res = await fetch(`http://localhost:5002/api/boxes/${boxMongoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_id: shortId, // 3-digit code
          label: label.trim(),
          tags,
          // image: (not implemented yet)
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to update box');
      onSaved?.(
        payload?.box ||
          payload || { _id: boxMongoId, box_id: shortId, label, tags }
      );
    } catch (e2) {
      setError(e2.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Fallback Tag UI (if you don’t pass TagInputComponent) ---------- */
  const [tagDraft, setTagDraft] = useState('');
  const addTag = () => {
    const t = (tagDraft || '').trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagDraft('');
  };
  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));
  const onTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
      // quick backspace to remove last
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <Card onSubmit={onSubmit} noValidate>
      <Row $cols2>
        {/* Short ID (3 digits) */}
        <Field>
          <Label htmlFor="box-short-id">3-digit code</Label>
          {/*  Give checking state priority → always yellow while waiting on API */}
          <ShortIdInput
            id="box-short-id"
            inputMode="numeric"
            pattern="\d{3}"
            maxLength={3}
            placeholder="123"
            value={shortId}
            onChange={(e) =>
              setShortId(e.target.value.replace(/\D+/g, '').slice(0, 3))
            }
            $status={
              shortIdChecking
                ? 'inProgress' // ← yellow while awaiting API
                : inProgress
                ? 'inProgress'
                : isValid
                ? 'valid'
                : isInvalid
                ? 'invalid'
                : 'default'
            }
          />
          {shortIdChecking && <Hint>Checking availability…</Hint>}
          {!shortIdValid && (
            <Hint $error>Must be exactly 3 digits (000–999).</Hint>
          )}
          {shortIdValid &&
            !shortIdChecking &&
            !unchanged &&
            (shortIdAvail ? (
              <Hint $success>Code is available.</Hint>
            ) : (
              <Hint $error>That code is already in use.</Hint>
            ))}
        </Field>

        {/* Label */}
        <Field>
          <Label htmlFor="box-label">Label</Label>
          <Input
            id="box-label"
            placeholder="e.g. Kitchen Utensils"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
      </Row>

      {/* Tags */}
      <Field style={{ marginTop: 10 }}>
        <Label>Tags</Label>
        {TagInputComponent ? (
          <TagInputComponent value={tags} onChange={setTags} />
        ) : (
          <TagWrap>
            <TagList>
              {tags.map((t) => (
                <TagChip key={t}>
                  {t}
                  <RemoveX
                    type="button"
                    onClick={() => removeTag(t)}
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </RemoveX>
                </TagChip>
              ))}
              <TagAdder
                placeholder="Add tag and press Enter"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={onTagKeyDown}
              />
            </TagList>
          </TagWrap>
        )}
      </Field>

      {/* Image placeholder (no-op for now) */}
      <Field style={{ marginTop: 10 }}>
        <Label>Image</Label>
        <FileStub>
          Image upload coming soon. (This is a placeholder — file selection
          disabled.)
        </FileStub>
      </Field>

      {error && (
        <Hint $error style={{ marginTop: 8 }}>
          {error}
        </Hint>
      )}

      <Actions>
        <Ghost type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Ghost>
        <Primary type="submit" disabled={!canSave}>
          {busy ? 'Saving…' : 'Save changes'}
        </Primary>
      </Actions>
    </Card>
  );
}
