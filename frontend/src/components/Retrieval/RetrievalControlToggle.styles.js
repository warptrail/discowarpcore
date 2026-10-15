import styled from 'styled-components';
import { ViewModeToggle, ViewModeButton } from '../../styles/InventoryGridHeader.styles';

export const ControlToggleGroup = styled(ViewModeToggle)`
  grid-template-columns: repeat(${({ $columns = 2 }) => $columns}, auto);
`;
export const ControlToggleButton = styled(ViewModeButton)`
  width: auto; min-width: 44px; min-height: 44px; gap: 6px; padding-inline: 10px;
  &:not(:last-child) { border-right: 1px solid var(--dw-border); }
  @media (min-width: 1100px) and (max-width: 1279px) {
    &:has(svg) { width: 44px; padding-inline: 0; }
    svg + span { display: none; }
  }
`;
