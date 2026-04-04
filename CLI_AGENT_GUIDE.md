# objectGlow CLI Guide for Agent Callers

## Purpose

This guide explains how another program or LLM agent should invoke `objectglow` safely and predictably.

Use this document when you need to:

- process a single image through the CLI
- collect structured progress updates
- run many item jobs as a backend-managed batch
- distinguish success, warnings, and failures at the subprocess boundary

This guide is written for machine operators, backend workers, and agentic tooling, not for human end users.

## Recommended Execution Model

Use `objectglow` as a **per-item worker**.

The recommended architecture is:

- your backend owns queueing
- your backend creates one job per media item
- each queued job launches one `objectglow` subprocess
- your backend reads `stdout` as JSONL progress
- your backend reads `stderr` as human/debug logs
- your backend aggregates many per-item jobs into batch progress

Do not treat `objectglow` as the batch orchestrator.

## Available Entry Points

You can activate the CLI through any of these entry points:

1. Wrapper script:

```bash
./bin/objectglow ...
```

2. Installed console script:

```bash
objectglow ...
```

3. Alternate installed name:

```bash
itemcutout ...
```

4. Module invocation:

```bash
python -m itemcutout ...
```

For external callers, prefer `./bin/objectglow` from the repo checkout or the installed `objectglow` script in a managed runtime environment.

## Input Surface

The CLI accepts:

- one required positional `input_path`
- optional render/output flags
- optional structured progress flags

### Positional input

```bash
objectglow <input_path>
```

`input_path` may be:

- a single image file
- a directory of images

### Output and render flags

- `--output <path>`
- `--recursive`
- `--legacy-transparent-png`
- `--random-token-combinator`
- `--preset <name>`
- `--background-token <name>`
- `--glow-token <name>`
- `--accent-token <name>`
- `--size <pixels>`
- `--padding <ratio>`
- `--webp-quality <0-100>`

### Structured progress flags

- `--progress-format jsonl`
- `--run-id <job-id>`
- `--media-id <media-id>`
- `--batch-id <batch-id>`

When `--progress-format jsonl` is enabled:

- `--run-id` is required
- `--media-id` is required
- `--batch-id` is optional
- directory input is rejected

## Output Channels

The subprocess uses the channels like this:

- `stdout`: machine-readable JSON Lines only, when `--progress-format jsonl` is enabled
- `stderr`: human-readable operational logs

If you are a backend or another agent, do not parse `stderr` as structured state.

## Exit Codes

Use both exit code and terminal JSON event.

Current exit semantics:

- `0`: success
- `1`: processing failure or unsupported/no valid inputs
- `2`: runtime dependency/setup failure before processing
- `127`: wrapper could not find an executable Python interpreter

When JSONL mode is enabled, prefer the final `job_completed` or `job_failed` event as the structured source of truth, with exit code as a secondary guardrail.

## Canonical Single-Item Contract Invocation

For backend-owned queues, use this shape:

```bash
./bin/objectglow "/abs/path/to/input.jpg" \
  --output "/abs/path/to/output.webp" \
  --progress-format jsonl \
  --run-id "job-123" \
  --media-id "media-456" \
  --batch-id "batch-789"
```

This is the preferred subprocess contract.

## JSONL Protocol

Each `stdout` line is one complete JSON object.

The envelope contains:

- `protocolVersion`
- `event`
- `timestamp`
- `runId`
- `mediaId`
- optional `batchId`
- `stage`
- `message`

Additional fields may include:

- `progressPercent`
- `stageCurrent`
- `stageTotal`
- `outputPath`
- `errorCode`
- `details`
- `elapsedSeconds`
- `inputDimensions`
- `outputDimensions`
- `glowApplied`
- `glowColor`
- `background`
- `glow`
- `accent`
- `renderKey`
- `finalAsset`

### Event types currently emitted

- `job_started`
- `stage_started`
- `stage_progress`
- `stage_completed`
- `job_completed`
- `job_failed`

`warning` is part of the contract directionally, but the current implementation does not yet emit real warning events.

### Stable stage taxonomy

The current stages are:

- `preflight`
- `load_input`
- `segment`
- `composite`
- `render_glow`
- `encode_output`
- `write_output`
- `finalize`

## Example JSONL Stream

Example success flow:

