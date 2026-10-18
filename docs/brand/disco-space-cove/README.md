# Disco Space Cove asset kit

Disco Space Cove is the personal **household identity**: Disco the fish, ocean and space. Disco Warp Core remains the application's product name. “Space Boxes” is a possible future name, not an approved replacement. The approved kit is now wired into the local app header, desktop rail, home-command emblem, favicons, Apple icon and PWA manifest. Product and installed-app names remain unchanged.

## Choose an asset

All browser-ready files live in `frontend/public/brand/disco-space-cove/`, available after a future normal app build under `/brand/disco-space-cove/`.

| File | Use |
| --- | --- |
| `lockup-approved-navy.png` | Exact approved artwork crop, original luminous lettering, baked navy background, 1750×430 |
| `lockup-transparent.png` | Transparent header lockup, 1870×450; dark surfaces only |
| `lockup-transparent-480.png`, `-960.png` | Smaller header exports, same proportions |
| `wordmark-transparent.png` | Approved extracted lettering alone, used beneath the emblem in the narrow desktop rail |
| `emblem-transparent-512.png` | Standalone wave/fish/star, square transparent canvas |
| `star-transparent-256.png` | Isolated prism star; small-symbol variant |
| `favicon-16.png`, `-32.png`, `-48.png`, `favicon.ico` | Small browser icons, star on opaque navy; ICO contains 16/32/48 |
| `icon-64.png`, `-128.png`, `-192.png`, `-256.png`, `-512.png`, `-1024.png` | Full emblem on opaque navy |
| `apple-touch-icon-180.png` | iOS home-screen icon; no baked rounded corners |
| `icon-maskable-192.png`, `-512.png` | Opaque full-bleed navy with the emblem inside the central safe circle |
| `asset-inventory.json` | Export dimensions, alpha flags, file sizes and SHA-256 checksums |

The integrated app head references ICO/PNG favicons and a 180px Apple icon. Its PWA manifest requests 192/512px PNGs with separate any/maskable purposes. These exports cover that intended size set; head/manifest references now use this kit, including separate maskable entries. No fake vector SVG is supplied, and this kit does not include a Safari monochrome pinned-tab mask.

## Placement

Use the full lockup at **240 CSS pixels wide or larger**, preferably 320px+. The compact app header targets 240px and may shrink with existing controls; the narrow desktop rail uses the separate wordmark beneath a 68px emblem for legibility. At 240px the lettering is small; use the emblem alone in narrow navigation, at 32px minimum and preferably 48px+. Use the star at 16–48px. Do not try to fit the complete name into a square icon.

Keep clear space around the lockup of at least one quarter of its displayed emblem height. Preserve aspect ratio (`height: auto`) and never stretch, recolor, add glow or replace the approved lettering with a font. At 2× pixel density, the 960px export supports a 480px CSS width. The 512px transparent emblem and 1024px app icon involve some interpolation; they add no new vector detail.

Use Prism navy `#080e17` or a similarly dark opaque surface. On white/light surfaces, place the lockup inside an opaque navy panel with clear padding. Its white letters and brightest wave tips lose contrast directly on white. The preview includes white-background edge inspection, not an approved white-on-white placement. The transparent derivative has clean negative space and no rectangular navy fringe. Do not use CSS filters to invent a dark-lettered variant.

Household colors complement the app's existing cyan/violet vocabulary. They do not override physical-box identity colors, workflow colors, focus or semantic feedback. Existing LCARS // Cyberpunk // Minimal and Prism Console documents remain authoritative for the app UI.

For React consumption use an ordinary image inside the project's styled-components layout:

```jsx
<img
  src="/brand/disco-space-cove/lockup-transparent-960.png"
  alt="Disco Space Cove"
  width="960"
  height="231"
/>
```

Give standalone decorative images `alt=""` when the same adjacent text already supplies the identity. Icons used as buttons need a useful accessible action name. Use household wording only where household identity is intended; keep application titles and product navigation names intact.

## Provenance and practical limits

- `source/approved-master.png` is the exact approved 1983×793 image copied without modification from `exec-d32379f9-8fd5-46a0-9ee8-43bfec5b6e2c.png`. Its futuristic sans wordmark supersedes the rejected serif concept.
- `source/transparent-extraction.png` is a built-in imagegen background extraction from that master, with glow removed for clean alpha. It preserves the approved visual closely but is an AI-derived raster, **not a pixel-identical cutout**. Letter contours, proportions and facets can differ slightly. Use the approved navy crop wherever exact approved pixels are required.
- `source/star-extraction.png` is an imagegen-derived isolated four-point submark, with no orbit dots. The source prompts are recorded in `prompts.md`.
- All production outputs are PNG/ICO rasters, not vector masters or an identified licensed font. Obtain a manually traced and reviewed vector master if large-format print or exact editable paths become necessary.
- Local integration updates header/rail artwork, the existing home-command mark, icon references and manifest colors/icons. Page title, installed-app name, routes and data contracts remain unchanged. No service restart, remote deployment or database operations were performed. Legacy unreferenced icon files remain available.

## Reproduce and verify

Run the two scripts from the repository root with Node.js and `sharp` available:

```sh
node scripts/brand/export-disco-space-cove.cjs
node scripts/brand/preview-disco-space-cove.cjs
```

`preview.png` shows the approved crop, transparent lockup on navy, emblem edges on dark/white, standard/maskable icons, 16/32/48/64px renders and a light-surface backing example. Actual tiny samples are rendered at 1 image pixel per asset pixel; view the preview at 100% to judge them.

QA: inspected that sheet and separate navy/white composites; verified PNG alpha, dimensions, ICO entries, maskable central-circle containment, source checksum identity and export inventory checksums. Local browser integration was subsequently verified at 320px, 390px, 768px and 1280px on Operations/Retrieval; see `integration-verification.md`. Actual installed-device PWA refresh was not tested.
