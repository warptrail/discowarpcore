import React, { useEffect, useMemo, useState } from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';

function pickImageUrl(item) {
  return item?.image?.display?.url || item?.image?.url || item?.imagePath || '';
}

async function parseResponseError(res, fallback) {
  const raw = await res.text().catch(() => '');
  if (!raw) return fallback;

  try {
    const json = JSON.parse(raw);
    return json?.error || json?.message || fallback;
  } catch {
    return raw;
  }
}

export default function EditItemImageSection({
  item,
  disabled = false,
  onItemImageUpdated,
}) {
  const itemId = item?._id;
  const [previewUrl, setPreviewUrl] = useState(() => pickImageUrl(item));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setPreviewUrl(pickImageUrl(item));
    setStatus('');
    setError('');
  }, [item?._id, item?.image?.display?.url, item?.image?.url, item?.imagePath]);

  const hasImage = useMemo(() => !!previewUrl, [previewUrl]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !itemId) return;

    const body = new FormData();
    body.append('image', file);

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemId)}/image`, {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        const message = await parseResponseError(
          res,
          `Upload failed (${res.status})`
        );
        throw new Error(message);
      }

      const json = await res.json().catch(() => ({}));
      const nextUrl = json?.image?.display?.url || json?.urls?.display || '';
      if (nextUrl) setPreviewUrl(nextUrl);
      onItemImageUpdated?.({
        image: json?.image || null,
        imagePath: json?.image?.display?.url || json?.image?.original?.url || '',
      });

      setStatus('Image uploaded.');
    } catch (err) {
      setError(err?.message || 'Image upload failed.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  const handleRemove = async () => {
    if (!itemId || !hasImage) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemId)}/image`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const message = await parseResponseError(
          res,
          `Remove failed (${res.status})`
        );
        throw new Error(message);
      }

      const json = await res.json().catch(() => ({}));
      setPreviewUrl('');
      onItemImageUpdated?.({
        image: json?.image || null,
        imagePath: '',
      });
      setStatus('Image removed.');
    } catch (err) {
      setError(err?.message || 'Image removal failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <S.Field>
      <S.Label>Image</S.Label>

      {previewUrl ? (
        <S.ImagePreview src={previewUrl} alt={`${item?.name || 'Item'} preview`} />
      ) : (
        <S.FieldHint>No image uploaded.</S.FieldHint>
      )}

      <S.FileInput
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleUpload}
        disabled={disabled || busy || !itemId}
      />

      <S.InlineActions>
        <S.SmallActionButton
          type="button"
          onClick={handleRemove}
          disabled={disabled || busy || !hasImage || !itemId}
          $tone="danger"
        >
          Remove Image
        </S.SmallActionButton>
      </S.InlineActions>

      {busy ? <S.StatusText>Working…</S.StatusText> : null}
      {status ? <S.StatusText $tone="success">{status}</S.StatusText> : null}
      {error ? <S.StatusText $tone="error">{error}</S.StatusText> : null}
    </S.Field>
  );
}
