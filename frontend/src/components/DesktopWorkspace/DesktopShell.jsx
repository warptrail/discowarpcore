import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const DesktopShell = styled.div`
  max-width: ${({ $retrievalPage, $itemPage }) => (
    $retrievalPage ? '1280px' : $itemPage ? '1440px' : '1024px'
  )};
  margin: 0 auto;
  padding: ${({ $retrievalPage }) =>
    $retrievalPage ? 'clamp(0.75rem, 2vw, 1.25rem)' : 'clamp(0.75rem, 2vw, 1.5rem)'};
  font-family: var(--dw-font-ui);
  min-height: 100dvh;
  min-width: 0;

  @media (min-width: 980px) {
    ${({ $retrievalPage }) => $retrievalPage && `
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.38rem;
      height: 100dvh;
      overflow: hidden;
      padding-block: 0.38rem 0.5rem;
    `}
  }

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) and (max-width: 899px) {
    padding: 0.75rem;
  }

  @media (min-width: 1100px) {
    max-width: none;
    width: 100%;
    margin: 0;
    padding: 16px 16px 16px 208px;
    gap: 12px;
  }
  @media (min-width: 1600px) { padding: 24px 24px 24px 216px; }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: 100%;
    padding: 0;
  }
`;

export default DesktopShell;
