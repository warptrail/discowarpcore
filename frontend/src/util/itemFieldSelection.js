// Field selections commit their selected value, never the previous render's draft.
export const ITEM_DROPDOWN_EDITORS = new Set([
  'category', 'keep-priority', 'condition', 'acquisition-type', 'primary-owner',
]);
export function commitItemFieldSelection(editor, value, onChange, onSave) {
  if (editor.saving) return;
  onChange(value);
  if (ITEM_DROPDOWN_EDITORS.has(editor.descriptor.editor)) {
    return onSave?.({ value, commitSelection: true, quiet: true });
  }
}
