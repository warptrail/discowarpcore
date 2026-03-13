import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { createBox } from '../api/boxes';
import { listLocations } from '../api/locations';
import useShortIdAvailability from '../hooks/useShortIdAvailability';

const Container = styled.div`
  max-width: 500px;
  margin: 3rem auto;
  padding: 2rem;
  background: #111;
  border-radius: 8px;
  box-shadow: 0 0 20px #000;
  color: #f0f0f0;
`;

const Heading = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
`;

const Field = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: #222;
  color: #f0f0f0;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: #222;
  color: #f0f0f0;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 1rem;
`;

const Status = styled.div`
  font-size: 0.9rem;
  margin-top: 0.25rem;
  color: ${({ $available }) =>
    $available === true
      ? '#00cc88'
      : $available === false
        ? '#ff5555'
        : '#aaa'};
`;

const Error = styled.div`
  color: #ff4444;
  margin-top: 1rem;
  text-align: center;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #00aa88;
  color: #fff;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #00cc99;
  }

  &:disabled {
    background: #444;
    cursor: not-allowed;
  }
`;

function BoxCreate() {
  const navigate = useNavigate();
  const [boxId, setBoxId] = useState('');
  const [label, setLabel] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listLocations()
      .then((data) => {
        if (!active) return;
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load locations:', err);
      });
    return () => {
      active = false;
    };
  }, []);

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
      await createBox({
        box_id: boxId,
        label,
        locationId: locationId || null,
      });
      navigate(`/boxes/${boxId}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <Container>
      <Heading>Create New Box</Heading>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="boxId">Box ID (3-digit)</Label>
          <Input
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
          <Status $available={availabilityState}>
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
          <Label htmlFor="locationId">Location</Label>
          <Select
            id="locationId"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">None / Unassigned</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </Field>

        <Button
          type="submit"
          disabled={!boxId || !label || availabilityState === false}
        >
          Create Box
        </Button>

        {error && <Error>{error}</Error>}
      </form>
    </Container>
  );
}

export default BoxCreate;
