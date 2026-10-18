# NeonAzoth production release and location cleanup

Activated October 14, 2026 at 8:54 PM Pacific (October 15, 03:54 UTC).

- Source revision: `3cdaf13e3306450ae4b34ad813e8945485e3d90a` (clean tracked checkout, frozen with `git archive`).
- Production: https://discowarpcore.taild6c610.ts.net
- Host/account/root: `neonazoth`, `warptrail`, `/home/warptrail/discowarpcore`.
- Release: `/home/warptrail/discowarpcore-releases/20261014-3cdaf13`.
- Production control used the installed DeckOne production adapter workers under `/home/warptrail/.local/share/deckone-production/control.lock`. Stop/start job outcomes were checked explicitly.

## Backup first

Before any application deployment or location writes, the API was stopped through its owner and the full `discowarpcore` database dumped to:

`/home/warptrail/discowarpcore/var/backups/predeploy-2026-10-15T03-50-38-524Z/database.archive.gz`

SHA-256: `9f40ff0f26d2627ffed68a2755f4c33faa533a81b4c8b9f2e0bd19eef7bcac77`.

An actual restore into an isolated temporary database recovered all 2,356 documents across all nine collections. Every document hash and every index definition matched production. Indexes were compared by name, since restore creates them in a different order. `verification.json` beside the archive records collection counts/hashes. The temporary verification database was removed after success. The archive is mode 0600 in a private directory.

An additional full dump, `preactivation.archive.gz`, and BSON-preserving `before-patch.ejson` reside in the release directory. These were created again while the API was stopped immediately before cleanup. The archive passed a restore dry run. Backups remain on NeonAzoth; an attempted second copy to the development machine was rejected by automatic approval review and was not performed.

## Location result

Live comparison established that production and development already had exactly the same four location records, including IDs/timestamps, with the four-field case-insensitive unique index. All 49 shared boxes had matching structured assignments. Production-only boxes and production inventory were retained.

The matching house paths are:

- The Study
- kitchen → Pantry → Top Shelf
- Bedroom → Closet → Top Right
- Office → Closet → Top Shelf - Left

Each record has `room`, `vicinity`, `specifics`, and `exactSpot`; Exact Spot is currently empty on all four. No locations were invented, imported, deleted, or renamed.

Per the user's explicit authorization to remove legacy location data, raw collection updates removed the obsolete `location` field from all 512 item records (87 contained nonempty Office/kitchen/garage labels). No box retained that field. Existing `locationId` references were preserved. Historical source payloads were not rewritten. Current application item contracts can still create empty or explicit item-location strings in future edits/imports; this operation cleans the existing database and does not remove that application contract.

Before restart, every document in every original collection was compared with the saved snapshot, permitting only the intended item/box `location` field removals. The same comparison passed after restart. Result: 512 items, 51 boxes, four locations, zero legacy item/box `location` fields. The four-field unique index remains present. Evidence: `patch-plan.json`, `patch.log`, `patch-result.json`, and `post-verification.json` in the release directory.

## Deployment and validation

Locked dependencies were installed and the frontend built in the isolated Linux release directory. Protected checksum-based rsync dry runs preceded activation. Production environment, media, backups, runtime state and Git metadata were excluded. Previous source, dependencies and built assets were saved to `previous-source`. New frontend assets were added while old hashed assets were retained for existing browser sessions; the new index was installed last.

- Targeted location/Missing/Loadouts suites: 53 passed, one skipped.
- Full top-level suite plus MCP: 446 passed, 11 failed, 15 skipped (472 total). Four failures are Node's resolution of an extensionless frontend hook import; seven are source/UI assertions inconsistent with current components. These failures remain unresolved in the deployed source; deployment is not claimed to have a fully green suite.
- Frontend lint: zero errors, two existing warnings in ItemEditForm and SystemLogsPage.
- Production build passed, retaining the large-chunk warning.
- Installed owner status: ready, one verified backend on 5002; start job succeeded.
- Private Tailscale HTTPS Serve points to loopback 5002; no Funnel configuration was present.
- Browser verification: Operations loads inventory; Location shows all four house paths and all four schema tiers; Retrieval populates results and displays inherited structured locations. No browser console errors observed.

## Recovery

Recovery is deliberate, not automatic. Hold the same production control lock and use the installed adapter worker to stop the API before any restore. The database backup above contains the entire predeployment database and indexes; restoring it overwrites later database edits, so review those edits before using `mongorestore --drop` against the pinned production target. Use production's own configured URI without printing credentials.

Application rollback source/dependencies/assets are in `previous-source` inside the release directory. Restore those with the same exclusions for production environment, media, backups, runtime and Git metadata. Source rollback alone does not restore the database. Alternatively, `before-patch.ejson` preserves the original BSON records for a narrowly scoped, concurrency-reviewed reversal of the location field removals. Restart through the installed owner and verify readiness, records/indexes, and browser routes afterward.

## Ethernet-only access and friendly LAN bookmark

At the user's request, a backend-only listener update was activated at approximately 9:01 PM Pacific. `backend/server.js` now accepts an optional comma-separated `LISTEN_HOSTS` setting. Existing `HOST` behavior remains the default. Production's protected `.env` sets `LISTEN_HOSTS=127.0.0.1,192.168.1.37`. This preserves the installed adapter's loopback readiness checks, inventory MCP, and the private HTTPS proxy while closing direct access through Wi-Fi's `192.168.1.72` address. The Wi-Fi interface itself and other host services were not modified.

The overlay and rollback copies of server source and production environment are private on NeonAzoth in `/home/warptrail/discowarpcore-releases/20261014-ethernet-only`. Activation held the existing production control lock, used checked stop/start workers, and provided a source/config rollback on failure. No database changes were required. These backend source edits also remain in the local checkout for subsequent releases.

The user selected **disco.local**. A persistent user service at `/home/warptrail/.config/systemd/user/disco-local.service` runs:

`/usr/bin/avahi-publish --address --no-reverse disco.local 192.168.1.37`

It is enabled in the user's `default.target`; user lingering was already enabled. The alias advertises only the Ethernet address. Router configuration, DHCP, and household DNS were not changed. The working bookmark is **http://disco.local:5002/**; the port remains required. Devices on home Wi-Fi can use this bookmark while the server serves requests through its Ethernet address. This is local multicast name resolution, so it requires devices on a LAN that allows mDNS.

Verified from both NeonAzoth and the development client:

- `disco.local` resolves to `192.168.1.37`.
- Ethernet and loopback readiness return `{"ok":true,"database":"ready"}`.
- Direct Wi-Fi-address connections to port 5002 fail.
- Only `127.0.0.1:5002` and `192.168.1.37:5002` are listening, owned by the same backend PID.
- The existing private HTTPS route remains healthy.
- The new hostname loaded Operations, inventory counts, box rows, photos, and structured location labels in the browser; no console errors were observed.
- Nine existing production deployment/control/restart tests passed; backend syntax and diff whitespace checks passed.

If Ethernet's DHCP address changes, update both production `LISTEN_HOSTS` and the alias service's address before restarting them. Roll back this network change by restoring the saved server/environment through the same locked production owner and disabling/removing `disco-local.service` if the alias is no longer wanted. Restoring the old listener configuration would reopen all-interface access.
