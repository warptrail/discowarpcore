import { useState } from 'react';
import styled from 'styled-components';
import { FieldControl } from './ItemFieldEditor';
import useItemFieldEditor from './useItemFieldEditor';
import { getItemFieldDraft } from './itemFieldRegistry';
import { commitItemFieldSelection } from '../../util/itemFieldSelection';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const Row = styled.div`
  position: relative; display: flex; align-items: center; min-height: 44px; padding: 0 24px 0 0;
  @media (max-width: ${MOBILE_BREAKPOINT}) { margin: -0.06rem 0; }
  > div { width: 100%; min-width: 0; }
  button[role='combobox'] {
    height: 44px; min-height: 44px; padding: 0 6px; border-color: transparent;
    border-radius: 4px; background: transparent; font-size: .85rem; box-shadow: none;
    &:hover:not(:disabled) { background: rgba(var(--domain-rgb), .06); }
    &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  }
`;
const Cue = styled.span`
  position: absolute; right: 0; top: 50%; transform: translateY(-50%);
  width: 20px; text-align: center; color: var(--dw-text-secondary); font-size: .72rem;
`;
const Error = styled.span`
  position: absolute; top: 100%; left: 0; z-index: 10; padding: 6px 8px;
  color: var(--dw-coral); background: var(--dw-background); border: 1px solid var(--dw-coral); border-radius: 4px;
`;

export default function ItemDropdownRowControl({ item, descriptor, editor, disabled, onSaved, onClose, onError }) {
  const [saved, setSaved] = useState(false);
  const local = useItemFieldEditor({ item, fieldKey: descriptor.key,
    sourceVersion: JSON.stringify(getItemFieldDraft(descriptor, item)), onError,
    onSaved: (patch) => onSaved?.({ ...patch, stayInRow: true }) });
  const editing = editor || local;
  const select = async (value) => {
    if (disabled || editing.saving) return;
    setSaved(false);
    const updated = await commitItemFieldSelection(editing, value, editing.setDraft, editing.save);
    if (updated) setSaved(true);
  };
  return <Row data-item-field={descriptor.key} tabIndex={-1} onKeyDown={(event) => {
    if (event.key === 'Escape' && !event.defaultPrevented && editor) { event.preventDefault(); onClose?.(); }
  }}>
    <div><FieldControl descriptor={descriptor} draft={editing.draft} saving={disabled || editing.saving}
      selectVariant="floating" compact onChange={select} /></div>
    <Cue role="status" aria-label={editing.saving ? `Saving ${descriptor.label}` : saved ? `${descriptor.label} saved` : undefined}
      title={saved ? 'Saved' : undefined}>{editing.saving ? '…' : saved ? '✓' : ''}</Cue>
    {editing.error ? <Error role="alert">{editing.error}</Error> : null}
  </Row>;
}
