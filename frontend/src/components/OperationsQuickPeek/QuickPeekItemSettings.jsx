import { useMissingItem, useMissingItems } from '../MissingItems/MissingItemsContext';
import * as Controls from './QuickPeekItemControls.styles';

export default function QuickPeekItemSettings({ item, isConsumable, consumablePending, onToggleConsumable, onItemUpdated }) {
  const current = useMissingItem(item);
  const { open } = useMissingItems();
  const missing = Number(current?.missing?.quantity || 0) > 0;
  const name = item?.name || 'item';
  const identified = Boolean(item?._id || item?.id);
  const missingDisabled = !identified || item?.item_status === 'gone';
  const report = mode => open(item, mode, onItemUpdated);

  return <>
    <Controls.SettingsRail data-item-settings role="group" aria-label="Item settings">
      <Controls.Button type="button" aria-pressed={missing} disabled={missingDisabled}
        aria-label={missing ? `Record recovery of ${name}` : `Mark ${name} missing`}
        title={missing ? 'Missing: on · Record recovery' : 'Missing: off · Report missing'}
        onClick={() => report(missing ? 'found' : 'report')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 17H3L12 3ZM12 8v5m0 3v1" /></svg>
        Missing
      </Controls.Button>
      <Controls.Button type="button" aria-pressed={isConsumable} aria-busy={consumablePending}
        disabled={consumablePending || !identified}
        aria-label={isConsumable ? `Mark ${name} as not consumable` : `Mark ${name} as consumable`}
        title={isConsumable ? 'Consumable: on' : 'Consumable: off'} onClick={onToggleConsumable}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12ZM9 15a3 3 0 0 0 3 3" /></svg>
        Consumable
      </Controls.Button>
    </Controls.SettingsRail>
    {missing && <Controls.ReportOptions role="group" aria-label="Missing report options">
      <Controls.Button type="button" onClick={() => report('report')}>Update missing count</Controls.Button>
      <Controls.Button type="button" onClick={() => report('correction')}>Correct report</Controls.Button>
    </Controls.ReportOptions>}
  </>;
}
