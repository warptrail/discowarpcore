import { useEffect, useMemo, useState } from 'react';
import { listLocations } from '../../api/locations';
import LocationBranchFilter from '../InventoryFilters/LocationBranchFilter';
import { locationLabel } from '../Location/locationHierarchy';
import { buildRetrievalLocations, facetKey, isUnknownLocation, locationKeysForScope, roomsForLocationKeys, scopeForLocationKeys, UNKNOWN_ROOM_OPTION } from './retrievalControlModel';

export default function RetrievalLocationFilter({ options = [], rooms = [], selectedKeys = [], selectedRooms,
  onChange, onRoomsChange }) {
  const [registry, setRegistry] = useState([]);
  const [branch, setBranch] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    listLocations({ signal: controller.signal }).then((locations) => {
      if (!controller.signal.aborted) setRegistry(locations);
    }).catch(() => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    return () => controller.abort();
  }, []);
  const records = useMemo(() => buildRetrievalLocations(registry, options, rooms), [registry, options, rooms]);
  // Unmatched saved labels remain flat room choices; never infer hierarchy from their text.
  const branchKeys = branch ? locationKeysForScope(records, options, branch) : [];
  const branchIsSelected = branch && branchKeys.length === selectedKeys.length && branchKeys.every((key) => selectedKeys.includes(key));
  const restored = scopeForLocationKeys(records, selectedKeys);
  let roomNames = selectedRooms?.length
    ? selectedRooms.map((key) => rooms.find((option) => option.key === key)?.label || key)
    : roomsForLocationKeys(records, options, selectedKeys);
  if (!roomNames.length && selectedKeys.length && (branchIsSelected || restored?.room)) {
    roomNames = [branchIsSelected ? branch.room : restored.room];
  }
  const singleRoom = roomNames.length === 1 && roomNames[0] !== UNKNOWN_ROOM_OPTION ? roomNames[0] : '';
  const value = branchIsSelected ? branch : restored || (singleRoom ? { room: singleRoom } : 'all');
  const selectedLabels = selectedKeys.map((key) => {
    const label = options.find((option) => option.key === key)?.label;
    return isUnknownLocation(label) ? UNKNOWN_ROOM_OPTION : label || roomNames.join(' · ') || locationLabel(value);
  });
  const summary = branchIsSelected ? locationLabel(branch)
    : restored?.room ? locationLabel(restored)
      : roomNames.join(' · ') || selectedLabels.filter(Boolean).join(' · ') || 'All locations';

  return <>
    <LocationBranchFilter locations={records} value={value} dense stacked
      extraRoomOptions={[{ key: UNKNOWN_ROOM_OPTION, label: UNKNOWN_ROOM_OPTION }]}
      selectedRooms={roomNames} summary={summary} hasSelection={selectedKeys.length > 0}
      onRoomsChange={(names) => {
        setBranch(null);
        // Boxes with no location have no server room key. Use location-key unions
        // for Unknown + rooms so the two server filter groups do not intersect.
        if (onRoomsChange && !names.includes(UNKNOWN_ROOM_OPTION)) {
          onRoomsChange(names.map(facetKey));
          onChange([]);
        } else {
          const next = [...new Set(names.flatMap((room) => locationKeysForScope(records, options, { room })))];
          onRoomsChange?.([]);
          if (names.length === 1 && names[0] !== UNKNOWN_ROOM_OPTION) setBranch({ room: names[0] });
          onChange(next);
        }
      }}
      onChange={(next) => {
        setBranch(next === 'all' ? null : next);
        if (next === 'all') { onChange([]); onRoomsChange?.([]); return; }
        onRoomsChange?.([]);
        onChange(locationKeysForScope(records, options, next));
      }}
    />
    {loadFailed && <small role="status">Location registry unavailable. Saved inventory locations remain selectable.</small>}
  </>;
}
