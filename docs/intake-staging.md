# Intake Staging Workspace

> Legacy/manual reference: the preferred current operator workflow is
> `npm run intake:tui`, documented in `docs/batch-import-workflow.html`.
> Use this page only when maintaining the older project-local staging scripts.

Disco Warp Core now uses a project-local runtime workspace for multi-step intake artifacts:

```text
var/
  intake/
    batches/
      <batch-id>/
        merged_inventory_batch.json
        image_order.csv
        imagekey_mapping.csv
        original_images/
        staged_images/
```

This area is:

- git-ignored runtime/operator workspace
- safe for temporary and semi-temporary batch artifacts
- not canonical app storage
- not a production runtime dependency

Canonical app data still lives in MongoDB and app-managed media storage after import.

## What goes in a batch folder

- `merged_inventory_batch.json`
  The merged JSON payload used for AI JSON import.
- `image_order.csv`
  The SnapSheet image-order export or equivalent ordered filename list.
- `imagekey_mapping.csv`
  Generated source-to-staged mapping for debugging and auditability.
- `original_images/`
  Optional per-batch copy of raw source images.
- `staged_images/`
  Files copied and renamed to `imageKey` basenames.

## Scripts

Create a new batch folder:

```bash
node scripts/create_intake_batch.js --name tools-test
```

Merge inventory JSON files into a batch:

```bash
node scripts/merge_inventory_json.js \
  --batch-dir var/intake/batches/2026-04-01_1030_tools-test \
  path/to/part1.json \
  path/to/part2.json
```

Fill in missing `imageKey` values from item names:

```bash
node scripts/assign_imagekeys_to_json.js \
  --batch-dir var/intake/batches/2026-04-01_1030_tools-test
```

Validate JSON/CSV/image counts before staging:

```bash
node scripts/validate_intake_batch.js \
  --batch-dir var/intake/batches/2026-04-01_1030_tools-test
```

Stage renamed image files into `staged_images/`:

```bash
node scripts/stage_imagekey_files.js \
  --batch-dir var/intake/batches/2026-04-01_1030_tools-test
```

The staging script is strict about CSV input:

- It expects a raw image-order CSV, not a generated `imagekey_mapping.csv`.
- Expected columns should include usable image references such as `file_path` and/or `file_name`.
- A good header shape is:

```text
index,file_path,file_name
```

- If the CSV contains values like `index`, `1`, `2`, or other non-image tokens instead of real image filenames/paths with supported extensions, the script fails fast and does not generate a new mapping file.

## Batch-dir centric defaults

When `--batch-dir` is provided, the scripts default to:

- JSON: `<batch-dir>/merged_inventory_batch.json`
- CSV: `<batch-dir>/image_order.csv`
- original images: `<batch-dir>/original_images/`
- staged images: `<batch-dir>/staged_images/`
- mapping CSV: `<batch-dir>/imagekey_mapping.csv`

You can still override individual paths explicitly when needed.

## Workflow

1. Create a batch folder.
2. Put merged JSON and image-order CSV into that batch.
3. Copy or sync source photos into `original_images/`.
4. Fill missing `imageKey` values if needed.
5. Run batch validation to confirm JSON/CSV/image counts line up.
6. Run the image staging script to create `staged_images/` and `imagekey_mapping.csv`.
7. Use the staged batch artifacts for import/testing.

This keeps Desktop clutter out of the operator workflow and gives future intake scripts a predictable home.
