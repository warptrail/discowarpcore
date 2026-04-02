# objectGlow Part 4 Runtime Test Plan

## Endpoint
`POST http://localhost:5002/api/media/process-test`

## Test Data Prep
- Pick one real existing source image path on the backend host, for example:
  - `/absolute/path/to/existing/input.jpg`
- Pick one writable output path, for example:
  - `/absolute/path/to/output/processed.webp`

## 1) Happy Path
### Request JSON
```json
{
  "inputPath": "/absolute/path/to/existing/input.jpg",
  "outputPath": "/absolute/path/to/output/processed.webp"
}
```

### curl
```bash
curl -sS -X POST http://localhost:5002/api/media/process-test \
  -H 'Content-Type: application/json' \
  -d '{
    "inputPath": "/absolute/path/to/existing/input.jpg",
    "outputPath": "/absolute/path/to/output/processed.webp"
  }'
```

### Expected Response (shape)
```json
{
  "ok": true,
  "data": {
    "status": "...",
    "inputPath": "...",
    "outputPath": "...",
    "elapsedSeconds": 0,
    "inputDimensions": { "width": 0, "height": 0 },
    "outputDimensions": { "width": 0, "height": 0 },
    "glowApplied": true,
    "glowColor": "..."
  }
}
```
(Values may be `null` for optional fields; required keys are `status`, `inputPath`, `outputPath`.)

## 2) Nonexistent Input Path
### Request JSON
```json
{
  "inputPath": "/definitely/not/real/missing-file.jpg",
  "outputPath": "/tmp/objectglow-test/missing-case.webp"
}
```

### curl
```bash
curl -sS -X POST http://localhost:5002/api/media/process-test \
  -H 'Content-Type: application/json' \
  -d '{
    "inputPath": "/definitely/not/real/missing-file.jpg",
    "outputPath": "/tmp/objectglow-test/missing-case.webp"
  }'
```

### Expected Response (shape)
```json
{
  "ok": false,
  "error": {
    "code": "OBJECT_GLOW_PROCESS_FAILED",
    "message": "...",
    "exitCode": null,
    "stderr": "",
    "stdoutSnippet": "",
    "inputPath": "...",
    "outputPath": "..."
  }
}
```
(HTTP status should be `502` for service-thrown failures.)

## 3) objectGlow Invocation Failure Path
Use a valid input file, but start backend with a bad module name so subprocess start/invocation fails:

```bash
OBJECT_GLOW_MODULE=module_that_does_not_exist npm run dev
```

### Request JSON
```json
{
  "inputPath": "/absolute/path/to/existing/input.jpg",
  "outputPath": "/tmp/objectglow-test/invoke-fail.webp"
}
```

### curl
```bash
curl -sS -X POST http://localhost:5002/api/media/process-test \
  -H 'Content-Type: application/json' \
  -d '{
    "inputPath": "/absolute/path/to/existing/input.jpg",
    "outputPath": "/tmp/objectglow-test/invoke-fail.webp"
  }'
```

### Expected Response (shape)
```json
{
  "ok": false,
  "error": {
    "code": "OBJECT_GLOW_PROCESS_FAILED",
    "message": "...",
    "exitCode": 1,
    "stderr": "...",
    "stdoutSnippet": "...",
    "inputPath": "...",
    "outputPath": "..."
  }
}
```
(`exitCode` may be `null` in spawn/start failures; otherwise non-zero on subprocess failure.)

## Filesystem Side Effects to Check
- Happy path:
  - Output directory exists (created recursively if needed).
  - Output `.webp` file exists at `outputPath`.
- Nonexistent input path:
  - No output directory/file should be created (input validation happens before `mkdir`).
- Invocation failure path:
  - Output directory may exist (service creates it before spawning).
  - Output file should usually be absent; if present, verify it is not valid/final output.

## Logs/Stderr Signals to Inspect
- Primary diagnostics are in response `error` payload:
  - `error.stderr`
  - `error.stdoutSnippet`
  - `error.message` (e.g., non-zero exit, signal termination, bad JSON)
- If timeout occurs, expect message containing: `timed out after ...ms`.

## Environment Assumptions
- Backend is running on `localhost:5002`.
- Backend process has access to valid `MONGO_URI` so server starts.
- `python3` is available to backend process.
- `itemcutout` is importable in that Python environment for happy-path runs.
- Input file paths are absolute, readable by backend process.
- Output path parent location is writable by backend process.
