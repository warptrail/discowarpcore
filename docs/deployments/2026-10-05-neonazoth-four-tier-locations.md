# NeonAzoth deployment: four-tier locations

Production activation succeeded on October 5, 2026 at 7:22 PM Pacific (October 6, 02:22 UTC).

- Private site: https://discowarpcore.taild6c610.ts.net
- Source revision: `2f09180531d2a6d0d4dc6b3f2194b763d32ad269` plus the migration, guard-test, and documentation overlays recorded in the release's `RELEASE_METADATA.json`.
- Release directory: `/home/warptrail/discowarpcore-releases/20261005-2f091805` on NeonAzoth.
- Application root: `/home/warptrail/discowarpcore`; API port: `5002`.
- Activation result: `result.json` in the release directory, status `succeeded`; backend PID at verification: `715099`.

## Database transition

Locations now support **Room → Vicinity → Specifics → Exact Spot**. All four original location records received `exactSpot: ''`. Their IDs, existing fields, and timestamps were preserved, as were all box location assignments. Inventory record counts stayed at 51 boxes and 512 items. Item quantities displayed in the UI are distinct from database record counts.

The four-field unique index was created and verified with case-insensitive collation (`locale: en`, `strength: 2`), then the old three-field unique index was removed. The original four saved locations remain; disposable verification records were removed.

The production migration pins the Linux hostname, account, canonical application root, loopback MongoDB host, and explicitly expected database `discowarpcore`. It refuses development targets. Preflight found no conflicts. The migration required the API to be stopped, and activation ran under the production control adapter's shared lock. The updated backend started only after migration completed.

## Recovery evidence

On NeonAzoth, the backup directory is:

`/home/warptrail/discowarpcore/var/backups/location-exact-spot-production/1791253328292-53033178-d8b6-4828-b4e4-2efa068681fa`

It contains:

- `database.archive.gz`: full MongoDB dump taken while the API was stopped.
- `1791253328421-d8e0f518-e9f0-406e-ad0b-8f15db8feb53.json`: location records, index definitions, and box assignment snapshot.

The backup directory is mode 0700 and the database archive is mode 0600. Previous application source and built frontend are saved in the release directory's `previous-source`. Activation logs and its script are retained beside `result.json`.

The prepared failure recovery restores application source; it does **not** automatically restore the database. A database rollback would require deliberate use of the retained backup. Recovery was not needed.

## Verification

- 24 targeted tests passed on Linux, covering normalization, hierarchy, duplicates, production target guards, chart nesting, and retrieval behavior.
- Two isolated MongoDB tests passed locally, covering migration reruns, preserved references, four-field uniqueness, and retrieval inheritance.
- Frontend lint passed with two existing warnings in ItemEditForm and SystemLogsPage. The Linux production build passed with the existing large-chunk warning.
- Production API fixtures verified two distinct Exact Spots under the same three-tier parent, case-insensitive duplicate rejection, hierarchy rejection, creation, editing, and reload persistence. Cleanup restored the original location collection exactly.
- Read-only browser checks verified the deployed Exact Spot editor, desktop Operations and loaded Retrieval results, desktop Configuration, and phone-width Intake. Location layout checks at 390px found no horizontal overflow. No JavaScript page errors or failed assets were observed in the successful checks.
- Sequential browser navigation initially timed out; isolated browser sessions completed the route checks. Network-idle waits were unsuitable for the live app.
- Backend readiness, raw database indexes, deployed release hashes, private HTTPS routing, and absence of Funnel were verified.

The release preserves production environment files, media, dependencies, and runtime state. Prior hashed frontend assets remain available for clients open across activation. The frozen source includes the reviewed Operations console visual changes. This deployment report was written after activation and does not change the deployed release.
