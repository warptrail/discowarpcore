import { createElement, useContext, useEffect, useMemo, useRef } from 'react';
import { ToastContext } from '../Toast';
import ItemPageConsoleActions from '../ItemPageConsoleActions';
import ItemPageConsoleDetails from '../ItemPageConsoleDetails';
import { getItemOwnershipContext } from '../../util/itemOwnership';
import {
  getBoxTheme,
  getBoxThemeCssVars,
  getItemTheme,
  getItemThemeCssVars,
} from '../../util/inventoryColorTheme';

export default function useEditItemActionToast({
  enabled = true,
  item,
  isDirty,
  saving,
  lifecycleBusy,
  onCancel,
  onSave,
  onRevert,
  preserveToastOnCancel = false,
  modeLabel = 'Edit item',
  revertLabel = 'Revert',
  revertRequiresDirty = true,
  saveLabel = 'Save',
  title,
  toastId,
  presentation = 'item-page',
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
  const ownership = getItemOwnershipContext(item);
  const isFieldCommand = presentation === 'item-field';
  const editActionToastId = useMemo(
    () => toastId || `edit-item-actions:${itemId}`,
    [itemId, toastId]
  );

  useEffect(() => {
    saveRef.current = onSave;
    revertRef.current = onRevert;
    cancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!enabled || !showToast || !itemId) return;

    showToast({
      id: editActionToastId,
      sticky: true,
      variant: 'command',
      title: title || itemName || 'Item',
      titleDetails: createElement(ItemPageConsoleDetails, {
        item,
        modeLabel,
        compact: isFieldCommand,
      }),
      titleAlign: 'start',
      titleSize: isFieldCommand ? 'default' : 'hero',
      presentation,
      themeStyle: {
        ...getBoxThemeCssVars(getBoxTheme(ownership.boxId)),
        ...getItemThemeCssVars(
          getItemTheme(ownership.boxId, itemId, {
            selected: true,
            varied: true,
          })
        ),
      },
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
        revertLabel,
        revertRequiresDirty,
        saveLabel,
        showViewAction: false,
        prism: isFieldCommand,
      }),
    });
  }, [
    editActionToastId,
    enabled,
    isDirty,
    item,
    itemId,
    itemName,
    isFieldCommand,
    lifecycleBusy,
    modeLabel,
    ownership.boxId,
    preserveToastOnCancel,
    presentation,
    saving,
    revertLabel,
    revertRequiresDirty,
    saveLabel,
    showToast,
    title,
  ]);

  useEffect(() => {
    if (!enabled || !hideToast || !itemId) return undefined;
    return () => {
      if (!cancelRequestedRef.current) hideToast(editActionToastId);
    };
  }, [editActionToastId, enabled, hideToast, itemId]);
}
