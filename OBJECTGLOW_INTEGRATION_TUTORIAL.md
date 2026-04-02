# OBJECTGLOW Integration Tutorial

This document is the practical integration guide for using `objectGlow` as a standalone image-processing engine inside a future Node.js app or Python app.

It is based on the pattern already proven in Discowarpcore, but written to be reusable in any host application.

## 1. What objectGlow Is

`objectGlow` is a headless image-processing engine.

Use it like this:

- input image in
- processed image out
- optional render controls in between

Important mental model:

- `objectGlow` does not need a UI.
- `objectGlow` should not own your app's database records.
- `objectGlow` should not decide when processing happens.
- Your host app owns orchestration, storage, metadata, and retries.
- `objectGlow` just transforms image files.

Current usable forms:

- local CLI command: `objectglow`
- subprocess target from another app
- Python package import via `itemcutout`

In practice, treat it as a pure boundary:

```text
host app chooses source file
-> objectGlow processes it
-> host app stores and references the result
```

## 2. Integration Patterns

### A. Node.js App -> Python Subprocess

This is usually the simplest integration path.

Why:

- your Node app stays in Node
- `objectGlow` stays in Python
- the contract stays file-based and stable
- deployment is straightforward if you pin the Python environment

Recommended subprocess target:

- preferred: `<objectGlowRepo>/bin/objectglow`
- fallback: `<objectGlowRepo>/.venv/bin/python -m itemcutout`

Why the launcher script is better:

- it forces the repo-local `.venv`
- it forces `PYTHONPATH` to the local `src/`
- it avoids accidentally calling a stale globally installed package

Recommended inputs from Node:

- absolute `inputPath`
- absolute `outputPath`
- optional `--preset`
- optional explicit token flags
- optional `--size`
- optional `--webp-quality`
- optional `--legacy-transparent-png`

What success should mean in the host app:

- subprocess exits with code `0`
- expected output file exists
- output file is non-empty

What failure should mean:

- non-zero exit code
- spawn failure
- timeout
- missing output file even after exit `0`

Capture both:

- `stdout` for logs
- `stderr` for errors and operator debugging

### B. Python App -> Direct Import or Internal Call

This is preferable when your host app is already Python.

Use direct import when:

- you want one process instead of subprocess orchestration
- you want native exceptions
- you want your app code to stay close to the rendering options
- you may later build batch or queue logic around the same function

Use the stable API:

```python
from itemcutout import ProcessImageOptions, process_image, resolve_export_mode
```

Keep the processing logic reusable by wrapping it in one app-local adapter function such as:

- `render_product_image(...)`
- `process_media_asset(...)`
- `build_glow_variant(...)`

That wrapper should:

- validate paths
- resolve app-level defaults
- call `process_image(...)`
- translate exceptions into your app's error model

### C. CLI / Manual Workflow

Use the CLI directly before wiring anything into an app.

This is useful for:

- confirming the environment actually works
- testing token combinations
- reproducing production failures
- checking whether WebP export works on a target machine
- debugging a bad image without involving app code

Manual testing should be the first thing you do in a new environment.

## 3. Recommended Architecture

Recommended system boundary:

- host app stores originals
- host app decides when processing runs
- `objectGlow` transforms images
- host app stores and references outputs

Preferred ownership split:

- host app owns upload flow
- host app owns DB state
- host app owns job queues
- host app owns retry policy
- host app owns user-facing status
- `objectGlow` owns rendering internals only

Do not make `objectGlow` own:

- app models
- app database writes
- business rules
- asset lifecycle policy

Do not turn `objectGlow` into a web service unless there is a strong reason.

Reasons to keep it as an engine first:

- simpler deployment
- less coupling
- easier local debugging
- fewer moving parts
- easier reuse from multiple host apps

## 4. Required Inputs and Outputs

Think of the processing contract like this:

Required:

- `inputPath`
- `outputPath`

Optional:

- preset
- explicit tokens
- output size
- padding
- WebP quality
- legacy PNG mode

Default modern output:

- square image
- WebP
- dark opaque background
- centered subject
- glow applied

