import React, { useEffect, useState } from 'react';

import MoveItemBar from './MoveItemBar';
import ItemEditFieldsForm from './ItemEditFieldsForm';
import * as S from './ItemEditForm.styles';

export default function ItemEditForm({
  initialItem,
  sourceBoxId,
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
        },
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const updatedItem = await response.json();
      console.log('updated Item', updatedItem);

      if (onItemUpdated) {
        onItemUpdated(updatedItem);
      }

      const newFlashTags = formData.tags.filter((tag) => !savedTags.includes(tag));
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
      sourceBoxId,
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

  const isDisabled = saving || !dirty;

  let buttonContent;
  if (saving) {
    buttonContent = 'Saving...';
  } else if (saveSuccess && !dirty) {
    buttonContent = <S.SaveFlash $isVisible={true}>✅ Saved</S.SaveFlash>;
  } else {
    buttonContent = 'Save';
  }

  const allBoxes = ['this is a box'];

  useEffect(() => {
    setSavedTags(initialItem.tags || []);
  }, [initialItem._id, initialItem.tags]);

  useEffect(() => {
    if (saveSuccess) {
      const timeout = setTimeout(() => {
        setSaveSuccess(false);
        setFlashTagSet(new Set());
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [saveSuccess]);

  return (
    <S.FormContainer>
      <ItemEditFieldsForm
        formData={formData}
        onFieldChange={handleChange}
        onQuantityChange={handleQuantityChange}
        onTagsChange={handleTagsChange}
        saveSuccess={saveSuccess}
        savedTags={savedTags}
        flashTagSet={flashTagSet}
        onClose={onClose}
        onSave={(e) => {
          handleSave(e);
          console.log('item saved!');
        }}
        isDisabled={isDisabled}
        buttonContent={buttonContent}
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
    </S.FormContainer>
  );
}
