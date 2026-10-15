import { useState } from 'react';
import styled from 'styled-components';
import QuantityInput from '../QuantityInput';
import useItemFieldEditor from './useItemFieldEditor';
import * as Q from '../../styles/QuantityInput.styles';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const RowControl = styled.div`
  position: relative; display: flex; align-items: center; min-height: 44px; padding: 0;
  @media (max-width: ${MOBILE_BREAKPOINT}) { margin: -0.06rem 0; }
  ${Q.Wrapper} { width: min(calc(100% - 24px), 132px); height: 44px; padding: 0; gap: 0; border: 0; background: transparent; }
  ${Q.Button} { flex: 0 0 44px; min-width: 44px; height: 44px; padding: 0; border: 0; background: transparent; font-size: 1rem; }
  ${Q.Input} { width: 100%; min-width: 0; min-height: 30px; height: 30px; box-sizing: border-box; padding: 0; border-radius: 4px; font-size: .85rem; }
`;
const SaveCue = styled.span`
  position: absolute; right: 0; top: 50%; transform: translateY(-50%);
  width: 20px; text-align: center; color: var(--dw-text-secondary); font-size: .72rem;
`;
const ErrorMessage = styled.span`
  position: absolute; top: 100%; left: 12px; z-index: 10;
  padding: 6px 8px; background: var(--dw-background); color: var(--dw-coral);
  border: 1px solid var(--dw-coral); border-radius: 4px;
`;

export default function ItemQuantityRowControl({ item, editor, disabled, onSaved, onClose, onError }) {
  const [saved, setSaved] = useState(false);
  const local = useItemFieldEditor({ item, fieldKey: 'quantity', sourceVersion: item.quantity, onError,
    onSaved: (patch) => onSaved?.({ ...patch, stayInRow: true }) });
  const editing = editor || local;
  const change = (value) => { setSaved(false); editing.setDraft(value); };
  const step = async (value) => {
    if (disabled || editing.saving) return;
    change(value);
    const updated = await editing.save({ value, commitSelection: true });
    if (updated) setSaved(true);
  };
  const commit = () => {
    if (editor) onClose?.();
    else if (editing.isDirty) void editing.save();
  };
  return <>
    <RowControl data-item-field="quantity" tabIndex={-1}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) commit(); }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || event.defaultPrevented) return;
        if (event.key === 'Enter' || event.key === 'Escape') { event.preventDefault(); commit(); }
      }}>
      <QuantityInput compact fullWidth ariaLabel="Quantity" value={editing.draft ?? item.quantity ?? 1}
        disabled={disabled || editing.saving} onChange={change} onStep={step} />
      <SaveCue role="status" aria-label={editing.saving ? 'Saving quantity' : saved ? 'Quantity saved' : undefined}
        title={saved ? 'Saved' : undefined}>{editing.saving ? '…' : saved ? '✓' : ''}</SaveCue>
    </RowControl>
    {editing.error ? <ErrorMessage role="alert">{editing.error}</ErrorMessage> : null}
  </>;
}
