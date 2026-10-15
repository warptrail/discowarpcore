import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { APP_VISUAL_THEME } from '../../styles/tokens';
import { BOX_CARD_FIELDS } from '../OperationsQuickPeek/operationsBoxFields';

const Fields = styled.div`
  display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
  height: 40px; min-width: 0; padding: 0 6px; box-sizing: border-box;
  border-top: 1px solid rgba(var(--box-primary-rgb), .12);
  @media (pointer: coarse) { overflow-x: auto; grid-template-columns: repeat(7, 44px); }
`;
const Field = styled.button`
  display: grid; place-items: center; width: 100%; min-width: 0; height: 40px;
  padding: 0; border: 0; border-radius: 3px; cursor: pointer;
  background: transparent; color: var(--box-primary); opacity: .8;
  &:hover { opacity: 1; background: rgba(var(--box-primary-rgb), .12); }
  &:focus-visible { opacity: 1; outline: 2px solid var(--dw-cyan); outline-offset: -3px; }
  @media (pointer: coarse) { min-width: 44px; }
`;
const Tooltip = styled.div`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  z-index: 180;
  width: 140px;
  box-sizing: border-box;
  padding: 7px 10px;
  border: 1px solid ${APP_VISUAL_THEME.border};
  border-radius: 4px;
  background: ${APP_VISUAL_THEME.surfaceRaised};
  color: ${APP_VISUAL_THEME.text};
  font-size: 0.78rem;
  line-height: 20px;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .25);
`;
export default function OperationsCardFields({ box, onEdit }) {
  const [tooltip, setTooltip] = useState(null);
  const tooltipId = useId();
  const showTooltip = (event, key, label) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ key, label: `Edit ${label}`,
      left: Math.max(8, Math.min(rect.left + rect.width / 2 - 70, window.innerWidth - 148)),
      top: rect.bottom + 42 < window.innerHeight ? rect.bottom + 6 : rect.top - 42 });
  };
  useEffect(() => {
    if (!tooltip) return undefined;
    const hide = () => setTooltip(null);
    const onKey = (event) => { if (event.key === 'Escape') hide(); };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('keydown', onKey);
    };
  }, [tooltip]);
  return <Fields role="group" aria-label={`Edit box ${box.box_id} fields`}>
    {BOX_CARD_FIELDS.map(({ key, label, path }) => <Field key={key} type="button"
      data-box-field={key} data-box-field-owner={String(box._id)}
      aria-label={`Edit box ${box.box_id} ${label}`}
      aria-describedby={tooltip?.key === key ? tooltipId : undefined}
      onMouseEnter={(event) => showTooltip(event, key, label)}
      onMouseLeave={() => setTooltip(null)}
      onFocus={(event) => showTooltip(event, key, label)}
      onBlur={() => setTooltip(null)}
      onClick={(event) => { event.stopPropagation(); setTooltip(null); onEdit(box, key, event.currentTarget); }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
    </Field>)}
    {tooltip && createPortal(<Tooltip id={tooltipId} role="tooltip" $top={tooltip.top} $left={tooltip.left}>{tooltip.label}</Tooltip>, document.body)}
  </Fields>;
}
