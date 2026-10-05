import { useContext, useMemo, useState } from 'react';
import styled from 'styled-components';
import { controlStyles } from '../../styles/primitives';
import { ToastContext } from '../Toast';

const Wrap = styled.div`
  display: grid;
  gap: 0.3rem;
  min-width: 0;
`;

const Label = styled.div`
  display: flex;
  align-items: center;
  gap: 0.34rem;
  color: rgba(230, 237, 243, 0.64);
  font: 800 0.75rem/1.2 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
`;

const OrderToggle = styled.button`
  ${controlStyles}
  padding: 0;
  border: 0;
  border-bottom: 1px dotted rgba(127, 215, 255, 0.6);
  background: transparent;
  color: rgba(159, 228, 255, 0.94);
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #e6f8ff;
    border-bottom-color: rgba(159, 228, 255, 0.96);
  }

  &:focus-visible {
    outline: 1px solid rgba(127, 215, 255, 0.58);
    outline-offset: 3px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 0.28rem;
  max-height: 154px;
  overflow: auto;
  padding: 0.22rem;
  border: 1px solid rgba(127, 215, 255, 0.2);
  border-radius: 7px;
  background: var(--dw-surface-raised);

  @media (max-width: 760px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: 176px;
  }
`;

const Tile = styled.button`
  ${controlStyles}
  min-width: 0;
  min-height: 48px;
  padding: 0.38rem 0.42rem;
  overflow: hidden;
  border: 1px solid hsla(var(--batch-hue), 72%, 64%, ${({ $selected }) => ($selected ? '0.95' : '0.44')});
  border-radius: 5px;
  background: var(--dw-surface);
  box-shadow: none;
  color: #e6edf3;
  text-align: left;
  cursor: pointer;
  opacity: ${({ $archived }) => ($archived ? 0.66 : 1)};

  &:hover,
  &:focus-visible {
    border-color: hsla(var(--batch-hue), 86%, 72%, 0.96);
    background: var(--dw-surface);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }
`;

const TileName = styled.span`
  display: block;
  overflow: hidden;
  font-size: 0.7rem;
  font-weight: 780;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TileMeta = styled.span`
  display: block;
  margin-top: 0.28rem;
  color: hsla(var(--batch-hue), 82%, 80%, 0.86);
  font: 0.75rem/1 var(--dw-font-ui);
  letter-spacing: normal;
`;

function toTimestamp(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return 'Date unknown';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

function buildColoredOptions(options) {
  const timestamps = options.map((option) => toTimestamp(option.exportedAt)).filter(Boolean);
  const oldest = timestamps.length ? Math.min(...timestamps) : 0;
  const newest = timestamps.length ? Math.max(...timestamps) : 0;
  const span = Math.max(newest - oldest, 1);

  return options.map((option, index) => {
    const timestamp = toTimestamp(option.exportedAt);
    const position = timestamp ? (timestamp - oldest) / span : index / Math.max(options.length - 1, 1);
    return {
      ...option,
      hue: Math.round(270 - position * 258),
    };
  });
}

export default function AllItemsBatchGrid({
  options = [],
  selectedValue = '',
  disabled = false,
  onChange,
}) {
  const toastContext = useContext(ToastContext);
  const [newestFirst, setNewestFirst] = useState(true);
  const coloredOptions = useMemo(
    () => buildColoredOptions(Array.isArray(options) ? options : []),
    [options],
  );
  const orderedOptions = useMemo(
    () => (newestFirst ? [...coloredOptions].reverse() : coloredOptions),
    [coloredOptions, newestFirst],
  );

  return (
    <Wrap>
      <Label>
        <span>Source batches ·</span>
        <OrderToggle
          type="button"
          aria-label={`Sort source batches ${newestFirst ? 'oldest to newest' : 'newest to oldest'}`}
          title="Reverse batch date order"
          onClick={() => setNewestFirst((current) => !current)}
        >
          {newestFirst ? 'newest → oldest' : 'oldest → newest'}
        </OrderToggle>
      </Label>
      <Grid aria-label="Source batch grid">
        {orderedOptions.map((option) => {
          const selected = String(option.value) === String(selectedValue);
          const archived = option.archiveStatus === 'archived';
          return (
            <Tile
              key={option.value}
              type="button"
              style={{ '--batch-hue': option.hue }}
              $selected={selected}
              $archived={archived}
              aria-pressed={selected}
              disabled={disabled || option.selectableCount < 1}
              onClick={() => {
                onChange?.(option.value);
                toastContext?.showToast?.({
                  id: `all-items-batch:${option.value}`,
                  title: option.label,
                  message: `${formatDate(option.exportedAt)} · ${option.selectableCount}/${option.totalCount} active ${
                    option.totalCount === 1 ? 'item' : 'items'
                  }${archived ? ' · archived export' : ''}`,
                  variant: 'info',
                  timeoutMs: 3600,
                });
              }}
            >
              <TileName>{option.label}</TileName>
              <TileMeta>
                {formatDate(option.exportedAt)} · {option.selectableCount}/{option.totalCount}
              </TileMeta>
            </Tile>
          );
        })}
      </Grid>
    </Wrap>
  );
}
