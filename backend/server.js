require('dotenv').config({ path: './backend/.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const boxRoutes = require('./routes/boxes');
const itemRoutes = require('./routes/items');
const boxItemRoutes = require('./routes/boxItem');

const PORT = process.env.PORT || 5002;
const app = express();

app.use(cors());
app.use(express.json());

// Connect to Mongo
connectDB(process.env.MONGO_URI);

app.use('/api/boxes', boxRoutes);
app.use('/api/boxItem', boxItemRoutes);
app.use('/api/items', itemRoutes);

app.get('/', (req, res) => {
  res.send(
    "🏡 Welcome to the Disco Warp Core. This is the house website [under_construction 🚧🦺🏗️]. You have mail: 'Love you boo 💙' "
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at:
  • http://localhost:${PORT}
  • http://<your-local-ip>:${PORT}`);
});
