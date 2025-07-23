// AddItemForm.jsx
import styled from 'styled-components';
import { useState } from 'react';

const AddItemContainer = styled.div`
  margin-top: 2rem;
`;

const AddItemHeading = styled.h4`
  font-size: 1.2rem;
  color: #f0f0f0;
  margin-bottom: 0.75rem;
`;

const AddInput = styled.input`
  background: #111;
  color: #f0f0f0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.5rem;
  margin-right: 1rem;
  font-size: 1rem;
  width: ${(props) => (props.$compact ? '60px' : 'auto')};

  &:focus {
    outline: none;
    border-color: #00ffcc;
  }
`;

const AddButton = styled.button`
  background-color: ${({ disabled }) => (disabled ? '#444' : '#222')};
  color: ${({ disabled }) => (disabled ? '#888' : '#f0f0f0')};
  border: 1px solid #555;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 1rem;

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#444' : '#333')};
  }
`;

//! ===============================================================================

function AddItemForm({ boxMongoId, onItemAdded }) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  const isValid = newItemName.trim().length > 0;

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      // Step 1: Create item
      const itemRes = await fetch('http://localhost:5002/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          quantity: newItemQuantity,
          notes: '',
          tags: [],
          imagePath: '',
        }),
      });

      const newItem = await itemRes.json();
      console.log(newItem._id);

      // Step 2: Link item to box
      await fetch(`http://localhost:5002/api/boxitem/${boxMongoId}/additem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: newItem._id }),
      });

      // Step 3: Notify parent
      onItemAdded();

      // Step 4: Reset
      setNewItemName('');
      setNewItemQuantity(1);
    } catch (err) {
      console.error('❌ Failed to add item:', err);
    }
  };

  return (
    <AddItemContainer>
      <AddItemHeading>Add New Item to This Box</AddItemHeading>
      <AddInput
        type="text"
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
        placeholder="Item name"
      />
      <AddInput
        type="number"
        min="1"
        value={newItemQuantity}
        onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
        placeholder="Qty"
        $compact
      />
      <AddButton onClick={handleAddItem} disabled={!isValid}>
        ➕ Add
      </AddButton>
    </AddItemContainer>
  );
}

export default AddItemForm;
