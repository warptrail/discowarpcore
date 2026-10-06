# Four-tier development locations

Locations now use Room → Vicinity → Specifics → Exact Spot. `exactSpot` is optional free text (for example, "Behind the blue bin") and requires Specifics. Existing location IDs, box references and item-string/import contracts remain intact.

## Local database transition

The migration refuses non-loopback MongoDB hosts, databases without a development/test suffix, and production environment/NeonAzoth signals. It defaults to a read-only dry run:

```sh
node backend/scripts/migrate-location-exact-spot.js --dry-run
```

For an approved local apply, stop the development stack through Tarot (frontend before backend), then run:

```sh
./scripts/tarot banish
node backend/scripts/migrate-location-exact-spot.js --apply
./scripts/tarot awaken
```

Apply refuses a listening dev API on port 7610. It checks normalized conflicts, writes an Extended JSON snapshot of locations, indexes and box assignments under `var/backups/location-exact-spot/`, backfills missing/null Exact Spot values, creates and verifies the four-field case-insensitive unique index, and only then drops the old three-field unique index. It checks records and assignments afterward. Repeated applies are safe and produce fresh snapshots.

Keep the snapshot: it preserves BSON IDs and dates. Do not restore the old three-field index after creating multiple exact spots beneath one Specifics; restoring requires a separately reviewed data rollback. A failure leaves the snapshot and reports an error; resolve the cause before restarting an old schema or retrying.

## Checks

```sh
node --test test/locationStructure.test.js test/locationHierarchy.test.js test/locationExactSpot.test.js test/retrievalBoxPrefix.test.js
LOCAL_MONGO_TEST=1 node --test test/locationExactSpotMigration.test.js test/locationExactSpotRetrieval.test.js
npm --prefix frontend run lint
npm --prefix frontend run build
```

The integration test creates and removes only its uniquely named local test database. Browser verification should use disposable locations/boxes and mock GET `/api/declutter-deck`, which can reconcile inventory candidates. NeonAzoth requires a separate rollout; this migration is deliberately development-only.