Legacy compatibility mode:

- transparent PNG via `--legacy-transparent-png`

Important integration rule:

- the host app should always decide the output path
- `objectGlow` should not be responsible for naming app-owned files

## 5. Token / Preset Handling

This is the actual precedence used by `objectGlow`:

1. explicit token flags
2. preset
3. random token combinator
4. built-in defaults

Current preset names:

- `default`
- `reactor`
- `dreamscape`
- `afterburn`

Current modes to think about:

### Explicit Token Override Mode

Use when the host app wants exact rendering control.

Example:

- `--background-token plasma`
- `--glow-token reactor`
- `--accent-token mint`

Best for:

- admin tools
- deterministic rendering
- saved render settings
- regeneration of an existing asset

### Preset Mode

Use when the host app should expose simple style choices instead of raw tokens.

Best for:

- UI with a small number of named looks
- product-level style controls
- safer public-facing configuration

### Random Token Combinator Mode

Use when variation matters more than exact control.

Best for:

- experiments
- content generation
- one-click style variety

Do not use it if you need deterministic re-renders unless you also persist the chosen tokens afterward.

### Practical Recommendation

Expose presets in most host apps.

Expose raw tokens only when:

- the user is advanced
- you need fine-grained control
- you plan to persist and replay exact rendering choices

Keep token details internal when:

- the app just needs one branded default look
- you want to avoid UI complexity
- consistency matters more than customization

If your host app already has its own defaults, pass explicit tokens and do not rely on package defaults.

## 6. Filesystem and Deployment Advice

### Local Development Machine

Recommended setup inside the `objectGlow` repo:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -e .
```

Then verify:

```bash
./bin/objectglow --help
```

Advice:

- keep `objectGlow` in its own repo or directory
- use absolute paths when integrating from another app
- avoid assuming the current working directory
- keep originals and processed outputs in separate directories

### Deployed Linux / Server Machine

Use explicit interpreter and repo paths.

Good pattern:

- deploy `objectGlow` into a known directory
- create a repo-local `.venv`
- invoke `<repo>/bin/objectglow`

Avoid:

- plain `python3 -m itemcutout` from arbitrary shells
- depending on whichever Python happens to be first in `PATH`
- hardcoded home-directory assumptions in app code

Deployment checklist:

- Python installed
- virtualenv created
- package installed with `-e .` or installed intentionally another way
- calling user can read source images
- calling user can create output directories
- calling user can write processed files
- target machine can export WebP successfully

Path handling rules:

- keep paths absolute once they cross the app boundary
- do not hardcode Mac-specific paths in production
- do not assume `/tmp` is persistent
- create output directories before invoking processing

WebP validation:

- run one real command on the target machine
- confirm the result is actually `.webp`
- confirm the output opens and is non-empty

## 7. Step-by-Step Integration Recipe

Use this order. Do not skip ahead.

1. Confirm `objectGlow` runs standalone.

```bash
<objectGlowRepo>/bin/objectglow /absolute/path/to/input.png --output /absolute/path/to/output.webp
```

2. Define your storage boundary.

- where originals live
- where processed outputs live
- who generates filenames

3. Choose the integration style.

- Node app: subprocess
- Python app: direct import unless subprocess is operationally simpler

4. Wire one single-image happy path only.

- one known-good input
- one explicit output path
- one synchronous call
- no batch logic yet

5. Add output verification.

- check exit code
- check output file exists
- check file size is non-zero

6. Add structured app-level error handling.

- bad input path
- process start failure
- timeout
- token validation error
- write failure

7. Add logging.

- input path
- output path
- selected preset or tokens
- elapsed time
- stderr on failure

8. Add batch support only after the single-image path is reliable.

9. Persist tokens only if you need deterministic regeneration later.

10. Expose UI options last.

- presets first
- raw tokens only if genuinely needed

This order matters. The main mistake is trying to design the UI or queue system before proving the processing boundary on one image.

## 8. Node Example

This example uses `execFile`, passes explicit args, captures output, enforces a timeout, and verifies the file was actually written.

```js
const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

