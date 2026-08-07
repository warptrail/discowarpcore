# 🪩 Disco Warp Core

Disco Warp Core is a household inventory app for the eternal question:
**“Which box did we put that in?”**

It keeps track of boxes, drawers, baskets, shelves, cupboards, and the smaller
things hiding inside them. The goal is simple: make a home easier to remember
without turning daily life into a spreadsheet-maintenance job.

It is designed to run on a home server and be used over the home Wi-Fi. It is
LAN-only by design: this is not meant to be a public website, a cloud
subscription, or a service that quietly ships a household inventory to someone
else’s server. The data lives on the machines and network you control.

This is open-source work in progress. Some corners are polished, some are
experimental, and some still have the energy of a very capable garage robot
with one loose panel. That is part of the fun.

## What it is for

Disco Warp Core helps a household:

- remember what it owns;
- remember where that thing lives;
- put boxes inside boxes without losing the plot;
- share that knowledge between people in the home;
- find items by location, category, name, or photo; and
- avoid filling out the same inventory form forever.

The central idea is delightfully literal: **almost everything can be a box**.
A cardboard carton, a kitchen drawer, a storage bin, or a mysterious basket
under the bed can all be a container with things inside it.

Normal forms are still part of the app, and they are quite nice. Use them when
you already know exactly what you want to enter, when you are correcting a
record, or when you simply prefer careful hands-on control.

## The slightly magical photo workflow

Filling out a form for every object in a messy room is not anyone’s dream
Friday night. The project therefore has a branch-off extension called the
**Vision Intake TUI**. It is a terminal wizard meant to be used alongside a
ChatGPT Codex workflow.

The intended black-box protocol looks like this:

```text
take photographs → put them in a folder → run the TUI
→ let Codex annotate controlled JSON → validate → import
```

In ordinary day-speak:

1. Put photographs of your items in `~/Intake/inbox/`.
2. Start the Vision Intake TUI.
3. The TUI creates a resumable batch, preprocesses the photographs, and makes
   small JSON records for the images.
4. It generates a controlled `CODEX_AGENT_PROMPT.md` for the Codex session.
5. Codex looks at the processed images and fills in useful fields such as the
   item name, description, category, tags, and quantity.
6. Return to the TUI. It checks that the JSON and image keys match before it
   exports the batch or imports it through the backend API.

I do not pretend to understand every incantation inside this pipeline. The
honest description is: **photos go in, identified database entries come out,
and Codex does a suspicious amount of the paperwork**.

The important part is that the magic has boundaries. The TUI generates the
prompt, the prompt limits what Codex may edit, and validation happens before a
database import. Codex is not supposed to rummage around in the media folder or
write directly to MongoDB.

### What the Codex side is allowed to do

During annotation, the intended workflow is deliberately narrow:

- Codex edits JSON artifacts only.
- Codex does not rename, move, delete, or copy image files.
- Codex does not write directly to the backend media folder.
- Codex does not call backend APIs while annotating.
- The TUI validates the batch before packaging or importing it.

That separation keeps the visual work, structured data, and database import as
three understandable steps instead of one giant mystery button. If you do not
want the AI workflow, use the normal forms. They are there for exactly that.

## How ObjectGlow fits in

ObjectGlow is a separate companion project, not an npm package hidden inside
this repository. It is a headless Python image worker that turns an ordinary
item photo into a consistent derived image for the app:

```text
original photo
  → ObjectGlow removes the background and applies framing/glow
  → square WebP derivative
  → Disco Warp Core stores the original and the derived image
```

The original image remains the source of truth. ObjectGlow creates a replaceable
presentation asset. If processing fails, the original does not disappear; the
derived image can be retried.

### The naming trap

There are three names to keep straight:

| Name | Meaning |
| --- | --- |
| `objectiglow` | The separate repository folder; yes, it contains an `i`. |
| `objectglow` | The executable command inside that repository. |
| `itemcutout` | The Python package/module used by the executable. |

The normal output is a square dark-background WebP, usually `1024x1024`, with
the subject centered and a restrained neon glow. Legacy transparent PNG output
is also possible, but it is not the primary Disco Warp Core path.

### The three configuration names

The spelling difference is historical, not meaningful. Copy it carefully:

