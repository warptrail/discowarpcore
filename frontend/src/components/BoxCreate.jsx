import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

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
  const [storageLocation, setStorageLocation] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);

  // Debounced check for box_id availability
  useEffect(() => {
    if (!/^\d{3}$/.test(boxId)) {
      setAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(
          `http://localhost:5002/api/boxes/check-id/${boxId}`
        );
        const data = await res.json();
        setAvailable(data.available);
        setError('');
      } catch (err) {
        console.error(err);
        setAvailable(null);
        setError('Failed to check box ID availability');
      } finally {
        setChecking(false);
      }
    }, 500); // debounce delay

    return () => clearTimeout(timer);
  }, [boxId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{3}$/.test(boxId)) {
      return setError('Box ID must be exactly 3 digits (e.g. 001)');
    }
    if (!label.trim()) {
      return setError('Label is required');
    }
    if (available === false) {
      return setError('Box ID is already in use');
    }

    try {
      const res = await fetch('http://localhost:5002/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_id: boxId,
          label,
          location: storageLocation,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Unknown error');
      }

      // Navigate to the new box view
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
                e.preventDefault(); // block non-digit
              }

              if (
                isDigit &&
                atMaxLength &&
                window.getSelection()?.toString().length === 0
              ) {
                // block typing more digits if not selecting/replacing existing text
                e.preventDefault();
              }
            }}
            placeholder="e.g. 004"
            maxLength={3} // just in case, as a double check
          />
          <Status $available={available}>
            {checking && '🔄 Checking...'}

            {!checking &&
              boxId &&
              !/^\d{3}$/.test(boxId) &&
              '⚠️ Must be exactly 3 digits'}

            {!checking &&
              /^\d{3}$/.test(boxId) &&
              available === true &&
              '✅ Available'}

            {!checking &&
              /^\d{3}$/.test(boxId) &&
              available === false &&
              '❌ Already in use'}

            {!checking &&
              /^\d{3}$/.test(boxId) &&
              available === null &&
              error &&
              '⚠️ Could not verify'}
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
          <Label htmlFor="storageLocation">Location</Label>
          <Input
            id="storageLocation"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
            placeholder="e.g. Hall Closet, Garage Shelf"
          />
        </Field>

        <Button
          type="submit"
          disabled={!boxId || !label || available === false}
        >
          Create Box
        </Button>

        {error && <Error>{error}</Error>}
      </form>
    </Container>
  );
}

export default BoxCreate;
