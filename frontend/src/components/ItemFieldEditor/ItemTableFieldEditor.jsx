import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import ItemFieldEditor, { FieldControl } from './ItemFieldEditor';
import useRetrievalFieldPopoverBounds from '../Retrieval/useRetrievalFieldPopoverBounds';
import * as Pop from '../Retrieval/RetrievalFieldPopover.styles';
import { commitItemFieldSelection } from '../../util/itemFieldSelection';
import * as Quantity from '../../styles/QuantityInput.styles';

const COMPACT = new Set(['text', 'money', 'date', 'category', 'keep-priority', 'condition', 'acquisition-type', 'primary-owner']);
const Inline = styled.div`
  position: absolute; inset: 0 12px; display: grid; grid-template-columns: ${({ $quantity }) => $quantity ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) 44px'};
  align-items: center; gap: 4px; background: ${({ $quantity }) => $quantity ? 'transparent' : 'var(--dw-background)'}; z-index: 5;
  > div { min-width: 0; }
  input, button { max-width: 100%; }
  input { width: 100%; min-height: 40px; box-sizing: border-box; }
  ${Quantity.Wrapper} { width: min(100%, 156px); height: 44px; padding: 0; gap: 0; border: 0; background: transparent; }
  ${Quantity.Button} { flex: 0 0 44px; min-width: 44px; height: 44px; border: 0; background: transparent; }
  ${Quantity.Input} { height: 40px; min-width: 0; padding: 0; border-radius: 4px; font-size: .95rem; }
`;
const Apply = styled.button`
  height: 44px; width: 44px; padding: 0; border: 0; border-radius: 4px;
  background: transparent; color: var(--dw-cyan); cursor: pointer;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  &:disabled { opacity: .45; cursor: default; }
`;

// Preserve the display row as a sizing reference. Only the editor floats, so
// long values, column balancing and responsive layout never depend on its form.
export default function ItemTableFieldEditor({ anchor, editor, onSave, onClose }) {
  const rootRef = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!anchor) return undefined;
    const update = () => setWidth(anchor.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchor]);
  const quantity = editor.descriptor.editor === 'quantity';
  const compact = quantity || (COMPACT.has(editor.descriptor.editor) && width >= 240 && !editor.error);
  const bounds = useRetrievalFieldPopoverBounds(compact ? null : anchor, rootRef);
  const theme = {};
  if (anchor) {
    const style = getComputedStyle(anchor);
    ['--box-primary', '--box-primary-rgb', '--box-secondary', '--box-secondary-rgb', '--item-accent', '--domain-color', '--domain-rgb'].forEach((key) => { theme[key] = style.getPropertyValue(key); });
    theme['--retrieval-panel-accent'] = theme['--domain-color'] || theme['--box-primary'];
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const root = rootRef.current;
      const target = root?.querySelector('input, textarea')
        || root?.querySelector('[role="combobox"]') || root?.querySelector('button');
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [compact, editor.descriptor.key]);
  useEffect(() => {
    const outside = (event) => {
      if (rootRef.current?.contains(event.target) || anchor?.contains(event.target)
        || event.target.closest('[role="listbox"], [data-item-field]')) return;
      onClose();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [anchor, onClose]);
  const keys = (event) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    else if (compact && event.key === 'Enter' && event.target.tagName === 'INPUT') {
      event.preventDefault(); onClose();
    }
  };
  if (compact) return <Inline $quantity={quantity} data-inline-field-editor ref={rootRef} id={`item-field-editor-${editor.descriptor.key}`} onKeyDown={keys}>
    <div><FieldControl descriptor={editor.descriptor} draft={editor.draft} saving={editor.saving}
      compact onChange={(value) => commitItemFieldSelection(editor, value, editor.setDraft, onSave)} selectVariant="floating" /></div>
    {!quantity ? <Apply type="button" aria-label={`Done editing ${editor.descriptor.label}`} disabled={editor.saving} onClick={onClose}>✓</Apply> : null}
  </Inline>;
  return createPortal(<Pop.Dialog ref={rootRef} role="dialog" aria-modal="false" aria-label={`Edit ${editor.descriptor.label}`}
    id={`item-field-editor-${editor.descriptor.key}`} onKeyDown={keys}
    style={{ ...theme, ...bounds, visibility: bounds ? undefined : 'hidden' }}>
    <Pop.Header><h3>{editor.descriptor.label}</h3><Pop.Close type="button" aria-label="Close field editor" disabled={editor.saving} onClick={onClose}>×</Pop.Close></Pop.Header>
    <Pop.Body><fieldset disabled={editor.saving}><ItemFieldEditor autoFocus={false} editNotesImmediately
      commitSelections commitTextOnTab={false} selectVariant="floating"
      descriptor={editor.descriptor} draft={editor.draft} error={editor.error} isDirty={editor.isDirty}
      saving={editor.saving} onChange={editor.setDraft} onSave={(options) => onSave({ ...options, quiet: true })} onRequestDiscard={onClose} /></fieldset></Pop.Body>
    <Pop.Actions><Pop.Button type="button" $primary disabled={editor.saving} onClick={onClose}>{editor.saving ? 'Saving…' : editor.isDirty ? 'Save changes' : 'Done'}</Pop.Button></Pop.Actions>
  </Pop.Dialog>, document.body);
}
