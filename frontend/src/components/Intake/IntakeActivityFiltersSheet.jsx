import { consoleControlStyles } from './IntakeConsole.styles';
import CaptureGlyph from './CaptureGlyph';
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
  background: var(--dw-surface-raised);
  cursor: default;
  pointer-events: auto;

  background: rgba(3, 8, 14, 0.72);
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
  border: 1px solid var(--dw-border);
  border-bottom: 0;
  border-radius: 9px 9px 0 0;
  background: var(--dw-background);
  box-shadow: none;
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
  border-bottom: 1px solid var(--dw-border);
  background: var(--dw-surface);
`;

const SheetHeading = styled.div`
  min-width: 0;
`;

const SheetTitle = styled.h2`
  margin: 0;
  color: #e2f3f0;
  font-size: 0.82rem;
  letter-spacing: 0.01em;
  text-transform: none;
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
  ${consoleControlStyles}
  font-size: .75rem;
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
  ${consoleControlStyles}
  justify-content: space-between;
  border-bottom: 1px solid var(--dw-border-soft);
  font-size: .8rem;
  text-align: left;
  &[aria-pressed='true'] {
    color: var(--dw-cyan);
    box-shadow: inset 0 -1px var(--dw-cyan);
  }
`;

const ToggleState = styled.span`
  color: ${({ $active }) => ($active ? '#7be4db' : '#78949b')};
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  white-space: nowrap;
`;

const SectionTitle = styled.div`
  color: var(--dw-text-muted);
  font-size: .75rem;
  font-weight: 400;
`;

const BatchGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const BatchChip = styled.button`
  ${consoleControlStyles}
  max-width: 100%;
  font-size: .75rem;
  color: ${({ $active, $accentRgb }) => $active ? `rgb(${$accentRgb})` : 'var(--dw-text-secondary)'};
  &[aria-pressed='true'] {
    box-shadow: inset 0 -1px currentColor;
  }
`;

const BatchLabel = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const BatchCount = styled.span`
  color: #87a0b8;
  font-size: 0.75rem;
  white-space: nowrap;
`;

function getSummary(selectedBatchIds, onlyOrphanedItems) {
  const selectedCount = Array.isArray(selectedBatchIds) ? selectedBatchIds.length : 0;
  const filters = [
    onlyOrphanedItems ? 'orphaned only' : '',
    selectedCount ? `${selectedCount} batch${selectedCount === 1 ? '' : 'es'}` : '',
  ].filter(Boolean);
  return filters.length ? filters.join(' · ') : 'All inventory';
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
  const sheetRef = useRef(null);
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
      if (event.key !== 'Tab') return;
      const controls = Array.from(sheetRef.current?.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
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
      <Sheet ref={sheetRef} id="intake-activity-filters" role="dialog" aria-modal="true" aria-labelledby="intake-activity-filters-title">
        <SheetHeader>
          <SheetHeading>
            <SheetTitle id="intake-activity-filters-title">Inventory scope</SheetTitle>
            <SheetSummary>{getSummary(selectedBatchIds, onlyOrphanedItems)}</SheetSummary>
          </SheetHeading>
          <HeaderActions>
            {filtersActive ? (
              <HeaderButton type="button" $text onClick={onClearFilters}>Clear</HeaderButton>
            ) : null}
            <HeaderButton ref={closeButtonRef} type="button" aria-label="Close activity filters" onClick={onClose}><CaptureGlyph kind="cancel" /></HeaderButton>
          </HeaderActions>
        </SheetHeader>

        <SheetBody>
          <ToggleRow type="button" $active={onlyOrphanedItems} aria-pressed={onlyOrphanedItems} onClick={onToggleOnlyOrphaned}>
            Items Adrift only
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
