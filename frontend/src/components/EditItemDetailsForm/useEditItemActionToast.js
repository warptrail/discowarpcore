import { useContext, useEffect, useMemo, useRef } from 'react';
import { ToastContext } from '../Toast';

export default function useEditItemActionToast({
  item,
  isDirty,
  saving,
  lifecycleBusy,
  onCancel,
  onSave,
  onRevert,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const saveRef = useRef(onSave);
  const revertRef = useRef(onRevert);
  const cancelRef = useRef(onCancel);
  const itemId = String(item?._id || item?.id || '');
  const itemName = String(item?.name || '').trim();
  const hasCancelAction = typeof onCancel === 'function';
  const editActionToastId = useMemo(
    () => `edit-item-actions:${itemId}`,
    [itemId]
  );

  useEffect(() => {
    saveRef.current = onSave;
    revertRef.current = onRevert;
    cancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!showToast || !itemId) return;

    showToast({
      id: editActionToastId,
      sticky: true,
      variant: 'command',
      title: itemName ? `Editing ${itemName}` : 'Editing item',
      message: isDirty ? 'Unsaved changes' : 'All changes saved',
      onClose: hasCancelAction ? () => cancelRef.current?.() : undefined,
      actions: [
        ...(hasCancelAction
          ? [{
              id: 'view',
              label: 'View',
              kind: 'mode',
              disabled: saving,
              onClick: () => cancelRef.current?.(),
            }]
          : []),
        {
          id: 'save',
          label: saving ? 'Saving...' : 'Save',
          kind: 'primary',
          disabled: !isDirty || saving || lifecycleBusy,
          onClick: () => saveRef.current?.(),
        },
        {
          id: 'revert',
          label: 'Revert',
          disabled: !isDirty || saving || lifecycleBusy,
          onClick: () => revertRef.current?.(),
        },
      ],
    });
  }, [
    editActionToastId,
    hasCancelAction,
    isDirty,
    itemId,
    itemName,
    lifecycleBusy,
    saving,
    showToast,
  ]);

  useEffect(() => {
    if (!hideToast || !itemId) return undefined;
    return () => hideToast(editActionToastId);
  }, [editActionToastId, hideToast, itemId]);
}
