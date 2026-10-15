import styled from 'styled-components';
import { LOCATION_MAP_TIERS } from './locationHierarchy';
import * as S from './Location.styles';

const Panel = styled(S.Panel)`padding: 12px; gap: 12px; border: 0; border-bottom: 1px solid var(--dw-border-soft); border-radius: 0;`;
const Header = styled(S.PanelHeader)`flex-wrap: wrap;`;
const Controls = styled.div`
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.5rem;
  @media (max-width: 700px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
export default function LocationMapScope({ scope, options, pathCount, loading, busy, onChange, onReset, onRefresh }) {
  return (
    <Panel>
      <Header><h2>Map scope</h2><S.Actions>
        <S.Button onClick={onReset} disabled={!scope.room}>Show whole house</S.Button>
        <S.Button onClick={onRefresh} disabled={loading || busy}>{loading ? 'Loading…' : 'Refresh'}</S.Button>
      </S.Actions></Header>
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
      <S.Text>{pathCount} saved path{pathCount === 1 ? '' : 's'} in view</S.Text>
    </Panel>
  );
}
