import { getAnswerPlacement } from './answerPlacement.js';
import { getBoxSearchText, getMatchingInventoryItems } from '../../util/inventorySearch.js';
export { getMatchingInventoryItems } from '../../util/inventorySearch.js';

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const text = (value) => String(value ?? '').trim();

export function buildQuickAnswers({ boxes = [], orphanedItems = [], locations = [], query = '' }) {
  const needle = normalize(query);
  if (!needle) return [];
  const registry = new Map(locations.map((location) => [String(location._id), location]));
  const candidates = [];
  const seen = new Set();
  const add = (item, box, placement, boxTrail = []) => {
    const id = text(item?._id || item?.id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    const name = text(item.name || item.label) || 'Unnamed item';
    const normalizedName = normalize(name);
    const rank = normalizedName === needle ? 0 : normalizedName.startsWith(needle) ? 1 : normalizedName.includes(needle) ? 2 : 3;
    candidates.push({ id, item, box, name, nameMatch: rank < 3, rank,
      boxId: text(box?.box_id), boxLabel: text(box?.label),
      boxRecordId: text(box?._id), path: placement.path, placement, boxTrail, unboxed: !box,
    });
  };
  const visit = (nodes, ancestorPlacement = null, ancestorBoxes = []) => {
    for (const box of nodes) {
      const ownPlacement = getAnswerPlacement(box, registry);
      const placement = ownPlacement.path.length ? ownPlacement : ancestorPlacement || ownPlacement;
      const path = placement.path;
      const boxTrail = [...ancestorBoxes, { id: text(box.box_id), label: text(box.label) }];
      const contextMatches = getBoxSearchText(box, path).includes(needle);
      const matchingItems = contextMatches ? (Array.isArray(box.items) ? box.items : []) : getMatchingInventoryItems(box, needle);
      for (const item of matchingItems) add(item, box, path.length ? placement : getAnswerPlacement(item, registry), boxTrail);
      visit(box.childBoxes || [], placement, boxTrail);
    }
  };
  visit(boxes);
  for (const item of orphanedItems) {
    // Orphaned candidates are already filtered by the Operations query and controls.
    add(item, null, getAnswerPlacement(item, registry));
  }
  return candidates.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}
