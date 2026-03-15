# Disco Warp Core Status Report (March 14, 2026)

## Scope of this report
- Based on code inspection of the current frontend/backend in this workspace.
- Focused on: what is implemented, what is missing, and what should come next for a LAN-only household inventory system with iPad photo capture/upload.

## What is working now

### Core architecture and data model
- React + Vite frontend and Express + MongoDB backend are wired and running as separate apps.
- Core models exist for `Box`, `Item`, and `Location`.
- `Box` and `Item` both already include an `imagePath` field in the schema.
- Backend server binds to `0.0.0.0` (good for LAN reachability on the backend side).

### Inventory structure and navigation
- Box hierarchy/tree retrieval is implemented (`/api/boxes/tree`, `/api/boxes/by-short-id/:shortId`).
- Home route displays hierarchical boxes with search, sorting, filtering, category filtering, and location filtering.
- Box detail page supports three tabs: tree view, flat item view, and edit/actions view.
- Item detail pages are implemented with enriched metadata (breadcrumb, top box, depth, lifecycle/value/category fields).

### Box and item lifecycle operations
- Create box with short ID validation and availability check.
- Update box details (including location linkage and tags).
- Nest/reparent box with cycle prevention logic in backend service.
- Unnest box to floor level.
- Release direct child boxes to floor.
- Add item into a box.
- Move item between boxes.
- Orphan item from a box.
- Empty a box (orphans all direct items).
- Destroy box flow in UI includes confirmation and user messaging.

### Location system
- Location CRUD endpoints are implemented.
- Duplicate location names are guarded.
- Location deletion is blocked when in use.
- Legacy string location handling/backfill exists to sync `locationId` + `location` name.

### Toast/message system
- Header-mounted interactive toast system is implemented via `ToastContext` and rendered in Header.
- Supports sticky messages and action buttons (including undo flows).
- Includes idle placeholder state when there is no active toast.

## What is not working yet / key gaps

### iPad + LAN blockers (high priority)
- Frontend API base URL is hardcoded to `http://localhost:5002`.
- Some box action controller calls also hardcode `http://localhost:5002` directly.
- On iPad, `localhost` points to the iPad itself, not the Mac mini backend, so API calls will fail off-device.
- Vite config does not currently enable host exposure (`server.host`), so dev frontend LAN access is not configured by default.

### Photo upload pipeline is not implemented
- No backend multipart upload endpoint (no multer/storage pipeline currently in use).
- No backend static media serving path for uploaded files.
- Box edit UI explicitly says image upload is “coming soon” (placeholder).
- Item edit UI has no file input/upload flow.
- Current image support is mostly metadata/path display only.

### Operational and product gaps
- No authentication or role-based controls (may be acceptable for trusted LAN, but still a risk).
- No automated frontend/backend test suite (only a standalone cycle-prevention script exists).
- Header has placeholder/disabled nav entries (`Orphaned`, `Settings`, `Logs`).
- No offline/PWA behavior for iPad home-screen use.
- No documented backup/restore workflow for MongoDB + media files.

### Consistency risk
- `DELETE /api/boxes/:id` service deletes a box and orphans direct items, but does not itself release child boxes.
- UI destroy flow currently compensates by calling release-children first, but direct API deletion could leave child boxes pointing to a deleted parent.

## Recommended next-phase features

## Phase 1: LAN reliability and device compatibility (must-do first)
1. Make frontend API origin configurable by environment (no hardcoded localhost).
2. Replace all direct fetch URLs with shared `API_BASE` usage.
3. Add LAN-friendly runtime config (e.g., `.env` for frontend backend host/IP).
4. Configure Vite for LAN access during development (`host`), and document start commands for iPad testing.
5. Add a quick “Connection status” indicator in UI (backend reachable/unreachable).

## Phase 2: iPad camera upload for boxes/items (must-do)
1. Backend upload API:
- Add multipart upload endpoints for item and box images.
- Validate mime type/size and sanitize file names.
- Store media under a server directory with stable relative URLs.
2. Backend media serving:
- Serve uploaded files via Express static route.
- Add delete/replace behavior to avoid orphaned files.
3. Frontend image UX:
- Add file input buttons in item and box edit flows.
- Include `accept="image/*"` and `capture="environment"` for iPad camera capture flow.
- Show upload progress, preview, retry, and remove image actions.
4. Data model usage:
- Standardize `imagePath` to store a server-relative URL, not arbitrary local paths.

## Phase 3: household workflow improvements
1. Orphaned items dedicated page with bulk actions.
2. “Recently changed” activity log for household coordination.
3. Low-stock and maintenance reminders using existing structured item fields.
4. Better global search (items, boxes, tags, location in one query).
5. Barcode/QR label support for quick locate/open box detail on iPad.

## Phase 4: resilience and maintainability
1. Add baseline API tests for box/item/location critical flows.
2. Add component-level tests for key workflows (move/orphan/empty/destroy undo behavior).
3. Add backup/restore scripts for MongoDB and uploaded media.
4. Add error tracking/diagnostics screen for LAN troubleshooting.

## Suggested implementation order (practical)
1. Fix API base and LAN config.
2. Ship minimal item/box image upload (single image per object).
3. Validate iPad capture flow end-to-end on local network.
4. Add orphaned-items page + activity log.
5. Add tests and backup scripts before scaling features further.

## Current readiness summary
- The app is already strong on core inventory structure and move/orphan/nesting workflows.
- The main blocker for the intended next milestone is not inventory logic; it is LAN host configuration plus a full image upload/serving pipeline for iPad camera usage.
