import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { createBox } from '../api/boxes';
import useShortIdAvailability from '../hooks/useShortIdAvailability';
import useLocationRegistry from '../hooks/useLocationRegistry';
import BoxLocationField from './BoxForms/BoxLocationField';
import BoxTagsField from './BoxForms/BoxTagsField';

const LCARS = {
  panel: '#11161f',
  panelSoft: '#171e2a',
  inset: '#0b1018',
  line: 'rgba(130, 168, 196, 0.36)',
  text: '#e6edf4',
  textDim: 'rgba(214, 226, 241, 0.8)',
  teal: '#4cc6c1',
};

const Container = styled.div`
  position: relative;
  max-width: 500px;
  margin: ${({ $embedded }) => ($embedded ? '0' : '3rem auto')};
  padding: ${({ $embedded }) => ($embedded ? '0.86rem 0.86rem 0.96rem' : '1rem 1rem 1.1rem')};
  border-radius: 14px;
  border: 1px solid ${LCARS.line};
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 34%),
    ${LCARS.panel};
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 14px 28px rgba(0, 0, 0, 0.24);
  color: ${LCARS.text};
  overflow: hidden;

  ${({ $embedded }) =>
    $embedded
      ? `
    max-width: 100%;
  `
      : ''}
`;

const Heading = styled.h2`
  position: relative;
  z-index: 1;
  margin: 0 0 0.9rem;
  padding-left: 0.25rem;
  font-size: 0.98rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Field = styled.div`
  display: grid;
  gap: 0.4rem;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(140, 160, 179, 0.2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 70%),
    ${LCARS.panelSoft};
`;

const Hint = styled.div`
  font-size: 0.72rem;
  color: rgba(214, 226, 241, 0.7);
  letter-spacing: 0.02em;
  line-height: 1.35;
`;

const Input = styled.input`
  width: 100%;
  border-radius: 9px;
  border: 1px solid rgba(122, 142, 167, 0.45);
  background: ${LCARS.inset};
  color: ${LCARS.text};
  font-size: 1rem;
  line-height: 1.35;
  padding: 0.62rem 0.72rem;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;

  &::placeholder {
    color: rgba(214, 226, 241, 0.44);
  }

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow:
      0 0 0 2px rgba(76, 198, 193, 0.25),
      inset 0 0 0 1px rgba(255, 255, 255, 0.03);
    background: #0c121b;
  }
`;

const ShortIdInput = styled(Input)`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  text-align: center;
  letter-spacing: 0.12em;
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
      ? '#9be2b5'
      : $tone === 'invalid'
        ? '#ffbdbd'
        : $tone === 'pending'
          ? '#f8d799'
          : LCARS.textDim};
`;

const Error = styled.div`
  border: 1px solid rgba(240, 138, 123, 0.4);
  background: rgba(240, 138, 123, 0.12);
  color: #ffccc6;
  border-radius: 10px;
  padding: 0.6rem 0.72rem;
  font-size: 0.86rem;
`;

const Button = styled.button`
  min-width: 8rem;
  border-radius: 999px;
  border: 1px solid ${({ $secondary }) => ($secondary ? '#6f7c8f' : '#2f8f4d')};
  color: ${({ $secondary }) => ($secondary ? '#dce8ff' : '#d6ffe4')};
  background: ${({ $secondary }) =>
    $secondary
      ? 'linear-gradient(180deg, #2a3344, #202739)'
      : 'linear-gradient(180deg, #2d8f47, #216b36)'};
  box-shadow: 0 0 0 1px rgba(17, 30, 20, 0.42);
  padding: 0.58rem 1.08rem;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease,
    background 120ms ease;

  &:hover:enabled {
    border-color: ${({ $secondary }) => ($secondary ? '#8898b5' : '#42b765')};
    background: ${({ $secondary }) =>
      $secondary
        ? 'linear-gradient(180deg, #33405a, #27324b)'
        : 'linear-gradient(180deg, #35a353, #257840)'};
    box-shadow:
      0 0 0 1px rgba(21, 35, 26, 0.45),
      0 0 16px ${({ $secondary }) => ($secondary ? 'rgba(77, 108, 168, 0.28)' : 'rgba(51, 163, 83, 0.28)')};
  }

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
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
  const [group, setGroup] = useState('');
  const [locationId, setLocationId] = useState('');
  const [tags, setTags] = useState([]);
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

  const handleCreateLocation = async (rawValue) => {
    const normalized = String(rawValue || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      setLocationError('Location name is required');
      throw new Error('Location name is required');
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
      const created = await createBox({
        box_id: boxId,
        label: label.trim(),
        group: group.trim() || undefined,
        locationId: locationId || null,
        tags: normalizeTags(tags),
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
          <Label htmlFor="group">Group</Label>
          <Input
            id="group"
            value={group}
            type="text"
            onChange={(e) => setGroup(e.target.value)}
            placeholder="e.g. Entertainment Center"
          />
          <Hint>
            Optional larger furniture/unit grouping, e.g. Entertainment Center
            or Tool Chest.
          </Hint>
        </Field>

        <Field>
          <BoxLocationField
            locationId={locationId}
            setLocationId={setLocationId}
            locationOptions={locations}
            locationsLoading={locationsLoading}
            onCreateLocation={handleCreateLocation}
            createBusy={locationCreateBusy}
            errorMessage={locationError || locationsError}
          />
        </Field>

        <BoxTagsField tags={tags} setTags={setTags} />

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
