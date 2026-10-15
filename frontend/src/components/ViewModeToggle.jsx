import { ViewModeToggle as Group, ViewModeButton } from '../styles/InventoryGridHeader.styles';

export default function ViewModeToggle({ mode = 'cards', onChange, ariaLabel = 'Inventory view mode' }) {
  return <Group role="group" aria-label={ariaLabel}>
    <ViewModeButton type="button" $active={mode === 'cards'}
      aria-label="Cards view" title="Cards view" aria-pressed={mode === 'cards'}
      onClick={() => onChange?.('cards')}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.5" y="4" width="7" height="16" rx="1.5" />
        <rect x="13.5" y="4" width="7" height="16" rx="1.5" />
        <path d="M3.5 10h7m3 0h7" />
      </svg>
    </ViewModeButton>
    <ViewModeButton type="button" $active={mode === 'terminal'}
      aria-label="Terminal view" title="Terminal view" aria-pressed={mode === 'terminal'}
      onClick={() => onChange?.('terminal')}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 9 3 3-3 3m6 0h4" />
      </svg>
    </ViewModeButton>
  </Group>;
}
