import { useEffect, useMemo, useState } from 'react';
import { editItem } from '../../api/editItem';
import { normalizeTags } from '../../util/normalizeTags';

const buildFormState = (item) => ({
  ...item,
  tags: normalizeTags(item?.tags),
});

export default function useEditItemDetailsFormState({ item, triggerFlash, onSaved }) {
  const [formData, setFormData] = useState(() => buildFormState(item));
  const [initialData, setInitialData] = useState(() => buildFormState(item));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(buildFormState(item));
    setInitialData(buildFormState(item));
  }, [item]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialData),
    [formData, initialData]
  );

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags) => {
    setFormData((prev) => ({
      ...prev,
      tags: normalizeTags(tags),
    }));
  };

  const handleQuantityChange = (num) => {
    setFormData((prev) => ({
      ...prev,
      quantity: num,
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

      setInitialData(buildFormState(updated));
      setFormData(buildFormState(updated));
    } catch (err) {
      console.error('Update failed:', err);
      triggerFlash?.(item._id, 'red');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = (e) => {
    e.preventDefault();
    setFormData(buildFormState(initialData));
    triggerFlash?.(item._id, 'blue');
  };

  return {
    formData,
    saving,
    isDirty,
    handleTextChange,
    handleTagsChange,
    handleQuantityChange,
    handleSave,
    handleRevert,
  };
}
