import styled from 'styled-components';
import { getItemOwnershipContext } from '../util/itemOwnership';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../util/inventoryColorTheme';
import ItemPageBreadcrumb from './ItemPageBreadcrumb';

const Details = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.24rem 0.44rem;
  min-width: 0;
  color: rgba(230, 244, 255, 0.86);
`;

const ContextId = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--box-neon, #c5f4f1);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
`;

const LocationLine = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.26rem;
  min-width: 0;
  ${({ $stacked }) => $stacked && 'flex-basis: 100%;'}
  color: rgba(230, 244, 255, 0.72);
  font-size: 0.64rem;
  line-height: 1.2;
`;

const LocationLabel = styled.span`
  color: rgba(230, 244, 255, 0.5);
  font-size: 0.58rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const CompactItemName = styled.span`
  min-width: 0;
  overflow: hidden;
  color: rgba(238, 246, 252, 0.94);
  font-size: 0.7rem;
  font-weight: 720;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CompactSeparator = styled.span`
  color: rgba(185, 204, 219, 0.42);
  font-size: 0.62rem;
`;

export default function ItemPageConsoleDetails({
  item,
  compact = false,
}) {
  const ownership = getItemOwnershipContext(item);
  const boxId = ownership.boxId || '';
  const location = String(ownership.effectiveLocation || '').trim() || 'No location set';
  const themeStyle = getBoxThemeCssVars(getBoxTheme(boxId));

  const itemName = String(item?.name || 'Item').trim() || 'Item';

  if (compact) {
    return (
      <Details aria-label="Field editing context" style={themeStyle}>
        <CompactItemName title={itemName}>{itemName}</CompactItemName>
        <CompactSeparator aria-hidden="true">·</CompactSeparator>
        {boxId ? <ContextId>BOX {boxId}</ContextId> : <ContextId>UNBOXED</ContextId>}
        <CompactSeparator aria-hidden="true">·</CompactSeparator>
        <LocationLine>
          <span>{location}</span>
        </LocationLine>
      </Details>
    );
  }

  return (
    <Details aria-label="Item context" style={themeStyle}>
      <ItemPageBreadcrumb item={item} itemId={item?._id} compact />
      <LocationLine $stacked>
        <LocationLabel>Location</LocationLabel>
        <span>{location}</span>
      </LocationLine>
    </Details>
  );
}
