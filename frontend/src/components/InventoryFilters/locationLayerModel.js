import { LOCATION_MAP_TIERS } from '../Location/locationHierarchy.js';

export function availableLocationLayers(scope, options) {
  const layers = [0];
  for (let index = 1; index < LOCATION_MAP_TIERS.length; index++) {
    if (!scope[LOCATION_MAP_TIERS[index - 1].key] || !options[LOCATION_MAP_TIERS[index].key]?.length) break;
    layers.push(index);
  }
  return layers;
}

export function nextLocationLayer(scope, options, index) {
  const last = availableLocationLayers(scope, options).at(-1);
  return Math.min(last, scope[LOCATION_MAP_TIERS[index].key] ? index + 1 : index);
}

export function selectLocationLayerScope(scope, field, key) {
  const next = { ...scope, [field]: key || '' };
  const index = LOCATION_MAP_TIERS.findIndex((tier) => tier.key === field);
  for (const tier of LOCATION_MAP_TIERS.slice(index + 1)) next[tier.key] = '';
  return next;
}
