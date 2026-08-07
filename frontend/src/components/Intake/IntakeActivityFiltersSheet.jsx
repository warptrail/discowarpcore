import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const sheetEnter = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Layer = styled.div`
  position: fixed;
  z-index: 560;
  inset: 0;
  display: grid;
  align-items: end;
  justify-items: center;
  pointer-events: none;
`;

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.54);
  cursor: default;
  pointer-events: auto;
`;

const Sheet = styled.section`
  position: relative;
  z-index: 1;
  width: min(760px, calc(100vw - 1.25rem));
  max-height: min(76dvh, 680px);
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid rgba(102, 218, 211, 0.42);
  border-bottom: 0;
  border-radius: 9px 9px 0 0;
  background: #080e14;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 -18px 45px rgba(0, 0, 0, 0.42);
  pointer-events: auto;
  animation: ${sheetEnter} 220ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    max-height: 80dvh;
    border-radius: 9px 9px 0 0;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SheetHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.62rem 0.78rem;
  border-bottom: 1px solid rgba(94, 145, 162, 0.35);
  background: linear-gradient(100deg, rgba(72, 203, 198, 0.08), transparent 48%, rgba(167, 139, 250, 0.06));
`;

const SheetHeading = styled.div`
  min-width: 0;
`;

const SheetTitle = styled.h2`
  margin: 0;
  color: #e2f3f0;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SheetSummary = styled.p`
  margin: 0.12rem 0 0;
  color: #95b8bc;
  font-size: 0.7rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.28rem;
`;

const HeaderButton = styled.button`
  min-width: 40px;
  min-height: 40px;
  padding: 0.25rem 0.42rem;
  border: 0;
  background: transparent;
  color: #c4ddd9;
  font: inherit;
  font-size: ${({ $text }) => ($text ? '0.67rem' : '1rem')};
  font-weight: ${({ $text }) => ($text ? 800 : 500)};
  letter-spacing: ${({ $text }) => ($text ? '0.05em' : 'normal')};
  text-transform: ${({ $text }) => ($text ? 'uppercase' : 'none')};
  cursor: pointer;

  &:hover { color: #e4fffb; }

  &:focus-visible {
    outline: 2px solid #a78bfa;
    outline-offset: -2px;
  }
`;

const SheetBody = styled.div`
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.68rem 0.78rem 1rem;
  display: grid;
  align-content: start;
  gap: 0.75rem;
`;

const ToggleRow = styled.button`
  min-height: 44px;
  padding: 0.42rem 0;
  border: 0;
  border-bottom: 1px solid rgba(87, 129, 145, 0.34);
  background: transparent;
  color: ${({ $active }) => ($active ? '#d9fffa' : '#b8d1d2')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 720;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #a78bfa;
    outline-offset: 2px;
  }
`;

const ToggleState = styled.span`
  color: ${({ $active }) => ($active ? '#7be4db' : '#78949b')};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.68rem;
  white-space: nowrap;
`;

const SectionTitle = styled.div`
  color: #9dbcbf;
  font-size: 0.68rem;
  font-weight: 820;
  letter-spacing: 0.075em;
  text-transform: uppercase;
`;

const BatchGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const BatchChip = styled.button`
  min-height: 40px;
  max-width: 100%;
  padding: 0.35rem 0.52rem;
  border: 1px solid ${({ $active, $accentRgb }) =>
    $active ? `rgba(${$accentRgb}, 0.82)` : 'rgba(84, 122, 144, 0.5)'};
  border-radius: 7px;
  background: ${({ $active, $accentRgb }) =>
    $active ? `rgba(${$accentRgb}, 0.16)` : 'rgba(10, 18, 27, 0.8)'};
  color: ${({ $active, $accentRgb }) => ($active ? `rgb(${$accentRgb})` : '#b4c9dc')};
  display: inline-flex;
  align-items: baseline;
  gap: 0.32rem;
  font-size: 0.71rem;
  font-weight: 760;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #a78bfa;
    outline-offset: 2px;
  }
`;

const BatchLabel = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const BatchCount = styled.span`
  color: #87a0b8;
  font-size: 0.63rem;
  white-space: nowrap;
`;

function getSummary(selectedBatchIds, onlyOrphanedItems) {
  const selectedCount = Array.isArray(selectedBatchIds) ? selectedBatchIds.length : 0;
  const filters = [
    onlyOrphanedItems ? 'orphaned only' : '',
    selectedCount ? `${selectedCount} batch${selectedCount === 1 ? '' : 'es'}` : '',
  ].filter(Boolean);
  return filters.length ? filters.join(' · ') : 'All activity';
}

export default function IntakeActivityFiltersSheet({
  open,
  batchOptions = [],
  batchToneMap,
  selectedBatchIds = [],
  onlyOrphanedItems = false,
  onToggleBatch,
  onToggleOnlyOrphaned,
  onClearFilters,
  onClose,
}) {
  const closeButtonRef = useRef(null);
  const selectedBatchSet = new Set(
    (Array.isArray(selectedBatchIds) ? selectedBatchIds : [])
      .map((batchId) => String(batchId || '').trim())
      .filter(Boolean),
  );
  const filtersActive = selectedBatchSet.size > 0 || onlyOrphanedItems;

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <Layer>
      <Scrim aria-hidden="true" onClick={onClose} />
      <Sheet id="intake-activity-filters" role="dialog" aria-modal="true" aria-labelledby="intake-activity-filters-title">
        <SheetHeader>
          <SheetHeading>
            <SheetTitle id="intake-activity-filters-title">Activity filters</SheetTitle>
            <SheetSummary>{getSummary(selectedBatchIds, onlyOrphanedItems)}</SheetSummary>
          </SheetHeading>
          <HeaderActions>
            {filtersActive ? (
              <HeaderButton type="button" $text onClick={onClearFilters}>Clear</HeaderButton>
            ) : null}
            <HeaderButton ref={closeButtonRef} type="button" aria-label="Close activity filters" onClick={onClose}>×</HeaderButton>
          </HeaderActions>
        </SheetHeader>

        <SheetBody>
          <ToggleRow type="button" $active={onlyOrphanedItems} aria-pressed={onlyOrphanedItems} onClick={onToggleOnlyOrphaned}>
            Orphaned only
            <ToggleState $active={onlyOrphanedItems}>{onlyOrphanedItems ? 'On' : 'Off'}</ToggleState>
          </ToggleRow>

          <SectionTitle>Source batches</SectionTitle>
          <BatchGrid>
            {batchOptions.map((batch) => {
              const batchId = String(batch?.id || '').trim();
              const active = selectedBatchSet.has(batchId);
              const batchLabel = batch?.label || batchId;
              const countLabel = onlyOrphanedItems
                ? `${batch?.orphanedCount || 0}/${batch?.count || 0}`
                : batch?.count || 0;

              return (
                <BatchChip
                  key={batchId}
                  type="button"
                  $active={active}
                  $accentRgb={batchToneMap?.get(batchId) || '127, 215, 255'}
                  aria-pressed={active}
                  aria-label={`Toggle batch ${batchLabel}, ${countLabel} items`}
                  onClick={() => onToggleBatch?.(batchId)}
                >
                  <BatchLabel>{batchLabel}</BatchLabel>
                  <BatchCount>{countLabel}</BatchCount>
                </BatchChip>
              );
            })}
          </BatchGrid>
        </SheetBody>
      </Sheet>
    </Layer>
  );
}
