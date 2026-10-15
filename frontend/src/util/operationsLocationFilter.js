import { getLocationMapScope, locationLabel } from '../components/Location/locationHierarchy.js';

const normalize = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export function resolveOperationsLocationFilter(value, locations = []) {
  if (!value || value === 'all') return 'all';
  if (typeof value === 'string') return value;
  const branch = getLocationMapScope(locations, value);
  return {
    kind: 'branch',
    ids: new Set(branch.scope.room ? branch.locations.map((entry) => String(entry._id)) : []),
    labels: new Set(branch.scope.room ? branch.locations.flatMap((entry) =>
      [locationLabel(entry), entry.name].filter(Boolean).map(normalize)) : []),
  };
}

export function matchesOperationsLocation(entity, filter = 'all') {
  if (filter === 'all') return true;
  const id = String(entity?.locationId?._id ?? entity?.locationId ?? '');
  if (typeof filter === 'string') return Boolean(id) && id === filter;
  // A saved ID is authoritative. Legacy item placement is a full registry label.
  if (id) return filter.ids.has(id);
  return filter.labels.has(normalize(entity?.location));
}
