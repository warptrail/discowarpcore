# Desktop console revamp

The shared shell fills the viewport at 1100px and above. Existing smaller-screen layouts remain in place. `DESIGN_SYSTEM.md` records the approved geometry and palette rules.

## Component boundaries

- `DesktopWorkspace/DesktopShell.jsx`: shared viewport geometry and route shell.
- `DesktopWorkspace/DesktopNavigation.jsx`: existing route destinations and icons in a 176px command rail.
- `DesktopWorkspace/InspectorFrame.jsx`: reusable inspector container; Operations keeps the same portal target mounted across breakpoints.
- `OperationsInventory/OperationsInventoryGrid.jsx`: row-ordered card grid and permanent 384px right dock column.
- `OperationsInventory/OperationsInspectorIdle.jsx`: quiet selection prompt and card-control guide beneath the dock.
- `OperationsInventory/useOperationsDockGeometry.js`: shared viewport positioning for the resting panel and selected-box dock; observes the portal target and header size.
- `OperationsInventory/OperationsBoxCard.jsx`: extracted card presentation; filtering, branch traversal and selection remain in the existing controller.
- `OperationsInventory/OperationsCardFields.jsx`: seven desktop field shortcuts inside the fixed card footprint.
- `OperationsQuickPeek/QuickPeekFieldSheet.jsx`: shared item/box field-panel presentation; existing item save behavior remains in its controller.
- `OperationsQuickPeek/QuickPeekBoxEditor.jsx` and `QuickPeekBoxLocationField.jsx`: selected-field box patches, unique number validation, registered location editing and existing photo controls. Drafts snapshot once per editing session and survive responsive presentation changes.
- `OperationsInventory/OperationsCardMedia.jsx`: desktop square thumbnails and contained offset frames for boxes with children, reusing existing photo inspection and cube fallbacks. Mobile retains its existing media geometry.
- `OperationsInventory/OperationsDesktopTree.jsx`: stable main-grid card rendering and parent branch activation. Expansion identities, active tab and dismissal state stay centrally controlled by `BoxList`, preserving branches through desktop/mobile resizing.
- `OperationsInventory/OperationsBranchOverlay.jsx`: floating nonmodal containment console, parent tabs with arrow/Home/End navigation, opening/closing presence and Escape/focus handling. It uses a body portal and leaves the main inventory layout unchanged.
- `OperationsInventory/OperationsBranchPanel.jsx`: recursive child grids, connected descendant panels and complete ancestry labels inside the console.
- `OperationsInventory/operationsTreeLayout.js`: stable box identities and ordered child-row boundaries. Identity, ancestry and depth stay separate from card markup; compartment rendering remains future work.
- `OperationsInventory/useGridColumnCount.js`: observes actual child-grid columns when resizing. `useBranchOverlayPosition.js` keeps the floating console within the workspace and viewport alongside the inspector.
- `OperationsInventory/OperationsNestedTray.styles.js` and `OperationsBranchOverlay.styles.js`: entity-color rails, layered 4px/8px backplates, 280ms console unfold, 190ms closing fold and 260ms descendant reveal. Reduced motion disables animation.
- `OperationsQuickPeek/OperationsBoxQuickPeek.jsx`: existing controller/content, with internal sheet/dock presentation and desktop Close behavior.
- `Retrieval/RetrievalInspector.jsx`: existing expanded resource content in a desktop inspector.
- `Intake/IntakeDestinationContext.jsx`: read-only destination context beside the single editing workspace.

The other routes extend their existing styled layouts. No backend contract, authentication, migration or dashboard metric was added. Pre-existing working-tree changes were preserved.

## Verification performed

- Frontend production build passes. Existing large-chunk warnings remain.
- Frontend lint has zero errors; existing warnings remain in `ItemEditForm.jsx` and `SystemLogsPage.jsx`.
- 42 relevant inventory, palette, filter, hierarchy, tree-row layout, Quick Peek history and Undo tests pass.
- The broad fixture-only browser suite completed 121 layout checks. The final focused overlay suite passed 28 layout states plus tab activation/dismissal, animation and fixed card geometry checks. Both reported zero runtime errors and zero attempted inventory writes. All API reads were mocked, including the reconciling Declutter GET.
- Operations grid counts are unchanged by inspection: 1100px 1, 1366px 2, 1920px 4, 2560px 6, 3440px 9.
- Operations checked at 320, 390, 430, 678, 700 and 1099px; other routes checked at 320, 390, 700, 1100 and 1920px.
- Checked item and box Retrieval modes, Terminal tree, search-revealed descendants, collapsed branches, Adrift/history, pagination selection cleanup, outside-click persistence, Escape, keyboard focus restoration and reduced motion.
- An unsaved Quick Peek field draft and item deep link survive desktop-to-phone-to-desktop resizing. Nested field, note and photo dialogs preserve the parent inspector. Missing/failed photos fall back safely.
- Every desktop box/child card and Adrift tile is 196px tall. Equal-width columns, bounded names, single-line location values, truncating tags and scrollable search matches prevent content from changing tile dimensions. Thumbnails remain 96px squares, including missing-photo fallbacks.
- Nested counts open a floating tree console with tabs for independent parent branches. Opening it does not move or resize the underlying grid. This replaces the earlier inline desktop trays; recursive connected panels remain inside the console only.
- Five nested levels retain complete ancestry through tab switching, resizing and inspector changes. Search reveals the matching path and highlights its item; clearing search restores manual expansion. Pagination leaves no detached console, and collapsing a descendant restores focus to its parent toggle.
- Overlay checks cover 1100, 1366, 1689, 1920, 2560 and 3440px with the inspector open and closed, including the annotated 1689×885 viewport, plus 320, 390, 430, 678 and 700px mobile behavior. There is no horizontal overflow. The active inventory tab, Close and Escape dismiss the console; closing animates before unmounting and restores focus. Nested modal Escape does not dismiss the console or inspector. Reduced motion suppresses both console and descendant animations.
- Populated Declutter review, discussion and action modes were checked at desktop and phone widths. Sidebar heading/reset controls have a dedicated overlap regression check. Voting writes were deliberately not executed.

