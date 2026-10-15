import styled from 'styled-components';
import RetrievalRoomCarousel, { RetrievalRoomOptions } from '../Retrieval/RetrievalRoomCarousel';
import { getLocationMapScope, LOCATION_MAP_TIERS } from '../Location/locationHierarchy';
import LocationLayerStack from './LocationLayerStack';
import { selectLocationLayerScope } from './locationLayerModel';

const Tier = styled.div`
  min-width: 0;
  padding: ${({ $dense }) => $dense ? '.1rem .2rem' : '.3rem .2rem'};
  > span { color: var(--tier-color); font: 650 .75rem/1.2 var(--dw-font-ui); }
`;

function LocationSymbol() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10c0 5-6 11-6 11S6 15 6 10a6 6 0 1 1 12 0Z" />
    <circle cx="12" cy="10" r="2" />
  </svg>;
}

export default function LocationBranchFilter({ locations = [], value = 'all', onChange, selectedRooms, onRoomsChange, summary: customSummary, extraContent, hasSelection = false, extraRoomOptions = [], dense = false, stacked = false }) {
  const requested = typeof value === 'object' ? value : locations.find((entry) => String(entry._id) === value);
  const { scope, options } = getLocationMapScope(locations, requested || {});
  const selectTier = (field, keys) => {
    const next = selectLocationLayerScope(scope, field, keys[0]);
    onChange?.(next.room ? next : 'all');
  };
  const summary = LOCATION_MAP_TIERS.map(({ key }) => scope[key]).filter(Boolean).join(' · ');

  if (stacked) return <>
    <LocationLayerStack locations={locations} scope={scope} options={options}
      selectedRooms={selectedRooms} onRoomsChange={onRoomsChange} onTierChange={selectTier} extraRoomOptions={extraRoomOptions}
      summary={customSummary ?? (summary || 'All locations')}
      hasSelection={hasSelection || Boolean(scope.room) || Boolean(selectedRooms?.length)} onClear={() => onChange?.('all')} />
    {extraContent}
  </>;

  return (
    <RetrievalRoomCarousel label="Location" summary={customSummary ?? (summary || 'All locations')}
      accent="var(--dw-violet)" icon={<LocationSymbol />}
      selectedKeys={hasSelection ? ['selected'] : selectedRooms ?? (scope.room ? [scope.room] : [])}
      onChange={() => onChange?.('all')} defaultOpen compact dense={dense}>
      {LOCATION_MAP_TIERS.map((tier, index) => {
        if (index > 0 && (!scope[LOCATION_MAP_TIERS[index - 1].key] || !options[tier.key].length)) return null;
        return <Tier key={tier.key} $dense={dense} style={{ '--tier-color': tier.color }}>
          <span>{tier.label}</span>
          <RetrievalRoomOptions options={[
            ...(index === 0 ? extraRoomOptions : []),
            ...options[tier.key].map((name) => ({ key: name, label: name })),
          ]}
            selectedKeys={index === 0 && selectedRooms ? selectedRooms : scope[tier.key] ? [scope[tier.key]] : []}
            multiple={index === 0 && Boolean(onRoomsChange)}
            ariaLabel={`Filter by ${tier.label.toLowerCase()}`}
            onChange={(keys) => index === 0 && onRoomsChange ? onRoomsChange(keys) : selectTier(tier.key, keys)} />
        </Tier>;
      })}
      {extraContent}
    </RetrievalRoomCarousel>
  );
}
