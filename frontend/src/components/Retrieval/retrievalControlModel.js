import { getLocationMapScope, locationLabel } from '../Location/locationHierarchy.js';
import { formatPrimaryOwner, normalizePrimaryOwner } from '../../util/itemOwners.js';

export const facetKey = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
export const EMPTY_LOCATION_BRANCH_PREFIX = '__location_branch__:';
export const UNKNOWN_ROOM_OPTION = '[Unknown]';
export const isUnknownLocation = (label) => ['unknown', 'unknown location'].includes(facetKey(label));

// Facets are the server's exact filter keys. Keep unmatched legacy labels selectable
// without guessing a structured placement from words or punctuation in the label.
export function buildRetrievalLocations(registry = [], facets = [], rooms = []) {
  const records = [...registry];
  const labels = new Set(records.map((record) => facetKey(locationLabel(record))));
  for (const { label } of facets) {
    if (label && !isUnknownLocation(label) && !labels.has(facetKey(label))) {
      records.push({ room: label, legacy: true });
      labels.add(facetKey(label));
    }
  }
  for (const { label } of rooms) {
    if (label && !isUnknownLocation(label) && !records.some((record) => facetKey(record.room) === facetKey(label))) records.push({ room: label });
  }
  return records;
}

export function locationKeysForScope(records, facets, scope) {
  if (!scope?.room) return [];
  if (scope.room === UNKNOWN_ROOM_OPTION) {
    const keys = facets.filter(({ label }) => isUnknownLocation(label)).map(({ key }) => key);
    return keys.length ? keys : [`${EMPTY_LOCATION_BRANCH_PREFIX}unknown`];
  }
  const branch = getLocationMapScope(records, scope);
  const labels = new Set(branch.locations.map((record) => facetKey(locationLabel(record))));
  const matches = branch.scope.room ? facets.filter(({ label }) => labels.has(facetKey(label))).map(({ key }) => key) : [];
  // An empty registered branch must yield zero results, never silently show all.
  return matches.length ? matches : [`${EMPTY_LOCATION_BRANCH_PREFIX}${facetKey(locationLabel(scope))}`];
}

export function scopeForLocationKeys(records, keys) {
  if (keys.length !== 1) return null;
  const [key] = keys;
  if (key.startsWith(EMPTY_LOCATION_BRANCH_PREFIX)) {
    const [room, vicinity, specifics, exactSpot] = key.slice(EMPTY_LOCATION_BRANCH_PREFIX.length).split(' · ');
    return getLocationMapScope(records, { room, vicinity, specifics, exactSpot }).scope;
  }
  return records.find((record) => facetKey(locationLabel(record)) === key) || null;
}

export function roomsForLocationKeys(records, facets, keys) {
  const labels = new Set(facets.filter(({ key }) => keys.includes(key)).map(({ label }) => facetKey(label)));
  const unknown = [...labels].some(isUnknownLocation) || keys.includes(`${EMPTY_LOCATION_BRANCH_PREFIX}unknown`);
  return [...new Set([
    ...(unknown ? [UNKNOWN_ROOM_OPTION] : []),
    ...records.filter((record) => labels.has(facetKey(locationLabel(record)))).map((record) => record.room),
  ])];
}

export function ownerFacetKeys(options, ownerId) {
  return options.filter(({ key }) => normalizePrimaryOwner(key) === ownerId).map(({ key }) => key);
}

export function buildControlPanelChips(chips) {
  const owners = new Set();
  return chips.flatMap((chip) => {
    if (chip.type !== 'owners') return [{ ...chip, label: chip.label.replace(EMPTY_LOCATION_BRANCH_PREFIX, '') }];
    const key = normalizePrimaryOwner(chip.key);
    if (owners.has(key)) return [];
    owners.add(key);
    return [{ ...chip, key, label: `Owner: ${formatPrimaryOwner(key)}` }];
  });
}

export function hasSecondaryRetrievalFilters({ isBoxMode, hasTagScope, activeChips = [], selectedBoxTags = [] }) {
  if (isBoxMode) return !hasTagScope && selectedBoxTags.length > 0;
  return activeChips.some(({ type }) => (
    ['categories', 'owners', 'keepPriorities'].includes(type) || (!hasTagScope && type === 'tags')
  ));
}