async function renderWithObjectGlow({
  objectGlowRepo,
  inputPath,
  outputPath,
  preset,
  tokens,
  size = 1024,
  webpQuality = 90,
  legacyTransparentPng = false,
  timeoutMs = 120000,
}) {
  const launcher = path.resolve(objectGlowRepo, 'bin', 'objectglow');
  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath);

  await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });

  const args = [
    resolvedInput,
    '--output',
    resolvedOutput,
    '--size',
    String(size),
    '--webp-quality',
    String(webpQuality),
  ];

  if (preset) {
    args.push('--preset', String(preset));
  }

  if (tokens?.background) {
    args.push('--background-token', String(tokens.background));
  }

  if (tokens?.glow) {
    args.push('--glow-token', String(tokens.glow));
  }

  if (tokens?.accent) {
    args.push('--accent-token', String(tokens.accent));
  }

  if (legacyTransparentPng) {
    args.push('--legacy-transparent-png');
  }

  let stdout = '';
  let stderr = '';

  try {
    const result = await execFileAsync(launcher, args, {
      cwd: path.resolve(objectGlowRepo),
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 8,
    });

    stdout = result.stdout || '';
    stderr = result.stderr || '';
  } catch (error) {
    const details = {
      code: 'OBJECT_GLOW_PROCESS_FAILED',
      message: error.message,
      exitCode: Number.isInteger(error.code) ? error.code : null,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      inputPath: resolvedInput,
      outputPath: resolvedOutput,
    };

    throw Object.assign(new Error(`objectGlow failed: ${details.message}`), details);
  }

  let stat;
  try {
    stat = await fs.stat(resolvedOutput);
  } catch {
    throw Object.assign(
      new Error('objectGlow exited successfully but output file is missing'),
      {
        code: 'OBJECT_GLOW_OUTPUT_MISSING',
        stdout,
        stderr,
        inputPath: resolvedInput,
        outputPath: resolvedOutput,
      }
    );
  }

  if (!stat.isFile() || stat.size <= 0) {
    throw Object.assign(
      new Error('objectGlow produced an empty output file'),
      {
        code: 'OBJECT_GLOW_OUTPUT_INVALID',
        stdout,
        stderr,
        inputPath: resolvedInput,
        outputPath: resolvedOutput,
      }
    );
  }

  return {
    outputPath: resolvedOutput,
    bytes: stat.size,
    stdout,
    stderr,
  };
}
```

Recommended Node usage pattern:

- keep this in a small adapter module
- call it from your service layer
- do not scatter subprocess logic through route handlers

## 9. Python Example

Preferred Python integration is direct import.

```python
from pathlib import Path

from itemcutout import ProcessImageOptions, ProcessingError, process_image, resolve_export_mode


def render_with_objectglow(
    input_path: str,
    output_path: str,
    *,
    background: str = "midnight",
    glow: str = "standard",
    accent: str = "cyanCore",
    size: int = 1024,
    padding: float = 0.10,
    webp_quality: int = 90,
    legacy_transparent_png: bool = False,
):
    source = Path(input_path).expanduser().resolve()
    target = Path(output_path).expanduser().resolve()
    target.parent.mkdir(parents=True, exist_ok=True)

    options = ProcessImageOptions(
        output_size=size,
        padding=padding,
        background=background,
        glow=glow,
        accent=accent,
        webp_quality=webp_quality,
        export_mode=resolve_export_mode(
            legacy_transparent_png=legacy_transparent_png
        ),
    )

    try:
        result = process_image(
            input_path=source,
            output_path=target,
            options=options,
        )
    except ProcessingError as exc:
        raise RuntimeError(f"objectGlow processing failed: {exc}") from exc

    if not result.output_path.exists():
        raise RuntimeError(
            f"objectGlow reported success but output is missing: {result.output_path}"
        )

    return {
        "input_path": str(result.input_path),
        "output_path": str(result.output_path),
        "elapsed_seconds": result.elapsed_seconds,
        "render_key": result.render_key,
        "output_format": result.output_format,
        "glow_color": result.glow_color,
    }
