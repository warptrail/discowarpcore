# Disco Warp Core — LCARS // Cyberpunk // Minimal

This is the shared visual source of truth for the React inventory application. The October 2026 direction supersedes the previous natural-minimal document. Preserve existing inventory behavior, color provenance and data contracts while making the app feel like a clear, capable starship inventory console.

## Visual hierarchy

- Deep, opaque navy surfaces keep inventory readable. Use amber for the LCARS structural spine, cyan for action and focus, violet for secondary context, and coral for danger. Preserve box/item identity colors as meaningful provenance.
- LCARS character comes from asymmetric corners, slim leading rails, segmented navigation and compact data identifiers. Keep broad glow, nested ornamental frames, idle pulsing and decorative telemetry out of the workspace.
- Use the shared sans-serif for human names, controls and prose. Use the data font selectively for box IDs, counts and small section eyebrows. Keep metadata readable, usually at least 0.75rem; avoid walls of tracked uppercase text.
- Group related content with space and alignment. One boundary per functional panel is enough. Item imagery and useful actions should dominate.

## Source and reuse

`frontend/src/styles/tokens.js` owns palette, geometry, typography and mobile targets. `globalStyles.js` publishes `--dw-*` variables. `styles/primitives.js` exports layout-neutral `controlStyles`, `inputStyles`, `panelStyles` and React primitives `Control`, `Panel`, `Field`, `TextArea`, `StateMessage`.

Use these foundations from Styled Components; do not add Tailwind, TypeScript or a second styling layer. Components retain their own layout and meaningful state colors. The base radius is 8px, control radius 4px, regular control minimum 40px and coarse-pointer target 44px. Clear/dismiss actions keep intrinsic width rather than stretching across a toolbar.

## Inventory color provenance

`frontend/src/util/inventoryColorTheme.js` remains the authoritative mapping. Exactly three digits identify a physical box, including leading zeroes. The first digit selects its family: 0 ice/sky, 1 amber/orange, 2 teal/aqua, 3 lilac/violet, 4 coral/red, 5 lime/green, 6 blue/indigo, 7 magenta/pink, 8 cyan/marine, 9 gold/solar. The remaining digits choose the existing deterministic variant and phase. System collections and Items Adrift retain their neutral palettes.

Apply `getBoxThemeCssVars(getBoxTheme(shortId))` at each entity boundary, including nested boxes and portaled sheets. Entity rails, identifiers and handles use `--box-primary`; location labels retain `--box-location`. Selection must not replace the identity rail with global amber or cyan. Global navigation and workflow framing can use structural amber; keyboard focus remains cyan. Item hues continue to derive from their actual owning box and stable item ID.

## Navigation and responsive behavior

- Design from 320px upward. Let toolbars wrap and lists use available width. Keep essential search, sort and contextual actions visible, with secondary filters in disclosures or sheets.
- The opaque header occupies normal layout space and exposes its measured height for scroll offsets. First results and focused controls must remain visible below it.
- Preserve each route, deep link, browser history, query and inventory workflow. Items Adrift opens the Operations Quick Peek slide-up workspace with the same carousel/actions as boxed inventory.
- Use responsive bounded sheets on tablet/desktop and full-width sheets on phones. Respect safe-area insets, constrain scrolling to sheet bodies and avoid horizontal overflow.

## Interaction and accessibility

- Visible keyboard focus uses cyan. Use semantic buttons and labels, current/expanded/selected states, readable disabled states, and appropriate live messages.
- Shared dialogs trap keyboard focus, restore it when dismissed, and honor Escape. Nested sheets must not close together or unlock background scrolling prematurely. Keep Back distinct from Close.
- Animate state changes briefly (about 160–260ms). Respect reduced motion globally. Loading and empty/error states should explain what happened and provide a useful next action.
- A Toast is the existing **header-mounted interactive system message**, not an auto-dismiss notification. Preserve its confirmations, actions, undo, persistent status, and explicit dismissal.

## Verification

Run the production build, frontend lint and relevant pure tests. Check all routes at desktop and 390px, with representative 320px, 430px and 678px views. Check Clear sizing, header/result separation, dropdown opacity, keyboard dialog containment/restoration and Items Adrift route preservation. Browser QA must block inventory writes; note that GET `/api/declutter-deck` can reconcile stored candidates, so mock it for data-safe visual checks. Record failures and unrun workflows honestly.
