# Disco Warp Core — Fresh Boot & Production Operator Note

This is the short version of how to get Disco Warp Core running again when I
have forgotten the details.

## Identity card

- Local repository: `/Volumes/Luna/Developer-Luna/discowarpcore`
- Local app: <http://localhost:7611/>
- Local Express API: `http://127.0.0.1:7610`
- Local MongoDB database: `discowarpcore_dev`
- Production host: `neonazoth` / `warptrail@neonazoth`
- Production repository: `/home/warptrail/discowarpcore`
- Production app: <http://192.168.1.37:5002>
- Production MongoDB database: `discowarpcore`

The local database is a clone for design and development. Production is the
source of truth. The local development database must never be sent to
neonazoth as database state.

## Fresh boot: the cybermage path

Open Terminal and run:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run tarot
```

Tarot is the canonical operator interface and local service dock. It is the
control plane; MongoDB, Express, and Vite are the data-plane services. Tarot
does not absorb their business logic or database. It coordinates them through
the project manifest, which records each service’s purpose, command, port,
dependency order, health endpoint, owner, logs, and safe lifecycle actions.

For Disco Warp Core, Tarot starts or supervises:

- MongoDB on `27017`
- Express on `7610`
- Vite/React on `7611`

Open <http://localhost:7611/>.

Useful Tarot actions from the Tarot shell:

```text
status
health
ports
links
logs backend
logs frontend
restart backend
restart frontend
```

The Tarot interface is the default because it remembers the project’s port
geography, keeps service ownership explicit, checks health, exposes local and
LAN links, and restarts only the exact project service requested. It is the
cybermage version of “start the app”: one command awakens the known local
system, while the ordinary shell remains available for normal commands.

## The boring old way: manual startup fallback

Use this only when Tarot itself is unavailable or when debugging the launcher.
It is intentionally more manual: two terminals, two processes, explicit port
environment, and no Tarot service dashboard.

Terminal 1 — backend:

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

The historical `npm run dev:backend` and `npm run dev:frontend` commands are
not the current canonical package scripts. The commands above are the direct
fallback that matches the current Tarot port contract.

Do not create a third competing launcher or use broad `kill` commands to free a
port. Tarot should verify that a listener belongs to this project before
reclaiming it; unknown and system-owned listeners are not Tarot’s to stop.

Quick local health check:

```bash
curl http://127.0.0.1:7610/api/health
```

Expected response:

```json
{"ok":true}
```

## Important: restart after changing the database

Node reads `backend/.env` when the backend starts. If the local database URI
changes, restart the backend before judging what the browser displays:

```text
restart backend
```

Then reload <http://localhost:7611/>. A browser can otherwise show the old
database through an already-running backend process or an old page state.

## Updating Tarot

Check the current Tarot release without changing this project:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run tarot:update -- --verify
```

The project currently records the Tarot source as:

```text
/Volumes/Luna/Developer-Luna/deckone
```

If that source checkout is present and is the intended Tarot master, preview
an update:

```bash
npm run tarot:update -- \
  --source /Volumes/Luna/Developer-Luna/deckone
```

Apply only after reviewing the preview:

```bash
npm run tarot:update -- \
  --source /Volumes/Luna/Developer-Luna/deckone \
  --apply
```

Tarot creates a safety copy under `.tarot/backups/` before applying updates.
If the source path is missing, stop and locate the current Tarot master; do not
guess at a replacement path.

## Before pushing code to production

