import styled from 'styled-components';

export const CardIdentity = styled.div`
  display: contents;
  @media (min-width: 1100px) {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }
`;
const Indicator = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 0 0 auto;
  height: 24px;
  padding: 0 3px;
  border: 0;
  border-radius: var(--dw-radius-sm);
  background: transparent;
  color: var(--box-primary);
  font: 400 .7rem/1 var(--dw-font-ui);
  opacity: .7;
  cursor: pointer;
  &:hover, &[aria-expanded='true'] { opacity: 1; background: rgba(var(--box-primary-rgb), .1); }
  &:focus-visible { opacity: 1; outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export default function OperationsBranchIndicator({ box, count, controls }) {
  return <Indicator id={controls.toggleId} type="button" data-nested-box-toggle
    aria-label={`${controls.expanded ? 'Close' : 'Open'} nested box tree for ${box.box_id}`}
    aria-expanded={controls.expanded} aria-controls={controls.trayId}
    title={`${count} ${count === 1 ? 'box' : 'boxes'} inside · Inspect containment`}
    onClick={event => { event.stopPropagation(); controls.onToggle(); }}>
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 3v8h5M4 7h5" stroke="currentColor" strokeWidth="1" />
      <rect x="2" y="1" width="4" height="3" rx=".5" stroke="currentColor" />
      <rect x="9" y="5.5" width="4" height="3" rx=".5" stroke="currentColor" />
      <rect x="9" y="10" width="4" height="3" rx=".5" stroke="currentColor" />
    </svg>
    <span>{count} inside</span>
  </Indicator>;
}
