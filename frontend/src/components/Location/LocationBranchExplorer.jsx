import { useEffect, useMemo, useState } from 'react';
import LocationBranchNode from './LocationBranchNode';
import { buildLocationBranches } from './locationHierarchy';
import { branchControlId } from './locationBranchEditing';
import * as A from './LocationAtlas.styles';

export default function LocationBranchExplorer({ locations, allLocations = locations, onFocusRoom, editor, onDelete, onEditPath, disabled }) {
  const [openMenu, setOpenMenu] = useState(null);
  // Keep the inline field mounted while a shared parent saves its individual paths.
  const visibleLocations = editor?.busy ? editor.editing.visibleLocations : locations;
  const rooms = useMemo(() => buildLocationBranches(visibleLocations), [visibleLocations]);
  useEffect(() => {
    if (!openMenu) return undefined;
    const outside = event => { if (!event.target.closest('[data-location-actions-open]')) setOpenMenu(null); };
    const escape = event => {
      if (event.key !== 'Escape' || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      event.preventDefault(); setOpenMenu(null);
      document.getElementById(branchControlId(JSON.parse(openMenu)))?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [openMenu]);
  return <A.BranchViewport role="region" aria-label="House location branches" tabIndex={0}>
    <A.Branches>
      <A.House><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></svg>
        <div><strong>House</strong><span>Follow each room down to its exact placement.</span></div>
      </A.House>
      <A.Rooms>{rooms.map(room => <LocationBranchNode key={room.key} node={room} locations={visibleLocations} allLocations={allLocations} editor={editor} disabled={disabled}
        onFocusRoom={onFocusRoom} openMenu={openMenu} onMenu={setOpenMenu} onDelete={onDelete} onEditPath={onEditPath} />)}</A.Rooms>
    </A.Branches>
  </A.BranchViewport>;
}
