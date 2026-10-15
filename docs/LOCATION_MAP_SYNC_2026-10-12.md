# Location map sync — October 12, 2026

The user selected the current production map as the source of truth for localhost. The development registry still contained the 13 paths from the October 7 legacy migration, including the earlier Garage sample path. Production had four different registered paths.

The local `discowarpcore_dev` registry now matches production's four records exactly, including their IDs and recorded timestamps:

- The Study
- kitchen → Pantry → Top Shelf
- Bedroom → Closet → Top Right
- Office → Closet → Top Shelf - Left

Only the location registry and existing boxes' `locationId`/legacy `location` fields were synchronized. Matching used the boxes' MongoDB IDs. All 49 shared box records passed comparison; box identifiers, other metadata, items, membership, media, history and location indexes were preserved. Local inventory remains 51 boxes and 507 items. Production boxes 021 and 103 are absent locally; development-only boxes 981 and 982 remain unchanged. There are no dangling local location references.

Production was read-only throughout. The location-scoped export was compared again afterward and was unchanged. This was a one-time sync, not an ongoing or bidirectional synchronization service. No production frontend deployment was performed.

Before applying, the local registry and all box location fields were saved in BSON-preserving Extended JSON, with unrelated collection fingerprints and location indexes. The backup, source exports, reviewed plan and verification result are private and ignored by Git:

`dump/production-map-sync-20261012-0fcl3xag/`

The local frontend and API were stopped and restarted through the existing Tarot owner; system MongoDB stayed running. The local API and frontend proxy both expose the four production paths and passed readiness after restart.

The Location UI also passes vertical scrolling through to the page at map/list boundaries, displays visible/total path counts with a persistent Show whole house action while scoped, and refreshes the shared registry when returning to the route. Browser checks covered the actual loaded map, wheel scrolling and 320px, 390px, 690px and 1366px layouts. An isolated fixture verified a server-side location change appeared on returning from Operations. The production build, frontend lint and 20 targeted location tests passed; lint retained two existing warnings.