```

If you need Python subprocess mode anyway, still prefer:

- `<repo>/bin/objectglow`

over:

- `python -m itemcutout`

for the same environment-isolation reasons.

## 10. Troubleshooting

### Wrong Python Interpreter

Symptoms:

- `ModuleNotFoundError`
- old behavior that does not match the repo
- command works on one machine but not another

Fix:

- call `<objectGlowRepo>/bin/objectglow`
- or call `<objectGlowRepo>/.venv/bin/python`
- avoid relying on global `python3`

### Missing Dependencies

Symptoms:

- import failures
- runtime dependency errors
- immediate exit before processing starts

Fix:

```bash
cd <objectGlowRepo>
python3 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -e .
```

### Permissions Issues

Symptoms:

- cannot read input file
- cannot create output directory
- cannot write output file

Fix:

- verify the app user can read originals
- verify the app user can write to processed output directories
- create directories explicitly before invocation

### Bad Input Paths

Symptoms:

- file not found
- unsupported input path
- subprocess exits quickly

Fix:

- resolve to absolute paths before calling
- verify the file exists
- verify the extension is supported

### Token Validation Failure

Symptoms:

- CLI argument errors
- Python exceptions about unknown tokens or presets

Fix:

- use approved preset names only
- use approved token names only
- do not let arbitrary UI strings pass straight through unchecked

Practical rule:

- if the host app exposes raw tokens, keep its allowed values in sync with `objectGlow`

### WebP Export Failure

Symptoms:

- processing fails only on one machine
- output file missing after apparent success
- PNG mode works but WebP does not

Fix:

- test one manual WebP run on the target machine
- confirm the Python environment has the required image stack
- confirm the host app verifies output existence after the process exits

### Slow Processing on Lower-Powered Machines

Symptoms:

- timeouts
- queue buildup
- long single-image latency

Fix:

- increase subprocess timeout
- reduce concurrency
- process in background jobs instead of request/response path
- avoid exposing large batch jobs through synchronous web requests

## 11. Design Lessons Learned

Main lesson from the Discowarpcore integration:

- `objectGlow` works best as a reusable engine with a small stable boundary

That means:

- host app owns orchestration
- host app owns storage
- host app owns business logic
- `objectGlow` stays focused on rendering internals

This keeps the integration durable. The less app-specific state you push into `objectGlow`, the easier it is to reuse in the next project.

## Recommended Default Path

For most future integrations, use this:

1. keep `objectGlow` in its own repo with its own `.venv`
2. from Node, call `<objectGlowRepo>/bin/objectglow` as a subprocess
3. pass absolute input and output paths
4. let the host app own filenames, DB state, and retries
5. expose presets first, not raw tokens

This is the easiest path because it preserves a tiny interface and avoids mixing Python internals into a Node codebase.

## Example Commands

Single file, default modern WebP:

```bash
./bin/objectglow /absolute/path/to/input.png --output /absolute/path/to/output.webp
```

Single file, preset-driven:

```bash
./bin/objectglow /absolute/path/to/input.png \
  --output /absolute/path/to/output.webp \
  --preset dreamscape
```

Single file, fully explicit tokens:

```bash
./bin/objectglow /absolute/path/to/input.png \
  --output /absolute/path/to/output.webp \
  --background-token reactor \
  --glow-token reactor \
  --accent-token mint
```

Legacy transparent PNG:

```bash
./bin/objectglow /absolute/path/to/input.png \
  --output /absolute/path/to/output.png \
  --legacy-transparent-png
```

Directory batch:

```bash
./bin/objectglow /absolute/path/to/input-dir \
  --recursive \
  --output /absolute/path/to/output-dir
```

## Checklist

- `objectGlow` runs manually on the target machine
- `.venv` exists and package installs cleanly
- host app uses absolute input and output paths
- output directories are created before processing
- host app checks exit code and verifies output file exists
- token strategy is decided: defaults, preset, or explicit tokens
- batch support is added only after single-image success
- UI exposure happens only after backend integration is stable
