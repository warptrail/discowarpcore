import { createElement, useContext, useEffect, useMemo, useRef } from 'react';
import { ToastContext } from '../Toast';
import ItemPageConsoleActions from '../ItemPageConsoleActions';
import ItemPageConsoleDetails from '../ItemPageConsoleDetails';

export default function useEditItemActionToast({
  item,
  isDirty,
  saving,
  lifecycleBusy,
  onCancel,
  onSave,
  onRevert,
  preserveToastOnCancel = false,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const saveRef = useRef(onSave);
  const revertRef = useRef(onRevert);
  const cancelRef = useRef(onCancel);
  const cancelRequestedRef = useRef(false);
  const itemId = String(item?._id || item?.id || '');
  const itemName = String(item?.name || '').trim();
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
      title: itemName || 'Item',
      titleDetails: createElement(ItemPageConsoleDetails, { item }),
      titleAlign: 'start',
      titleSize: 'hero',
      content: createElement(ItemPageConsoleActions, {
        isEditing: true,
        onView: () => {
          if (preserveToastOnCancel) cancelRequestedRef.current = true;
          return cancelRef.current?.();
        },
        onSave: () => saveRef.current?.(),
        onRevert: () => revertRef.current?.(),
        saving,
        isDirty,
        lifecycleBusy,
      }),
    });
  }, [
    editActionToastId,
    isDirty,
    itemId,
    itemName,
    lifecycleBusy,
    preserveToastOnCancel,
    saving,
    showToast,
  ]);

  useEffect(() => {
    if (!hideToast || !itemId) return undefined;
    return () => {
      if (!cancelRequestedRef.current) hideToast(editActionToastId);
    };
  }, [editActionToastId, hideToast, itemId]);
}
