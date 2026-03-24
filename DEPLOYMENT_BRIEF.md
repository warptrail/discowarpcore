# Discowarpcore Deployment Brief

## Goal
Prepare Discowarpcore for its first self-hosted LAN deployment on the Arch Linux server `neonazoth`.

This phase is focused on getting a working, stable version accessible from another device on the local network.

---

## Current Development Setup
- Frontend: Vite + React
- Backend: Node + Express
- Database: MongoDB
- Frontend dev server: http://localhost:5173
- Backend dev server: http://localhost:5002
- Development machine: macOS

Development environment assumptions:
- Frontend and backend run as separate processes
- Vite dev server handles hot reload and proxying
- Some code may assume `localhost`

---

## Target First Deployment (LAN Only)

### Host
- Arch Linux machine: `neonazoth`
- Accessible via LAN IP (e.g. `192.168.1.x`)

### Constraints
- LAN-only (no public internet exposure yet)
- 1–2 users
- No nginx
- No Docker
- No CI/CD
- Keep architecture simple and understandable

---

## Desired Production Architecture

Single-process entrypoint:

```text
Browser → Express (neonazoth)
                ├─ /api/* → backend routes
                └─ / → frontend (built static files)
