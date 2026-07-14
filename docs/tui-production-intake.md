# TUI Production Photo Intake

Use this guide when running the local photo intake TUI from a MacBook while writing inventory batches to the production Disco Warp Core backend on the always-on Linux host.

Production MongoDB is the source of truth for inventory data. Do not write to MongoDB directly from the TUI, do not rsync database state from a MacBook, and do not overwrite production database state as part of photo intake. The TUI must mutate inventory only through the production backend API.

## API Target

The vision intake TUI reads the backend API URL from `DISCO_API_BASE`.

```bash
DISCO_API_BASE=http://living-room-server.local:5002
```

For production runs, also set:

```bash
DISCO_ENV=production
```

When `DISCO_ENV=production` is set, the TUI refuses to start unless `DISCO_API_BASE` is present. Without production mode, the development default is:

```text
http://localhost:5002
```

At startup the TUI prints the current API target, warns when it targets localhost, and checks:

```text
GET /api/health
```

## Direct LAN API

Use this when the Linux host exposes the backend API only on your private LAN.

```bash
cd /path/to/discowarpcore
DISCO_ENV=production DISCO_API_BASE=http://living-room-server.local:5002 npm run intake:tui
```

Replace `living-room-server.local` with the real private hostname or LAN IP. The hostname above is only an example and is not hardcoded by the tool.

## SSH Tunnel API

Use this when the production API should stay private on the Linux host.

Terminal 1:

```bash
ssh -L 5002:localhost:5002 user@living-room-server.local
```

Terminal 2:

```bash
cd /path/to/discowarpcore
DISCO_ENV=production DISCO_API_BASE=http://localhost:5002 npm run intake:tui
```

The TUI will warn that the API target is localhost. For tunnel usage, that warning is expected: localhost on the MacBook forwards to the production backend through SSH.

## Runtime Flow

For direct imports, the TUI keeps local photo processing on the MacBook and sends all inventory mutations through backend HTTP endpoints:

1. Build the local photo batch workspace under `~/Intake`.
2. Run local preprocessing and JSON annotation.
3. Package the batch as a zip.
4. Upload the package with `POST /api/intake-batches/package`.
5. Review destination defaults with `POST /api/intake-batches/:batchId/destination` when needed.
6. Validate with `POST /api/intake-batches/:batchId/validate`.
7. Import with `POST /api/intake-batches/:batchId/import`.
8. Read final batch status with `GET /api/intake-batches/:batchId` when available.

The backend import endpoint performs server-side image staging internally when imported items include image keys. The TUI does not write media files into backend folders directly and does not connect to MongoDB.

## Development Commands

Development default:

```bash
npm run intake:tui
```

Development explicit:

```bash
DISCO_API_BASE=http://localhost:5002 npm run intake:tui
```

## Production Commands

Direct LAN:

```bash
DISCO_ENV=production DISCO_API_BASE=http://living-room-server.local:5002 npm run intake:tui
```

SSH tunnel:

```bash
ssh -L 5002:localhost:5002 user@living-room-server.local
```

```bash
DISCO_ENV=production DISCO_API_BASE=http://localhost:5002 npm run intake:tui
```

## Related Environment Variables

```bash
DISCO_ENV=production
DISCO_API_BASE=http://living-room-server.local:5002
DISCO_WARP_INTAKE_ROOT=~/Intake
OBJECTGLOW_REPO=/Volumes/Luna/Developer-Luna/objectiglow
```

`DISCO_WARP_INTAKE_ROOT` and `OBJECTGLOW_REPO` are optional local MacBook path overrides. They do not change the production database target.
