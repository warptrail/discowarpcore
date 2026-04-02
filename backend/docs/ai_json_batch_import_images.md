# AI JSON Batch Import Images

## JSON shape

Each imported item may include an optional `imageKey`:

```json
{
  "batchContext": {
    "source": "ai_json_import"
  },
  "items": [
    {
      "name": "Bench Grinder",
      "description": "8-inch grinder",
      "category": "tools",
      "quantity": 1,
      "box": "203",
      "imageKey": "bench-grinder"
    },
    {
      "name": "Shop Apron",
      "description": "Canvas apron",
      "category": "clothing"
    }
  ]
}
```

Items without `imageKey` import exactly as before.

## Import-images folder layout

Choose one folder in the AI JSON import UI and place one source image per `imageKey` basename:

```text
import-images/
  bench-grinder.jpg
  shop-apron.png
  spare-motor.webp
```

Subfolders are tolerated during upload, but matching always uses the final filename basename only.

## Matching rules

- `imageKey` must match the image filename basename exactly.
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`.
- Zero matches: item import continues and returns a warning.
- Multiple matches for the same basename: item import continues and returns a clear warning; no image is attached.
- The importer never guesses between multiple candidates.

## Storage behavior

- Matched files are copied into Discowarpcore-managed originals storage under `backend/media/items/original/`.
- Imported items do not depend on the external import-images folder after import completes.
- Imported batch images create or update `MediaState` records with:
  - `originalPath`
  - `processedPath` = empty until later processing
  - `processingStatus` = `ready_for_processing`
  - `sourceType` = `batch_import`

## Processing lifecycle

Batch-import images follow this lifecycle:

1. `ready_for_processing`
2. `queued`
3. `processing`
4. `completed` or `failed`

The import step stops at `ready_for_processing`. It does not invoke objectGlow.

## Toast and counting

- The import response includes `imageImportSummary.readyCount` for newly attached batch-import images.
- Global pending count is available from `GET /api/media/batch-import/ready-summary`.
- `POST /api/media/batch-import/process-ready` queues pending `batch_import` images for the normal media job pipeline.
