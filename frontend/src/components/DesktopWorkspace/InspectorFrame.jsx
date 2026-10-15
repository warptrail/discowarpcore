import styled from 'styled-components';

// The portal target remains mounted at every width, so breakpoint changes do
// not remount inspector contents or discard in-progress local state.
const InspectorFrame = styled.div`
  display: contents;
  @media (min-width: 1100px) {
    display: ${({ $open }) => $open ? 'block' : 'none'};
    position: sticky;
    top: calc(var(--dw-header-height, 100px) + 16px);
    align-self: start;
    width: 384px;
    min-width: 0;
  }
`;

export default InspectorFrame;
