export const LOCATION_LEVELS = ['room', 'vicinity', 'specifics', 'exactSpot'];
export const EMPTY_LOCATION = { room: '', vicinity: '', specifics: '', exactSpot: '' };
const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

export function updateLocationDraft(current, level, value) {
  const next = { ...current, [level]: value };
  if (!clean(value)) {
    for (const child of LOCATION_LEVELS.slice(LOCATION_LEVELS.indexOf(level) + 1)) next[child] = '';
  }
  return next;
}

export function locationSuggestions(locations, draft, level) {
  const parents = LOCATION_LEVELS.slice(0, LOCATION_LEVELS.indexOf(level));
  return [...new Set(locations.filter((entry) => parents.every((parent) =>
    clean(entry[parent]).toLowerCase() === clean(draft[parent]).toLowerCase(),
  )).map((entry) => clean(entry[level])).filter(Boolean))];
}