| Variable | Used by | Example |
| --- | --- | --- |
| `OBJECT_GLOW_REPO` | Express/backend media processing and the ObjectGlow smoke test | `/Volumes/Luna/Developer-Luna/objectiglow` |
| `OBJECTGLOW_REPO` | Vision Intake preprocessing and lower-level intake scripts | `/Volumes/Luna/Developer-Luna/objectiglow` |
| `OBJECTGLOW_BIN` | Optional direct override for the intake executable | `/Volumes/Luna/Developer-Luna/objectiglow/bin/objectglow` |

The backend variable has an underscore: `OBJECT_GLOW_REPO`. The intake TUI
variable does not: `OBJECTGLOW_REPO`.

### Development setup on the Mac

The current development checkout is expected at:

```text
/Volumes/Luna/Developer-Luna/objectiglow
```

Install its Python environment and dependencies once:

```bash
cd /Volumes/Luna/Developer-Luna/objectiglow
./scripts/bootstrap_objectglow.sh
./scripts/verify_objectglow_install.sh
```

The bootstrap script creates `.venv/`, installs the package in editable mode,
and installs the Python dependencies. It needs Python `3.11+` and network
access the first time so `pip` can download packages such as Pillow and
`rembg`.

Tell the Disco Warp Core backend where the worker lives by putting these values
in `backend/.env`:

```dotenv
OBJECT_GLOW_REPO=/Volumes/Luna/Developer-Luna/objectiglow
OBJECT_GLOW_MODULE=itemcutout
OBJECT_GLOW_TIMEOUT_MS=120000
```

Then run the integration smoke test from this repository:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run smoke:objectglow -- \
  --objectglow-repo /Volumes/Luna/Developer-Luna/objectiglow
```

The smoke test uses a generated temporary image, not a real inventory photo.
It verifies that the launcher can be found, the Python environment can run,
the JSONL subprocess protocol works, and a readable output image is created.

For the Vision Intake TUI, use the intake spelling when needed:

```bash
OBJECTGLOW_REPO=/Volumes/Luna/Developer-Luna/objectiglow \
npm run intake:tui
```

The TUI also knows the usual local paths. If the checkout is somewhere else,
set `OBJECTGLOW_REPO` explicitly.

### What happens during image processing

When an item image is processed, the Express backend launches
`bin/objectglow` as a subprocess. It sends one image at a time, listens for
JSONL progress events, and records the processing state. The worker creates the
derived asset; the backend owns storage, media records, retries, and status.

The Vision Intake preprocessing stage can accept `.jpg`, `.jpeg`, `.png`,
`.webp`, `.heic`, and `.heif`. It can convert HEIC/HEIF inputs, run one
ObjectGlow subprocess per image, write a preprocessing manifest, and pass the
processed images into the JSON/Codex stage.

For a lower-level manual run, the intake preprocessing command supports the
full glow renderer:

```bash
OBJECTGLOW_REPO=/Volumes/Luna/Developer-Luna/objectiglow \
node scripts/preprocess_vision_images.js \
  --source-dir ~/Intake/some-batch/raw \
  --output-dir ~/Intake/some-batch/processed \
  --render-mode objectglow \
  --output-mode webp
```

Use `--dry-run` while experimenting. Use `--objectglow-bin
/absolute/path/to/objectiglow/bin/objectglow` when you want to bypass repository
discovery entirely.

### Production setup on the home server

ObjectGlow lives outside the Disco Warp Core repository. The normal NeonAzoth
source deployment does not copy it, and it deliberately does not overwrite
production `.env` files. Install or update the worker separately.

From the ObjectGlow checkout on the Mac, make a verified transfer archive:

```bash
cd /Volumes/Luna/Developer-Luna/objectiglow
./scripts/build_transfer_archive.sh
```

The archive leaves out the Python virtual environment, generated images,
caches, and other machine-local material. Copy the archive whose name the
script prints, then unpack it on NeonAzoth:

```bash
scp transfer_dist/<archive-name>.tar.gz neonazoth:/tmp/
ssh neonazoth 'mkdir -p ~/services && \
  tar -xzf /tmp/<archive-name>.tar.gz -C ~/services'
