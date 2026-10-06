import styled from 'styled-components';
import { LOCATION_MAP_TIERS, countLocationTiers } from './locationHierarchy';

const Legend = styled.ul`
  display: flex; flex-wrap: wrap; gap: 0.4rem 0.9rem; margin: 0; padding: 0; list-style: none;
  li { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--dw-text-secondary); }
  span { width: 8px; height: 8px; background: var(--tier-color); border-radius: 2px; }
  b { font-weight: 500; color: var(--dw-text); }
`;
export default function LocationMapLegend({ locations }) {
  const counts = countLocationTiers(locations);
  return <Legend aria-label="Map legend and tier counts">{LOCATION_MAP_TIERS.map((tier, index) => (
    <li key={tier.key} style={{ '--tier-color': tier.color }}><span aria-hidden="true" />
      {index + 1}. {tier.label} <b>{counts[tier.key]}</b>
    </li>
  ))}</Legend>;
}
