# Legacy location migration

This is a reusable, deterministic data migration, not an AI classification service at runtime. The checked-in [mapping](../backend/scripts/migrations/legacy-location-map.json) records the agent's decisions from the localhost production copy. Development and production use the same planner, mapping and mutation engine, with separate guarded entry points.

## Mapping decisions

| Legacy label | Room | Vicinity | Specifics / Exact Spot |
| --- | --- | --- | --- |
| Garage | Garage | — | — |
| Garage - Dark Corner | Garage | Dark Corner | — |
| Office | Office | — | — |
| Office Bookshelf | Office | Bookshelf | — |
| Office Closet | Office | Closet | — |
| Kitchen | Kitchen | — | — |
| Living Room | Living Room | — | — |
| Bedroom Closet | Bedroom | Closet | — |
| Coat Closet | Coat Closet | — | — |
| Front Porch | Front Porch | — | — |
| Main Floor Bathroom | Main Floor Bathroom | — | — |

Room → Vicinity → Specifics → Exact Spot allows shorter known paths. Missing tiers are empty strings, not invented shelf/spot details. The user explicitly confirmed Bedroom → Closet on 2026-10-07. Coat Closet retains its existing named-space identity because its containing room is not recorded. No generic Garage item is assigned to North Shelf, and no generic Kitchen item is assigned to Pantry. Matching is whole-label, whitespace-normalized and case-insensitive; no regex or delimiter guessing occurs during migration.

Boxes gain real `locationId` references and lose their retired `location` field once its assignment is safely registered. Existing structured references and existing location records/IDs remain unchanged; the old empty `location` field on an already structured box is removed. Unknown/unlocated boxes remain untouched. Items retain their established **string** location API contract: populated strings are normalized to canonical registered path labels. Their blank fields are left alone, including boxed items that inherit their box's location. No item placement, parent, membership, quantity, lifecycle, image, timestamp or other metadata is changed.

## Safety contract

- Default is read-only dry-run. Require `--expected-database=NAME`, matching the configured loopback MongoDB URI exactly. Development refuses production signals and non-development/test database names. There is no arbitrary URI/remote-host flag.
- Every label must be explicitly mapped or already be a registered canonical label. Unmapped strings, dangling references, conflicting old/new assignments, invalid tier dependencies and normalized duplicates block the entire apply.
- The four-tier, case-insensitive unique index must already exist. Unexpected older unique indexes are blocked; this migration does not create/drop indexes or rewrite registered paths.
- Apply requires `--expect-plan=HASH` from the reviewed dry-run. The hash covers the mapping, full location/box/item records and location indexes. Any intervening edit requires a fresh review.
- Apply and rollback refuse a listening API on development port 7610 or production port 5002. Stop the verified process owner first; do not kill MongoDB.
- Before any write, create a full `mongodump --gzip` archive, validate its readability with `mongorestore --dryRun`, and write a BSON-preserving Extended JSON snapshot/plan with a SHA-256 checksum. Backup directories are private, and archives/snapshots/reports are mode 0600. A failed backup makes no migration writes.
- Recheck source records after backup. Field-level compare-and-set protects assignments. Verify complete records, inventory IDs/counts, membership, parent relationships and indexes after apply, not just totals. A second plan must contain zero changes.
- A mid-apply failure leaves the API stopped and reports the snapshot path. Rollback accepts partial applications but refuses unrelated/later edits or changed indexes/registry. It backs up the current state again, restores only the migration's fields and removes only its newly inserted, unreferenced registry records. It does not blindly restore/drop a database.

Backups cover database state, not media; this migration never changes media. Keep archives/snapshots local and private; do not commit them. A rollback after subsequent real inventory edits needs a separately reviewed recovery plan rather than forcing past the guard.

## Local use

Run from the canonical repository root. The script reads the same `backend/.env` MongoDB configuration as the local API. Install MongoDB Database Tools (`mongodump` and `mongorestore`) before apply.

```sh
node backend/scripts/migrate-legacy-locations.js --expected-database=discowarpcore_dev --dry-run
```

Review every source/target and the conflict list. If all is correct, stop the local stack through its existing owner, then substitute the reported 64-character fingerprint:

```sh
./scripts/tarot --json banish
node backend/scripts/migrate-legacy-locations.js --expected-database=discowarpcore_dev --apply --expect-plan=REVIEWED_HASH
./scripts/tarot --json awaken
node backend/scripts/migrate-legacy-locations.js --expected-database=discowarpcore_dev --dry-run
```

