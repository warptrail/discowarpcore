# Media Dev Contract

This project uses a single media root (`MEDIA_ROOT`) on disk and serves it at `/media`.

## Dev Media Structure

Relative to `MEDIA_ROOT`:

- `items/original/`
- `items/display/`
- `items/thumb/`
- `boxes/original/`
- `boxes/display/`
- `boxes/thumb/`

Item uploads currently write:

- original file -> `items/original/<uuid>.<ext>`
- display derivative -> `items/display/<uuid>.webp`
- thumb derivative -> `items/thumb/<uuid>.webp`

Stored DB paths are relative storage paths (for portability), and browser URLs are rooted at `/media/...`.

## iPad Test Flow (LAN)

1. Start backend and frontend on the Mac.
2. Open frontend on iPad using LAN URL (example): `http://<mac-lan-ip>:5173`.
3. Open an item detail page and upload an image.
4. Confirm preview loads and URL resolves under `/media/...` (proxied in dev via Vite).

## Future Container Mapping

No path in DB is machine-specific. To move to a Linux container:

1. Mount a persistent volume into the container (for example `/data/media`).
2. Set `MEDIA_ROOT=/data/media`.
3. Keep backend static mount at `/media`.

This preserves existing API/browser URL behavior while moving storage to a mounted volume.
