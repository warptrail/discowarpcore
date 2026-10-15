import { useRef, useState } from 'react';
import styled from 'styled-components';
import * as D from './DeclutterDiscussion.styles';
import useDialogFocus from '../../hooks/useDialogFocus';
import { getDeclutterItemTheme } from './declutterItemTheme';
import { getItemName, getSessionItemItem } from './declutterUtils';

const Form = styled.form`display:flex; flex-direction:column; min-height:0;`;
const Field = styled.label`
  display:grid; gap:6px; color:var(--dw-text-secondary); font:400 .8rem/1.4 var(--dw-font-ui);
  input,textarea,select { box-sizing:border-box; width:100%; min-width:0; min-height:44px; padding:9px 10px;
    color:var(--dw-text); background:var(--dw-background); border:1px solid var(--dw-border-soft);
    border-radius:8px; font:400 .85rem/1.45 var(--dw-font-ui); }
  textarea { min-height:80px; resize:vertical; }
`;

export default function DeclutterDepartureSheet({ candidate, onClose, onConfirm }) {
  const item = getSessionItemItem(candidate);
  const sale = candidate.stagingRoute==='sell';
  const original = sale ? item?.saleDetails : item?.giftDetails;
  const [person,setPerson] = useState(original?.buyer || original?.recipient || '');
  const [paymentType,setPaymentType] = useState(original?.paymentType || '');
  const [amount,setAmount] = useState(original?.amountCents==null ? '' : (original.amountCents/100).toFixed(2));
  const [detail,setDetail] = useState(original?.tradedFor || original?.occasion || '');
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [discard,setDiscard] = useState(false);
  const ref = useRef(null);
  const dirty = person!==(original?.buyer || original?.recipient || '') || paymentType!==(original?.paymentType || '')
    || amount!==(original?.amountCents==null ? '' : (original.amountCents/100).toFixed(2)) || detail!==(original?.tradedFor || original?.occasion || '');
  const dismiss = ()=>{if (!saving) {if(dirty) setDiscard(true);else onClose();}};
  useDialogFocus(ref,dismiss,true,'nav[aria-label="Declutter workspaces"] button[aria-pressed="true"]');
  const submit = async event=>{
    event.preventDefault(); setError('');
    if (sale && paymentType==='dollars' && amount && !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError('Enter a nonnegative dollar amount with at most two decimal places.');return;
    }
    const cents = amount ? Math.round(Number(amount)*100) : null;
    if (sale && paymentType==='dollars' && cents!==null && !Number.isSafeInteger(cents)) {setError('That amount is too large.');return;}
    const hasDetails = Boolean(person.trim() || paymentType || detail.trim());
    const payload = sale ? {saleDetails:hasDetails ? {buyer:person.trim(),paymentType,
      amountCents:paymentType==='dollars' ? cents : null,tradedFor:paymentType==='trade' ? detail.trim() : ''} : original ? null : undefined}
      : {giftDetails:hasDetails ? {recipient:person.trim(),occasion:detail.trim()} : original ? null : undefined};
    setSaving(true);
    try {
      const result = await onConfirm({disposition:sale ? 'sold' : 'gifted',...payload});
      if (result===true) onClose();
      else setError(result?.error || 'The departure was not saved. Your details are still here.');
    } catch(err) {setError(err.message || 'The departure was not saved.');}
    finally {setSaving(false);}
  };
  return <D.Scrim style={getDeclutterItemTheme(item)} onMouseDown={event=>{if(event.target===event.currentTarget) dismiss();}}>
    <D.Sheet ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="departure-title">
      <D.SheetHeader><div><D.Kicker>{sale ? 'SALE' : 'GIFT'} · DEPARTURE DETAILS</D.Kicker>
        <h2 id="departure-title">{getItemName(item)}</h2><p>Details are optional. Confirm only once the item has left.</p></div>
        <D.Close type="button" aria-label="Close departure details" onClick={dismiss} disabled={saving}>×</D.Close>
      </D.SheetHeader>
      <Form onSubmit={submit}>
        <D.Body>
          <Field>{sale ? 'Sold to' : 'Given to'}<input value={person} onChange={event=>setPerson(event.target.value)} maxLength={300} disabled={saving} /></Field>
          {sale ? <Field>Payment<select value={paymentType} onChange={event=>{setPaymentType(event.target.value);setAmount('');setDetail('');}} disabled={saving}>
            <option value="">Not recorded</option><option value="dollars">Dollars (USD)</option><option value="trade">Trade</option>
          </select></Field> : null}
          {sale && paymentType==='dollars' ? <Field>Amount in dollars<input inputMode="decimal" value={amount}
            onChange={event=>setAmount(event.target.value)} placeholder="0.00" disabled={saving} /></Field> : null}
          {!sale || paymentType==='trade' ? <Field>{sale ? 'Traded for' : 'Occasion or reason'}<textarea value={detail}
            onChange={event=>setDetail(event.target.value)} maxLength={1000} disabled={saving} /></Field> : null}
          {error ? <D.Error role="alert">{error}</D.Error> : null}
          {discard ? <D.Section><span>Discard unsaved details?</span><D.Reopen type="button" onClick={()=>setDiscard(false)}>Keep editing</D.Reopen>
            <D.Reopen type="button" onClick={onClose}>Discard details</D.Reopen></D.Section> : null}
        </D.Body>
        <D.Footer><D.Confirm type="submit" $tone={sale ? 'sell' : 'gift'} disabled={saving}>
          {saving ? 'Saving…' : sale ? 'Confirm sold' : 'Confirm gifted'}</D.Confirm>
          <D.Reopen type="button" onClick={dismiss} disabled={saving}>Cancel</D.Reopen></D.Footer>
      </Form>
    </D.Sheet>
  </D.Scrim>;
}
