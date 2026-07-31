function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function toId(value) {
  return toTrimmed(value?._id || value?.id || value);
}

function toNonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function calculateBoxCollectionStats({
  boxes = [],
  items = [],
  includedBoxIds = null,
} = {}) {
  const includedIds =
    includedBoxIds == null
      ? null
      : new Set(Array.from(includedBoxIds, (value) => toId(value)).filter(Boolean));
  const scopedBoxes = boxes.filter((box) => {
    const id = toId(box);
    return id && (!includedIds || includedIds.has(id));
  });
  const referencedItemIds = new Set();
  const locations = new Set();
  const groups = new Set();
  let boxesWithNotes = 0;

  for (const box of scopedBoxes) {
    const location = toTrimmed(box?.location).toLowerCase();
    const group = toTrimmed(box?.group).toLowerCase();
    if (location) locations.add(location);
    if (group) groups.add(group);
    if (toTrimmed(box?.notes)) boxesWithNotes += 1;

    for (const itemId of Array.isArray(box?.items) ? box.items : []) {
      const normalizedId = toId(itemId);
      if (normalizedId) referencedItemIds.add(normalizedId);
    }
  }

  let itemRecordCount = 0;
  let itemQuantity = 0;
  let itemsWithNotes = 0;
  let valuedItemRecordCount = 0;
  let totalValueCents = 0;

  for (const item of items) {
    if (!referencedItemIds.has(toId(item))) continue;

    const quantity = toNonNegativeNumber(item?.quantity, 1);
    const valueCents = toNonNegativeNumber(item?.valueCents);
    itemRecordCount += 1;
    itemQuantity += quantity;

    if (toTrimmed(item?.notes) || toTrimmed(item?.maintenanceNotes)) {
      itemsWithNotes += 1;
    }
    if (valueCents > 0) {
      valuedItemRecordCount += 1;
      totalValueCents += valueCents * quantity;
    }
  }

  return {
    scope: 'filtered_boxes',
    currency: 'USD',
    metrics: {
      boxCount: scopedBoxes.length,
      locationCount: locations.size,
      groupCount: groups.size,
      boxNoteCount: boxesWithNotes,
      itemRecordCount,
      itemQuantity,
      itemNoteCount: itemsWithNotes,
      valuedItemRecordCount,
      totalValueCents: Math.round(totalValueCents),
    },
  };
}

module.exports = {
  calculateBoxCollectionStats,
};
