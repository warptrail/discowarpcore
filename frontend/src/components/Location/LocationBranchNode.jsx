import LocationOptionIcon from '../InventoryFilters/LocationOptionIcon';
import LocationBranchInlineEditor from './LocationBranchInlineEditor';
import { LOCATION_MAP_TIERS } from './locationHierarchy';
import { branchControlId, branchLocations } from './locationBranchEditing';
import * as A from './LocationAtlas.styles';
import * as C from './LocationBranchControls.styles';

export default function LocationBranchNode({ node, locations, allLocations = locations, editor, openMenu, onMenu, onDelete, onEditPath, onFocusRoom, disabled }) {
  const tier = LOCATION_MAP_TIERS.find(tier => tier.key === node.tier);
  const childTier = LOCATION_MAP_TIERS[node.path.length];
  const room = node.tier === 'room';
  const active = editor?.editing?.node.key === node.key;
  const locked = disabled || Boolean(editor?.editing);
  const editLocked = locked || !editor;
  const menuOpen = openMenu === node.key;
  const records = branchLocations(allLocations, node);
  const begin = mode => { onMenu(null); editor.begin(node, mode, locations); };
  const focusLabel = () => document.getElementById(branchControlId(node.path))?.focus({ preventScroll: true });
  const content = <>
    {room ? <A.RoomHeading data-location-actions-open={menuOpen || undefined}>
      <LocationOptionIcon tier={node.tier} label={node.label} />
      <C.NodeText><h3 aria-label={node.label}><C.Label id={branchControlId(node.path)} type="button" disabled={editLocked} onClick={() => begin('rename')} aria-label={`Rename room ${node.label}`} title="Rename room">
        <span>{node.label}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z" /></svg>
      </C.Label></h3><small>{node.pathCount} saved path{node.pathCount === 1 ? '' : 's'}</small></C.NodeText>
      <A.ToolButton type="button" disabled={locked} aria-label={`Focus ${node.label} branch`} title={`Focus ${node.label}`} onClick={() => onFocusRoom?.(node.label)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M8 12h8M12 8v8" /></svg>
      </A.ToolButton>
      <C.Command type="button" disabled={editLocked} aria-label={`Actions for ${node.path.join(' · ')}`} title="Location actions" aria-expanded={menuOpen} onClick={() => onMenu(menuOpen ? null : node.key)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
      </C.Command>
    </A.RoomHeading> : <A.Node style={{ '--tier-color': tier.color }} data-location-actions-open={menuOpen || undefined}>
      <LocationOptionIcon tier={node.tier} label={node.label} />
      <C.NodeText><small>{tier.label}</small><C.Label id={branchControlId(node.path)} type="button" disabled={editLocked} onClick={() => begin('rename')}
        aria-label={`Rename ${tier.label.toLowerCase()} ${node.path.join(' · ')}`} title={`Rename ${tier.label.toLowerCase()}`}>
        <span>{node.label}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z" /></svg>
      </C.Label></C.NodeText>
      <C.Command type="button" disabled={editLocked} aria-label={`Actions for ${node.path.join(' · ')}`} title="Location actions" aria-expanded={menuOpen} onClick={() => onMenu(menuOpen ? null : node.key)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
      </C.Command>
    </A.Node>}
    {active ? <LocationBranchInlineEditor editor={editor} locations={allLocations} /> : null}
    {menuOpen ? <C.Menu aria-label={`Actions for ${node.path.join(' · ')}`} data-location-actions-open>
      {childTier ? <C.Command type="button" onClick={() => begin('add')} aria-label={`Add ${childTier.label.toLowerCase()} under ${node.path.join(' · ')}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16" /></svg>Add {childTier.label.toLowerCase()}
      </C.Command> : null}
      {records.length === 1 ? <C.Command type="button" onClick={() => { focusLabel(); onMenu(null); onEditPath(records[0]); }} aria-label={`Edit full path ${node.path.join(' · ')}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16M9 3v4m6 3v4m-6 3v4" /></svg>Full path
      </C.Command> : null}
      <C.Command type="button" $danger onClick={() => { focusLabel(); onMenu(null); onDelete(records, { label: node.path.join(' · '), branch: true, focusId: branchControlId(node.path) }); }} aria-label={`Delete branch ${node.path.join(' · ')}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" /></svg>Delete{records.length > 1 ? ` · ${records.length} paths` : ''}
      </C.Command>
    </C.Menu> : null}
    {node.children.length ? <A.Tree>{node.children.map(child => <LocationBranchNode key={child.key} node={child} locations={locations} allLocations={allLocations} editor={editor}
      openMenu={openMenu} onMenu={onMenu} onDelete={onDelete} onEditPath={onEditPath} onFocusRoom={onFocusRoom} disabled={disabled} />)}</A.Tree>
      : room ? <A.Node style={{ '--tier-color': tier.color }}><div><small>Room</small><span>Room-level location</span></div></A.Node> : null}
  </>;
  return room ? <A.Room aria-label={`${node.label} branch`}>{content}</A.Room> : <li>{content}</li>;
}
