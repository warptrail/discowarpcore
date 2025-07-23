import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import QuantityInput from './QuantityInput';

import TagEdit from './TagEdit';

const FormContainer = styled.form`
  background-color: #1e1e1e;
  color: #eee;
  padding: 1rem;
  margin-top: 0.5rem;
  border-radius: 10px;
  border: 1px solid #333;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const Button = styled.button`
  background-color: ${(props) =>
    props.$variant === 'close' ? '#555' : '#009688'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background-color: ${(props) =>
      props.$variant === 'close' ? '#666' : '#00796b'};
  }
`;

const SaveFlash = styled.span`
  color: limegreen;
  font-weight: bold;
  margin-left: 8px;
`;

export default function ItemEditForm({ item, onClose, refreshBox }) {
  const [formData, setFormData] = useState({
    name: item.name || '',
    notes: item.notes || '',
    quantity: item.quantity || 1,
    tags: item.tags || [],
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => {
    setDirty(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    markDirty();
  };

  const handleQuantityChange = (newQty) => {
    setFormData((prev) => ({
      ...prev,
      quantity: newQty,
    }));
    markDirty();
  };

  // ! Tag Logic

  const handleTagsChange = (newTags) => {
    setFormData((prev) => ({
      ...prev,
      tags: newTags,
    }));
    markDirty();
  };

  const originalTags = item.tags || [];
  const currentTags = formData.tags || [];
  const newTagSet = new Set(
    currentTags.filter((tag) => !originalTags.includes(tag))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(
        `http://localhost:5002/api/items/${item._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      setSaveSuccess(true);
      await refreshBox?.();
      setDirty(false);
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (saveSuccess) {
      // Clear success flag after 2 seconds of it being true
      const timeout = setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);

      // Cleanup in case component unmounts before timeout ends
      return () => clearTimeout(timeout);
    }
  }, [saveSuccess]);

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Label>
        Name:
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </Label>

      <Label>
        Notes:
        <Input
          type="text"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />
      </Label>

      <Label>Tags:</Label>
      <TagEdit
        initialTags={item.tags}
        onTagsChange={handleTagsChange}
        newTagSet={newTagSet}
        saveSuccess={saveSuccess}
      />

      <Label>Quantity:</Label>
      <QuantityInput
        value={formData.quantity}
        onChange={handleQuantityChange}
      />

      <ButtonRow>
        <Button type="button" $variant="close" onClick={onClose}>
          Close
        </Button>
        <Button type="submit" disabled={saving || !dirty}>
          {saving ? (
            'Saving...'
          ) : saveSuccess && !dirty ? (
            <SaveFlash $isVisible={true}>✅ Saved</SaveFlash>
          ) : (
            'Save'
          )}
        </Button>
      </ButtonRow>
    </FormContainer>
  );
}