Only awaken after successful verification. On failure, use the reported absolute snapshot path while the API remains stopped:

```sh
node backend/scripts/migrate-legacy-locations.js --expected-database=discowarpcore_dev --rollback=/absolute/path/snapshot.ejson --dry-run
node backend/scripts/migrate-legacy-locations.js --expected-database=discowarpcore_dev --rollback=/absolute/path/snapshot.ejson --apply
./scripts/tarot --json awaken
```

Optional `--report=/new/path/report.json` saves a summary with exclusive creation; its parent directory must already exist. Report files contain no MongoDB credentials.

## Production: separate authorization required

**No production data was changed during this task.** Never copy the development database back into production. Deploy only the reviewed script/module/mapping files through the authorized source workflow. The production entry point pins Linux host `neonazoth`, user `warptrail`, root `/home/warptrail/discowarpcore`, loopback MongoDB and the exact production database name. It refuses to run on this Mac. See [Exact Spot production procedures](LOCATION_EXACT_SPOT.md#neonazoth-production) for the existing production control lock and process owner.

After explicit production approval, on that host in that root:

```sh
node backend/scripts/migrate-legacy-locations-production.js --expected-database=discowarpcore --dry-run
```

Review production's **own** report/hash; it may have new labels or assignments since the local copy. Unknown new labels must be added deliberately to the mapping, retested locally, and reviewed again. Hold the production control lock, stop through the authenticated installed adapter, run the production entry point with `--apply --expect-plan=PRODUCTION_REVIEWED_HASH`, verify, then start through the same adapter. Do not use the local Tarot development lifecycle for production. Production rollback uses the production entry point, the production snapshot and the same control-lock procedure.

## Verification and recorded local result (2026-10-07)

```sh
node --test test/legacyLocationMigration.test.js
LOCAL_MONGO_TEST=1 node --test test/legacyLocationMigration.test.js
```

The opt-in integration test creates a uniquely named loopback `_test` database from the current local location/box/item records, preserves BSON IDs and recreates the location indexes. It adds one isolated item/box fixture and a test-only four-tier alias so rerunning the test after the real migration still exercises writes. That alias is never loaded by either CLI. It rehearses apply, no-op rerun, backup failure, stale plan refusal, later-edit refusal and exact rollback, then removes only that disposable test database. Its private backup files remain in the reported temporary directory.

The actual `discowarpcore_dev` run preserved **51 boxes / 507 item records**, registered **11 paths** (2 → 13), changed **44 box location fields/assignments** (including the existing structured box's empty legacy-field cleanup), and normalized **49 item location strings**. Both original registry IDs were retained. Seven unknown/unlocated boxes and all blank item location fields were unchanged. The postflight contains zero pending changes and no conflicts. Local frontend/API were stopped and restarted through Tarot and passed readiness.

Private reports: `var/backups/legacy-locations/local-{preflight,apply,postflight}-2026-10-07.json`.

Verified backup/snapshot directory:
`var/backups/legacy-locations/1791391214842-cc1a1460-c0bf-4560-9666-1bb9da96b557/`.

The Retrieval API now exposes canonical `Garage · Dark Corner`, `Office · Bookshelf` and `Office · Closet` facets. Unknown Location remains an unassigned sentinel, not an invented room.

### User-confirmed Bedroom correction (2026-10-07)

After the initial migration, the user specified Bedroom as Room and Closet as Vicinity. The manifest above now reflects that decision for future legacy-data runs, including the separately authorized production run. The local registered location `6ac675eee8d9a0c28ab025dd` was corrected through the existing location PATCH API without replacing its ID or changing box 113/126 assignments. Both later tiers remain empty. All 51 boxes, 507 item records and 13 registry records were preserved; full snapshots verified that only this location's room, vicinity and normal update timestamp changed.

A fresh validated archive and snapshot precede the correction under:
`var/backups/bedroom-location-correction/1791393514161-030efdcd-7e69-4a13-bf73-86e6d408c4b1/`.

The earlier whole-migration rollback snapshot intentionally refuses this later registry edit. Do not bypass its guard: a reversal of the correction or a full earlier rollback requires review against the fresh backup. Production has not been migrated or corrected.
