import styled from 'styled-components';
import { controlStyles } from '../../styles/primitives';

const Button = styled.button`
  ${controlStyles};
  width: 44px;
  min-width: 44px;
  height: 44px;
  padding: 0;
  display: inline-grid;
  place-items: center;
  color: ${({ $active }) => $active ? 'var(--dw-cyan)' : 'var(--dw-text-muted)'};
  background: ${({ $active }) => $active ? 'color-mix(in srgb, var(--dw-cyan) 12%, var(--dw-surface-raised))' : 'var(--dw-surface-raised)'};
  svg { width: 19px; height: 19px; }
  svg { filter: ${({ $active }) => $active ? 'drop-shadow(0 0 5px var(--dw-cyan))' : 'none'}; }
`;

export default function RetrievalShuffleButton({ mode, shuffled, loading, onReshuffle }) {
  const label = `Reshuffle ${mode === 'boxes' ? 'boxes' : 'items'}`;
  return <Button type="button" aria-label={label} title={label} aria-pressed={shuffled}
    $active={shuffled} disabled={loading} onClick={onReshuffle}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.8 0 3.6-2.4 5.3-5M13 9c1.8-2.2 3.3-3 5-3h3m-4-4 4 4-4 4" />
    </svg>
  </Button>;
}
