# Intake JSON Schema

This document describes the exact AI intake JSON contract currently accepted by Disco Warp Core, based on the live backend validation and import logic in:

- [`backend/services/aiJsonImportService.js`](/Users/moonshade/Developer/discowarpcore/backend/services/aiJsonImportService.js)
- [`backend/utils/itemCategory.js`](/Users/moonshade/Developer/discowarpcore/backend/utils/itemCategory.js)

This is the schema another agent should target if it needs to produce valid intake JSON for Disco Warp Core.

## Accepted Request Shapes

The backend accepts any of these outer request forms:

### 1. `jsonText`

```json
{
  "jsonText": "{ \"items\": [...] }"
}
```

### 2. `payload`

```json
{
  "payload": {
    "batchContext": { "...": "..." },
    "items": [ ... ]
  }
}
```

### 3. Direct payload object

```json
{
  "batchContext": { "...": "..." },
  "items": [ ... ]
}
```

For sharing with another agent, the important part is the payload object described below.

## Payload Schema

```json
{
  "type": "object",
  "additionalProperties": true,
  "properties": {
    "batchContext": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "location": { "type": ["string", "null"] },
        "box": { "type": ["string", "null"] },
        "source": { "type": ["string", "null"] },
        "itemCount": { "type": ["integer", "number", "string", "null"], "minimum": 0 }
      }
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "description": { "type": ["string", "null"] },
          "category": { "type": ["string", "null"] },
          "tags": {
            "type": ["array", "null"],
            "items": { "type": ["string", "number", "boolean", "null"] }
          },
          "quantity": { "type": ["integer", "number", "string", "null"] },
          "imageKey": { "type": ["string", "null"] },
          "location": { "type": ["string", "null"] },
          "box": { "type": ["string", "null"] }
        },
        "required": ["name"]
      }
    }
  },
  "required": ["items"]
}
```

## Normalized Meaning

After validation, each item is normalized into this shape:

```json
{
  "index": 0,
  "name": "Required non-empty string",
  "description": "",
  "category": "miscellaneous",
  "tags": [],
  "quantity": 1,
  "imageKey": null,
  "location": null,
  "box": null
}
```

## Rules

From [`backend/services/aiJsonImportService.js`](/Users/moonshade/Developer/discowarpcore/backend/services/aiJsonImportService.js):

- Top-level payload must be an object.
- `items` must be an array.
- `items` must contain at least one entry.
- Every item must be an object.
- Every item must have a non-empty `name`.
- `description` is optional and defaults to `""`.
- `quantity` is optional and defaults to `1`.
- Invalid, non-integer, or `< 1` quantity becomes `1`.
- `tags` is optional and defaults to `[]`.
- Duplicate tags are removed case-insensitively.
- `imageKey` is optional.
- `location` is optional.
- `box` is optional.
- Item-level `location` and `box` override `batchContext.location` and `batchContext.box`.
- `batchContext.source` is optional.
- Missing `batchContext.source` defaults to `"ai_json_import"`.
- `batchContext.source` is sanitized and truncated to 120 characters.
- `batchContext.itemCount` is optional.
- A mismatch between `batchContext.itemCount` and `items.length` creates a warning, not a hard failure.

## Allowed Categories

From [`backend/utils/itemCategory.js`](/Users/moonshade/Developer/discowarpcore/backend/utils/itemCategory.js):

```json
[
  "miscellaneous",
  "tools",
  "hardware",
  "automotive",
  "cleaning",
  "kitchen",
  "appliances",
  "electronics",
  "office",
  "books",
  "clothing",
  "bathroom",
  "medical",
  "decor",
  "furniture",
  "garden",
  "camping",
  "hobbies",
  "toys",
  "games",
  "seasonal"
]
```

Unknown or empty category normalizes to:

```json
"miscellaneous"
```

## Minimal Valid Example

```json
{
  "items": [
    {
      "name": "Hammer"
    }
  ]
}
```

## Typical Full Example

```json
{
  "batchContext": {
    "location": "garage",
    "box": "701",
    "source": "ai_intake_engine",
    "itemCount": 2
  },
  "items": [
    {
      "name": "Hammer",
      "description": "16 oz claw hammer",
      "category": "tools",
      "tags": ["metal", "hand tool"],
      "quantity": 1,
      "imageKey": "IMG_9506",
      "location": "garage",
      "box": "701"
    },
    {
      "name": "Screwdriver Set",
      "category": "tools",
      "tags": ["hand tool", "drivers"],
      "quantity": 1
    }
  ]
}
```

## Warnings vs Errors

Warnings do not block import:

- `batchContext` is not an object
- missing `batchContext.source`
- invalid `batchContext.itemCount`
- `batchContext.itemCount` mismatch with `items.length`

Errors do block validation/import:

- missing or invalid top-level payload
- missing `items`
- empty `items`
- non-object item
- missing or empty item `name`

## Practical Notes

- Extra fields are tolerated at both the top level and per-item level.
- Only the fields listed above are currently normalized and used by the AI intake import path.
- `imageKey` only matters if image attachment/import is also being supplied alongside the JSON import.