ssh neonazoth 'cd ~/services/objectiglow && \
  ./scripts/bootstrap_objectglow.sh && \
  ./scripts/verify_objectglow_install.sh'
```

The archive contains a top-level `objectiglow/` directory, so unpacking it in
`~/services` creates this layout:

```text
/home/warptrail/services/objectiglow
/home/warptrail/services/objectiglow/bin/objectglow
/home/warptrail/services/objectiglow/.venv/bin/python
```

On the home server, back up and edit the production backend environment file:

```bash
ssh neonazoth
cd ~/discowarpcore
cp backend/.env "backend/.env.backup-$(date +%Y%m%d-%H%M%S)"
nano backend/.env
```

Set or update these non-secret values:

```dotenv
OBJECT_GLOW_REPO=/home/warptrail/services/objectiglow
OBJECT_GLOW_MODULE=itemcutout
OBJECT_GLOW_TIMEOUT_MS=120000
```

Do not commit `backend/.env`, copy the Mac’s MongoDB state to production, or
point production at a `/Volumes/...` path. The worker path must exist on
NeonAzoth itself.

Verify both the worker and the app integration path:

```bash
ssh neonazoth 'cd ~/services/objectiglow && \
  ./scripts/verify_objectglow_install.sh'
ssh neonazoth 'cd ~/discowarpcore && \
  npm run smoke:objectglow -- \
    --objectglow-repo /home/warptrail/services/objectiglow'
```

Environment files are read when Node starts. After changing
`OBJECT_GLOW_REPO`, restart the existing production backend through whatever
process/session currently owns it. Do not start a second unmanaged `npm start`
on the same port. The deployment TUI syncs, installs, builds, and health-checks;
it does not restart an unknown remote process.

If image processing fails, check the executable, Python environment, and smoke
test in that order. A path existing on disk is not enough; the smoke test must
actually create an output image. Common causes are a missing virtual
environment, missing Python dependencies or models, the wrong environment
variable spelling, or a backend process that has not been restarted after its
configuration changed.

## Run it at home

### What you need

You need:

- Node.js and npm;
- MongoDB running locally or available to the configured backend; and
- a machine on the home LAN to act as the server.

Install the root and frontend dependencies from the project directory:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run install:all
```

### Start the local app with Tarot

Tarot is the project’s operator interface. It is the control plane that knows
how the local MongoDB, Express backend, and React/Vite frontend fit together.
It does not replace the app; it keeps the machinery from becoming three
terminals and a small séance.

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run tarot
```

The local service contract is:

| Service | Address | Purpose |
| --- | --- | --- |
| MongoDB | `127.0.0.1:27017` | Local persistence. |
| Express API | `http://127.0.0.1:7610` | Backend and health endpoint. |
| React/Vite | `http://localhost:7611` | Browser-facing local app. |

Useful Tarot commands include:

```text
status              # service state and ports
health              # call declared health endpoints
ports               # show port geography
links               # show localhost and LAN links
logs backend        # inspect backend output
logs frontend       # inspect frontend output
restart backend     # restart this project’s backend
restart frontend    # restart this project’s frontend
```

There are three different terminal interfaces in this project:

| Interface | Command | Job |
| --- | --- | --- |
| Tarot local dock | `npm run tarot` | Starts and controls the local MongoDB/backend/frontend stack. |
| Vision Intake TUI | `npm run intake:tui` | Turns item photographs into validated batches, with the Codex handoff in the middle. |
| NeonAzoth Control Station | `npm run neonazoth:tui` | Syncs and deploys the app to the remote home server. |

If you are starting the app, use Tarot. If you are processing photos, use
Vision Intake. If you are sending code to the home server, use NeonAzoth
Control Station.

If Tarot is unavailable, the direct fallback is:

```bash
# Terminal 1 — backend
cd /Volumes/Luna/Developer-Luna/discowarpcore
HOST=127.0.0.1 PORT=7610 npm run dev
```

```bash
# Terminal 2 — frontend
cd /Volumes/Luna/Developer-Luna/discowarpcore
VITE_API_TARGET=http://127.0.0.1:7610 \
VITE_PORT=7611 \
npm --prefix frontend run dev -- --host 0.0.0.0 --port 7611 --strictPort
```

Check the backend with:

```bash
curl http://127.0.0.1:7610/api/health
```

