import { getCompartments, getLeafCompartments } from './boxCompartments.js';

export function summarizeBoxInventory(box) {
  const seenBoxes = new Set();
  const seenItems = new Set();
  const pending = box ? [box] : [];
  let totalQuantity = 0;
  while (pending.length) {
    const current = pending.pop();
    const id = String(current._id || current.box_id || '');
    if (seenBoxes.has(id)) continue;
    seenBoxes.add(id);
    for (const [index, item] of (current.items || []).entries()) {
      const itemId = String(item?._id || item?.id || `${id}:${index}`);
      if (seenItems.has(itemId)) continue;
      seenItems.add(itemId);
      const quantity = Number(item?.quantity ?? 1);
      totalQuantity += Number.isFinite(quantity) && quantity >= 0 ? quantity : 1;
    }
    pending.push(...(current.childBoxes || []));
  }
  return {
    sectionCount: getCompartments(box).length,
    storageSpaceCount: getLeafCompartments(box).length,
    itemRecords: seenItems.size,
    totalQuantity,
    nestedBoxCount: Math.max(0, seenBoxes.size - 1),
  };
}
