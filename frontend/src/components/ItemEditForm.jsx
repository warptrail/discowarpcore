// Responsibilities: Renders inputs and collects user input only
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import QuantityInput from './QuantityInput';
import TagEdit from './TagEdit';
import MoveItemBar from './MoveItemBar';

const FormContainer = styled.div`
  background-color: #1e1e1e;
  color: #eee;
  padding: 1rem;
  /* margin-top: 0.5rem; */
  border-radius: 0px 0px 10px 10px;
  border: 1px solid #333;
  border-top: none;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border: 1px solid red;
  }

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

export default function ItemEditForm({
  boxMongoId,
  initialItem,
  sourceBoxId,
  sourceBoxLabel,
  sourceBoxShortId,
  onClose,
  refreshBox,
  onItemUpdated,
  onMoveRequest,
  onOrphanRequest,
}) {
  const [formData, setFormData] = useState({
    name: initialItem.name || '',
    notes: initialItem.notes || '',
    quantity: initialItem.quantity || 1,
    tags: initialItem.tags || [],
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedTags, setSavedTags] = useState(initialItem.tags || []);
  const [flashTagSet, setFlashTagSet] = useState(new Set());

  const markDirty = () => {
    console.log('🔥 markDirty called');
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(
        `http://localhost:5002/api/items/${initialItem._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const updatedItem = await response.json();
      console.log('updated Item', updatedItem);

      if (onItemUpdated) {
        onItemUpdated(updatedItem);
      }

      const newFlashTags = formData.tags.filter(
        (tag) => !savedTags.includes(tag)
      );
      setFlashTagSet(new Set(newFlashTags));
      setSavedTags([...formData.tags]);
      setSaveSuccess(true);

      await refreshBox();

      setDirty(false);
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setSaving(false);
      console.log(saving);
    }
  };

  const handleMoveRequestProxy = ({ destBoxId, destLabel, destShortId }) => {
    onMoveRequest({
      itemId: initialItem._id,
      itemName: initialItem.name,
      itemQuantity: initialItem.quantity,
      sourceBoxId, // ✅ correct owning box (nested-safe)
      destBoxId,
      destLabel,
      destShortId,
    });
  };

  const handleOrphanRequestProxy = () => {
    onOrphanRequest({
      boxMongoId: sourceBoxId,
      itemId: initialItem._id,
    });
  };

  // Save Button Logic:
  const isDisabled = saving || !dirty;

  let buttonContent;
  if (saving) {
    buttonContent = 'Saving...';
  } else if (saveSuccess && !dirty) {
    buttonContent = <SaveFlash $isVisible={true}>✅ Saved</SaveFlash>;
  } else {
    buttonContent = 'Save';
  }

  // Moving an item Logic:
  let allBoxes = ['this is a box'];

  // This ensures that switching between items resets the tag comparison baseline appropriately.
  useEffect(() => {
    setSavedTags(initialItem.tags || []);
  }, [initialItem._id]);

  useEffect(() => {
    if (saveSuccess) {
      // Clear success flag after 2 seconds of it being true
      const timeout = setTimeout(() => {
        setSaveSuccess(false);
        setFlashTagSet(new Set()); // 🧹 clear flashes
      }, 2000);

      // Cleanup in case component unmounts before timeout ends
      return () => clearTimeout(timeout);
    }
  }, [saveSuccess]);

  return (
    <FormContainer>
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
          type="textarea"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />
      </Label>

      <Label>Tags:</Label>
      <TagEdit
        initialTags={formData.tags}
        onTagsChange={handleTagsChange}
        justSaved={saveSuccess}
        newTagSet={
          new Set(formData.tags.filter((tag) => !savedTags.includes(tag)))
        }
        flashTagSet={flashTagSet}
      />

      <Label>Quantity:</Label>
      <QuantityInput
        value={formData.quantity}
        onChange={(newQuantity) => handleQuantityChange(newQuantity)}
      />

      <MoveItemBar
        itemId={initialItem._id}
        initialItem={initialItem}
        boxes={allBoxes}
        sourceBoxId={sourceBoxId}
        refreshBox={refreshBox}
        onMoveRequest={handleMoveRequestProxy}
        onOrphanRequest={handleOrphanRequestProxy}
      />

      <ButtonRow>
        <Button type="button" $variant="close" onClick={onClose}>
          Close
        </Button>

        <Button
          type="button"
          onClick={(e) => {
            handleSave(e);
            console.log('item saved!');
          }}
          disabled={isDisabled}
        >
          {buttonContent}
        </Button>
      </ButtonRow>
    </FormContainer>
  );
}
