require('dotenv').config({ path: './backend/.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const PORT = process.env.PORT || 5002;

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error", err));

app.get("/", (req, res) => {
  res.send("🏡 Welcome to the Disco Warp Core");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://192.168.1.17:${PORT}`);
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));