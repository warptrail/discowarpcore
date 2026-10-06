import styled from 'styled-components';
import { LOCATION_MAP_TIERS } from './locationHierarchy';
import * as S from './Location.styles';

const Panel = styled(S.Panel)`padding: 0.65rem; gap: 0.6rem;`;
const Controls = styled.div`
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.5rem;
  @media (max-width: 700px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
const Breadcrumbs = styled.ol`
  display: flex; flex-wrap: wrap; gap: 0.35rem; list-style: none; padding: 0; margin: 0;
  color: var(--dw-text-secondary); font-size: 0.8rem;
  li { overflow-wrap: anywhere; }
  li + li::before { content: '›'; padding-right: 0.35rem; color: var(--dw-text-muted); }
`;
export default function LocationMapScope({ scope, options, pathCount, loading, busy, onChange, onReset, onRefresh }) {
  return (
    <Panel>
      <S.PanelHeader><h2>Map scope</h2><S.Actions>
        <S.Button onClick={onReset} disabled={!scope.room}>Show whole house</S.Button>
        <S.Button onClick={onRefresh} disabled={loading || busy}>{loading ? 'Loading…' : 'Refresh'}</S.Button>
      </S.Actions></S.PanelHeader>
      <Controls>{LOCATION_MAP_TIERS.map((tier, index) => (
        <S.Label key={tier.key} htmlFor={`location-${tier.key}-filter`}>{tier.label}
          <S.Select id={`location-${tier.key}-filter`} value={scope[tier.key]}
            disabled={loading || (index > 0 && !scope[LOCATION_MAP_TIERS[index - 1].key])}
            onChange={(event) => onChange(tier.key, event.target.value)}>
            <option value="">{index === 0 ? 'All rooms' : `All ${tier.label.toLowerCase()}`}</option>
            {options[tier.key].map((name) => <option key={name} value={name}>{name}</option>)}
          </S.Select>
        </S.Label>
      ))}</Controls>
      <Breadcrumbs aria-label="Current map scope"><li>House</li>
        {LOCATION_MAP_TIERS.filter((tier) => scope[tier.key]).map((tier) => <li key={tier.key}>{scope[tier.key]}</li>)}
      </Breadcrumbs>
      <S.Text>{pathCount} saved path{pathCount === 1 ? '' : 's'} in view · Follow a branch from room to exact placement.</S.Text>
    </Panel>
  );
}
