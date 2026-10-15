import { RetrievalItemEditingContext } from './RetrievalItemEditingContext';
import useRetrievalItemFieldEditor from './useRetrievalItemFieldEditor';
import RetrievalFieldPopover from './RetrievalFieldPopover';
import useRetrievalBoxLocationEditor from './useRetrievalBoxLocationEditor';
import RetrievalBoxLocationFields from './RetrievalBoxLocationFields';
import { ITEM_DROPDOWN_EDITORS } from '../../util/itemFieldSelection';

export default function RetrievalItemEditorProvider({ item, detailResource, onItemUpdated, onBoxUpdated, themeStyle, children }) {
  const itemEditing = useRetrievalItemFieldEditor({ item, detailResource, onItemUpdated });
  const boxEditing = useRetrievalBoxLocationEditor({ item, detailResource, onBoxUpdated });
  const active = boxEditing.isActive ? boxEditing : itemEditing;
  const editing = { ...active,
    canEdit: (key) => key === 'box-location' ? boxEditing.canEdit() : itemEditing.canEdit(key),
    open: (key, anchor) => {
      if (active.isActive) { active.requestClose(); return; }
      (key === 'box-location' ? boxEditing : itemEditing).open(key, anchor);
    },
  };
  return <RetrievalItemEditingContext.Provider value={editing}>
    {children}
    {editing.isActive && !ITEM_DROPDOWN_EDITORS.has(editing.descriptor?.editor) ? <RetrievalFieldPopover editing={editing} themeStyle={themeStyle}>
      {boxEditing.isActive ? <RetrievalBoxLocationFields editing={boxEditing} /> : null}
    </RetrievalFieldPopover> : null}
  </RetrievalItemEditingContext.Provider>;
}
