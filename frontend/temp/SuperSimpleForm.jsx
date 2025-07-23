import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const BoxEditor = styled.div`
  margin-bottom: 2rem;
`;

const BoxLabel = styled.h3`
  color: #fff;
  margin-bottom: 0.5rem;
`;

const EditableItemList = styled.ul`
  list-style: none;
  padding-left: 1rem;
`;

const EditableItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ItemNameInput = styled.input`
  flex: 2;
  margin-right: 0.5rem;
`;

const ItemQuantityInput = styled.input`
  width: 60px;
  margin-right: 0.5rem;
`;

const ItemNotesInput = styled.input`
  flex: 3;
  margin-right: 0.5rem;
`;

const DeleteButton = styled.button`
  background: none;
  color: red;
  border: none;
  cursor: pointer;
`;

const NestedBoxWrapper = styled.div`
  margin-left: 1.5rem;
  border-left: 2px solid #444;
  padding-left: 1rem;
`;

const AddItemForm = styled.form`
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const AddItemInput = styled.input`
  padding: 0.25rem;
  flex: 1;
`;

const AddButton = styled.button`
  background-color: #444;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
`;

export default function BoxEditPanel({
  items,
  boxMongoId,
  onItemUpdated,
  onItemDeleted,
  onItemAdded,
  refreshBox,
  orphanedItems,
  fetchOrphanedItems,
}) {
  const [localItems, setLocalItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, notes: '' });

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    fetchOrphanedItems();
  }, [fetchOrphanedItems]);

  const handleChange = (itemId, field, value) => {
    const updated = localItems.map((item) =>
      item._id === itemId ? { ...item, [field]: value } : item
    );
    setLocalItems(updated);
    onItemUpdated(boxMongoId, itemId, field, value);
  };

  const handleDelete = (itemId) => {
    const updated = localItems.filter((item) => item._id !== itemId);
    setLocalItems(updated);
    onItemDeleted(boxMongoId, itemId);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) return;
    onItemAdded(boxMongoId, newItem);
    setNewItem({ name: '', quantity: 1, notes: '' });
  };

  return (
    <BoxEditor>
      <BoxLabel>Items in this Box</BoxLabel>

      <EditableItemList>
        {localItems.map((item) => (
          <EditableItem key={item._id}>
            <ItemNameInput
              value={item.name}
              onChange={(e) => handleChange(item._id, 'name', e.target.value)}
            />
            <ItemQuantityInput
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleChange(item._id, 'quantity', e.target.value)
              }
            />
            <ItemNotesInput
              value={item.notes || ''}
              onChange={(e) => handleChange(item._id, 'notes', e.target.value)}
            />
            <DeleteButton onClick={() => handleDelete(item._id)}>
              🗑
            </DeleteButton>
          </EditableItem>
        ))}
      </EditableItemList>

      <AddItemForm onSubmit={handleAdd}>
        <AddItemInput
          type="text"
          placeholder="New item name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <AddItemInput
          type="number"
          placeholder="Qty"
          value={newItem.quantity}
          onChange={(e) =>
            setNewItem({ ...newItem, quantity: Number(e.target.value) })
          }
        />
        <AddItemInput
          type="text"
          placeholder="Notes"
          value={newItem.notes}
          onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
        />
        <AddButton type="submit">+ Add Item</AddButton>
      </AddItemForm>
    </BoxEditor>
  );
}
