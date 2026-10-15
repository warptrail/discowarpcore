import styled from 'styled-components';

const Row = styled.div`
  display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center;
  gap: 6px; min-width: 0; min-height: 54px; padding: 4px 8px 4px 4px;
`;
const Thumbnail = styled.span`
  display: grid; place-items: center; width: 44px; height: 44px; min-width: 0;
  > * { width: 32px; height: 32px; min-height: 32px; align-self: center; border-radius: 3px; overflow: hidden; }
  > button { width: 44px; height: 44px; min-height: 44px; background: transparent; }
  > button img { inset: 6px; width: 32px; height: 32px; transform: none; }
`;
const Location = styled.span`
  min-width: 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${({ $secondary }) => $secondary ? 1 : 2};
  overflow: hidden; overflow-wrap: anywhere; color: var(--box-location, var(--dw-text-secondary));
  font: 500 ${({ $secondary }) => $secondary ? '.625rem' : '.75rem'}/1.3 var(--dw-font-ui);
`;
const Copy = styled.div`min-width: 0; display: grid; gap: 2px;`;
const Name = styled.span`
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--dw-text);
  font: 650 .75rem/1.3 var(--dw-font-ui);
`;
const Number = styled.span`
  color: var(--box-primary, var(--dw-text-secondary)); white-space: nowrap;
  font: 750 1.25rem/1 var(--dw-font-data); min-width: 3ch; text-align: right;
`;

export default function RetrievalCompactSummary({ thumbnail, boxNumber, location, boxTitle, name, status }) {
  return <Row data-retrieval-small-card>
    <Thumbnail>{thumbnail}</Thumbnail>
    {name ? <Copy><Name title={name}>{name}</Name>{status}
      <Location $secondary title={`Location: ${location || 'Unknown'}`}>{location || 'Unknown'}</Location>
    </Copy> : <Location title={`Location: ${location || 'Unknown'}`}>{location || 'Unknown'}</Location>}
    <Number aria-label={boxNumber ? `Box ${boxNumber}` : 'No box assigned'} title={boxTitle}>{boxNumber || '—'}</Number>
  </Row>;
}
