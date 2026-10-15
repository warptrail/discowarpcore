import { LOCATION_LEVELS } from '../../util/locationStructure';

export function boxLocationDraft(location) {
  return Object.fromEntries(LOCATION_LEVELS.map((key) => [key, String(location?.[key] || '').trim().replace(/\s+/g, ' ')]));
}

export function validateBoxLocationDraft(value) {
  const draft = boxLocationDraft(value);
  for (let index = 1; index < LOCATION_LEVELS.length; index += 1) {
    if (draft[LOCATION_LEVELS[index]] && !draft[LOCATION_LEVELS[index - 1]]) {
      throw new Error('Complete each location level before adding the next.');
    }
  }
  return draft;
}

// Assign a path to this box; never rename a shared registry path or patch the item.
export async function saveRetrievalBoxLocation(box, draft, { resolveLocation, updateBox }) {
  if (!box?._id) throw new Error('Box details are unavailable.');
  const normalized = validateBoxLocationDraft(draft);
  const location = normalized.room ? await resolveLocation(normalized) : null;
  if (normalized.room && !location?._id) throw new Error('Could not resolve this location.');
  const updated = await updateBox(box._id, { locationId: location?._id || null });
  return { ...box, ...updated };
}
