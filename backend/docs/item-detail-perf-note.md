## Item Detail Performance Note

Observed hotspot in the item-detail backend path (`GET /api/items/:id`):
- `Item.findItemById` loaded all boxes (`findAllBoxesForMaps`) and rebuilt box maps for every request.
- This added full-collection work even when only one item's container ancestry was needed.

Changes in this pass:
- Replaced full-box scan in `Item.findItemById` with targeted leaf + ancestor-chain lookups.
- Added scoped perf logs with prefix `[perf][item-detail]` at controller/service/model levels.
- Added `Box` index for membership lookups used by query shape `{ items: itemId }`.

Follow-up recommendation:
- After collecting production timings, consider a dedicated `item -> box` reference to remove array-membership lookups and reduce multi-step resolution cost further.
