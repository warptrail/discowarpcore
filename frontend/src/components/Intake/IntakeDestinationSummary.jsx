import React from 'react';
import styled from 'styled-components';

const Summary = styled.section`
  display: grid;
  gap: 0.65rem;
  min-width: 0;
`;

const Identity = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.65rem;
  align-items: baseline;
  min-width: 0;
`;

const BoxCode = styled.div`
  color: var(--box-neon);
  font-family: 'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace,
    Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: clamp(1rem, 4vw, 1.2rem);
  font-weight: 850;
  letter-spacing: 0.075em;
  line-height: 1;
  text-shadow: 0 0 14px rgba(var(--box-primary-rgb), 0.28);
`;

const BoxName = styled.h2`
  min-width: 0;
  margin: 0;
  color: rgba(var(--box-neon-rgb), 0.98);
  font-size: clamp(1.1rem, 4.5vw, 1.45rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.06;
  overflow-wrap: anywhere;
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 0.8rem;
  margin: 0;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(var(--box-primary-rgb), 0.28);

  @media (min-width: 760px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Fact = styled.div`
  min-width: 0;
`;

const FactLabel = styled.dt`
  color: rgba(var(--box-secondary-rgb), 0.68);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const FactValue = styled.dd`
  overflow: hidden;
  margin: 0.1rem 0 0;
  color: rgba(var(--box-neon-rgb), 0.86);
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DetailLine = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

const DetailLabel = styled.div`
  color: rgba(var(--box-secondary-rgb), 0.68);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const Notes = styled.p`
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #c3d6d6;
  font-size: 0.77rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Path = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 0;
`;

const PathButton = styled.button`
  min-width: 0;
  border: 0;
  background: transparent;
  color: ${({ $current }) =>
    $current ? 'var(--box-neon)' : 'rgba(var(--box-primary-rgb), 0.82)'};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  font: inherit;
  font-size: 0.69rem;
  font-weight: ${({ $current }) => ($current ? 700 : 600)};
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { ${({ $clickable }) => ($clickable ? 'color: #effffc;' : '')} }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: 2px; }
`;

const PathDivider = styled.span`
  color: #638286;
  font-size: 0.7rem;
`;

const TagLine = styled.div`
  color: rgba(var(--box-primary-rgb), 0.78);
  font-family: 'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace,
    Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.68rem;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function makeFallbackStats(box) {
  const items = Array.isArray(box?.items) ? box.items : [];
  const directQuantity = items.reduce((sum, item) => {
    const quantity = Number(item?.quantity);
    return sum + (Number.isFinite(quantity) ? quantity : 1);
  }, 0);
  const childBoxes = Array.isArray(box?.childBoxes) ? box.childBoxes.length : 0;

  return {
    directUnique: items.length,
    directQuantity,
    descendantUnique: 0,
    descendantQuantity: 0,
    totalUnique: items.length,
    totalQuantity: directQuantity,
    directChildBoxes: childBoxes,
    descendantBoxes: childBoxes,
  };
}

export default function IntakeDestinationSummary({
  box,
  currentBoxInsight,
  selectedBoxId = '',
  onSelectBox,
}) {
  if (!box?._id) return null;

  const locationName =
    box?.locationId?.name || box?.location?.name || box?.locationName || box?.location || '';
  const groupName = String(box?.group || '').trim();
  const notes = String(box?.notes || '').trim();
  const tags = Array.isArray(box?.tags) ? box.tags.filter(Boolean) : [];
  const stats = currentBoxInsight?.stats || makeFallbackStats(box);
  const breadcrumb = currentBoxInsight?.breadcrumb?.length
    ? currentBoxInsight.breadcrumb
    : [{ id: String(box._id), boxId: String(box?.box_id || ''), label: box?.label || 'Unnamed box' }];

  const facts = [
    locationName ? { label: 'Location', value: locationName } : null,
    groupName ? { label: 'Group', value: groupName } : null,
    { label: 'Direct items', value: `${stats.directUnique} · qty ${stats.directQuantity}` },
    stats.descendantBoxes > 0
      ? { label: 'Nested boxes', value: `${stats.descendantBoxes} total` }
      : null,
  ].filter(Boolean);

  return (
    <Summary>
      <Identity>
        <BoxCode>#{box?.box_id || '---'}</BoxCode>
        <BoxName>{box?.label || 'Unnamed box'}</BoxName>
      </Identity>

      <Facts>
        {facts.map((fact) => (
          <Fact key={fact.label}>
            <FactLabel>{fact.label}</FactLabel>
            <FactValue title={fact.value}>{fact.value}</FactValue>
          </Fact>
        ))}
      </Facts>

      {breadcrumb.length > 1 ? (
        <DetailLine>
          <DetailLabel>Path</DetailLabel>
          <Path>
            {breadcrumb.map((segment, index) => {
              const segmentId = String(segment?.id || '');
              const current = segmentId === String(selectedBoxId || '');
              const clickable = Boolean(segmentId) && !current;
              const label = segment?.label || (segment?.boxId ? `#${segment.boxId}` : 'Box');
              return (
                <React.Fragment key={`${segmentId || label}-${index}`}>
                  <PathButton
                    type="button"
                    $current={current}
                    $clickable={clickable}
                    disabled={!clickable}
                    onClick={() => clickable && onSelectBox?.(segmentId)}
                    title={segment?.boxId ? `${label} #${segment.boxId}` : label}
                  >
                    {segment?.boxId ? `#${segment.boxId} ${label}` : label}
                  </PathButton>
                  {index < breadcrumb.length - 1 ? <PathDivider>›</PathDivider> : null}
                </React.Fragment>
              );
            })}
          </Path>
        </DetailLine>
      ) : null}

      {notes ? (
        <DetailLine>
          <DetailLabel>Box notes</DetailLabel>
          <Notes>{notes}</Notes>
        </DetailLine>
      ) : null}

      {tags.length ? <TagLine>{tags.slice(0, 8).map((tag) => `#${tag}`).join(' ')}</TagLine> : null}
    </Summary>
  );
}