An ordinary healthy response is:

```json
{"ok":true}
```

## Use the Vision Intake TUI

Launch it with:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run intake:tui
```

Its working folders are:

```text
~/Intake/
  inbox/        raw photos waiting for a batch
  processing/   active resumable batches
  completed/    successful direct-import archives
  failed/       failed batches for recovery
  exports/      zip files for manual GUI upload
```

The normal sequence is:

1. Add supported photographs to `~/Intake/inbox/`.
2. Choose `Start New Batch`.
3. Give the batch a name and optional destination location or box.
4. Choose direct database import, export zip only, or validate/package only.
5. Let preprocessing and JSON stub creation finish.
6. Run the generated Codex prompt and let Codex annotate the JSON artifacts.
7. Return to the TUI and press ENTER.
8. Review validation, then let the TUI package/export or import the batch.

For local development, make the API target explicit:

```bash
DISCO_API_BASE=http://localhost:7610 npm run intake:tui
```

For production intake over the LAN, choose the current server address
deliberately:

```bash
DISCO_ENV=production \
DISCO_API_BASE=http://<neonazoth-lan-address>:5002 \
npm run intake:tui
```

The TUI prints its API target at startup. Read that line before importing. The
full folder and recovery rules are in
[docs/VISION_INTAKE_TUI.md](docs/VISION_INTAKE_TUI.md).

## Deploy and sync to the home server

This is the part that is easy to misunderstand because two commands sound like
they should do the same thing.

### The preferred deploy: NeonAzoth Control Station

Run this from the development checkout:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run neonazoth:tui
```

The normal sequence is:

1. Choose `Status and health check` to see whether NeonAzoth is reachable.
2. Choose `Protected source sync dry run` and read the proposed changes.
3. Choose `Protected sync + install + build + health check`.
4. Confirm only when the local checkout contains the code you mean to deploy.

The full deployment option:

1. runs a fresh protected `rsync --dry-run`;
2. asks for confirmation, with the safe default set to no;
3. performs the protected source sync;
4. installs root dependencies on the remote machine;
5. installs frontend dependencies there too;
6. runs the production frontend build;
7. checks the remote backend health endpoint at `http://127.0.0.1:5002/api/health`;
8. prints the current LAN URL.

The sync protects production-only material such as `.env` files, media,
database dumps, runtime state, logs, sockets, dependency folders, build
outputs, and local backup folders. It uses `rsync --delete` for the included
source files, which is why the dry run matters.

Useful non-interactive checks are:

```bash
npm run neonazoth:tui -- --status
npm run neonazoth:tui -- --url
```

If backend code or backend environment variables changed, the running backend
may still need a restart after deployment. A successful health check can be an
old process answering successfully. Use the process owner’s established
restart method; do not start a second unmanaged `npm start` on the same port.

### The source sync: `deploy:neonazoth`

This command is intentionally smaller:

```bash
npm run deploy:neonazoth:dry   # preview the protected source sync
npm run deploy:neonazoth       # copy the protected source tree
```

It runs the protected `rsync` step only. It does **not** install dependencies,
build the frontend, restart the app, or prove that the running production app
is serving the new code. The transfer can succeed while the old backend process
continues running, which is why the source sync is not the normal “deploy
everything” button.

Use `npm run neonazoth:tui` when you mean deploy the working app. Use
`deploy:neonazoth` when you deliberately mean copy source files only.

### The separate dependency repair command

```bash
npm run install:neonazoth
```

This SSHes to NeonAzoth and installs root and frontend npm dependencies. It does
not sync source, build the frontend, restart the backend, or check health. It is
useful as a repair step, not as the ordinary deploy path.

## Every `package.json` run script

Run root scripts from the repository root:

```bash
npm run <script-name>
```

To pass options through to the underlying Node script, put `--` before them:

```bash
npm run seed:boxes:range -- --start=700 --count=75 --dry-run
```

### Start, install, and operate the app

| Script | What it does |
| --- | --- |
| `start` | Starts `backend/server.js` directly. |
| `dev` | Starts the backend through `nodemon`, which can restart it after backend file changes. |
| `tarot` | Starts the local Tarot operator dock. |
| `taro` | Alias for `tarot`. |
| `install:all` | Installs root dependencies, then installs dependencies in `frontend/`. |

