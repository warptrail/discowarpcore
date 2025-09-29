import React, { useState, useEffect } from 'react';
import * as S from '../styles/EditItemDetailsForm.styles';
import { editItem } from '../api/editItem';
import { normalizeTags } from '../util/normalizeTags';

import QuantityInput from './QuantityInput';
import TagContainer from './TagContainer';

export default function EditItemDetailsForm({ item, triggerFlash, onSaved }) {
  const [formData, setFormData] = useState(() => ({
    ...item,
    tags: normalizeTags(item?.tags),
  }));
  const [initialData, setInitialData] = useState(() => ({
    ...item,
    tags: normalizeTags(item?.tags),
  }));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setFormData({ ...item, tags: normalizeTags(item?.tags) });
    setInitialData({ ...item, tags: normalizeTags(item?.tags) });
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle tags
  const handleAddTag = (value) => {
    setFormData((prev) => ({
      ...prev,
      tags: [
        ...(prev.tags || []),
        { value, status: 'new' }, // stage new
      ],
    }));
  };

  const handleRemoveTag = (tagValue) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.map((t) =>
        t.value === tagValue
          ? { ...t, status: t.status === 'deleted' ? 'normal' : 'deleted' }
          : t
      ),
    }));
  };

  // when updating tags from TagContainer
  const handleTagsChange = (tags) => {
    setFormData((prev) => ({
      ...prev,
      tags: normalizeTags(tags),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: normalizeTags(formData.tags)
          .filter((t) => t.status !== 'deleted')
          .map((t) => t.value),
      };

      const updated = await editItem(item._id, payload);
      triggerFlash?.(item._id, 'yellow');
      onSaved?.(updated);

      setInitialData({ ...updated, tags: normalizeTags(updated.tags) });
      setFormData({ ...updated, tags: normalizeTags(updated.tags) });
    } catch (err) {
      console.error('Update failed:', err);
      triggerFlash?.(item._id, 'red');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = (e) => {
    e.preventDefault();
    setFormData({ ...initialData, tags: normalizeTags(initialData.tags) });
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

        {/* 👇 New Tag Container */}
        <S.Field>
          <S.Label>Tags</S.Label>
          <TagContainer
            tags={formData.tags}
            onChange={handleTagsChange}
            mode="edit"
          />
        </S.Field>

        <S.Field>
          <S.Label>Quantity</S.Label>
          <QuantityInput
            value={formData.quantity}
            onChange={(num) =>
              setFormData((prev) => ({ ...prev, quantity: num }))
            }
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
