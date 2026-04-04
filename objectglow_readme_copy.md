# itemcutout

`itemcutout` now installs a standalone `objectglow` command for local use, while still exposing the core `process_image(...)` pipeline for programmatic callers such as Discowarpcore.

For agent-oriented CLI operation and backend subprocess usage, see [CLI_AGENT_GUIDE.md](./CLI_AGENT_GUIDE.md).

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -e .
```

This installs both:

- `objectglow`
- `itemcutout`

They point at the same CLI entrypoint.

## CLI Usage

The CLI accepts exactly one positional input path:

```bash
objectglow <input-path>
```

`<input-path>` can be:

- a single image file
- a directory of images

If you pass a directory, the CLI processes every supported image in that directory. `--recursive` enables nested traversal.

Supported extensions scanned by default:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.heic`
- `.tif`
- `.tiff`
- `.bmp`

If you do not provide `--output`, files are written to `~/Downloads`.

## Default Output Behavior

Default mode writes dark-background WebP files with timestamped names:

- single file: `objectglow_YYYYMMDD_HHMMSS.webp`
- directory input: `objectglow_<source-stem>_YYYYMMDD_HHMMSS.webp`

If a name collides during a fast batch run, the CLI appends a numeric suffix.

## Cutout Input Modes

The pipeline now has two mask-acquisition modes:

- standard mode: load the source image, run segmentation, validate the generated alpha mask, then continue through framing, optional rotation, glow, compositing, and export
- `--skip-cutout` mode: load the source image, validate its existing alpha channel, derive the subject mask directly from that alpha, then continue through the same downstream framing, optional rotation, glow, compositing, and export stages

`--skip-cutout` is intended for already-cut-out PNG inputs with transparency. It fails fast when:

- the source is not a PNG
- the image has no alpha channel
- the alpha channel is empty or uniform enough to be unusable as a subject mask

This mode skips segmentation entirely, including the `rembg` dependency path.

## Smart Rotation

Automatic rotation is still enabled by default, but it is now conservative:

- roughly square or moderately balanced subjects stay in their supplied orientation
- auto-rotation only activates when the subject bounding box is clearly elongated
- both very wide and very tall subjects are handled by the same aspect-ratio check

The default rotate threshold is `2.25`, meaning the subject bounding box must be at least `2.25:1` in either direction before the framing logic considers rotated candidates.

Use `--skip-auto-rotate` to preserve the supplied orientation exactly.

Use `--rotate-threshold <ratio>` to override the elongation threshold. Higher values rotate less often; lower values rotate more aggressively.

## Token Resolution

Token resolution is centralized in `itemcutout.render_tokens.resolve_token_selection(...)`.

Precedence is:

1. explicit token flags: `--background-token`, `--glow-token`, `--accent-token`
2. `--preset`
3. `--random-token-combinator`
4. built-in defaults

Available presets:

- `default`
- `reactor`
- `dreamscape`
- `afterburn`

## Legacy Transparent PNG Mode

`--legacy-transparent-png` switches only the export mode:

- output format becomes transparent PNG
- filename extension becomes `.png`
- the opaque dark background composite is skipped

Token resolution still follows the normal precedence rules.

## Options

- `-o`, `--output`: output file or output directory override
- `--recursive`: recurse into nested folders for directory input
- `--legacy-transparent-png`: export transparent PNG instead of WebP
- `--skip-cutout`: use the input's existing alpha channel as the subject mask and skip segmentation
- `--skip-auto-rotate`: disable automatic framing rotation
- `--rotate-threshold <ratio>`: minimum subject aspect ratio required before auto-rotation is considered, default `2.25`
- `--random-token-combinator`: choose a valid token combination per image
- `--preset <name>`: apply a named token preset
- `--background-token <name>`: explicit background token override
- `--glow-token <name>`: explicit glow token override
- `--accent-token <name>`: explicit accent token override
- `--size <px>`: output square size, default `1024`
- `--padding <ratio>`: subject padding ratio, default `0.10`
- `--webp-quality <0-100>`: WebP quality, default `90`
- `--progress-format jsonl`: emit machine-readable JSONL progress events on stdout
- `--run-id <id>`: required with `--progress-format jsonl`
- `--media-id <id>`: required with `--progress-format jsonl`
- `--batch-id <id>`: optional correlation identifier with `--progress-format jsonl`

## Structured Subprocess Contract

When invoked with `--progress-format jsonl`, `objectglow` behaves as a per-item worker for backend orchestration:

- `stdout` emits one JSON object per line and flushes after each event
- `stderr` carries human-readable logs
- `--run-id` and `--media-id` are required
- directory inputs are rejected in JSONL mode
- emits `job_queued` before `job_started` so callers can reflect loading/queue state
- emits `elapsedSeconds` on all events and approximate `etaSecondsRemaining` on in-flight progress events

Example:

```bash
objectglow ./images/widget.png \
  --output ./derived/widget.webp \
  --progress-format jsonl \
  --run-id job-123 \
  --media-id media-456 \
  --batch-id batch-789
```

## Examples

Single file, default output to `~/Downloads`:

```bash
objectglow ./images/widget.png
```

Pre-cutout PNG input:

```bash
objectglow ./images/cutout.png --skip-cutout
```

Pre-cutout PNG input with rotation fully preserved:

```bash
objectglow ./images/cutout.png --skip-cutout --skip-auto-rotate
```

Default processing with conservative smart rotation:

```bash
objectglow ./images/spear.jpg
```

Explicit rotate-threshold override:

```bash
objectglow ./images/spear.jpg --rotate-threshold 2.5
```

Directory run to `~/Downloads`:

```bash
objectglow ./images
```

Recursive directory run to a custom output folder:

```bash
objectglow ./images --recursive --output ./derived
```

Legacy transparent PNG output:

```bash
objectglow ./images/widget.png --legacy-transparent-png
```

Random valid token combinations:

```bash
objectglow ./images --random-token-combinator
```

Preset plus explicit override:

```bash
objectglow ./images/widget.png --preset dreamscape --accent-token gold
```

Fully explicit tokens:

```bash
objectglow ./images/widget.png \
  --background-token plasma \
  --glow-token reactor \
  --accent-token mint
```

## Programmatic Use

Discowarpcore can keep using the reusable processing layer directly:

```python
from pathlib import Path

from itemcutout import ProcessImageOptions, process_image, resolve_export_mode

result = process_image(
    input_path=Path("input.png"),
    output_path=Path("output.webp"),
    options=ProcessImageOptions(
        background="midnight",
        glow="standard",
        accent="cyanCore",
        export_mode=resolve_export_mode(legacy_transparent_png=False),
    ),
)
```

## Tests

```bash
python3 -m unittest discover -s tests -v
```
