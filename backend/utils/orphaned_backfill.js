const orphanedItems = await Item.find({ orphanedAt: null });
const boxes = await Box.find().select('items').lean();

const boxedItemIds = new Set();
boxes.forEach((box) =>
  box.items.forEach((id) => boxedItemIds.add(id.toString()))
);

for (const item of orphanedItems) {
  if (!boxedItemIds.has(item._id.toString())) {
    await Item.findByIdAndUpdate(item._id, {
      orphanedAt: new Date('2025-01-01'),
    }); // or new Date()
  }
}
