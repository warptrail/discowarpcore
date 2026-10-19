# Space Boxes — iPhone search UX investigation

Alternate name: Disco Warp Core. Tested 19 October 2026 UTC against the existing local app, `http://127.0.0.1:7611`, backend `7610`, source HEAD `95fcc3b` plus the user's pre-existing working-tree edits.

**Result: three concrete search/focus problems were observed in desktop browser tests. The reported iPhone software-keyboard bounce is not yet reproduced on iOS.** The findings below are plausible mechanisms for that report, with different triggers; they should not be represented as a single proven iOS root cause.

## Test conditions and limits

- Read `AGENTS.md` and `DESIGN_SYSTEM.md`. Used Space Boxes as the report name; changed no product names, production behavior, backend contracts or design files.
- Used the already installed Playwright desktop **WebKit 26.5** at 390×844 and 390×500 with mobile/touch emulation, plus installed **Chromium 151.0.7922.34** for touch-event sequences. These are desktop engines, **not iPhone Safari or an iOS software keyboard**. Height resizing changes both layout and visual viewports; it does not simulate the iOS keyboard's independent visual viewport or rubber-band scrolling.
- All browser contexts were fresh and temporary. Network guards allowed only local GET/HEAD requests. No inventory writes or external requests were attempted during the final runs (`blocked: []`); no fixtures, inventory edits, deployments or installations were needed. Screenshots contain local inventory and remain local.
- Native Mac browser/Simulator interaction was **blocked**, twice: computer-use inventory returned “The Mac is locked and automatic unlock could not unlock it.” No native apps or browser tabs were accessible. Unlock was requested and remains pending.
- Xcode is present. Sandboxed `xcrun simctl list devices booted` failed with CoreSimulator connection/refused and log-access errors. An escalated read-only device query produced no output and was cancelled. Runtime/device availability remains **unverified**, rather than proven absent. No simulator was booted or software installed.

## Confirmed findings and prioritized fixes

### 1. Quick Peek turns editing gestures into result scrolling — high severity, P1

**Reproduce:** Open Operations, search `cable`, tap box `117`, then the header's **Toggle Quick Peek item search** control. Enter `cable` in the panel search. Start a touch drag inside the text field and move upward 50px, as when repositioning a caret or selecting text.

**Expected:** Input touches belong to native text editing; the results scroll when the gesture begins in the results region.

**Actual:** In Chromium touch emulation, a gesture beginning on `INPUT` was captured by its parent `DIV`; every move was cancelled and result `scrollTop` changed **0 → 50px**. The caret stayed at `[5,5]`, input stayed focused and root scroll stayed at 0. This confirms inappropriate gesture routing; iOS selection handles, magnifier and keyboard movement remain untested.

**Cause:** `QuickPeekBoxHeader.jsx:46–65` captures all touch pointer downs bubbling from the search dock, then calls `preventDefault()` and `onSearchScroll(deltaY)` for movement over 1px. `OperationsQuickPeek.styles.js:285–298` puts `touch-action: none` on the dock, including the input. There is no editable-target exclusion.

**Fix first:** Remove result-scrolling gestures from the input and its editing affordances; keep native touch behavior there. If a separate drag surface is retained, restrict capture to that surface with a deliberate threshold. Preserve ordinary results scrolling and the existing resize/close gestures.

Evidence: [touch event/scroll trace](touch-drag-results.json), [panel screenshot](06-quick-peek-input-touch-drag.png).

### 2. Returning to the main search briefly steals its focus — high severity, P1

**Reproduce:** Operations → enter `cable` → tap a matching box → tap the still-visible **main header search**, then wait about 0.65 seconds.

**Expected:** Once the user taps the search, its caret and focus remain there as Quick Peek closes.

**Actual:** Desktop WebKit recorded `main search → box preview card → main search`. Approximately 626ms after the input first gained focus, the closing panel requested focus for its trigger; the pending search-focus effect then returned focus to the input. The two resulting focus transitions occurred about 3ms apart. This is a confirmed focus race, **not a measured iOS keyboard dismissal/reopen**. The automation's own scroll-into-view before tapping is excluded from the application findings.