First inspect the worktree. This repository often contains in-progress UI
work, so do not deploy blindly:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
git status --short
```

Run the protected deployment preview:

```bash
npm run deploy:neonazoth:dry
```

The production sync is an `rsync --delete` operation. It deliberately excludes:

- `.env` and `.env.*`
- `dump/`
- `var/`
- `backend/media/`
- `node_modules/`
- build output and local caches
- `.git/`

Those exclusions are the main data-isolation boundary. Never remove them to
“make deployment easier.”

## Preferred production deploy

Use the remote control TUI:

```bash
npm run neonazoth:tui
```

Choose these actions in order:

1. `Status and health check`
2. `Protected source sync dry run`
3. Review the files that would change.
4. `Protected sync + install + build + health check`
5. Confirm the prompts only when the code being deployed is intentional.

That workflow syncs source code, installs dependencies remotely, builds the
frontend, and checks the production health endpoint. It preserves neonazoth’s
production `.env`, media, database, logs, and runtime state.

The lower-level source-only command is:

```bash
npm run deploy:neonazoth
```

Use the TUI workflow when possible because source sync alone does not install,
build, or verify the remote app.

## Confirming production

Production is served directly by Express on neonazoth:

```bash
curl http://192.168.1.37:5002/api/health
```

The operator TUI can show the current LAN address instead of relying on a
remembered IP:

```bash
npm run neonazoth:tui -- --url
npm run neonazoth:tui -- --status
```

The production URL is currently:

<http://192.168.1.37:5002>

The IP can change if the LAN DHCP lease changes, so use `--url` when in doubt.

## Production database backups

### Full backup: database plus media

SSH to production and run the project’s documented full backup:

```bash
ssh neonazoth 'cd ~/discowarpcore && npm run backup:full'
```

This creates a timestamped archive under:

```text
~/discowarpcore/dump/
```

It contains MongoDB data, media, and a manifest. Production is not dropped or
modified by a backup.

### Database-only backup

Use this when the goal is to refresh the local development database without
copying production media:

```bash
ssh neonazoth 'cd ~/discowarpcore && \
  set -a && . backend/.env && set +a && \
  mkdir -p dump && \
  stamp=$(date +%Y%m%d-%H%M%S) && \
  mongodump --uri="$MONGO_URI" \
    --db=discowarpcore \
    --archive="dump/neonazoth-discowarpcore-production-$stamp.archive.gz" \
    --gzip'
```

Keep the archive on neonazoth until the local copy has been verified. Record
its checksum when transferring it:

```bash
ssh neonazoth 'cd ~/discowarpcore && sha256sum dump/*.archive.gz | tail -n1'
rsync -avz neonazoth:/home/warptrail/discowarpcore/dump/<archive-name> dump/
sha256sum dump/<archive-name>
```

## Refreshing the local development database

The safe local refresh utility is:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
python3 scripts/restore_dev_database.py --dry-run
python3 scripts/restore_dev_database.py --yes
```

It is intentionally restricted to:

- a loopback MongoDB host
- the database named `discowarpcore_dev`
- an archive directly inside this repo’s `dump/` directory

It drops only `discowarpcore_dev`, restores the archive under that same
development name, and verifies the result. It cannot target production unless
the safety checks are deliberately rewritten.

After the restore:

```text
restart backend
```

Then reload <http://localhost:7611/>.

## Production-to-development sync rule

The normal direction is:

```text
production database → compressed dump → local dump/ → discowarpcore_dev
```

Never use a local development dump as an input to production deployment.
Never point local `backend/.env` at the production MongoDB URI for ordinary UI
development. The current local URI should end in:

```text
mongodb://127.0.0.1:27017/discowarpcore_dev
```

The `npm run neonazoth:tui` deploy menu does not restore databases or media.
Prefer `scripts/restore_dev_database.py` for the current database-only
playground workflow.

## The AI-assisted inventory workflow: what it is called

The project calls it the **Vision Intake TUI**. A useful longer name is the
**AI-assisted photo intake pipeline**.

It is not a direct MongoDB editor. It is a local terminal wizard that:

1. Takes raw item photos from `~/Intake/inbox/`.
2. Creates a resumable batch under `~/Intake/processing/`.
3. Runs ObjectGlow image preprocessing.
4. Creates JSON item stubs for the images.
5. Writes `CODEX_AGENT_PROMPT.md`.
6. Pauses while Codex turns the visual observations into properly labeled,
   practical inventory JSON.
