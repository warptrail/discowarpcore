import { panelStyles, inputStyles, controlStyles } from '../styles/primitives';
import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { createBox } from '../api/boxes';
import useShortIdAvailability from '../hooks/useShortIdAvailability';
import useLocationRegistry from '../hooks/useLocationRegistry';
import BoxLocationField from './BoxForms/BoxLocationField';
import BoxTagsField from './BoxForms/BoxTagsField';
import BoxComplexField from './BoxForms/BoxComplexField';
import BoxDeclutterFields from './BoxForms/BoxDeclutterFields';

const LCARS = {
  panel: 'var(--dw-surface)',
  panelSoft: 'var(--dw-surface-raised)',
  inset: 'var(--dw-background)',
  line: 'rgba(230, 237, 243, 0.14)',
  text: 'var(--dw-text)',
  textDim: 'var(--dw-text-secondary)',
  teal: 'var(--dw-teal)',
};

const Container = styled.div`
  position: relative;
  max-width: 500px;
  margin: ${({ $embedded }) => ($embedded ? '0' : '1rem auto')};
  padding: ${({ $embedded }) => ($embedded ? '0.86rem 0.86rem 0.96rem' : '1rem 1rem 1.1rem')};
  border-radius: var(--dw-radius-sm);
  border: 1px solid ${LCARS.line};
  background: ${LCARS.panel};
  color: ${LCARS.text};
  overflow: hidden;

  ${({ $embedded }) =>
    $embedded
      ? `
    max-width: 100%;
  `
      : ''}

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
`;

const Heading = styled.h2`
  position: relative;
  z-index: 1;
  margin: 0 0 0.9rem;
  padding-left: 0.25rem;
  font-size: 0.98rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: ${LCARS.textDim};
`;

const Form = styled.form`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.95rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${LCARS.textDim};
  letter-spacing: 0.01em;
  text-transform: none;
`;

const Field = styled.div`
  display: grid;
  gap: 0.4rem;
  min-width: 0;
  padding: 0;
`;

const Hint = styled.div`
  font-size: 0.72rem;
  color: var(--dw-text-muted);
  letter-spacing: 0.02em;
  line-height: 1.35;
`;

const Input = styled.input`
  width: 100%;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: ${LCARS.inset};
  color: ${LCARS.text};
  font-size: 1rem;
  line-height: 1.35;
  padding: 0.62rem 0.72rem;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;

  &::placeholder {
    color: var(--dw-text-muted);
  }

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: none;
    background: ${LCARS.inset};
  }

  ${inputStyles}
`;

const Textarea = styled.textarea`
  width: 100%;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: ${LCARS.inset};
  color: ${LCARS.text};
  font-size: 0.94rem;
  line-height: 1.45;
  min-height: 92px;
  padding: 0.62rem 0.72rem;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
  resize: vertical;
  white-space: pre-wrap;

  &::placeholder {
    color: var(--dw-text-muted);
  }

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: none;
    background: ${LCARS.inset};
  }

  ${inputStyles}
  min-height: 88px;
  resize: vertical;
`;

const ShortIdInput = styled(Input)`
  font-family: var(--dw-font-ui);
  text-align: center;
  letter-spacing: 0.01em;
  width: 8.5rem;
  max-width: 100%;
`;

const Status = styled.div`
  min-height: 1.15rem;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: ${({ $tone }) =>
    $tone === 'valid'
      ? 'var(--dw-teal)'
      : $tone === 'invalid'
        ? 'var(--dw-coral)'
        : $tone === 'pending'
          ? 'var(--dw-amber)'
          : LCARS.textDim};
`;

const Error = styled.div`
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: var(--dw-coral);
  border-radius: var(--dw-radius-sm);
  padding: 0.6rem 0.72rem;
  font-size: 0.86rem;
`;

