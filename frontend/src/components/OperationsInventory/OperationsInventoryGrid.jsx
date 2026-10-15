import styled from 'styled-components';
import { desktopCardLayout } from './OperationsCardLayout.styles';
import { styledComponents as S } from '../../styles/BoxList.styles';

export const OperationsWorkspace = styled.div`
  display: contents;
  @media (min-width: 1100px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 384px;
    align-items: start;
    gap: 16px;
    min-width: 0;
  }
`;

const OperationsInventoryGrid = styled.div`
  display: contents;
  @media (min-width: 1100px) {
    display: ${({ $cards }) => $cards ? 'grid' : 'flex'};
    flex-direction: column;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: 12px;
    align-items: start;
    min-width: 0;
    > ${S.NodeSection} { margin-top: 0; }
    > ${S.PaginationBar}, > ${S.EmptyMessage} { grid-column: 1 / -1; }
    ${({ $cards }) => $cards && desktopCardLayout}
  }
`;

export default OperationsInventoryGrid;
