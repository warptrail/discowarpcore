import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getItemOwnershipContext } from '../util/itemOwnership';

const Details = styled.div`
  display: grid;
  gap: 0.24rem;
  min-width: 0;
  color: rgba(230, 244, 255, 0.86);
`;

const BoxLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.42rem;
  min-width: 0;
  font-size: 0.82rem;
  line-height: 1.2;
`;

const BoxChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0.12rem 0.44rem;
  border: 1px solid rgba(76, 198, 193, 0.48);
  border-radius: 999px;
  background: rgba(76, 198, 193, 0.12);
  color: #c5f4f1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
`;

const BoxName = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
  color: rgba(230, 244, 255, 0.92);
  font-weight: 650;
`;

const BoxNameLink = styled(Link)`
  min-width: 0;
  overflow-wrap: anywhere;
  color: #a9ebe6;
  font-weight: 650;
  text-decoration: none;

  &:hover {
    color: #d3fffb;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const LocationLine = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.36rem;
  min-width: 0;
  color: rgba(230, 244, 255, 0.72);
  font-size: 0.74rem;
  line-height: 1.2;
`;

const LocationLabel = styled.span`
  color: rgba(230, 244, 255, 0.5);
  font-size: 0.58rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export default function ItemPageConsoleDetails({ item }) {
  const ownership = getItemOwnershipContext(item);
  const boxId = ownership.boxId || '';
  const boxLabel =
    ownership.boxLabel || (boxId ? `Box ${boxId}` : 'No box assigned');
  const boxHref = boxId ? `/boxes/${encodeURIComponent(boxId)}` : '';
  const location = String(ownership.effectiveLocation || '').trim() || 'No location set';

  return (
    <Details aria-label="Item context">
      <BoxLine>
        {boxId ? <BoxChip>BOX {boxId}</BoxChip> : null}
        {boxHref ? <BoxNameLink to={boxHref}>{boxLabel}</BoxNameLink> : <BoxName>{boxLabel}</BoxName>}
      </BoxLine>
      <LocationLine>
        <LocationLabel>Location</LocationLabel>
        <span>{location}</span>
      </LocationLine>
    </Details>
  );
}
