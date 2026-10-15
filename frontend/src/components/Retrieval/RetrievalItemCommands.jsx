import MissingActions from '../MissingItems/MissingActions';
import { useRef, useState } from 'react';
import * as S from './RetrievalItemPanel.styles';
import RetrievalEditableField from './RetrievalEditableField';
import ItemCommandIcon from '../ItemCommandIcon';
import * as C from './RetrievalItemCommands.styles';
import RetrievalDeclutterButton from './RetrievalDeclutterButton';

const SUMMARY_FIELDS = { 'Latest Used': 'usage-history', 'Use Events': 'usage-history',
  'Latest Checked': 'check-history', 'Check Events': 'check-history',
  'Latest Maintained': 'maintenance-history', 'Service Events': 'maintenance-history' };

export default function RetrievalItemCommands({ item, model, detailResource, onLifecycleAction, onClose, onItemUpdated }) {
  const [pending, setPending] = useState('');
  const busy = useRef(false);
  const actions = [{ key: 'used', label: 'Used' }, { key: 'checked', label: 'Checked' },
    model.isConsumable ? { key: 'consumed', label: 'Consumed' } : { key: 'maintained', label: 'Maintained' }];
  const run = async (action) => {
    if (busy.current || typeof onLifecycleAction !== 'function') return;
    busy.current = true; setPending(action);
    try {
      await onLifecycleAction(item, action);
      // The persistent header owns the consumption confirmation and Undo.
      if (action === 'consumed') onClose?.();
    } catch {
      // The existing lifecycle handler reports failures through ToastContext.
    } finally { busy.current = false; setPending(''); }
  };
  const summary = model.lifecycleTelemetry;
  const activityRows = [
    { label: 'Used', latest: 'Latest Used', count: 'Use Events', field: 'usage-history' },
    { label: 'Checked', latest: 'Latest Checked', count: 'Check Events', field: 'check-history' },
    { label: 'Maintained', latest: 'Latest Maintained', count: 'Service Events', field: 'maintenance-history' },
  ];
  const valueFor = label => summary.find(entry => entry.label === label)?.value || '—';
  return <C.Commands>
    <C.ManagementRail role="group" aria-label="Item management commands">
      <MissingActions item={detailResource?.data || item} onSaved={onItemUpdated} />
      <RetrievalDeclutterButton item={item} detailResource={detailResource} onItemUpdated={onItemUpdated} />
    </C.ManagementRail>
    <C.Rail role="group" aria-label={`Quick actions for ${item.name}`}>
      {actions.map((action) => <S.Button key={action.key} type="button" aria-label={action.label}
        disabled={Boolean(pending) || detailResource?.status !== 'ready' || !onLifecycleAction}
        onClick={() => { void run(action.key); }}><ItemCommandIcon action={action.key} />{pending === action.key ? 'Saving…' : { used: 'Use', checked: 'Check', maintained: 'Maint.', consumed: 'Consume' }[action.key]}</S.Button>)}
    </C.Rail>
    <C.Summary><h3>Activity summary · select a value to edit</h3><dl>
      {activityRows.map(row => <div key={row.field}><dt>{row.label}</dt><dd>
        <RetrievalEditableField fieldKey={row.field} variant="block"><C.Value>
          <span>{valueFor(row.latest)}</span><small>{valueFor(row.count)} events</small>
        </C.Value></RetrievalEditableField>
      </dd></div>)}
      {summary.filter(entry => !SUMMARY_FIELDS[entry.label]).map(({label,value}) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></C.Summary>
  </C.Commands>;
}
