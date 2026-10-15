import { OCCASION_PRESETS } from './occasionPresets.js';

export function getFixedLoadouts(loadouts = []) {
  return OCCASION_PRESETS.flatMap(preset => {
    const loadout = loadouts.find(row => row.occasion === preset.id && !row.archived);
    return loadout ? [loadout] : [];
  });
}

export function loadoutProgress(entries = []) {
  const gathered = entries.filter(entry => entry.gathered).length;
  const returned = entries.filter(entry => entry.gathered && entry.returned).length;
  return { total: entries.length, linked: entries.filter(entry => entry.itemId).length, gathered, returned, remaining: gathered - returned };
}

export function toggleChecklist(entries, id, mode) {
  return entries.map(entry => {
    if (entry.id !== id) return entry;
    if (mode === 'return') return entry.gathered ? { ...entry, returned: !entry.returned } : entry;
    return { ...entry, gathered: !entry.gathered, returned: false };
  });
}

export function loadoutBody(loadout) {
  return {
    name: loadout.name, notes: loadout.notes, occasion: loadout.occasion,
    revision: loadout.revision, archived: Boolean(loadout.archived),
    entries: loadout.entries.map(({ id, label, itemId, gathered, returned }) => ({ id, label, itemId, gathered, returned })),
  };
}
