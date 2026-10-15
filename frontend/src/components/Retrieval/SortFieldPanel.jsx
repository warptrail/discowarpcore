import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import * as S from './Retrieval.styles';
import BackdropLabel from '../InventoryFilters/PaintedControlLabel';

const SymbolButton = styled(S.SortFieldButton)`
  display: grid;
  place-items: center;
  min-width: 40px;
  min-height: 40px;
  svg { width: 19px; height: 19px; }
  @media (pointer: coarse) { min-width: 44px; min-height: 44px; }
`;
const Tooltip = styled.div`
  position: fixed;
  z-index: 1100;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  transform: translateX(-50%);
  max-width: calc(100vw - 16px);
  padding: .45rem .65rem;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  box-shadow: var(--dw-shadow);
  font: 500 .8rem/1.3 var(--dw-font-ui);
  pointer-events: none;
`;

export default function SortFieldPanel({ options = [], value, onChange, iconOnly = false, endControl = null, backdropLabel = null }) {
  const [tooltip, setTooltip] = useState(null);
  const tooltipId = useId();
  const panelRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const clearTimer = () => window.clearTimeout(dismissTimerRef.current);
  const hideTooltip = () => { clearTimer(); setTooltip(null); };
  const showTooltip = (button, option) => {
    clearTimer();
    const rect = button.getBoundingClientRect();
    setTooltip({
      key: option.key,
      label: option.label,
      left: Math.max(68, Math.min(window.innerWidth - 68, rect.left + rect.width / 2)),
      top: rect.bottom + 6,
    });
  };

  useEffect(() => {
    if (!iconOnly) return undefined;
    const hide = () => { window.clearTimeout(dismissTimerRef.current); setTooltip(null); };
    const outside = (event) => { if (!panelRef.current?.contains(event.target)) hide(); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.clearTimeout(dismissTimerRef.current);
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [iconOnly]);

  return <>
    <S.SortFieldButtons ref={panelRef} role="group" aria-label="Sort field" $count={options.length} $hasEndControl={Boolean(endControl)} $hasBackdrop={Boolean(backdropLabel)}>
      {backdropLabel && <BackdropLabel aria-hidden="true" $hasEndControl={Boolean(endControl)}>{backdropLabel}</BackdropLabel>}
      {options.map((option) => iconOnly ? (
        <SymbolButton key={option.key} type="button"
          aria-pressed={value === option.key} aria-label={`Sort by ${option.label}`}
          aria-describedby={tooltip?.key === option.key ? tooltipId : undefined}
          onPointerEnter={(event) => { if (event.pointerType !== 'touch') showTooltip(event.currentTarget, option); }}
          onPointerLeave={(event) => { if (event.pointerType !== 'touch') hideTooltip(); }}
          onPointerDown={(event) => { if (event.pointerType === 'touch') showTooltip(event.currentTarget, option); }}
          onPointerCancel={hideTooltip}
          onFocus={(event) => showTooltip(event.currentTarget, option)} onBlur={hideTooltip}
          onKeyDown={(event) => { if (event.key === 'Escape') hideTooltip(); }}
          onClick={(event) => {
            onChange?.(option.key);
            showTooltip(event.currentTarget, option);
            dismissTimerRef.current = window.setTimeout(() => setTooltip(null), 2000);
          }}>
          {option.icon}
        </SymbolButton>
      ) : (
        <S.SortFieldButton key={option.key} type="button" aria-pressed={value === option.key}
          aria-label={`Sort by ${option.label}`} title={option.label} onClick={() => onChange?.(option.key)}>
          {{ location: 'Location', box: 'Box ID', name: 'Name', tag: 'Tags' }[option.key] || option.label}
        </S.SortFieldButton>
      ))}
      {endControl}
    </S.SortFieldButtons>
    {iconOnly && tooltip && createPortal(
      <Tooltip id={tooltipId} role="tooltip" $left={tooltip.left} $top={tooltip.top}>{tooltip.label}</Tooltip>,
      document.body,
    )}
  </>;
}
