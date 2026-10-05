import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { controlStyles } from '../styles/primitives';

import ItemsFlatList from './ItemsFlatList';
import { getBoxTheme, getBoxThemeCssVars } from '../util/inventoryColorTheme';

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
    <Unit $depth={railDepth} $root={root} style={getBoxThemeCssVars(getBoxTheme(id))}>
      <UnitHeader>
        <Disclosure type="button" onClick={() => isExpandable && setExpanded((current) => !current)} disabled={!isExpandable} aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}>
          {expanded ? '▾' : '▸'}
        </Disclosure>
        <HeaderCopy>
          <BoxTitle><BoxCode>#{id || '???'}</BoxCode> {label}</BoxTitle>
          <Location $missing={!String(node?.location ?? '').trim()}>
            {String(node?.location ?? '').trim() || 'Location not recorded'}
          </Location>
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
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.15rem 0.5rem;
  min-width: 0;
  padding: 0.45rem;
  border: 1px solid var(--dw-border-soft);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  font-family: var(--dw-font-ui);
`;
const Disclosure = styled.button`
  ${controlStyles}
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--box-primary, var(--dw-cyan));
`;
const HeaderCopy = styled.div`
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  display: grid;
  gap: 0.2rem;
`;
const BoxTitle = styled.div`
  overflow: hidden;
  color: var(--dw-text);
  font: 650 0.82rem/1.3 var(--dw-font-ui);
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const BoxCode = styled.span`
  font-family: var(--dw-font-data);
  color: var(--box-primary, var(--dw-cyan));
`;
const Location = styled.div`
  color: ${({ $missing }) => ($missing ? 'var(--dw-coral)' : 'var(--box-location, var(--dw-text-secondary))')};
  font: 500 0.75rem/1.35 var(--dw-font-ui);
  overflow-wrap: anywhere;
`;
const Counts = styled.span`
  grid-column: 2 / -1;
  grid-row: 2;
  color: var(--dw-text-secondary);
  font: 500 0.75rem/1.35 var(--dw-font-ui);
`;
const BoxLink = styled.a`
  grid-column: 3;
  grid-row: 1;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: 0.35rem;
  color: var(--dw-cyan);
  font: 600 0.75rem/1.25 var(--dw-font-ui);
  text-decoration: none;
  white-space: nowrap;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  &:hover { text-decoration: underline; }
`;
const UnitBody = styled.div`
  display: grid;
  gap: 0.42rem;
  padding: 0.38rem 0 0.1rem;
  min-width: 0;
`;
