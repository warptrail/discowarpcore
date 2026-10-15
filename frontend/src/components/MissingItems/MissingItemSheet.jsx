import { useContext, useRef, useState } from 'react';
import ObsidianPrismSheet from '../Sheets/ObsidianPrismSheet';
import MoveItemToOtherBox from '../MoveItemToOtherBox';
import HouseholdProfileSwitcher from '../HouseholdProfile/HouseholdProfileSwitcher';
import { useHouseholdProfile } from '../HouseholdProfile/HouseholdProfileContext';
import { ToastContext } from '../Toast';
import { saveMissingItem } from '../../api/itemMissing';
import * as S from './MissingItems.styles';

export default function MissingItemSheet({ item: initialItem, mode, onClose, onSaved }) {
  const [item, setItem] = useState(initialItem);
  const found = mode === 'found';
  const missing = Number(item.missing?.quantity || 0);
  const [count, setCount] = useState(found ? String(missing) : mode === 'correction' ? String(missing) : missing ? String(missing) : item.quantity === 1 ? '1' : '');
  const [note, setNote] = useState(found ? '' : item.missing?.note || '');
  const [newHome, setNewHome] = useState(false);
  const [destination, setDestination] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [wholeRecord, setWholeRecord] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);
  const { profileId, getProfileId } = useHouseholdProfile();
  const { showToast } = useContext(ToastContext) || {};
  const home = item.box ? `#${item.box.placementLabel || item.box.box_id} · ${item.box.label}` : 'Intentionally unboxed / Items Adrift';
  const validQuantity = Number.isSafeInteger(item.quantity) && item.quantity > 0;
  const recoveredAll = Number(count) === missing;
  const reload = () => { setItem(conflict); setCount(found ? String(conflict.missing?.quantity || 0) : mode === 'report' ? String(Math.max(1, conflict.missing?.quantity || 0)) : String(conflict.missing?.quantity || 0));
    setConflict(null); setNewHome(false); setDestination(null); setConfirmed(false); setWholeRecord(false); setError('Review the current count and placement before saving.'); };
  const submit = async event => {
    event.preventDefault();
    if (busy.current) return;
    if (!getProfileId()) { setError('Choose a household profile before saving.'); return; }
    if (count === '') { setError('Enter a whole-number count.'); return; }
    if (found && (!confirmed || (newHome && (!destination || !wholeRecord || !recoveredAll)))) { setError('Confirm where the recovered objects were put away.'); return; }
    busy.current = true; setPending(true); setError('');
    try {
      const payload = { profile: getProfileId(), expectedRevision: item.missing?.revision || 0, expectedQuantity: item.quantity, note };
      if (found) Object.assign(payload, { recoveredQuantity: Number(count), placementConfirmed: confirmed,
        placement: { mode: newHome ? 'new' : 'home', expected: { boxId: item.box?._id ? String(item.box._id) : null, compartmentKey: item.box?.compartmentKey || '' },
          boxId: destination?.destBoxId, compartmentKey: destination?.compartmentKey, wholeRecordConfirmed: wholeRecord } });
      else Object.assign(payload, { quantity: Number(count), action: mode === 'correction' ? 'correction' : 'report' });
      const updated = await saveMissingItem(item._id, mode, payload);
      onSaved(updated); onClose();
      showToast?.({ id: 'missing-item-feedback', variant: 'success', title: found ? 'Recovery recorded' : mode === 'correction' ? 'Report corrected' : 'Missing report saved',
        message: `${updated.name}: ${updated.missing?.quantity || 0} missing.`, sticky: true });
    } catch (err) {
      setError(err.message); if (err.data) setConflict(err.data);
      showToast?.({ id: 'missing-item-feedback', variant: 'danger', title: 'Could not save Missing Items', message: err.message, sticky: true });
    } finally { busy.current = false; setPending(false); }
  };
  return <ObsidianPrismSheet title={found ? 'Found and put away' : mode === 'correction' ? 'Correct missing report' : 'Report missing'}
    context={item.name} compact centered layer={2} returnFocusSelector="[data-app-header] button, #route-content" onClose={onClose} beforeClose={() => !busy.current}>
    <S.Form onSubmit={submit}>
      <p><strong>{item.name}</strong><br /><small>Recorded home: {home}<br />{item.inheritedLocation || item.box?.location || item.location || 'Location not recorded'}</small></p>
      {!profileId && <><p>Choose who is recording this update.</p><HouseholdProfileSwitcher /></>}
      {!validQuantity && <S.ErrorText role="alert">Correct the inventory quantity to a positive whole number before reporting missing objects.</S.ErrorText>}
      <label>{found ? 'How many recovered objects have you put away?' : 'Total currently missing'}
        <input required type="number" step="1" min={found || mode === 'report' ? 1 : 0} max={found ? missing : item.quantity}
          value={count} onChange={e => { setCount(e.target.value); setConfirmed(false); setWholeRecord(false); }} disabled={pending || !validQuantity} />
      </label>
      <small>Inventory quantity: {item.quantity}. Currently reported missing: {missing}.</small>
      {mode === 'correction' && <p>Correcting this count does not record a recovery. Enter zero to cancel an erroneous report.</p>}
      {found && <>
        <p>Only confirm after putting the recovered objects away. Cancel if they are still on a table or in transit.</p>
        <label>Placement<select value={newHome ? 'new' : 'home'} disabled={pending} onChange={e => { setNewHome(e.target.value === 'new'); setConfirmed(false); setWholeRecord(false); }}>
          <option value="home">{item.box ? `Returned to ${home}` : 'Confirmed intentionally unboxed'}</option>
          <option value="new" disabled={!recoveredAll}>New home for the entire record</option>
        </select></label>
        {newHome && <><MoveItemToOtherBox itemId={item._id} currentBoxId={item.box?._id} compact showOrphanOption={false} disabled={pending}
          onBoxSelected={selected => { setDestination(selected); setConfirmed(false); setWholeRecord(false); }} />
          <p>{destination ? `Selected: #${destination.destShortId} · ${destination.destLabel}` : 'Select a destination box or compartment.'}</p>
          <label data-check><input type="checkbox" checked={wholeRecord} disabled={pending || !recoveredAll} onChange={e => setWholeRecord(e.target.checked)} />All {item.quantity} objects in this record belong at this new home.</label></>}
        <label data-check><input required type="checkbox" checked={confirmed} disabled={pending} onChange={e => setConfirmed(e.target.checked)} />I have put the recovered objects at the confirmed placement.</label>
      </>}
      <label>Optional note<textarea rows="3" maxLength="2000" value={note} disabled={pending} onChange={e => setNote(e.target.value)} /></label>
      {error && <S.ErrorText role="alert">{error}</S.ErrorText>}
      {conflict && <S.Button type="button" onClick={reload}>Review refreshed record</S.Button>}
      <S.Actions><S.Button type="submit" disabled={pending || !validQuantity || !profileId || Boolean(conflict) || (found && missing === 0)}>{pending ? 'Saving…' : found ? 'Confirm recovery' : 'Save report'}</S.Button>
        <S.Button type="button" disabled={pending} onClick={onClose}>Cancel</S.Button></S.Actions>
    </S.Form>
  </ObsidianPrismSheet>;
}
