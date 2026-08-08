# Loading performance audit — 2026-08-07

## Scope

This report covers locally verified source changes only. Nothing was deployed to
`192.168.1.37:5002`.

## Before and after

| Metric | Before | After | Result |
| --- | ---: | ---: | --- |
| Initial All Items records | 488 active records | 60 compact records | 88% fewer records |
| Initial API body, uncompressed | 719,610 bytes | 107,267 bytes | 85% smaller |
| Initial API transfer, gzip | Not retained from baseline | 12,221 bytes | Locally measured |
| Initial entry JavaScript, gzip | 449.69 KB | 146.66 KB | 67% smaller |
| Command icon | 602 KB PNG | 3.6 KB WebP | 99% smaller |
| Desktop collections mounted | Desktop and mobile | Desktop only | One collection in DOM |
| Desktop item image elements | Up to 976 across both 488-item collections | 58 within the 60-row page | At least 94% fewer |
| Current desktop DOM nodes | Baseline not retained | 2,657 | Measured after load |
| Time to All Items heading | Baseline not retained | 657 ms | Warm local dev browser |
| Time to first visible thumbnail | Baseline not retained | 699 ms | Warm local dev browser |
| Time to item visual region | Baseline not retained | 666 ms | Warm local dev browser |
| Time to item hero | Baseline not retained | 720 ms | Warm local dev browser |

The timing measurements include the Vite development server and browser-tool
overhead. They are useful as a local regression reference, not as production
LAN latency measurements.

## Request and media verification

- All Items issued one paginated `GET /api/items` request for 60 records. It did
  not request the box tree, orphan inventory, or locations.
- The first page was 12,221 compressed bytes and completed in 23 ms locally.
- The desktop DOM contained 60 rows and no mobile cards.
- Rapidly replacing `blu` with `bluetooth` produced one debounced API request,
  kept `?q=bluetooth` authoritative in the URL, and reset the result to 2 rows.
- All 58 item image URLs in the first page used the `thumb` derivative endpoint;
  none used an original media path as their normal source.
- The tested item page requested item detail plus media state and rendered one
  `display` derivative. The cached derivative was 70,292 bytes.
- Generated list derivatives observed during the audit were generally 5–22 KB.
- Hashed assets, unique media paths, and derivative responses returned a one-year
  immutable cache header. `index.html` returned `max-age=0, must-revalidate`.

React Strict Mode intentionally repeats mount effects in the Vite development
build, so the item-detail request appeared twice in the development trace. That
double mount is not present in the production build.

## Validation

- `178` Node tests passed, including pagination/filter/sort contracts, legacy
  array compatibility helpers, frontend query/deduplication helpers, and
  derivative reuse/staleness/concurrency/path/cache cases.
- Frontend ESLint completed with zero errors. Two pre-existing hook warnings
  remain in `ItemEditForm.jsx` and `SystemLogsPage.jsx`.
- The Vite production build completed successfully.

## Remaining production validation

After a separately authorized deployment, repeat these measurements from the
Wi-Fi Mac against `192.168.1.37:5002`. That isolates Wi-Fi/LAN transport time
from server compute and confirms production media paths and cache behavior.
