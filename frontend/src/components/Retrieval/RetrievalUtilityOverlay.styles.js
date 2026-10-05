import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 150;
  display: ${({ $open }) => ($open ? 'grid' : 'none')};
  align-items: start;
  justify-items: center;
  padding: clamp(8.8rem, 21dvh, 12.5rem) 0.7rem 0.7rem;
  background: var(--dw-surface);
  backdrop-filter: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: clamp(8rem, 20dvh, 10.5rem) 0.45rem 0.45rem;
  }
`;

export const UtilityPanel = styled.section`
  width: min(100%, 960px);
  max-height: calc(100dvh - clamp(9.5rem, 22dvh, 13.2rem));
  overflow: auto;
  padding: 0.7rem;
  border: 1px solid rgba(119, 213, 255, 0.34);
  border-radius: var(--dw-radius);
  background:
    var(--dw-surface);
  box-shadow: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: calc(100dvh - clamp(8.5rem, 21dvh, 11rem));
    padding: 0.5rem;
    border-radius: var(--dw-radius);
  }
  border-color: var(--dw-border);
  border-left: 4px solid var(--dw-amber);
  box-shadow: var(--dw-shadow);
`;

export const PanelHint = styled.p`
  margin: 0 0 0.48rem;
  color: rgba(232, 238, 244, 0.58);
  font-size: 0.75rem;
  line-height: 1.35;
`;