### Seed, migrate, back up, and reset data

These commands touch the database. Back up before production data work and
read the script’s confirmation messages.

| Script | What it does |
| --- | --- |
| `seed` | Runs the standard development seed script. |
| `seed:all` | Runs the seed script with `--all`. |
| `seed:boxes:range` | Creates a configurable range of box IDs; supports `--start`, `--count`, `--label-prefix`, `--base-url`, and `--dry-run`. |
| `seed:boxes:700` | Convenience seed for boxes `700` through `774`. |
| `migrate:declutter-deck` | Migrates active legacy declutter session items into the declutter deck model. |
| `migrate:declutter-release-decisions` | Runs the release-decision migration; inspect its preview before applying. |
| `migrate:declutter-cooling-off` | Runs the cooling-off migration; inspect its preview before applying. |
| `merge:staged-db` | Preflights or applies a staged MongoDB merge; use its usage output and back up first. |
| `backup:full` | Creates a timestamped MongoDB plus media backup under `dump/`. |
| `restore:full` | Restores a named full backup archive; this changes database and media state. |
| `reset` | Destructive reset of database and intake provenance while preserving media. |
| `reset:hard` | Destructive reset of database, intake provenance, and media. |

Safer examples:

```bash
npm run backup:full
npm run migrate:declutter-release-decisions
npm run migrate:declutter-cooling-off
npm run seed:boxes:range -- --start=700 --count=75 --dry-run
```

The two declutter migrations preview by default; add `--apply` only after
reviewing their report. Reset commands require explicit confirmation flags and
are not casual “make it clean” buttons.

### Tests and media maintenance

| Script | What it does |
| --- | --- |
| `test:declutter-deck` | Runs the declutter-deck contract test. |
| `test:backend-logging` | Tests backend logging behavior. |
| `test:inventory-colors` | Tests inventory color behavior. |
| `test:delete-enforcement` | Runs the delete-enforcement backend check. |
| `test:media-cleanup` | Exercises media cleanup behavior. |
| `test:event-logging` | Exercises event logging. |
| `test:ai-json-import-validation` | Tests AI JSON intake validation. |
| `test:media-subsystem-contract` | Runs media subsystem contract tests. |
| `test:media-job-contract` | Runs media job contract tests. |
| `test:entity-media-contract` | Runs entity/media contract tests. |
| `test:batch-import-media-contract` | Runs batch-import and image-service contract tests together. |
| `smoke:objectglow` | Runs a temporary-image ObjectGlow integration smoke test. |
| `media:backfill:item-tiny` | Creates missing tiny item-media derivatives. |

The test scripts use Node’s built-in test runner or the project’s targeted
contract scripts. A focused test looks like this:

```bash
npm run test:media-subsystem-contract
```

### Photo intake and batch utilities

The recommended path is `intake:tui`. The other scripts are lower-level pieces,
recovery tools, or older/simple workflows.

| Script | What it does |
| --- | --- |
| `intake:tui` | Runs the full Vision Intake TUI: photos, preprocessing, JSON stubs, Codex prompt, validation, packaging, and optional API import. |
| `intake:create-batch` | Creates an empty intake batch workspace. |
| `intake:build-package` | Packages an older batch folder into an importable zip. |
| `intake:preprocess-images` | Runs the lower-level ObjectGlow image preprocessing stage. |
| `intake:vision` | Runs the lower-level vision batch initializer, validator, or packager. |
| `intake:trash-staging` | Moves old vision staging material to macOS Trash; supports a dry run. |
| `intake:merge-json` | Merges inventory JSON files into a batch JSON document. |
| `intake:assign-imagekeys` | Adds missing `imageKey` values to merged inventory JSON. |
| `intake:validate-batch` | Validates batch JSON, image keys, and image-order data. |
| `intake:stage-images` | Stages image files according to an image-order CSV. |
| `intake:simple:init` | Initializes the simple intake workspace and processes images. |
| `intake:simple:submit` | Uploads, validates, and imports the simple workspace. |
| `intake:simple:reset` | Archives and clears the simple workspace. |
| `intake:text:init` | Alias for the simple intake initializer. |
| `intake:text:submit` | Alias for the simple intake submitter. |
| `intake:text` | Alias for simple intake initialization. |
| `intake:ordered` | Alias for simple intake submission. |

