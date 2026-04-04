# DiscoWarpCore Backup, Reset, and Restore Runbook

This guide covers the exact terminal commands for:

1. Creating a full backup
2. Standard reset: wipe live database + intake provenance state
3. Hard reset: wipe live database + intake provenance + media
4. Restoring from a backup archive

Run all commands from project root:

```bash
cd /Users/moonshade/Developer/discowarpcore
```

## 1) Full Backup

Create a full backup archive (MongoDB + media):

```bash
npm run backup:full
```

Expected success line:

```text
Backup created: dump/discowarpcore-backup-YYYYMMDD-HHmmss.tar.gz
```

List available backups:

```bash
ls -lh dump/discowarpcore-backup-*.tar.gz
```

Optional: inspect archive contents:

```bash
LATEST="$(ls -t dump/discowarpcore-backup-*.tar.gz | head -n1)"
tar -tzf "$LATEST" | head -n 20
```

You should see `mongo/`, `media/`, and `manifest.json` under the top-level backup folder.

## 2) Standard Reset (Database + Intake Provenance)

This wipes:

- MongoDB database `discowarpcore`
- Intake provenance state under `var/intake`, including legacy `batch_state.json` files and batch directories that can rehydrate archived `Batch` records
- External intake provenance state under `~/Intake/discowarpcore` (or `DISCOWARPCORE_INTAKE_ROOT` if overridden), including staged folders, receipts, and package-derived batch state that can rehydrate `Batch` records

This preserves:

- Live media library on disk under `backend/media`

Required command:

```bash
npm run reset -- --yes-reset-db-and-intake
```

Expected success lines include:

- `✅ Dropped database: discowarpcore`
- `✅ Wiped repo intake provenance state: .../var/intake`
- `✅ Recreated repo batches root: .../var/intake/batches`
- `✅ Wiped external intake provenance root: .../Intake/discowarpcore`
- `Standard reset completed.`

If you omit the flag, the script will refuse to run.

## 3) Hard Reset (Destructive)

This wipes:

- MongoDB database `discowarpcore`
- Intake provenance state under `var/intake`
- External intake provenance state under `~/Intake/discowarpcore` (or `DISCOWARPCORE_INTAKE_ROOT` if overridden)
- Live media library on disk

Required command:

```bash
npm run reset:hard -- --yes-delete-everything
```

Expected success lines include:

- `✅ Dropped database: discowarpcore`
- `✅ Wiped repo intake provenance state: .../var/intake`
- `✅ Recreated repo batches root: .../var/intake/batches`
- `✅ Wiped external intake provenance root: .../Intake/discowarpcore`
- `✅ Wiped media directory: .../backend/media`
- `✅ Recreated media directory structure at: .../backend/media`
- `Hard reset completed.`

If you omit the flag, the script will refuse to run.

## 4) Restore From Backup

Restore from a specific backup archive:

```bash
npm run restore:full -- dump/discowarpcore-backup-YYYYMMDD-HHmmss.tar.gz
```

### Using a temporary `BACKUP_FILE` variable

Set a specific archive path:

```bash
BACKUP_FILE="dump/discowarpcore-backup-20260318-203215.tar.gz"
npm run restore:full -- "$BACKUP_FILE"
```

Auto-pick the newest backup:

```bash
BACKUP_FILE="$(ls -t dump/discowarpcore-backup-*.tar.gz | head -n1)"
npm run restore:full -- "$BACKUP_FILE"
```

On success, restore prints:

- Restored archive path
- Restored database name (`discowarpcore`)
- Restored media path
- Pre-restore media safety backup path (if created)

## Quick Verification After Restore

Start app:

```bash
npm run dev
```

Then verify expected records and media are visible in the app.
