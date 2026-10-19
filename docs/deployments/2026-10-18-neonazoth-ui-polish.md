# NeonAzoth release: UI polish, nested compartments and address-aware Retrieval

Deployed October 18, 2026 from commit `95fcc3b9384acac52752a14a9ab1812e0f3b5aaa` (`UI polish on redesign`), with the two behavior-preserving lint fixes described below.

- Household bookmark: http://disco.local:5002
- Private HTTPS: https://discowarpcore.taild6c610.ts.net
- Production root: `/home/warptrail/discowarpcore` on `neonazoth`, account `warptrail`, port `5002`.
- Release and recovery directory: `/home/warptrail/discowarpcore-releases/20261018-95fcc3b`.

## Backup and inventory preservation

Before deployment, the installed production adapter stopped the API under `/home/warptrail/.local/share/deckone-production/control.lock`. A complete database archive was restored into a uniquely named verification database; every original document and index matched. The verification database was dropped only after successful comparison.

- Archive: `database.archive.gz` in the release directory.
- SHA-256: `45ebd297707e5d42336e5136ab6475f0700f6cdb7912d5a8c7c787dfcb2fb91b`.
- Evidence: `backup-verification.json` and `before-database.ejson`.
- All ten collections were included, including the empty loadouts collection; 2,356 total documents were restored.

Immediately before activation, the stopped API received another complete backup, `preactivation.archive.gz`, verified by a restore dry run, and a BSON-preserving snapshot, `preactivation-database.ejson`. No production fixture seeding, migration, development-data import, or direct inventory patches were performed.

After restart, every document and index in every original collection matched the preactivation snapshot exactly. Production retained 512 item records, 51 boxes and four locations. UI quantities such as 642 units and Retrieval's filtered 505 records are different measures from the 512 database records. Evidence is recorded in `result.json`.

## Source, validation and activation

The source was frozen using `git archive` from the clean committed checkout. Its archive SHA-256 is `4fccb09e34e42f95ab585713bfc153741a031d412afd988acadd5a0321149883`. Locked backend and frontend dependencies were installed in the isolated Linux staging directory. No live dependency installation or build was needed during cutover.

Initial lint found two errors. Two minimal fixes were applied locally and included as explicit release overlays:

- `InventorySearchCards.jsx`: make the component-private `getCardMatchExcerpt` helper non-exported; no consumers imported it.
- `ItemThumbnailMedia.jsx`: assign the configurable JSX image component to a local `Image` variable so the existing unused-variable lint rule recognizes its usage.

Both fixes preserve rendered behavior. They remain uncommitted in the local checkout for review. The release retains `lint-fixes.patch`, `source-manifest.json`, and per-overlay hashes in the live `RELEASE_METADATA.json`; the patch SHA-256 is `3fda2bd4d02bc208a352a3d70ac2569000b63f0c7f20eaaa3dcbf9229b1fb9ff`.

Validation:

- Frontend lint passed with zero errors and the two existing ItemEditForm/SystemLogsPage warnings.
- Linux production build passed with the existing chunk-size warning.
- All 40 targeted tests passed: addresses, nested compartments, cabinet ordering, shelf selection, missing quantities, content fingerprints, locations and production deployment controls.
- All three database integration tests passed against uniquely named disposable databases, covering address-aware Retrieval, ownership/counts/bulk placement, nested placement, subdivision, deep physical nesting and exports. Staging used a synthetic development URI; production credentials and records were not used for these tests.
- The broader top-level/MCP suite ran 512 tests: 480 passed, 15 failed, 17 skipped. Failures include four extensionless frontend hook import-resolution failures, and eleven UI assertions/fixture lookups inconsistent with current components. These failures remain unresolved; this is not a fully green regression suite. Full diagnostics are retained in `tests.log`.

Protected checksum-based rsync dry runs were audited before activation. Production environment files, uploads/media, backups, runtime state, dependencies and Git metadata were excluded from source sync. Previous application source, runtime dependencies and frontend assets were saved in `previous-source`. Activation held the installed production control lock across stop, backup, source/dependency/assets activation and checked worker start. A source rollback handler was prepared for activation failures; it was not needed.

All 1,096 manifest-listed source files matched their expected hashes after activation. New built assets were added without deleting old hashed frontend assets, and the new frontend index was installed last. The production environment checksum was unchanged. Source rollback alone does not roll back database data.

## Live verification

- Installed production owner reports one healthy backend, ready database and successful start job.
- Only `127.0.0.1:5002` and Ethernet `192.168.1.37:5002` listen. Wi-Fi `192.168.1.72:5002` rejects connections.
- `disco-local.service` remains active. Private Tailscale HTTPS still proxies to loopback; no Funnel configuration was present.
- Readiness, the full box-tree page, item Retrieval, cabinet-aware box Retrieval, location registry, manifest and new branding icon all returned HTTP 200. Evidence: `api-verification.json`.
- Browser through `disco.local`: the new Disco Space Cove brand and box/cabinet/shelf locator are present; Operations loads inventory, search returns the new match cards, Solar Lights opens in Quick Peek with quantity 12, and the redesigned tag editor opens with an accessible Add item tag control. No tags or inventory values were changed.
- Retrieval loads 25 of 505 matching item records and exposes the new box-address scope field. No browser console errors were observed during these checks.

## Recovery

Use the same production control lock and checked installed-adapter workers. Stop the API, restore `previous-source` and its saved dependencies/assets with the same protected exclusions, then start and verify readiness and database-backed routes. Production environment/media/runtime remain live and must not be overwritten by a source rollback. Complete database archives and BSON snapshots are retained on NeonAzoth for a separately reviewed data restore if needed; such a restore would overwrite later edits.