## Repeat the browser checks

Start the local frontend using the project's existing launcher, then run from the repository root:

```sh
node test/browser/desktopConsole.qa.cjs
```

For the focused floating-tree and fixed-card checks only (the existing environment flag is retained):

```sh
DWC_QA_TRAYS_ONLY=1 node test/browser/desktopConsole.qa.cjs
```

The default origin is `http://localhost:7611`. Set `DWC_QA_URL` to another local frontend origin if necessary. `DWC_QA_OUTPUT` optionally selects the screenshot/report directory; otherwise the runner creates a fresh temporary directory and prints its path.

The runner intercepts every `/api/` request before it reaches the server, returns fixture data for reads, blocks writes, and rejects unrelated external resources. It does not start services or deploy changes. These checks validate UI behavior with fixtures; they do not validate production writes or server data reconciliation.

## Box field shortcuts

Desktop physical-box tiles expose number, name, location, tags, description, notes and photo actions. The 40px shortcut row fits inside the unchanged 196px height, above the 36px count footer. Names and locations remain bounded, and thumbnails stay 96px square. Mobile cards and the Adrift system tile do not gain these controls. Box text/location sheets use explicit Save/Cancel; existing item field blur/Enter saves are preserved. Saves use Mongo identity and patch only the selected field; renumbering dismisses the old URL-backed inspector through its controller before refreshed data arrives.

Fixture browser checks exercise all seven editors, fixed geometry at 1100–3440px, location selection/unassignment, invalid numbers, keyboard focus, nested-tree editing and draft survival across desktop/mobile resizing. All inventory writes remain blocked, including reconciling Declutter GET reads mocked as fixtures. Pure field tests verify identity validation, tag normalization and selected-field payloads.

The desktop Operations inspector is viewport-anchored within its reserved 384px column. Its measured top is clamped to 16px below the live header and its bottom stays 24px above the viewport edge. This prevents the inventory's bottom edge from pushing a sticky inspector up underneath the header. Fixture checks cover bottom-of-page selection at 1374×1093, 1100×700 and 1920×885, including simulated header-message height changes.

Latest field/clearance verification: frontend production build passed; lint passed with the two existing hook warnings; 40 relevant pure/API/UI contract tests passed; 50 fixture browser checks passed with zero page errors and zero attempted inventory writes. Fixtures covered 1100–3440px desktop and 320–700px mobile behavior, all seven editors, resize drafts/focus, nested trees and bottom-of-page header clearance. Real inventory saves and media uploads were not exercised by browser QA.

Desktop inspector dismissal retains the URL-backed selection during a 260ms outward slide/fade, then performs the existing history cleanup and focus restoration. The right column remains reserved after dismissal. Close and Escape share this timing; reduced motion bypasses the delay. Existing 620ms mobile dismissal remains unchanged. The fixture motion checks passed at 1374px and 1920px, verifying a visible intermediate animation, no horizontal overflow, URL cleanup, focus restoration, Escape and immediate reduced-motion dismissal. Production build, lint (two existing warnings) and history tests passed; fixture browser checks reported zero page errors or attempted inventory writes.

The current Operations design reserves the right column at all desktop widths. Its idle panel offers selection guidance and field/tree shortcuts without invented telemetry. Opening uses a 300ms inward slide/fade and closing uses the existing 260ms exit over that panel; neither changes card positions or dimensions. This replaces the earlier position-only grid animation. A ResizeObserver keeps dock coordinates current when the portal target settles or changes size, avoiding an initial left-edge placement. Smaller-screen sheet behavior remains unchanged.

Permanent right dock verification: 61 fixture browser checks passed, followed by 15 focused checks of final shared positioning, initial URL selection, opening/closing motion, idle-panel viewport bounds, Escape, focus restoration, reduced motion and 320/390/700px hiding. Both runs reported zero page errors and zero attempted inventory writes. The live in-app browser confirmed right-side docking and identical positions/dimensions for all 49 displayed grid cards before and after selection. Build, lint (two existing warnings), 12 history/tree/color tests and diff whitespace checks passed.
