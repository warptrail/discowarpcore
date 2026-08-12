import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import ItemsFlatList from './ItemsFlatList';

function boxId(node) { return String(node?.box_id ?? node?.shortId ?? '').trim(); }
function countDescendants(node) {
  return (node?.childBoxes || []).reduce((total, child) => total + (child?.items?.length || 0) + countDescendants(child), 0);
}

export default function BoxTreeUnit({ node, root = false, depth = 0, autoExpand = false, openItemId, onOpenItem, ...itemListProps }) {
  const [expanded, setExpanded] = useState(root);
  const manualExpansion = useRef(expanded);
  const isExpandable = (node?.items?.length || 0) + (node?.childBoxes?.length || 0) > 0;
  useEffect(() => {
    if (autoExpand) { manualExpansion.current = expanded; setExpanded(true); }
    else setExpanded(manualExpansion.current);
  // Deliberately restore the pre-search disclosure state only when search changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpand]);
  const directItems = node?.items || [];
  const childBoxes = node?.childBoxes || [];
  const descendants = useMemo(() => countDescendants(node), [node]);
  const label = node?.label || node?.name || 'Unnamed box';
  const id = boxId(node);
  const railDepth = Math.min(depth, 3);

  return (
    <Unit $depth={railDepth} $root={root}>
      <UnitHeader>
        <Disclosure type="button" onClick={() => isExpandable && setExpanded((current) => !current)} disabled={!isExpandable} aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}>
          {expanded ? '▾' : '▸'}
        </Disclosure>
        <HeaderCopy>
          <BoxTitle>#{id || '???'} {label}</BoxTitle>
          {node?.location ? <Location>{node.location}</Location> : null}
        </HeaderCopy>
        <Counts>{directItems.length} direct · {descendants} nested</Counts>
        {!root && id ? <BoxLink href={`/boxes/${encodeURIComponent(id)}`}>Open ↗</BoxLink> : null}
      </UnitHeader>
      {expanded ? (
        <UnitBody>
          {directItems.length ? <ItemsFlatList items={directItems} openItemId={openItemId} onOpenItem={onOpenItem} showHeader={false} {...itemListProps} /> : null}
          {childBoxes.map((child, index) => <BoxTreeUnit key={String(child?._id || boxId(child) || `child-${index}`)} node={child} depth={depth + 1} autoExpand={autoExpand} openItemId={openItemId} onOpenItem={onOpenItem} {...itemListProps} />)}
        </UnitBody>
      ) : null}
    </Unit>
  );
}

const Unit = styled.section`
  position: relative; min-width: 0; margin: ${({ $root }) => ($root ? '0' : '0.5rem 0 0 0.62rem')};
  padding-left: ${({ $root }) => ($root ? '0' : '0.58rem')};
  border-left: ${({ $root }) => ($root ? '0' : '2px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.26)')};
`;
const UnitHeader = styled.header`
  display: flex; align-items: center; gap: 0.42rem; min-width: 0; padding: 0.42rem 0.5rem;
  border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.28); border-radius: 9px;
  background: linear-gradient(90deg, rgba(var(--box-primary-rgb, 76, 198, 193), 0.12), rgba(14, 19, 29, 0.65));
`;
const Disclosure = styled.button`
  width: 25px; height: 25px; flex: 0 0 auto; border: 0; border-radius: 5px; background: rgba(8, 15, 23, 0.68); color: rgba(192, 229, 235, 0.9); cursor: pointer;
  &:disabled { opacity: 0.35; cursor: default; }
`;
const HeaderCopy = styled.div`min-width: 0; display: grid; gap: 0.14rem;`;
const BoxTitle = styled.div`overflow: hidden; color: rgba(228, 241, 244, 0.94); font: 800 0.72rem/1.1 ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap;`;
const Location = styled.div`color: var(--box-location, #7fd7ff); font: 820 0.68rem/1.1 ui-monospace, SFMono-Regular, Menlo, monospace; text-shadow: 0 0 8px rgba(var(--box-location-rgb, 127, 215, 255), 0.24); text-transform: uppercase;`;
const Counts = styled.span`margin-left: auto; color: rgba(190, 207, 222, 0.62); font: 700 0.54rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap;`;
const BoxLink = styled.a`color: rgba(173, 209, 255, 0.84); font: 700 0.54rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; text-decoration: none; white-space: nowrap;`;
const UnitBody = styled.div`display: grid; gap: 0.42rem; padding: 0.38rem 0 0.1rem; min-width: 0;`;
