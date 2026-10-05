import styled from 'styled-components';
import { controlStyles } from '../../styles/primitives';
import { SORT_OPTIONS } from './allItemsList.utils';
import { APP_VISUAL_THEME as theme } from '../../styles/tokens';

const Rail = styled.div`
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;

  > :last-child {
    margin-left: auto;
  }
`;

const Control = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0.4rem 0.65rem;
  border: 0;
  border-radius: 4px;
  background: ${theme.surfaceRaised};
  color: ${theme.text};
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;

  &:hover {
    background: ${theme.border};
  }
  &:focus-visible {
    outline: 2px solid ${theme.teal};
    outline-offset: 2px;
  }
`;

const CycleButton = styled(Control)`
  border-left: 3px solid var(--dw-cyan);
  justify-content: space-between;
  min-width: 0;
  box-shadow: none;

  > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  > span:last-child {
    color: ${theme.teal};
  }
`;

const SORT_LABELS = {
  alpha: 'Name',
  random: 'Random',
  batch: 'Batch',
  box: 'Box',
  date: 'Date added',
  keepPriority: 'Keep priority',
  owner: 'Owner',
  lastMaintained: 'Maintained',
  purchasePrice: 'Price',
  category: 'Category',
  dispositionAt: 'Departure',
};

export default function AllItemsQuickSort({
  sortBy,
  sortDirection,
  onSortChange,
  onSortDirectionChange,
  onRandomize,
  children,
}) {
  const index = SORT_OPTIONS.findIndex((option) => option.value === sortBy);
  const next = SORT_OPTIONS[(index + 1) % SORT_OPTIONS.length];
  const descending = sortDirection === 'desc';

  return (
    <Rail role="group" aria-label="Quick sort controls">
      <CycleButton
        type="button"
        aria-label={`Sort by ${SORT_LABELS[sortBy] || sortBy}. Next: ${SORT_LABELS[next.value]}`}
        title={`Cycle sort: ${SORT_LABELS[next.value]} next`}
        onClick={() =>
          next.value === 'random' ? onRandomize?.() : onSortChange?.(next.value)
        }
      >
        <span>{SORT_LABELS[sortBy] || sortBy}</span>
        <span aria-hidden="true">›</span>
      </CycleButton>
      {sortBy !== 'random' ? (
        <Control
          type="button"
          aria-label={`Sort ${descending ? 'descending' : 'ascending'}. Reverse order`}
          title={
            descending
              ? 'Descending — reverse order'
              : 'Ascending — reverse order'
          }
          onClick={() => onSortDirectionChange?.(descending ? 'asc' : 'desc')}
        >
          <span aria-hidden="true">{descending ? '↓' : '↑'}</span>
        </Control>
      ) : null}
      <Control
        type="button"
        aria-label="Shuffle items"
        title="Shuffle items"
        onClick={onRandomize}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3m-4-4 4 4-4 4" />
        </svg>
      </Control>
      {children}
    </Rail>
  );
}
