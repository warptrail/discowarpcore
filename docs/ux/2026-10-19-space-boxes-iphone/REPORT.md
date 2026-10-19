# Space Boxes — search UX fixes and verification

Disco Warp Core is the alternate name. Updated 19 October 2026 UTC. Tested the existing local frontend at `127.0.0.1:7611`, backend `7610`, against HEAD `95fcc3b` plus working-tree changes.

**The three confirmed UI issues are fixed locally. All eight WebKit scenarios, 16 added isolated UI regressions and 29 existing checks pass. Actual iPhone software-keyboard behavior remains unverified.** No deployment, installation, security/access change or inventory mutation was performed.

## Fixes and before/after evidence

| Issue / severity | Before | Fix and verified result |
| --- | --- | --- |
| Quick Peek input gestures scroll results — high / P1 | Operations → `cable` → box `117` → Toggle Quick Peek item search → enter `cable` → drag upward 50px within the input. Parent captured the gesture, cancelled moves and scrolled results **0 → 50px**. | Removed the search-dock drag/wheel controller and its unused scrolling callback. Input touch selection is exempt from the panel's background-scroll listener. The open-search header permits horizontal panning/pinch zoom, blocks background vertical panning and lets input text remain selectable. The same drag now leaves **results 0 → 0 and background 0 → 0**, keeps focus, and cancels no input pointer moves. Ordinary result swipes still scroll **0 → 85px**. |
| Quick Peek closure steals main-search focus — high / P1 | Enter `cable`, open a matching box, tap the main header search and wait about 620ms. WebKit logged **input → box card → input** during closure. | Removed the delayed second input-focus effect. Trigger restoration now respects an already focused external control and ignores disconnected triggers. Search keeps focus and a middle caret throughout closure; explicit Close still restores the box trigger. Reduced-motion closure also passes. |
| Full-box search vanishes on short scroll — high / P1 | `/boxes/117` → Toggle box quick search → enter `a` → scroll document 25px. Search unmounted, focus fell to BODY, header shrank about 157 → 127px, and scroll returned to 0. | Removed scroll-distance dismissal and its opening-scroll state. Outside dismissal now uses an actual click, so swipes do not count as outside taps. After 25px, the same input remains mounted/focused. A native Chromium-emulated swipe through results scrolled the page **105px** while search stayed open and focused. Escape, Enter, header toggle and outside tap still dismiss. |

Relevant code: [QuickPeekBoxHeader](../../../frontend/src/components/OperationsQuickPeek/QuickPeekBoxHeader.jsx), [Quick Peek styles](../../../frontend/src/components/OperationsQuickPeek/OperationsQuickPeek.styles.js), [Quick Peek controller](../../../frontend/src/components/OperationsQuickPeek/useOperationsQuickPeek.js), [BoxList](../../../frontend/src/components/BoxList.jsx), [box search state](../../../frontend/src/components/BoxDetailView/useBoxWorkspaceSearch.js), [box search overlay](../../../frontend/src/components/BoxDetailView/BoxSearchOverlay.jsx).

