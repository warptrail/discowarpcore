import { useEffect, useState } from 'react';
import { createBox, uploadBoxImage } from '../../api/boxes';
import useShortIdAvailability from '../../hooks/useShortIdAvailability';
import useLocationRegistry from '../../hooks/useLocationRegistry';
import cropImageToSquare from '../../util/cropImageToSquare';
import BoxLocationField from '../BoxForms/BoxLocationField';
import QuickBoxStagingPurpose from './QuickBoxStagingPurpose';
import * as S from './OperationsQuickBoxCreate.styles';

const normalizeTags = (value) => [...new Set(String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean))];

export default function OperationsQuickBoxCreate({ onCreated, onCancel }) {
  const [boxId, setBoxId] = useState('');
  const [label, setLabel] = useState('');
  const [locationId, setLocationId] = useState('');
  const [group, setGroup] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [declutterPurpose, setDeclutterPurpose] = useState('standard');
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdWithoutPhoto, setCreatedWithoutPhoto] = useState(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState('');
  const { locations, loading: locationsLoading, error: registryError, createLocationInline } = useLocationRegistry();
  const { shortIdValid, shortIdAvail, shortIdChecking, checkError } = useShortIdAvailability({ shortId: boxId, debounceMs: 300 });

  useEffect(() => {
    if (!photo) { setPreviewUrl(''); return undefined; }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const createLocation = async (raw) => {
    setLocationBusy(true);
    setLocationError('');
    try {
      const created = await createLocationInline(String(raw || '').trim());
      if (!created?._id) throw new Error('Location could not be created');
      setLocationId(String(created._id));
      return created;
    } catch (nextError) {
      setLocationError(nextError?.message || 'Location could not be created');
      throw nextError;
    } finally { setLocationBusy(false); }
  };

  const uploadPhoto = async (box) => {
    if (!photo || !box?._id) return box;
    const cropped = await cropImageToSquare(photo, { maxDimension: 1200 });
    const result = await uploadBoxImage(box._id, cropped);
    return result?.box || { ...box, image: result?.image || box.image, imagePath: result?.imagePath || box.imagePath };
  };

  const finish = async (box) => {
    await Promise.resolve(onCreated?.(box));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!shortIdValid) { setError('Box number must be exactly three digits.'); return; }
    if (!shortIdAvail) { setError('That box number is already in use.'); return; }
    if (!label.trim()) { setError('Give the box a short label.'); return; }
    setBusy(true);
    try {
      const created = await createBox({
        box_id: boxId,
        label: label.trim(),
        locationId: locationId || null,
        group: group.trim() || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: normalizeTags(tagDraft),
        declutterPurpose,
        declutterIsDefault: false,
        isGiftBox: declutterPurpose === 'gift_staging',
      });
      try {
        await finish(await uploadPhoto(created));
      } catch (photoError) {
        setCreatedWithoutPhoto(created);
        setError(`Box #${boxId} was created, but its photo was not uploaded. ${photoError?.message || ''}`.trim());
      }
    } catch (nextError) { setError(nextError?.message || 'Box could not be created.'); }
    finally { setBusy(false); }
  };

  const retryPhoto = async () => {
    setBusy(true); setError('');
    try { await finish(await uploadPhoto(createdWithoutPhoto)); }
    catch (nextError) { setError(nextError?.message || 'Photo upload failed again.'); }
    finally { setBusy(false); }
  };

  return (
    <S.Shell aria-label="Quick create a new box">
      <S.Header>
        <div><S.Eyebrow>Operations intake</S.Eyebrow><S.Title>Create a new box</S.Title></div>
        <S.Close type="button" onClick={onCancel} aria-label="Close quick box creator">×</S.Close>
      </S.Header>
      <S.Form onSubmit={submit}>
        <S.IdentityRow>
          <S.Field><S.Label>Box ID</S.Label><S.CodeInput inputMode="numeric" maxLength={3} value={boxId} onChange={(e) => setBoxId(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="000" disabled={Boolean(createdWithoutPhoto)} /></S.Field>
          <S.Field><S.Label>Label</S.Label><S.Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What is this box?" disabled={Boolean(createdWithoutPhoto)} /></S.Field>
        </S.IdentityRow>
        <S.Availability $bad={shortIdValid && !shortIdAvail && !shortIdChecking} $good={shortIdValid && shortIdAvail && !shortIdChecking}>
          {shortIdChecking ? 'CHECKING SIGNAL…' : checkError ? 'COULD NOT VERIFY ID' : shortIdValid ? (shortIdAvail ? 'ID AVAILABLE' : 'ID ALREADY IN USE') : 'THREE DIGITS REQUIRED'}
        </S.Availability>
        <BoxLocationField compact locationId={locationId} setLocationId={setLocationId} locationOptions={locations} locationsLoading={locationsLoading} onCreateLocation={createLocation} createBusy={locationBusy} errorMessage={locationError || registryError} />
        <S.PhotoField>
          <S.PhotoPreview $src={previewUrl}>{previewUrl ? '' : 'PHOTO'}</S.PhotoPreview>
          <S.PhotoCopy><strong>{photo ? photo.name : 'Optional box photo'}</strong><small>Crop and upload after creation</small></S.PhotoCopy>
          <S.PhotoAction>{photo ? 'Change' : 'Add'}</S.PhotoAction>
          <S.HiddenInput type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </S.PhotoField>
        <S.Details>
          <S.Summary>Optional details</S.Summary>
          <S.DetailGrid>
            <QuickBoxStagingPurpose
              value={declutterPurpose}
              onChange={setDeclutterPurpose}
            />
            <S.Field><S.Label>Group</S.Label><S.Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Furniture or unit" /></S.Field>
            <S.Field><S.Label>Tags</S.Label><S.TagInput value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="comma, separated" /></S.Field>
            <S.Field><S.Label>Physical description</S.Label><S.Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Color, size, markings…" /></S.Field>
            <S.Field><S.Label>Notes</S.Label><S.Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything useful later…" /></S.Field>
          </S.DetailGrid>
        </S.Details>
        {error ? <S.Message $error>{error}</S.Message> : null}
        <S.Footer>
          {createdWithoutPhoto ? <S.Button type="button" onClick={() => finish(createdWithoutPhoto)} disabled={busy}>Finish without photo</S.Button> : <S.Button type="button" onClick={onCancel} disabled={busy}>Cancel</S.Button>}
          <S.Button type={createdWithoutPhoto ? 'button' : 'submit'} $primary onClick={createdWithoutPhoto ? retryPhoto : undefined} disabled={busy || locationBusy || shortIdChecking || (!createdWithoutPhoto && (!shortIdValid || !shortIdAvail || !label.trim()))}>{busy ? 'Working…' : createdWithoutPhoto ? 'Retry photo' : 'Create box'}</S.Button>
        </S.Footer>
      </S.Form>
    </S.Shell>
  );
}
