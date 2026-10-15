import { EMPTY_LOCATION, LOCATION_LEVELS } from '../../util/locationStructure.js';

const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const key = value => clean(value).toLocaleLowerCase();

export function branchScope(node) {
  return Object.fromEntries(LOCATION_LEVELS.map((field, index) => [field, node.path[index] || '']));
}

export function branchLocations(locations, node) {
  return locations.filter(location => node.path.every((part, index) => key(location[LOCATION_LEVELS[index]]) === key(part)));
}

export function branchControlId(path) {
  return `location-node-${encodeURIComponent(JSON.stringify(path.map(key)))}`;
}

export function childLocation(node, name) {
  const level = LOCATION_LEVELS[node.path.length];
  if (!level) throw new Error('Exact Spot is the final location level.');
  const value = clean(name);
  if (!value) throw new Error('Enter a name.');
  return { ...EMPTY_LOCATION, ...branchScope(node), [level]: value };
}

export function branchRenamePlan(locations, node, name, ids) {
  const value = clean(name);
  if (!value) throw new Error('Enter a name.');
  const targetIds = new Set(ids || branchLocations(locations, node).map(location => location._id));
  const targets = locations.filter(location => targetIds.has(location._id));
  if (targets.length !== targetIds.size || !targets.length) throw new Error('A saved path changed. Refresh locations before editing this branch.');
  const index = LOCATION_LEVELS.indexOf(node.tier);
  const parents = node.path.slice(0, index);
  const siblingExists = locations.some(location => !targetIds.has(location._id)
    && parents.every((part, depth) => key(location[LOCATION_LEVELS[depth]]) === key(part))
    && key(location[node.tier]) === key(value));
  if (siblingExists) throw new Error('That name already belongs to another branch here.');
  return targets.filter(location => location[node.tier] !== value)
    .map(location => ({ id: location._id, draft: { ...Object.fromEntries(LOCATION_LEVELS.map(field => [field, location[field] || ''])), [node.tier]: value } }));
}

// Keep confirmed progress explicit: the existing API updates one saved path at a time.
export async function saveBranchRename(registry, plan) {
  let saved = 0;
  try {
    for (const change of plan) { await registry.renameLocationInline(change.id, change.draft); saved += 1; }
  } catch (failure) {
    const error = new Error(saved ? `${saved} of ${plan.length} paths saved. ${failure.message} Retry to finish the remaining paths.` : failure.message);
    error.savedCount = saved;
    throw error;
  }
}

export function scopeAfterBranchChange(scope, node, next, mode) {
  const matches = node.path.every((part, index) => !scope[LOCATION_LEVELS[index]] || key(scope[LOCATION_LEVELS[index]]) === key(part));
  if (!matches) return scope;
  const updated = { ...scope };
  if (mode === 'rename' && scope[node.tier]) updated[node.tier] = next[node.tier];
  if (mode === 'add') for (const field of LOCATION_LEVELS.slice(node.path.length)) updated[field] = '';
  return updated;
}
