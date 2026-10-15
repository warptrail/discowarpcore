# Missing Items

Missing is a temporary uncertainty about whereabouts. It is independent of `item_status` and the permanent `gone / lost` disposition. Missing objects retain their inventory quantity, physical box membership, compartment, and recorded home.

## Household workflow

Choose Discofish or Laserfox on the device. In Operations item actions, Retrieval Commands, or full-item Commands, choose **Mark missing**. Enter the total currently missing (not an additional count), with an optional note. One-object records default to one; larger records require an explicit count. Both profiles can resolve any report. Profiles are household attribution, not authenticated accounts.

**Found** records how many objects were recovered only after placement confirmation. Partial recovery returns those objects to the recorded home. Changing homes requires recovering all missing objects, choosing a box/compartment, and confirming that every object in the record belongs at the destination. Records are not split. Intentionally unboxed objects can remain unboxed. Cancel if an object is still on a table or in transit.

**Correct report** changes an erroneous count without claiming recovery; zero cancels the report. Quantity edits cannot reduce inventory below the missing count. Ordinary placement and activity actions do not clear reports. Permanent departure closes the report as departed; reclaiming does not reopen it.

The Operations **Missing Items** virtual box stays available when empty. `/operations?missing=1` opens it while retaining other query parameters. Search its contents by name. Rows retain recorded placement, reporter, date and note; the primary link opens contextual Quick Peek and the separate link opens the item page. The quiet global count shows affected records, with both record and object counts in the accessible label. Inventory totals still count owned objects. Counts do not assert that remaining objects have been physically verified.

## API

All routes use the existing `{ ok, data }` response convention. Failures carry `error`; failed item mutations include refreshed `data` when the record still exists. Conflicts return HTTP 409.

- `GET /api/items/missing?limit=25&offset=0&q=flashlight`: newest active reports first; `items`, filtered `total`, global `summary`, pagination and `hasMore`.
- `GET /api/items/missing/summary`: `{ records, objects }` for active missing reports.
- `PATCH /api/items/:id/missing`: `{ profile, expectedRevision, expectedQuantity, action: "report" | "correction", quantity, note? }`.
- `PATCH /api/items/:id/found`: `{ profile, expectedRevision, expectedQuantity, recoveredQuantity, note?, placementConfirmed: true, placement }`.

Placement contains `mode: "home" | "new"` and `expected: { boxId, compartmentKey }`; an unboxed home uses `boxId: null` and an empty compartment. New-home placement also carries `boxId`, optional `compartmentKey`, and `wholeRecordConfirmed: true`.

Counts are safe integers. Inventory quantity must be a positive whole number. Reporting may increase or restate the current count; decreases require Found or correction. Recovery ranges from one through the current missing count. Notes are optional text up to 2,000 characters.

## Storage and consistency

Item `missing` stores quantity, revision, reporting profile/timestamp and note. `isMissing` is derived. Missing fields on legacy items read as zero; no backfill rewrites inventory. The index covers missing quantity and report time.

`missingHistory` records each report, correction, recovery and departure closure with before/after count, acting profile, server timestamp, revision and placement snapshots. State and history update together in one item write. The event log is a best-effort mirror; item history is authoritative. The initial report timestamp/profile remain attached to an open episode, while history identifies every subsequent actor.

A short database lease serializes missing changes with item edits and individual placement operations across processes. Revision and expected quantity checks reject stale/duplicate requests. Leases are excluded from API serialization and expire after interrupted operations. Generic item patches cannot alter missing state, history or lease fields.

New-home recovery verifies the destination, runs the existing placement service, verifies the resulting home, then updates missing state. A move and recovery are separate writes: if recovery fails after movement, the new placement may remain, while the missing report stays open. Review the refreshed record before retrying. This workflow does not claim multi-document transaction support.

Shared status refresh runs on successful local mutations, window focus, and every 30 seconds while visible. Mounted inventory resources refresh quietly; replacement is deferred while a dialog or focused editing field is active, preserving drafts and scroll position. Reporting sheets use a fresh item snapshot and require explicit review after a conflicting save.

## Verification

- `node --test test/itemMissing.test.js`: count rules and state transitions.
- `DWC_MISSING_DB_TEST=1 node --test test/itemMissing.integration.test.js`: real MongoDB behavior using a uniquely named `dwc_missing_test_*` database on local port 27017. Only that generated database is dropped afterward. No environment URI or household database is used.
- Frontend build/lint and existing inventory, placement, Retrieval and Loadout regression tests.
- Browser checks with a generated development QA item, removed with only its own event logs after verification. Check report, partial recovery, correction, persistent header feedback, profile selection, deep links, keyboard/focus and 360px/393px layouts.

This change is local source/development work. Production deployment is separate.