**Cause:** `useOperationsQuickPeek.js:361–367` always restores trigger focus when selection clears. `BoxList.jsx:514–529` separately closes the panel on primary-input pointer down and schedules input focus after closure. Mobile exit duration is 620ms (`OperationsQuickPeek.motion.js`). `preventScroll` does not resolve the competing focus ownership.

**Fix:** Give the handoff one focus owner. When dismissal was caused by a user focusing another editable control, preserve that control and its selection and suppress trigger restoration. Keep trigger restoration for explicit Close/Back when appropriate. Do not depend on a delayed programmatic focus call to reopen an iOS keyboard.

Evidence: `operations-open-box-then-retap-primary-search` in [WebKit runtime results](runtime-results.json).

### 3. Full-box search unmounts after a 25px page scroll — high severity, P1

**Reproduce:** Open `/boxes/117` → **Toggle box quick search** → enter `a` → scroll the document downward 25px. Reopen search and repeat while editing the term. The automated reproduction deliberately uses `window.scrollBy(0,25)` to isolate the scroll handler.

**Expected:** Scrolling results or browser adjustment of a focused input should not destroy the active editor. Search should stay available until an explicit dismissal or commit.

**Actual:** WebKit removed the search field and focus fell to `BODY`. The header changed from approximately **157px to 127px**, and the page returned to scroll position 0 after the layout change. Reopening focuses the newly mounted input. **Clear** also closes the overlay and drops focus by design, so immediate replacement requires reopening it.

**Cause:** `useBoxWorkspaceSearch.js:112–119` minimizes on *any* document scroll more than 24px from opening, without considering input focus or a viewport adjustment. `BoxSearchOverlay.jsx:153–155` focuses on expansion without `preventScroll`, and returns `null` when minimized. The confirmed failure could form a keyboard-open → browser-scroll → unmount/blur → keyboard-close cycle on iOS; that cycle is still a hypothesis.

**Fix:** Keep the active editor mounted and focused through search-result scrolling and viewport changes. Prefer explicit dismissal. If scroll-to-dismiss is a retained product requirement, distinguish a deliberate outside gesture from browser/programmatic scrolling and never apply it while editing. Clarify Clear versus Close: Clear should support replacing a term without reopening the editor unless explicitly intended otherwise.

Evidence: `full-box-search-scroll-and-clear` in [runtime results](runtime-results.json), [before](03-full-box-search-before-scroll.png), [after](04-full-box-search-after-scroll.png).

## Other checks and remaining risks

| Check | Expected / observed in desktop testing |
| --- | --- |
| Operations and Retrieval typing, middle edit, select-all clear, replacement | `cable → caxble → empty → cable`; focus and the same DOM input survived. No per-keystroke remount was found. |
| Operations result scrolling with input focused | Scripted 280px down/up retained query, caret and focus; no focus loop occurred. This does not cover iOS rubber-band behavior. |
| Quick Peek search and panel lifecycle | Typed/edited/cleared/replaced; inner scroll accepted 100px; closing search removed input focus; browser Back removed the panel and retained the main query. |
| Full-box navigation / browser Back | Open full box reached `/boxes/117`; Back restored Operations with `q=cable&peek=117` and the selected panel. |
| Touch swipe in Quick Peek results | Chromium touch emulation moved inner `scrollTop` 50 → 135px while root remained at 0 and search stayed focused. |
| Retrieval item panel | Opening moved focus into the modal and collapsed finder controls; closing restored the result trigger. Reopening finder restored the query. This collapse is intentional UI state, not a test failure. |
| Retrieval focused height resize, 844 → 500 → 844 | Search focus, caret and scale 1 survived. No bounce observed. Header remained about 333px tall, leaving only about 167px at the smaller height; usable keyboard-space coverage still needs iOS testing. |
| Input sizing | Computed **16px** on tested main, box and Quick Peek inputs, enforced by `globalStyles.js:93–102`. Small-font focus zoom is not supported as the leading cause here. |
| Existing focused checks | **29 passed, 0 failed**: search matching/highlighting, finder geometry/navigation, Quick Peek dismissal/swipes and sheet header gestures. These tests do not exercise an OS keyboard. |

