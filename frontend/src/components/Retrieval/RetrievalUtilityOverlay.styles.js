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
  background: rgba(3, 8, 13, 0.54);
  backdrop-filter: blur(5px);

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
  border-radius: 16px;
  background:
    radial-gradient(circle at 92% 0%, rgba(103, 239, 200, 0.1), transparent 32%),
    linear-gradient(180deg, rgba(18, 30, 42, 0.98), rgba(8, 14, 21, 0.98));
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.46);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: calc(100dvh - clamp(8.5rem, 21dvh, 11rem));
    padding: 0.5rem;
    border-radius: 12px;
  }
`;

export const PanelHint = styled.p`
  margin: 0 0 0.48rem;
  color: rgba(232, 238, 244, 0.58);
  font-size: 0.72rem;
  line-height: 1.35;
`;
