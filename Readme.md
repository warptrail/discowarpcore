# 🪩 Disco Warp Core

Welcome to the **Disco Warp Core** — a private, local-only household server designed to bring cosmic-level organization to your earthly belongings.

Built with love (and Node.js, Express, React, and MongoDB), this little LAN party lives on our Mac Mini and is only accessible over our Wi-Fi network.

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

In this system, *everything* is a box:

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

```bash
npm install
npm run dev:backend   # Start Express server
npm run dev:frontend  # Start React frontend