Ask any lower-level script for its own options when needed:

```bash
npm run intake:vision -- --help
npm run intake:simple:init -- --help
```

### Production and Tarot maintenance

| Script | What it does |
| --- | --- |
| `deploy:neonazoth:dry` | Previews the protected source sync to NeonAzoth. |
| `deploy:neonazoth` | Performs the protected source sync only. It does not install, build, restart, or confirm the app is serving new code. |
| `install:neonazoth` | Installs root and frontend npm dependencies on the remote machine. |
| `neonazoth:tui` | Opens the protected remote Control Station for status, dry run, full sync/install/build/health, and LAN URL. |
| `tarot:update` | Verifies, previews, or updates this project’s local Tarot runtime from its declared Tarot source. |
| `tarot:install` | Installs or reconfigures a Tarot instance from a manifest/configuration. |
| `tarot:storm` | Emits a harmless five-second stream of colorful terminal lines for scrollback testing. |

For Tarot maintenance, verify or preview first:

```bash
npm run tarot:update -- --verify
npm run tarot:update -- --dry-run
```

Do not use `tarot:update` as a substitute for deploying the application. Tarot
maintenance updates the operator layer; the NeonAzoth TUI deploys the app.

### Frontend-only scripts

The frontend has its own `frontend/package.json`. Run these from the repository
root with `npm --prefix frontend run <script>`:

| Command | What it does |
| --- | --- |
| `npm --prefix frontend run dev` | Starts the Vite development server. |
| `npm --prefix frontend run build` | Builds the production frontend into `frontend/dist/`. |
| `npm --prefix frontend run lint` | Runs ESLint across the frontend. |
| `npm --prefix frontend run preview` | Serves the already-built frontend for a local preview. |

The remote deployment TUI runs the frontend `build` step on NeonAzoth. The
source-only deploy does not.

## LAN-only by design

The LAN boundary is a feature, not a missing checkbox. Disco Warp Core is meant
to be useful inside a home without requiring a hosted account or sending a
household inventory to a third-party cloud service.

That does not make the app magically secure. Anyone who can access the home
network may be able to reach a LAN service, so the home server, Wi-Fi, SSH
access, environment files, and backups still need ordinary care. LAN-only means
the intended exposure is local; it is not a substitute for access control or
good network hygiene.

## Technology

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB through Mongoose
- **Operator layer:** Tarot project control plane and NeonAzoth deployment TUI
- **Photo intake:** JavaScript TUI, ObjectGlow preprocessing, JSON artifacts,
  validation, and backend API import/export
- **Style:** plain JavaScript, styled-components, and a generous amount of
  household-inventory enthusiasm

## Project map

```text
frontend/                              React/Vite browser application
backend/                               Express API, persistence, and media handling
scripts/tarot-dock.mjs                 local Tarot operator interface
scripts/intake_tui.js                  photo intake and Codex handoff TUI
scripts/neonazoth/control_station.js   protected production deployment TUI
docs/                                  workflow and operator references
test/                                  contract and behavior tests
```

Useful references:

- [Fresh Boot & Production Operator Note](DISCO_WARP_CORE_RAYCAST_NOTE.md)
- [Vision Intake TUI reference](docs/VISION_INTAKE_TUI.md)
- [Production photo intake](docs/tui-production-intake.md)
- [Batch workflow explainer](docs/batch-import-workflow.html)
- [Deployment brief](DEPLOYMENT_BRIEF.md)
- [Backup, reset, and restore runbook](BACKUP_RESET_RESTORE_RUNBOOK.md)
- [Media development contract](backend/docs/media_dev_contract.md)

## Current status

This is an open-source work in progress built around a real household use case.
The inventory model, box nesting, local service control, production workflow,
photo intake, ObjectGlow integration, and Codex handoff are all active areas of
development. Some features are polished, some are practical prototypes, and
some are still wearing their “please do not remove this panel” sign.

Contributions, bug reports, careful refactors, and better explanations are
welcome. The goal is not to build a generic enterprise asset-management suite.
The goal is to make one real home easier to understand, one box at a time.
