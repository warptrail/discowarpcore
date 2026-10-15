import styled from 'styled-components';

const MoreFilters = styled.details`
  min-width: 0;
  border-top: 1px solid var(--dw-border-soft);
  > summary {
    min-height: 40px;
    padding: 0 .1rem;
    color: var(--dw-text-secondary);
    font: 650 .8rem/40px var(--dw-font-ui);
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  > summary:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media (pointer: coarse) { > summary { min-height: 44px; line-height: 44px; } }
`;

export default MoreFilters;
