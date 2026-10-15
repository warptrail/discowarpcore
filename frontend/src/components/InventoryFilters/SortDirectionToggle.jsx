import styled from 'styled-components';
import { SortFieldButton } from '../Retrieval/Retrieval.styles';

const Button = styled(SortFieldButton)`
  --direction-color: ${({ $descending }) => $descending ? 'var(--dw-amber)' : 'var(--dw-cyan)'};
  --direction-wash: ${({ $descending }) => $descending ? 'rgba(232, 177, 92, .14)' : 'rgba(113, 210, 255, .14)'};
  display: grid;
  place-items: center;
  width: 40px;
  min-width: 40px;
  min-height: 40px;
  margin-left: 2px;
  padding: 0;
  border-left: 1px solid var(--direction-color);
  border-radius: 0 3px 3px 0;
  color: var(--direction-color);
  background: var(--direction-wash);
  svg { width: 17px; height: 17px; }
  &:hover { color: var(--direction-color); background: var(--direction-wash); filter: brightness(1.2); }
  &:active { transform: translateY(1px); }
  @media (pointer: coarse) { width: 44px; min-width: 44px; min-height: 44px; }
`;

export default function SortDirectionToggle({ descending, onClick, disabled = false }) {
  const title = `Sort direction: ${descending ? 'Descending' : 'Ascending'}`;
  return <Button type="button" $descending={descending} onClick={onClick} disabled={disabled}
    aria-label={title} title={title}>
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={descending ? 'M12 5v14m-5-5 5 5 5-5' : 'M12 19V5m-5 5 5-5 5 5'}
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Button>;
}