```json
{"protocolVersion":1,"event":"job_started","timestamp":"2026-04-03T18:10:12.000Z","runId":"job-123","mediaId":"media-456","batchId":"batch-789","stage":"preflight","message":"Processing started","progressPercent":0,"stageCurrent":0,"stageTotal":1,"outputPath":"/abs/out/item.webp"}
{"protocolVersion":1,"event":"stage_started","timestamp":"2026-04-03T18:10:12.010Z","runId":"job-123","mediaId":"media-456","batchId":"batch-789","stage":"load_input","message":"Loading input image"}
{"protocolVersion":1,"event":"stage_progress","timestamp":"2026-04-03T18:10:12.035Z","runId":"job-123","mediaId":"media-456","batchId":"batch-789","stage":"segment","message":"Removing background","progressPercent":38,"stageCurrent":3,"stageTotal":8}
{"protocolVersion":1,"event":"stage_completed","timestamp":"2026-04-03T18:10:12.040Z","runId":"job-123","mediaId":"media-456","batchId":"batch-789","stage":"write_output","message":"Writing output image to disk","progressPercent":88,"stageCurrent":7,"stageTotal":8}
{"protocolVersion":1,"event":"job_completed","timestamp":"2026-04-03T18:10:12.050Z","runId":"job-123","mediaId":"media-456","batchId":"batch-789","stage":"finalize","message":"Processing complete","progressPercent":100,"stageCurrent":1,"stageTotal":1,"outputPath":"/abs/out/item.webp","elapsedSeconds":0.2512,"inputDimensions":{"width":1200,"height":900},"outputDimensions":{"width":1024,"height":1024},"glowApplied":true,"glowColor":"#4de2ff","background":"midnight","glow":"standard","accent":"cyanCore","renderKey":"midnight-standard-cyanCore","finalAsset":true}
```

Example failure flow:

```json
{"protocolVersion":1,"event":"job_started","timestamp":"2026-04-03T18:15:10.000Z","runId":"job-124","mediaId":"media-457","stage":"preflight","message":"Processing started","progressPercent":0,"stageCurrent":0,"stageTotal":1,"outputPath":"/abs/out/item.webp"}
{"protocolVersion":1,"event":"job_failed","timestamp":"2026-04-03T18:15:10.090Z","runId":"job-124","mediaId":"media-457","stage":"finalize","message":"Background removal produced an empty alpha mask.","errorCode":"EMPTY_MASK","outputPath":"/abs/out/item.webp","details":{"exceptionType":"EmptyMaskError","partialOutputDetected":false}}
```

## Common Workflows

### 1. Minimal single-file invocation

Use this for local/manual processing when you do not need structured progress.

```bash
./bin/objectglow "./images/widget.png"
```

Behavior:

- writes output to `~/Downloads` by default
- writes human-readable logs to `stderr`
- does not emit JSONL unless requested

### 2. Single-file invocation with explicit output path

```bash
./bin/objectglow "./images/widget.png" \
  --output "./derived/widget.webp"
```

Use this when your caller already chose a deterministic destination path.

### 3. Contract-mode single item for a queue worker

```bash
./bin/objectglow "/srv/uploads/originals/media-456.jpg" \
  --output "/srv/uploads/processed/media-456.webp" \
  --progress-format jsonl \
  --run-id "job-123" \
  --media-id "media-456"
```

Use this for production orchestration.

### 4. Contract-mode single item with batch correlation

```bash
./bin/objectglow "/srv/uploads/originals/media-456.jpg" \
  --output "/srv/uploads/processed/media-456.webp" \
  --progress-format jsonl \
  --run-id "job-123" \
  --media-id "media-456" \
  --batch-id "batch-789"
```

Use this if the current item job belongs to a higher-level selected batch.

### 5. Single item with explicit render tokens

```bash
./bin/objectglow "/srv/uploads/originals/media-456.jpg" \
  --output "/srv/uploads/processed/media-456.webp" \
  --progress-format jsonl \
  --run-id "job-123" \
  --media-id "media-456" \
  --background-token plasma \
  --glow-token reactor \
  --accent-token mint
```

Use explicit tokens when you need deterministic styling from the caller.

### 6. Single item with preset

```bash
./bin/objectglow "/srv/uploads/originals/media-456.jpg" \
  --output "/srv/uploads/processed/media-456.webp" \
  --preset dreamscape
```

### 7. Single item with transparent PNG output

```bash
./bin/objectglow "/srv/uploads/originals/media-456.jpg" \
  --output "/srv/uploads/processed/media-456.png" \
  --legacy-transparent-png
```

Use this only when an older downstream expects transparent PNG. It is not the primary integration path.

### 8. Manual directory batch run

```bash
./bin/objectglow "./images" \
  --recursive \
  --output "./derived"
```

Behavior:

- processes all supported images under the directory
- writes human-readable progress to `stderr`
- returns a summary at the end
- does not support JSONL contract mode

This mode is useful for local operator workflows, not for backend queue integration.

## How Batching Should Work

### Recommended backend pattern

Do this:

1. Select N item/media records in your backend.
2. Create one queue job per item.
3. For each job, launch one `objectglow` subprocess in single-item mode.
4. Attach `runId`, `mediaId`, and optional shared `batchId`.
5. Read each subprocess `stdout` independently as JSONL.
6. Update per-item job state from terminal events.
7. Compute aggregate batch progress in your backend.
8. Stream aggregate progress to the frontend from the backend, not from `objectglow`.

Do not do this:

- do not pass a directory to JSONL mode
- do not multiplex many items through one `objectglow` process expecting per-item JSON events
- do not rely on `stderr` for state

### Example batch fan-out

Suppose batch `batch-789` contains three items.

Launch three separate subprocesses:

```bash
./bin/objectglow "/srv/in/media-001.jpg" --output "/srv/out/media-001.webp" --progress-format jsonl --run-id "job-001" --media-id "media-001" --batch-id "batch-789"
./bin/objectglow "/srv/in/media-002.jpg" --output "/srv/out/media-002.webp" --progress-format jsonl --run-id "job-002" --media-id "media-002" --batch-id "batch-789"
./bin/objectglow "/srv/in/media-003.jpg" --output "/srv/out/media-003.webp" --progress-format jsonl --run-id "job-003" --media-id "media-003" --batch-id "batch-789"
```

Your backend should then aggregate these as:

- per-item status: from each item’s latest event stream state
- batch completed count: number of `job_completed`
- batch failed count: number of `job_failed`
- batch progress percent: a weighted aggregate derived from each item’s latest `progressPercent`

### Example aggregate strategy

A practical backend calculation:

- queued item with no event yet: `0%`
- running item: latest `progressPercent`
- completed item: `100%`
- failed item: either keep last progress or mark terminal and exclude from remaining expected work, depending on product choice

Then:

```text
batchProgress = average(itemProgress across all selected items)
```

That is a backend concern, not an `objectglow` concern.

## Parsing Guidance for Another Agent

If you are writing an LLM agent or tool wrapper:

1. Spawn the subprocess with separate `stdout` and `stderr` pipes.
2. If using contract mode, parse `stdout` line by line as JSON.
3. Reject partial or malformed lines as transport errors.
4. Treat `job_completed` and `job_failed` as terminal structured events.
5. Also observe process exit code.
6. Persist the final terminal event payload.
7. Store `stderr` for debugging, but do not derive authoritative job state from it.

## Python Pseudocode Example

```python
import json
import subprocess

cmd = [
    "./bin/objectglow",
    "/srv/uploads/originals/media-456.jpg",
    "--output", "/srv/uploads/processed/media-456.webp",
    "--progress-format", "jsonl",
    "--run-id", "job-123",
    "--media-id", "media-456",
    "--batch-id", "batch-789",
]

proc = subprocess.Popen(
    cmd,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1,
)

terminal_event = None

for line in proc.stdout:
    event = json.loads(line)
    # Persist progress and update backend state here.
    if event["event"] in {"job_completed", "job_failed"}:
        terminal_event = event

exit_code = proc.wait()
stderr_text = proc.stderr.read()

if terminal_event is None:
    raise RuntimeError(f"Missing terminal event; exit_code={exit_code}; stderr={stderr_text}")
```

## Shell Capture Example

```bash
./bin/objectglow "/srv/in/media-456.jpg" \
  --output "/srv/out/media-456.webp" \
  --progress-format jsonl \
  --run-id "job-123" \
  --media-id "media-456" \
  > progress.jsonl \
  2> objectglow.log
```

## Validation Rules to Remember

- JSONL mode only supports a single file input
- `--run-id` and `--media-id` are mandatory in JSONL mode
- output extension should match export mode
- unsupported or missing input files fail before useful processing begins

## Environment Notes

The bash wrapper also depends on:

- `OBJECTGLOW_PYTHON`: optional override for the Python interpreter
- a valid local environment with `Pillow` and `rembg`

If the wrapper cannot find a Python interpreter, it exits `127`.

## Recommended Default for Other Agents

If you are another agent integrating this CLI, default to this policy:

- always use absolute paths
- always set `--output`
- always use `--progress-format jsonl` for backend jobs
- always provide `--run-id` and `--media-id`
- provide `--batch-id` when the job belongs to a selected batch
- parse `stdout` only
- log `stderr`
- treat each subprocess as exactly one media-item worker

## Short Version

The safe production invocation is:

```bash
./bin/objectglow INPUT_FILE \
  --output OUTPUT_FILE \
  --progress-format jsonl \
  --run-id JOB_ID \
  --media-id MEDIA_ID \
  [--batch-id BATCH_ID]
```

Use one subprocess per item. Aggregate batch state outside `objectglow`.
