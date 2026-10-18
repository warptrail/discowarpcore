import { cabinetAccent } from '../../util/cabinetAccent';
import useCompartmentConnectors from './useCompartmentConnectors';
import { useEffect, useRef } from 'react';
import { getCompartments, getLeafCompartments, getItemCompartment, compartmentContains, compartmentAddress } from '../../util/boxCompartments';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import * as M from './CompartmentMap.styles';


function BranchIcon({ shelves = false }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d={shelves ? 'M4 4h16v16H4zM4 9h16M4 15h16' : 'M4 4h16v16H4zM12 4v16M9 11v2m6-2v2'} />
  </svg>;
}

function NodeContents({ box, row, selected, count, childCount, shelf }) {
  return <>
    <M.NodeIdentity>
      {shelf ? <M.ShelfMark aria-hidden="true">{row.key.slice(1)}</M.ShelfMark> : <M.CabinetMark aria-hidden="true">{row.key}</M.CabinetMark>}
      <M.NodeText>
        <M.Address>#{compartmentAddress(box, row.key)}</M.Address>
        <M.NodeName>{row.label || (shelf ? `Shelf ${row.key.slice(1)}` : `Compartment ${row.key}`)}</M.NodeName>
      </M.NodeText>
    </M.NodeIdentity>
    <M.NodeFacts>
      <M.Count>{count} {count === 1 ? 'item' : 'items'}{childCount ? ` · ${childCount} ${childCount === 1 ? 'box' : 'boxes'}` : ''}</M.Count>
      {selected ? <M.Selected><span aria-hidden="true">✓</span> Selected</M.Selected> : null}
    </M.NodeFacts>
  </>;
}

export default function CompartmentMap({ box, selectedKey, onSelect, items, children, fullscreen, onToggleFullscreen }) {
  const viewportRef = useRef(null);
  const compartments = getCompartments(box);
  const { branchesRef, connections } = useCompartmentConnectors(compartments);
  useEffect(() => {
    const viewport = viewportRef.current;
    const revealSelection = () => {
      const selected = viewport?.querySelector('button[aria-pressed="true"]');
      if (!selected || viewport.scrollHeight <= viewport.clientHeight) return;
      const bounds = viewport.getBoundingClientRect();
      const node = selected.getBoundingClientRect();
      if (node.top < bounds.top + 8 || node.bottom > bounds.bottom - 8) {
        viewport.scrollTop += node.top - bounds.top - viewport.clientHeight / 2 + node.height / 2;
      }
    };
    revealSelection();
    const observer = new ResizeObserver(revealSelection);
    if (viewport) observer.observe(viewport);
    return () => observer.disconnect();
  }, [selectedKey, box.box_id]);
  const childPlacement = (child) => child.parentCompartmentKey || box.childBoxCompartments?.[child._id] || '';
  const counts = (key) => ({
    count: items.filter((item) => compartmentContains(key, getItemCompartment(box, item))).length,
    childCount: children.filter((child) => compartmentContains(key, childPlacement(child))).length,
  });
  return <M.Map style={getBoxThemeCssVars(getBoxTheme(box.box_id))}>
    <M.RootHeader>
      <M.Root type="button" aria-label={`Browse all compartments in box ${box.box_id}`} aria-pressed={!selectedKey} onClick={() => onSelect('')}>
        <M.RootIcon><BranchIcon shelves /></M.RootIcon>
        <M.NodeText><M.RootAddress>#{box.box_id}</M.RootAddress><M.NodeName>All compartments</M.NodeName></M.NodeText>
        {!selectedKey ? <M.Selected><span aria-hidden="true">✓</span> Selected</M.Selected> : null}
      </M.Root>
      <M.HeaderFacts><M.Count>{getLeafCompartments(box).length} storage spaces · {compartments.length} sections</M.Count><M.Count>{items.length} direct items · {children.length} boxes</M.Count></M.HeaderFacts>
      <M.FullscreenButton type="button" aria-label={fullscreen ? 'Exit compartment fullscreen' : 'Expand compartments to fullscreen'} aria-pressed={fullscreen} onClick={onToggleFullscreen} title={fullscreen ? 'Exit fullscreen (Escape)' : 'Fullscreen compartment atlas'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={fullscreen ? 'M3 9h6V3m6 0v6h6M3 15h6v6m6 0v-6h6' : 'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'} /></svg>
        <span>{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
      </M.FullscreenButton>
    </M.RootHeader>
    <M.Viewport ref={viewportRef} role="region" aria-label={`Compartment map for box ${box.box_id}`} tabIndex={0}>
      <M.Branches ref={branchesRef} aria-label="Cabinet branches">
        <M.Connections aria-hidden="true" focusable="false">
          <path data-root-connector d={connections.trunk} />
          {connections.stems.map((stem) => <path key={stem.key} data-cabinet-connector={stem.key} d={stem.path} style={{ stroke: stem.color }} />)}
        </M.Connections>
        {compartments.map((row) => {
          const branchSelected = selectedKey && compartmentContains(row.key, selectedKey);
          return <M.Branch key={row.key} data-compartment-branch={row.key} style={cabinetAccent(row.key)} $active={!!branchSelected} aria-label={`${row.label || `Compartment ${row.key}`} branch`}>
            <M.CabinetButton type="button" aria-label={`Browse ${compartmentAddress(box, row.key)}: ${row.label || `Compartment ${row.key}`}`} aria-pressed={selectedKey === row.key} onClick={() => onSelect(row.key)}>
              <NodeContents box={box} row={row} selected={selectedKey === row.key} {...counts(row.key)} />
            </M.CabinetButton>
            {row.children?.length ? <>
              <M.BranchCaption><BranchIcon shelves />{row.children.length} shelves{branchSelected && selectedKey !== row.key ? <span>Contains selection</span> : null}</M.BranchCaption>
              <M.Shelves aria-label={`Shelves in ${row.label || row.key}`}>
                {row.children.map((shelf) => <M.Shelf key={shelf.key}>
                  <M.ShelfButton type="button" aria-label={`Browse ${compartmentAddress(box, shelf.key)}: ${shelf.label || `Shelf ${shelf.key.slice(1)}`}`} aria-pressed={selectedKey === shelf.key} onClick={() => onSelect(shelf.key)}>
                    <NodeContents box={box} row={shelf} shelf selected={selectedKey === shelf.key} {...counts(shelf.key)} />
                  </M.ShelfButton>
                </M.Shelf>)}
              </M.Shelves>
            </> : <M.SingleSpace><BranchIcon />Single storage space</M.SingleSpace>}
          </M.Branch>;
        })}
      </M.Branches>
    </M.Viewport>
    <M.Legend><span><i aria-hidden="true" />One color per cabinet; shelves share its branch.</span><span>Box → compartment → shelf</span></M.Legend>
  </M.Map>;
}
