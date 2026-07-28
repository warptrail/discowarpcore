# 🪩 Disco Warp Core

Welcome to the **Disco Warp Core** — a private, local-only household server designed to bring cosmic-level organization to your earthly belongings.

Built with love (and Node.js, Express, React, and MongoDB), this little LAN party lives on our Mac Mini and is only accessible over our Wi-Fi network.

For fresh-boot commands, Tarot, production deployment, database backups, and
the AI-assisted Vision Intake TUI, see the [Fresh Boot & Production Operator
Note](DISCO_WARP_CORE_RAYCAST_NOTE.md).

---

## 🧠 What Is This?

Disco Warp Core is:

- 🏠 A house-specific web app
- 📦 A dynamic inventory system — anything can be a "box"
- 🔁 A nestable, reorganizable container tracker
- 🌐 Totally offline and LAN-only
- 🧑‍🤝‍🧑 Shared between household members
- ☕ Fueled by caffeine, maybe some chaos

---

## 📦 How Boxes Work

In this system, _everything_ is a box:

- A cardboard box? ✅
- A kitchen drawer? ✅
- A mysterious basket under the bed? ✅

Boxes can contain other boxes, be moved freely, and keep track of their contents. Like a tiny filesystem... for your house.

---

## 🧰 Stack

- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB (local)
- **Frontend:** React + Vite
- **Platform:** macOS LAN server
- **Theme:** Warptrail-core modularity and sparkle ✨

---

## 🚀 How to Run It

### The boring old way: manual service startup

The direct two-terminal launch is the plumbing fallback. It starts the
backend and frontend as separate processes and makes me remember ports,
processes, logs, restart order, and health checks myself.

Terminal 1 — backend:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
HOST=127.0.0.1 PORT=7610 npm run dev
```

Terminal 2 — frontend:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
VITE_API_TARGET=http://127.0.0.1:7610 \
VITE_PORT=7611 \
npm --prefix frontend run dev -- --host 0.0.0.0 --port 7611 --strictPort
```

The old `npm run dev:backend` and `npm run dev:frontend` examples belonged to
an earlier command layout and are not the canonical scripts in this checkout.

### The cybermage way: Tarot

Tarot is the canonical operator interface for this project:

```bash
cd /Volumes/Luna/Developer-Luna/discowarpcore
npm run tarot
```

Think of Tarot as the control plane and the app as the data plane. Tarot does
not replace Express, React, or MongoDB and it does not own inventory logic. It
knows how the project’s services are shaped, what they depend on, which ports
they own, how to health-check them, where their logs go, and which lifecycle
actions are safe.

For Disco Warp Core, the local Tarot instance coordinates:

- MongoDB on `27017` as an observed system dependency
- Express on `7610`, with health endpoint `/api/health`
- Vite/React on `7611`, proxying API traffic to `7610`

Once Tarot is running, use its interactive command surface instead of manually
hunting for processes:

```text
status              # concise service state and ports
health              # call declared health endpoints
ports               # show the project’s port geography
links               # show localhost, computer, and LAN URLs
logs backend        # inspect backend output
logs frontend       # inspect frontend output
restart backend     # restart only the exact project backend
restart frontend    # restart only the exact project frontend
```

Tarot also keeps service ownership explicit. It should inspect a busy declared
port and reclaim it only when the listener belongs to this project’s declared
service. It must not blindly kill unknown, system-owned, or unrelated
processes. MongoDB is observed and started when needed, but is not stopped as
part of ordinary Tarot cleanup.

The visual dashboard, sigil, prompt, numbered links, and live service state are
the operator layer. The ordinary terminal remains available for normal shell
commands, source control, tests, backups, and deployment previews. Tarot gives
the project a repeatable command center without turning the control plane into
a second application architecture.

When the Tarot dock is not available, use the manual two-terminal fallback
above. Do not invent a third launcher or broadly kill processes to recover a
busy port.

### Tarot updates

Inspect a Tarot update before applying it:

```bash
npm run tarot:update -- --verify
npm run tarot:update -- --source /Volumes/Luna/Developer-Luna/deckone
```

Apply only after reviewing the dry run:

```bash
npm run tarot:update -- \
  --source /Volumes/Luna/Developer-Luna/deckone \
  --apply
```

Tarot updates are instance synchronization, not a reason to rewrite the
application. DeckOne is the master Tarot implementation; Disco Warp Core is a
project-local instance with its own identity, ports, service commands, and
database settings. The updater creates a rollback copy under `.tarot/backups/`
and should preserve those project-owned overrides.

## 🖼️ Media Dev Notes

See [backend/docs/media_dev_contract.md](backend/docs/media_dev_contract.md) for the current media storage/URL contract, iPad upload test flow, and future mounted-volume mapping.

# Notes and Todos

## Long term Ideas

1. Make the toast component a persistent ticker box even if there is no toast message so it doesn't jar the other components around. Consider adding a sort of blank message placeholder or little screensaver if there is no toast object.

2. Item-First Interface (Or box-independent item configuration interface)

3. Fire destroys items

## Tonight!!

1. Improve the View Mode on the box.
2. Nesting Boxes Logic
3. Destroying Boxes Logic
4. Destroying individual items logic (Perhaps should only be accessible through the item view mode only.)
5. Search
6. I should be using Trello for this, I almost forgot about that thing
7.