Touch policy follows the distinction between panning/zooming and native text selection in the [Pointer Events specification](https://www.w3.org/TR/pointerevents3/#details-of-touch-action-values). iOS selection handles and magnifier behavior still require device testing.

Baseline: [WebKit traces](before/runtime-results.json), [touch trace](before/touch-drag-results.json), full-box search [before scroll](before/03-full-box-search-before-scroll.png) / [after scroll](before/04-full-box-search-after-scroll.png).

After: [WebKit traces](runtime-results.json), [touch/navigation trace](touch-drag-results.json), full-box search [before scroll](03-full-box-search-before-scroll.png) / [after scroll](04-full-box-search-after-scroll.png), [after touch swipe](07-full-box-after-touch-swipe.png). All screenshots are desktop captures.

## Additional UI testing and corrections

- **Clear and replacement:** Clear previously closed full-box search. It now resets the term/sort while retaining the input and keyboard focus, allowing immediate replacement. Touch activation passes WebKit and Chromium; pointer-down cancellation was avoided because it suppressed activation in WebKit during development.
- **Sort selection:** The expanded tests caught an outside-click edge during implementation: selecting an option unmounts it before the document listener checks containment. Using the event's original composed path prevents that internal click from closing search. Sorting and subsequent editing pass in both engines.
- **Native gestures and background movement:** Checking the whole ancestor chain exposed the header's inherited touch restriction. An unrestricted intermediate version also allowed a vertical input swipe to pan the background. The final scoped horizontal/pinch policy preserves native editing without that background movement; original header resizing remains available when search is closed.
- **Other flows:** Tested normal/middle-of-term editing, empty/no-result terms, clearing/replacement, focused scrolling, panel open/close, explicit versus preserved focus, outside dismissal, sort changes, reduced motion, height resize, expansion/collapse and Back. No further confirmed desktop UI failures remain in this coverage. Test-harness layout/focus differences were corrected separately from application fixes.

## Final validation

| Coverage | Result / evidence |
| --- | --- |
| Original eight live WebKit scenarios, now with assertions | **8/8 pass**; [results](runtime-results.json), [run log](webkit-checks.log) |
| Added isolated real-component/hook regressions, synthetic inventory | **16/16 pass** across WebKit and Chromium; [results](isolated-regression-results.json) |
| Chromium touch and navigation | **Pass**: input-origin drag stays local; ordinary result swipe works; expansion locks the body and collapse releases it; full-box swipe preserves focus; Open full box / browser Back restores `q=cable&peek=117`. [Evidence](touch-drag-results.json) |
| Existing search, finder geometry/navigation, dismissal and swipe checks | **29 pass, 0 fail**; [output](unit-test-results.tap) |
| Targeted ESLint / whitespace | **Pass**, all seven changed production files; `git diff --check` passes. |
| Frontend production build | **Pass**; [build log](build-check.log). Vite reports a nonblocking large-chunk warning. No deployment followed. |

Operations and Retrieval retain the same input DOM node through typing/editing/clearing/replacement. Computed mobile input size remains **16px**. Retrieval's 844 → 500 → 844 desktop height change retains focus, caret and scale 1. Panel closure intentionally restores result focus rather than reopening a keyboard.

Runners, from the repository root using the already installed runtime:

```sh
node docs/ux/2026-10-19-space-boxes-iphone/run-ux-checks.cjs
node docs/ux/2026-10-19-space-boxes-iphone/check-touch-drag.cjs
node test/browser/searchEditingChecks.cjs
```

Set `PLAYWRIGHT_MODULE` if its installed path differs. The touch runner uses current local box `117`; choose another populated test box if inventory changes. Live contexts block non-local and non-GET/HEAD requests; final runs attempted none. Isolated fixtures block **every** request and use synthetic inventory. No package installation is part of this workflow.

## Remaining limits and iPhone regression gate

Testing used **desktop WebKit 26.5** and **desktop Chromium 151.0.7922.34**, mobile viewports/touch emulation at 390×844 and height 500. Resizing changes both viewports and cannot reproduce the iOS software keyboard, selection handles, magnifier, toolbar movement or rubber-band scrolling.

**Native testing blocker:** Mac browser/Simulator access was blocked by the locked Mac; manual unlock remains pending. Earlier simulator inventory queries failed under the sandbox or produced no output and were cancelled. A usable simulator/device is unverified, not proven absent. No action was denied, no lock was bypassed and no security settings were changed.

After manual unlock and with an existing device/runtime, perform ten cycles on Operations, Quick Peek, full-box search and Retrieval with the **software keyboard visibly open**: type; tap/drag a middle caret; long-press/select/replace text; clear and replace; swipe results to both bounds; tap boxes; close/resize panels; return to main search during closure; use browser/app Back. Include portrait/landscape, Safari toolbar movement, reduced motion and installed-app mode if used. Require no unsolicited focus loss, caret reset or keyboard close/reopen. Capture `focusin/out`, selections, root/inner scrolling, header/input/sheet bounds and `visualViewport.height/offsetTop/scale`, without sharing inventory values.

**P2 verification items:** Fixed sheet geometry and keyboard overlap remain unverified on iOS. Retrieval's expanded header occupies about 333px of a 500px desktop viewport. Some sheets measure `window.innerHeight`/header bounds without their own visualViewport handlers; delayed row alignment and return-scroll restoration also remain outside actual OS-keyboard coverage. These are follow-up risks, not newly reproduced iOS defects. No speculative viewport redesign was included.

The user's pre-existing changes in `InventorySearchCards.jsx`, `ItemThumbnailMedia.jsx` and the deployment note were preserved; the two source diffs were checked byte-for-byte against the start of this fix phase. Work is local and ready for review. iPhone keyboard sign-off remains open.