7. Validates the image/JSON pairing and required fields.
8. Packages the batch or imports it through the backend API.
9. Moves successful batches to `~/Intake/completed/`.

Launch it with:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run intake:tui
```

The folder model is:

```text
~/Intake/
  inbox/       raw photos waiting for a batch
  processing/  active resumable batches
  completed/   successful batch archives
  failed/      failed batches for recovery
  exports/     zip files for manual GUI upload
```

For local development using the current Tarot API port:

```bash
DISCO_API_BASE=http://localhost:7610 npm run intake:tui
```

For a direct production import over the LAN:

```bash
DISCO_ENV=production \
DISCO_API_BASE=http://192.168.1.37:5002 \
npm run intake:tui
```

Always read the API target printed at TUI startup. In production mode, an
explicit `DISCO_API_BASE` is required. The TUI talks to the backend API; it
does not connect directly to MongoDB.

### Vision Intake safety rules

- Codex edits JSON artifacts only.
- Codex does not rename, move, delete, or copy images.
- The TUI does not write directly to MongoDB.
- Production imports must target the production API explicitly.
- If the TUI says the target is localhost during an SSH tunnel workflow, that
  is expected only when `localhost` is intentionally forwarded to production.
- Validate before importing. A failed validation must not be packaged or
  imported.

## Two different TUIs

Do not confuse these:

### Vision Intake TUI

```bash
npm run intake:tui
```

AI-assisted photo-to-inventory workflow. It creates and imports item batches.

### NeonAzoth Control Station TUI

```bash
npm run neonazoth:tui
```

Remote production deploy workflow. It checks health, shows the URL, previews
source deployment, syncs code, installs dependencies, builds the frontend, and
verifies the health endpoint. Runtime control belongs to Tarot.

## SSH access after a fresh Mac boot

The SSH key is:

```text
~/.ssh/neonazoth_warptrail_ed25519
```

Load it into the macOS Keychain-backed agent if needed:

```bash
ssh-add --apple-use-keychain ~/.ssh/neonazoth_warptrail_ed25519
ssh -o BatchMode=yes neonazoth 'whoami && hostname'
```

Expected identity:

```text
warptrail
neonazoth
```

If SSH fails, do not copy a private key to another machine. Repair the public
key authorization on neonazoth or fix the local `~/.ssh/config` entry.

## Common recovery commands

```bash
# Is local MongoDB running?
brew services list | grep mongodb

# Start local MongoDB if needed
brew services start mongodb-community

# Local API health
curl http://127.0.0.1:7610/api/health

# Production API health
curl http://192.168.1.37:5002/api/health

# Check production control state
npm run neonazoth:tui -- --status

# Check the local repository before deployment
git status --short

# See available project commands
npm run
```

## Do not panic checklist

When something looks wrong, check in this order:

1. Am I in `/Volumes/Luna/Developer-Luna/discowarpcore`?
2. Is MongoDB running locally?
3. Is the local backend on `7610`?
4. Does `backend/.env` point to `discowarpcore_dev`?
5. Did I restart the backend after changing `.env` or restoring data?
6. Is the browser on `http://localhost:7611/`?
7. If production is involved, did I run the dry run first?
8. Did I verify the TUI’s API target before importing inventory?
9. Did I create a production backup before any production database write?

## Deeper references

- [Backup, reset, and restore runbook](BACKUP_RESET_RESTORE_RUNBOOK.md)
- [Vision Intake TUI reference](docs/VISION_INTAKE_TUI.md)
- [Production photo intake](docs/tui-production-intake.md)
- [Batch workflow explainer](docs/batch-import-workflow.html)
- [SSH handshake field guide](docs/ssh-handshake-field-guide.md)
- [Deployment brief](DEPLOYMENT_BRIEF.md)
