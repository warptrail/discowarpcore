import styled from 'styled-components';
import { cabinetAccent } from '../../util/cabinetAccent';
const Badge = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--branch-color); font: 600 .75rem/1.4 var(--dw-font-ui);
  &::before { content: ''; display: inline-block; width: 5px; height: 5px; background: currentColor; }
`;
export default function SectionBadge({ compartmentKey }) {
  return <Badge style={cabinetAccent(compartmentKey)}>Section {compartmentKey?.[0]}</Badge>;
}