const Button = styled.button`
  min-width: 8rem;
  border-radius: var(--dw-radius-sm);
  border: 1px solid ${({ $secondary }) => ($secondary ? 'rgba(230, 237, 243, 0.18)' : 'var(--dw-teal)')};
  color: var(--dw-text);
  background: ${({ $secondary }) => ($secondary ? 'var(--dw-surface-raised)' : 'rgba(76, 198, 193, 0.2)')};
  min-height: 44px;
  padding: 0.58rem 1.08rem;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease,
    background 120ms ease;

  &:hover:enabled {
    border-color: ${({ $secondary }) => ($secondary ? 'var(--dw-cyan)' : 'var(--dw-teal)')};
    background: ${({ $secondary }) => ($secondary ? 'var(--dw-surface-raised)' : 'rgba(76, 198, 193, 0.28)')};
  }

  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  ${controlStyles}

  color: ${({ $tone, $primary, $secondary }) => $tone === 'danger' ? 'var(--dw-coral)' : ($tone === 'primary' || $primary) ? 'var(--dw-cyan)' : $secondary ? 'var(--dw-violet)' : 'var(--dw-text)'};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

function normalizeTags(tags) {
  const values = Array.isArray(tags) ? tags : [];
  const deduped = new Set();

  for (const rawTag of values) {
    const next = String(rawTag || '').trim();
    if (!next) continue;
    deduped.add(next);
  }

  return [...deduped];
}

function BoxCreate({
  embedded = false,
  autoNavigate = true,
  onCreated,
  onCancel,
  title = 'Create New Box',
}) {
  const navigate = useNavigate();
  const [boxId, setBoxId] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationDraft, setLocationDraft] = useState({ room: '', vicinity: '', specifics: '', exactSpot: '' });
  const [tags, setTags] = useState([]);
  const [declutterPurpose, setDeclutterPurpose] = useState('standard');
  const [declutterIsDefault, setDeclutterIsDefault] = useState(false);
  const [isComplexBox, setIsComplexBox] = useState(false);
  const [isGiftBox, setIsGiftBox] = useState(false);
  const [locationCreateBusy, setLocationCreateBusy] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const {
    locations,
    loading: locationsLoading,
    error: locationsError,
    createLocationInline,
  } = useLocationRegistry();

  const {
    shortIdValid,
    shortIdAvail,
    shortIdChecking,
    checkError,
  } = useShortIdAvailability({
    shortId: boxId,
    debounceMs: 500,
  });
  const availabilityState = shortIdValid ? shortIdAvail : null;

  const handleCreateLocation = async (location) => {
    const normalized = {
      room: String(location?.room || '').trim().replace(/\s+/g, ' '),
      vicinity: String(location?.vicinity || '').trim().replace(/\s+/g, ' '),
      specifics: String(location?.specifics || '').trim().replace(/\s+/g, ' '),
      exactSpot: String(location?.exactSpot || '').trim().replace(/\s+/g, ' '),
    };
    if (!normalized.room) {
      setLocationError('Room is required');
      throw new Error('Room is required');
    }

    setLocationCreateBusy(true);
    setLocationError('');
    try {
      const created = await createLocationInline(normalized);
      if (!created?._id) {
        throw new Error('Failed to create location');
      }
      setLocationId(String(created._id));
      return created;
    } catch (createErr) {
      setLocationError(createErr?.message || 'Failed to create location');
      throw createErr;
    } finally {
      setLocationCreateBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!shortIdValid) {
      setError('Box ID must be exactly 3 digits (e.g. 001)');
      return;
    }
    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    if (shortIdAvail === false) {
      setError('Box ID is already in use');
      return;
    }

    try {
      let resolvedLocationId = locationId;
      if (String(locationDraft.room || '').trim()) {
        const resolvedLocation = await handleCreateLocation(locationDraft);
        resolvedLocationId = String(resolvedLocation?._id || '');
      }
      const created = await createBox({
        box_id: boxId,
        label: label.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        locationId: resolvedLocationId || null,
        tags: normalizeTags(tags),
        declutterPurpose,
        declutterIsDefault,
        isComplexBox,
        isGiftBox,
      });
      await Promise.resolve(onCreated?.(created));
      if (autoNavigate) {
        navigate(`/boxes/${created?.box_id || boxId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <Container $embedded={embedded}>
      <Heading>{title}</Heading>
      <Form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="boxId">Box ID (3-digit)</Label>
          <ShortIdInput
            id="boxId"
            value={boxId}
            onChange={(e) => setBoxId(e.target.value)}
            onKeyDown={(e) => {
              const allowedKeys = [
                'Backspace',
                'Delete',
                'ArrowLeft',
                'ArrowRight',
                'Tab',
              ];
              const isDigit = /^[0-9]$/.test(e.key);
              const isControl = allowedKeys.includes(e.key);

              const atMaxLength = boxId.length >= 3;

              if (!isDigit && !isControl) {
                e.preventDefault();
              }

              if (
                isDigit &&
                atMaxLength &&
                window.getSelection()?.toString().length === 0
              ) {
                e.preventDefault();
              }
            }}
            placeholder="e.g. 004"
            maxLength={3}
          />
          <Status
            $tone={
              shortIdChecking
                ? 'pending'
                : shortIdValid && availabilityState === true
                  ? 'valid'
                  : shortIdValid && availabilityState === false
                    ? 'invalid'
                    : shortIdValid && checkError
                      ? 'invalid'
                      : 'default'
            }
          >
            {shortIdChecking && '🔄 Checking...'}

            {!shortIdChecking && boxId && !shortIdValid && '⚠️ Must be exactly 3 digits'}

            {!shortIdChecking && shortIdValid && availabilityState === true && '✅ Available'}

            {!shortIdChecking &&
              shortIdValid &&
              availabilityState === false &&
              !checkError &&
              '❌ Already in use'}

            {!shortIdChecking && shortIdValid && checkError && '⚠️ Could not verify'}
          </Status>
        </Field>

        <Field>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={label}
            type="text"
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Winter Decorations"
          />
        </Field>


        <Field>
          <Label htmlFor="description">Physical Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the physical box, color, size, markings, or condition..."
          />
          <Hint>Optional physical details that help identify the box itself.</Hint>
        </Field>

        <Field>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add contextual notes for this box..."
          />
          <Hint>Optional freeform context for this box.</Hint>
        </Field>

        <Field>
          <BoxLocationField
            locationId={locationId}
            setLocationId={setLocationId}
            onLocationDraftChange={setLocationDraft}
            hideAssignAction
            locationOptions={locations}
            locationsLoading={locationsLoading}
            onCreateLocation={handleCreateLocation}
            createBusy={locationCreateBusy}
            errorMessage={locationError || locationsError}
          />
        </Field>

        <BoxTagsField tags={tags} setTags={setTags} />
        <BoxComplexField value={isComplexBox} onChange={setIsComplexBox} />
        <BoxDeclutterFields
          purpose={declutterPurpose}
          setPurpose={setDeclutterPurpose}
          isDefault={declutterIsDefault}
          setIsDefault={setDeclutterIsDefault}
          isGiftBox={isGiftBox}
          setIsGiftBox={setIsGiftBox}
        />

        <ButtonRow>
          {onCancel ? (
            <Button type="button" $secondary onClick={onCancel} disabled={locationCreateBusy}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={
              !boxId ||
              !label ||
              availabilityState === false ||
              locationCreateBusy
            }
          >
            Create Box
          </Button>
        </ButtonRow>

        {error && <Error>{error}</Error>}
      </Form>
    </Container>
  );
}

export default BoxCreate;
