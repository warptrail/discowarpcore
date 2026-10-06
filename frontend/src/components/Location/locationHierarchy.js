const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
export const locationLabel = (location) => [location.room, location.vicinity, location.specifics, location.exactSpot].map(clean).filter(Boolean).join(' · ');
const key = (value) => clean(value).toLocaleLowerCase();
const quote = (value) => clean(value).replace(/["&<>\\#`{}]/g, (char) => `#${char.codePointAt(0)};`);

export function getLocationRooms(locations) {
  const rooms = new Map();
  for (const location of locations) {
    if (clean(location.room)) rooms.set(key(location.room), rooms.get(key(location.room)) || clean(location.room));
  }
  return [...rooms.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

export function buildLocationMermaid(locations) {
  const nodes = new Map();
  const lines = ['flowchart TB', '  accTitle: House location hierarchy', '  accDescr: Room to vicinity to specifics to exact spot. Arrows show containment, not physical distance.', '  house["House"]:::house'];
  const add = (parts, parent, tier) => {
    const identity = JSON.stringify(parts.map(key));
    if (nodes.has(identity)) return nodes.get(identity);
    const id = `n${nodes.size}`;
    nodes.set(identity, id);
    lines.push(`  ${id}["${quote(parts.at(-1))}"]:::${tier}`, `  ${parent} --> ${id}`);
    return id;
  };
  for (const location of [...locations].sort((a, b) => locationLabel(a).localeCompare(locationLabel(b)))) {
    const room = clean(location.room);
    if (!room) continue;
    const vicinity = clean(location.vicinity);
    const specifics = clean(location.specifics);
    const roomId = add([room], 'house', 'room');
    if (!vicinity) continue;
    const vicinityId = add([room, vicinity], roomId, 'vicinity');
    if (!specifics) continue;
    const specificsId = add([room, vicinity, specifics], vicinityId, 'specifics');
    const exactSpot = clean(location.exactSpot);
    if (exactSpot) add([room, vicinity, specifics, exactSpot], specificsId, 'exactSpot');
  }
  lines.push(
    '  classDef house fill:#111a26,stroke:#93a7be,color:#edf3fa,stroke-dasharray:3 3',
    '  classDef room fill:#192637,stroke:#80dfff,color:#edf3fa',
    '  classDef vicinity fill:#111a26,stroke:#b5a7f5,color:#edf3fa',
    '  classDef exactSpot fill:#192637,stroke:#efbd78,color:#edf3fa,stroke-width:2px',
    '  classDef specifics fill:#111a26,stroke:#7edee2,color:#edf3fa',
  );
  return lines.join('\n');
}

export const LOCATION_MAP_TIERS = [
  { key: 'room', label: 'Room', color: 'var(--dw-cyan)' },
  { key: 'vicinity', label: 'Vicinity', color: 'var(--dw-violet)' },
  { key: 'specifics', label: 'Specifics', color: 'var(--dw-teal)' },
  { key: 'exactSpot', label: 'Exact Spot', color: 'var(--dw-amber)' },
];

export function getLocationMapScope(locations, requested = {}) {
  const scope = {};
  const options = {};
  let matching = locations;
  for (const [index, { key: field }] of LOCATION_MAP_TIERS.entries()) {
    const names = new Map();
    for (const location of matching) {
      const value = clean(location[field]);
      if (value && !names.has(key(value))) names.set(key(value), value);
    }
    options[field] = [...names.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    const parentSelected = index === 0 || Boolean(scope[LOCATION_MAP_TIERS[index - 1].key]);
    scope[field] = parentSelected ? names.get(key(requested[field])) || '' : '';
    if (scope[field]) matching = matching.filter((location) => key(location[field]) === key(scope[field]));
  }
  return { scope, options, locations: matching };
}

export function countLocationTiers(locations) {
  return Object.fromEntries(LOCATION_MAP_TIERS.map(({ key: field }, index) => {
    const parents = LOCATION_MAP_TIERS.slice(0, index + 1).map((tier) => tier.key);
    const paths = new Set(locations.filter((location) => parents.every((parent) => clean(location[parent])))
      .map((location) => JSON.stringify(parents.map((parent) => key(location[parent])))));
    return [field, paths.size];
  }));
}
