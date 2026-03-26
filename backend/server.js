require('dotenv').config({ path: './backend/.env' });
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const {
  MEDIA_ROOT,
  MEDIA_URL_BASE,
  ensureMediaDirs,
} = require('./config/media');
const boxRoutes = require('./routes/boxes');
const itemRoutes = require('./routes/items');
const boxItemRoutes = require('./routes/boxItem');
const devRoutes = require('./routes/devRoutes');
const locationRoutes = require('./routes/locations');
const retrievalRoutes = require('./routes/retrieval');
const logRoutes = require('./routes/logs');
const { backfillBoxLocations } = require('./services/locationService');

const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || '0.0.0.0';
const app = express();
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
const FRONTEND_INDEX = path.join(FRONTEND_DIST, 'index.html');

app.use(cors());
app.use(express.json());
app.use(MEDIA_URL_BASE, express.static(MEDIA_ROOT));

// Connect to Mongo
app.use('/api/boxes', boxRoutes);
app.use('/api/boxed-items', boxItemRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/retrieval', retrievalRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(FRONTEND_DIST));

app.get(/^\/(?!api|media).*/, (_req, res) => {
  res.sendFile(FRONTEND_INDEX);
});

// Centralized error handler (ensure last)
// app.use((err, _req, res, _next) => {
//   const status = err.status || 500;
//   res.status(status).json({
//     ok: false,
//     error: err.message || 'Internal Server Error',
//   });
// });

async function startServer() {
  await connectDB(process.env.MONGO_URI);
  ensureMediaDirs();

  try {
    const result = await backfillBoxLocations();
    console.log('📍 Location backfill:', result);
  } catch (err) {
    console.error('⚠️ Location backfill failed:', err);
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at:
  • http://localhost:${PORT}
  • http://<your-local-ip>:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
