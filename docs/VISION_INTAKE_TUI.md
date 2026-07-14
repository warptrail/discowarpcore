# Vision Intake TUI

`npm run intake:tui` is the preferred local workflow for AI-assisted vision intake.
For the operator-facing workflow guide, open `docs/batch-import-workflow.html`.
For MacBook-to-production intake, see `docs/tui-production-intake.md`.
The old Desktop staging-folder workflow has been removed from current docs.

## Folder Model

The TUI uses `$HOME/Intake`:

```text
~/Intake/
  inbox/        raw photos waiting to become a batch
  processing/   active resumable batch workspaces
  completed/    successfully imported batch archives
  failed/       reserved for failed batch recovery
  exports/      zip files created for manual GUI upload
```

Put raw photos in:

```text
~/Intake/inbox
```

The TUI creates one processing workspace per batch:

```text
~/Intake/processing/<batchId>/
  raw/
  processed/
  item_artifacts/
  package/
  logs/
  batch.json
  CODEX_AGENT_PROMPT.md
```

Raw images are moved from `inbox/` into the batch `raw/` folder. They are never
deleted permanently.

## Launch

```bash
npm run intake:tui
```

The startup menu shows inbox image count and active processing batches:

```text
DISCO WARP CORE VISION INTAKE
Inbox: N images
Processing: active/empty
```

## Start New Batch

The wizard asks for:

- batch name
- optional destination location
- optional destination box id; when provided it must be exactly 3 digits
- import mode

Import modes:

- `Direct database import`: packages the batch, uploads it to the local backend,
  validates it, and imports it through existing backend intake endpoints. If a
  3-digit destination box does not already exist, the TUI creates it through the
  existing box API before import.
- `Export zip only`: packages the batch and copies the zip to `~/Intake/exports`.
- `Validate/package only, no import`: validates and packages into the batch workspace
  but does not call the backend import endpoints.

Direct import uses the backend API target printed at TUI startup. In development,
the default is:

```text
http://localhost:5002
```

Override with:

```bash
DISCO_API_BASE=http://localhost:5002 npm run intake:tui
```

For production, run with `DISCO_ENV=production` and set `DISCO_API_BASE` to the
production backend API or an SSH tunnel URL. The TUI refuses to start in
production mode without `DISCO_API_BASE`.

## Pipeline

The TUI runs these steps:

1. Move supported images from `~/Intake/inbox` into `raw/`.
2. Run existing background removal into `processed/`.
3. Run existing vision `--init` to create JSON stubs in `item_artifacts/`.
4. Write and copy `CODEX_AGENT_PROMPT.md`.
5. Pause while Codex annotates the JSON files.
6. Run vision `--validate`.
7. Package/export or direct import based on the selected mode.
8. Move successfully direct-imported batch folders into `~/Intake/completed`.

Background removal uses the existing script:

```bash
node scripts/preprocess_vision_images.js
```

The TUI defaults `OBJECTGLOW_REPO` to the first available checkout from:

```text
/Volumes/Luna/Developer-Luna/objectiglow
~/Developer/objectiglow
```

Set `OBJECTGLOW_REPO` before launching the TUI if your objectGlow checkout lives
somewhere else.

## Codex Annotation

When init succeeds, the TUI writes:

```text
<batchRoot>/CODEX_AGENT_PROMPT.md
```

It copies that prompt through the terminal clipboard when running over SSH, or
to the local macOS clipboard with `pbcopy` when running directly on the Mac.

The prompt tells Codex to:

- inspect images in `processed/`
- follow `item_artifacts/CODEX_PROMPT.md` if present
- edit only JSON files in `item_artifacts/`
- never rename, move, delete, or copy images
- never write to backend media folders
- never call backend APIs
- fill only practical inventory fields

Return to the TUI and press ENTER after Codex finishes.

## Validation

`npm run intake:vision -- --validate` checks:

- every processed image has a matching JSON artifact
- every JSON artifact references an existing image
- malformed JSON
- required `imageKey` and `name`
- `imageKey` matching the image filename basename
- duplicate/mismatched image keys
- destination warnings when no location or box is present

Validation logs are written to:

```text
<batchRoot>/logs/validation.log
```

The TUI does not package or import when validation fails.

## Recovery

`Resume Existing Batch` reads `batch.json` files under `~/Intake/processing`.

Minimal supported resume behavior:

- `awaiting_annotation`: continue from validation
- `failed`: show the last error and offer retry/open-folder actions
- `packaged`: offer direct import or open folder

When a pipeline step fails, the TUI marks the batch as `failed` and moves it to
`~/Intake/failed` when possible. Failed batches remain visible through
`Review Failed Batch`.

## GUI Relationship

The GUI import screen remains available for:

- manual zip upload fallback
- validation/recovery review
- provenance inspection
- archived import inspection

For normal local capture, use:

```bash
npm run intake:tui
```

## Manual Test Checklist

1. Empty or move aside existing `~/Intake/inbox` contents.
2. Add two test images to `~/Intake/inbox`.
3. Run `npm run intake:tui`.
4. Start a new batch in `Export zip only` mode.
5. Confirm images move from `inbox/` to `processing/<batchId>/raw`.
6. Confirm cutouts appear in `processing/<batchId>/processed`.
7. Confirm JSON stubs appear in `processing/<batchId>/item_artifacts`.
8. Confirm `CODEX_AGENT_PROMPT.md` is written.
9. Fill JSON names manually or with Codex.
10. Press ENTER in the TUI.
11. Confirm validation passes.
12. Confirm zip appears in `~/Intake/exports/<batchId>.zip`.
13. Repeat with `Direct database import` while the backend dev server is running.
14. Confirm successful direct import moves the batch to `~/Intake/completed`.