**P2, verify before changing:** Quick Peek uses fixed positioning, `82dvh`/`100dvh`, a live-header measurement, nested scroll regions and a fixed-body lock when expanded. Shared Prism sheets use fixed top/bottom and header/`window.resize` measurements (`ObsidianPrismSheet.jsx:70–87`). Full-box search also listens only to `window.resize` for position. These surfaces lack their own `visualViewport.resize/scroll` handling, unlike some floating controls elsewhere in the app. Test visible bounds, keyboard overlap, safe areas and sheet/footer reachability with real iOS viewport offsets before deciding whether shared viewport geometry is needed.

Other possible scroll competitors are supported by source but not proven to cause this complaint: Quick Peek realigns its selected row immediately and again after 760ms (`useOperationsQuickPeek.js:265–313`); Operations scroll restoration can run up to 300 animation frames (`BoxList.jsx:321–372`); exact-address lookup calls `scrollIntoView` after 400ms (`BoxList.jsx:540–558`). Header compaction has 180px/24px hysteresis and a 360ms lock already. Avoid a broad header/scroll rewrite without an iOS trace isolating the trigger.

## Regression plan and completion gate

1. After the Mac is unlocked, use an already available iPhone simulator/runtime or a physical iPhone. Keep the **software keyboard visibly open**; record iOS version, Safari versus installed-app mode, device, orientation and keyboard type. Do not count a hardware-keyboard-only simulator session as OSK coverage.
2. For Operations main search, Quick Peek search, full-box search and Retrieval, repeat ten cycles: type `cable`; tap between letters; drag caret; long-press/select a substring; replace it; use native clear where available; type a replacement. Include a no-results term. Require no unsolicited focus loss, caret reset, result scroll from an input gesture or keyboard dismiss/reopen.
3. With keyboard open, swipe results slowly and quickly to both boundaries; scroll back to search; tap a box; expand/collapse/close panels; tap main search during the closing animation; navigate browser Back and app Back. Assert query/selection restoration and intentional keyboard retention/dismissal separately.
4. Capture timestamped `focusin/out`, selections, `scrollY`, nested `scrollTop`, header/input/sheet rectangles and `visualViewport.height/offsetTop/scale`. Include keyboard opening/closing, portrait/landscape, Safari toolbar expansion and reduced motion. Avoid recording inventory values in shared traces.
5. Add focused browser regressions for each confirmed mechanism: input-origin touch drags do not scroll results; search-to-panel handoff has no intermediate trigger focus; small page/viewport scroll does not unmount an active box editor. Keep matching, browser-history restoration, accessibility focus containment and existing sheet gestures intact.

**Remaining blocker:** actual iOS keyboard/selection/rubber-band coverage awaits Mac unlock and a usable connected device or installed simulator runtime. No software installation or production fix is authorized by this report. Test-and-report deliverables are complete; iPhone reproduction and sign-off remain open.

## Local deliverables

- [WebKit scenario runner](../run-ux-checks.cjs) and [runtime observations](runtime-results.json): eight completed scenarios; no page errors or attempted blocked requests. “Completed” means executed and recorded, not all behavior passed.
- [Chromium touch runner](../check-touch-drag.cjs) and [touch observations](touch-drag-results.json).
- [Existing unit-check output](unit-test-results.tap).
- Screenshots linked above; [Operations panel](01-operations-quick-peek.png), [Quick Peek search](02-quick-peek-search.png), [Retrieval scrolled results](05-retrieval-search-scrolled.png). All are desktop captures.

Rerun scripts from the repository root with Node and the existing Playwright module. Set `PLAYWRIGHT_MODULE` if its installed path differs. The touch runner uses current local box `117`; choose another populated test box if that inventory changes. No installation command is part of the test workflow.

The pre-existing edits to `frontend/src/components/InventorySearchCards.jsx`, `frontend/src/components/ItemThumbnailMedia.jsx` and the pre-existing deployment note were preserved. Only this report/evidence directory was added.

Archive note: runner links now lead to the strengthened regression runners; the baseline observations and screenshots in this folder are preserved from the initial investigation.
