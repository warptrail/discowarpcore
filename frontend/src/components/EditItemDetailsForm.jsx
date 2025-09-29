import React, { useState, useEffect } from 'react';
import * as S from '../styles/EditItemDetailsForm.styles';
import { editItem } from '../api/editItem';

export default function EditItemDetailsForm({ item, triggerFlash, onSaved }) {
  const [formData, setFormData] = useState({ ...item });
  const [initialData, setInitialData] = useState({ ...item });
  const [saving, setSaving] = useState(false);

  // Reset form when item prop changes (BoxDetailView updates after save)
  useEffect(() => {
    setFormData({ ...item });
    setInitialData({ ...item });
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await editItem(item._id, formData);

      // Flash success feedback
      triggerFlash?.(item._id, 'yellow');

      // Bubble fresh item up to BoxDetailView
      onSaved?.(updated);

      // Reset dirty state locally
      setInitialData(updated);
      setFormData(updated);
    } catch (err) {
      console.error('Update failed:', err);
      triggerFlash?.(item._id, 'red');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = (e) => {
    e.preventDefault();
    setFormData({ ...initialData });
    triggerFlash?.(item._id, 'blue');
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <S.Form onSubmit={handleSave}>
      <S.Fieldset disabled={saving}>
        <S.Field>
          <S.Label>Name</S.Label>
          <S.Input
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
          />
        </S.Field>

        <S.Field>
          <S.Label>Description</S.Label>
          <S.TextArea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
          />
        </S.Field>

        <S.Field>
          <S.Label>Notes</S.Label>
          <S.TextArea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
          />
        </S.Field>

        <S.Actions>
          <S.SaveButton type="submit" disabled={!isDirty || saving}>
            {saving ? 'Saving…' : 'Save'}
          </S.SaveButton>
          <S.RevertButton
            type="button"
            onClick={handleRevert}
            disabled={!isDirty || saving}
          >
            Revert
          </S.RevertButton>
        </S.Actions>
      </S.Fieldset>
    </S.Form>
  );
}
