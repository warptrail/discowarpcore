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

```bash
npm install
npm run dev:backend   # Start Express server
npm run dev:frontend  # Start React frontend
```

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
