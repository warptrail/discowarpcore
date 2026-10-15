import ViewModeToggle from '../ViewModeToggle';
import { ControlToggleGroup as Group, ControlToggleButton as Button } from './RetrievalControlToggle.styles';
import { getVisibleRetrievalPresentation } from './retrievalPresentation';

const options = [
  { value: 'cards', label: 'Large cards', icon: <><rect x="3.5" y="4" width="7" height="16" rx="1.5" /><rect x="13.5" y="4" width="7" height="16" rx="1.5" /><path d="M3.5 10h7m3 0h7" /></> },
  { value: 'compact', label: 'Small cards', icon: <><rect x="3" y="4" width="18" height="6" rx="1" /><rect x="3" y="14" width="18" height="6" rx="1" /><path d="M9 4v6m0 4v6" /></> },
  { value: 'ascii', label: 'Terminal', icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3m6 0h4" /></> },
];

export default function RetrievalViewToggle({ presentation = 'cards', onChange, desktop = false }) {
  const visiblePresentation = getVisibleRetrievalPresentation(presentation, { desktop });
  if (!desktop) {
    return <ViewModeToggle mode={visiblePresentation === 'ascii' ? 'terminal' : 'cards'}
      onChange={(next) => onChange?.(next === 'terminal' ? 'ascii' : 'cards')}
      ariaLabel="Retrieval results view mode" />;
  }
  return <Group $columns={3} role="group" aria-label="Retrieval results view mode">
    {options.map(({ value, label, icon }) => <Button key={value} type="button" $active={visiblePresentation === value}
      aria-label={`${label} view`} title={`${label} view`} aria-pressed={visiblePresentation === value}
      onClick={() => onChange?.(value)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icon}</svg><span>{label}</span>
    </Button>)}
  </Group>;
}
