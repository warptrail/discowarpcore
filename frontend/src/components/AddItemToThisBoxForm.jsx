// AddItemForm.jsx
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { controlStyles, inputStyles } from '../styles/primitives';
import { API_BASE } from '../api/API_BASE';
import {
  DEFAULT_ITEM_CATEGORY,
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../util/itemCategories';

export default function AddItemForm({
  boxMongoId, // Mongo _id of the current box
  boxShortId,
  onAdded, // (newItem) => void
  api = defaultApi, // swappable API
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [category, setCategory] = useState(DEFAULT_ITEM_CATEGORY);
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
        category: normalizeItemCategory(category),
      });

      // 2) attach to this box
      await api.attachItemToBox(boxMongoId, newItem._id);

      // 3) let parent update UI
      onAdded?.(newItem);

      // 4) clear form
      setName('');
      setQty(1);
      setCategory(DEFAULT_ITEM_CATEGORY);
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
          aria-label="Item name"
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
        <Select
          value={category}
          onChange={(e) => setCategory(normalizeItemCategory(e.target.value))}
          aria-label="Category"
        >
          {ITEM_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {formatItemCategory(value)}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!isValid || busy}
          $variant="primary"
        >
          {busy ? 'Adding…' : 'Add item'}
        </Button>
      </Row>
      {msg && <Msg>{msg}</Msg>}
    </Wrap>
  );
}

/* ---------- default API (adjust to your routes if needed) ---------- */
const defaultApi = {
  async createItem(payload) {
    const r = await fetch(`${API_BASE}/api/items`, {
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
      `${API_BASE}/api/boxed-items/${boxMongoId}/addItem`,
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
  grid-template-columns: 1fr;
  gap: 0.5rem;

  @media (min-width: 700px) {
    grid-template-columns: minmax(0, 1fr) 80px minmax(120px, 190px) 120px;
  }
`;

const AddItemHeading = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dw-text);
  margin: 0 0 0.5rem 0;
`;

const Input = styled.input`
  ${inputStyles}
  width: 100%;
`;

const NumberInput = styled(Input).attrs({ inputMode: 'numeric' })`
  font-family: var(--dw-font-data);
`;

const Select = styled.select`
  ${inputStyles}
  width: 100%;
`;

const Button = styled.button`
  ${controlStyles}
  width: 100%;
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
`;

const Msg = styled.div`
  font-size: 0.9rem;
  color: var(--dw-text-secondary);
  opacity: 0.9;
`;
