import { useId } from 'react';
import { getItemFieldDescriptor } from '../ItemFieldEditor/itemFieldRegistry';
import { useRetrievalItemEditing } from './RetrievalItemEditingContext';
import * as S from './RetrievalItemPanel.styles';
import { ITEM_DROPDOWN_EDITORS } from '../../util/itemFieldSelection';
import RetrievalInlineSelect from './RetrievalInlineSelect';

export default function RetrievalEditableField({ fieldKey, label, variant = 'value', children }) {
  const editing = useRetrievalItemEditing();
  const valueId = useId();
  if (!editing?.canEdit(fieldKey)) return children ?? null;
  const fieldLabel = label || (fieldKey === 'box-location' ? 'Box location' : getItemFieldDescriptor(fieldKey, editing.item).label);
  const dropdown = ITEM_DROPDOWN_EDITORS.has(getItemFieldDescriptor(fieldKey, editing.item)?.editor);
  if (dropdown && editing.fieldKey === fieldKey) return <RetrievalInlineSelect editing={editing} />;
  return <S.AttributeButton type="button" $variant={variant} aria-label={`Edit ${fieldLabel}`} data-retrieval-field={fieldKey}
    aria-describedby={children != null ? valueId : undefined}
    aria-haspopup={dropdown ? 'listbox' : 'dialog'} aria-expanded={editing.fieldKey === fieldKey} title={`Edit ${fieldLabel}`}
    onClick={(event) => editing.open(fieldKey, event.currentTarget)}>
    {children != null ? <S.AttributeValue id={valueId}>{children}</S.AttributeValue> : null}
    {children == null ? 'Edit' : null}
  </S.AttributeButton>;
}
