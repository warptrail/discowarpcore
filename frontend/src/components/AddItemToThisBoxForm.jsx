// AddItemForm.jsx
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

export default function AddItemForm({
  boxMongoId, // Mongo _id of the current box
  boxShortId,
  onAdded, // (newItem) => void
  api = defaultApi, // swappable API
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isValid = useMemo(
    () => name.trim().length > 0 && qty > 0 && Number.isFinite(qty),
    [name, qty]
  );

  const handleAdd = async () => {
    if (!isValid || !boxMongoId) return;
    setBusy(true);
    setMsg('');
    try {
      // 1) create the item
      const newItem = await api.createItem({
        name: name.trim(),
        quantity: qty,
      });

      // 2) attach to this box
      await api.attachItemToBox(boxMongoId, newItem._id);

      // 3) let parent update UI
      onAdded?.(newItem);

      // 4) clear form
      setName('');
      setQty(1);
      setMsg(`${name} - x${qty} added to box ${boxShortId}`);
    } catch (e) {
      setMsg(e?.message || 'Failed to add item.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrap>
      <AddItemHeading>Add a new Item</AddItemHeading>
      <Row>
        <Input
          type="text"
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <NumberInput
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value || '1', 10))}
          aria-label="Quantity"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!isValid || busy}
          $variant="primary"
        >
          ➕ Add
        </Button>
      </Row>
      {msg && <Msg>{msg}</Msg>}
    </Wrap>
  );
}

/* ---------- default API (adjust to your routes if needed) ---------- */
const defaultApi = {
  async createItem(payload) {
    const r = await fetch('http://localhost:5002/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body?.message || `HTTP ${r.status}`);
    return body; // expect { _id, name, quantity, ... }
  },
  async attachItemToBox(boxMongoId, itemId) {
    const r = await fetch(
      `http://localhost:5002/api/boxed-items/${boxMongoId}/addItem`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      }
    );
    if (r.status === 204) return {};
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body?.message || `HTTP ${r.status}`);
    return body;
  },
};

/* -------------------------- styles (mobile-first) -------------------------- */
const Wrap = styled.div`
  margin-top: 0.75rem;
  display: grid;
  gap: 0.5rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 88px 96px; /* name | qty | add */
  gap: 0.5rem;

  @media (min-width: 700px) {
    grid-template-columns: 1fr 100px 120px;
  }
`;

const AddItemHeading = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #f0f0f0;
  margin: 0 0 0.5rem 0;
`;

const Input = styled.input`
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 0.55rem 0.6rem;
  font-size: 0.95rem;
  &:focus {
    outline: none;
    border-color: rgba(120, 170, 255, 0.7);
  }
`;

const NumberInput = styled(Input).attrs({ inputMode: 'numeric' })``;

const Button = styled.button`
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: ${({ $variant }) =>
    $variant === 'primary' ? 'rgba(60,120,255,.18)' : 'rgba(255,255,255,.06)'};
  color: #fff;
  padding: 0.55rem 0.6rem;
  border-radius: 12px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease;
  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.28);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Msg = styled.div`
  font-size: 0.9rem;
  color: #cfe2ff;
  opacity: 0.9;
`;
