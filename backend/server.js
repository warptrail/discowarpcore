require('dotenv').config({ path: './backend/.env' });
const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
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
const mediaRoutes = require('./routes/media');
const intakeBatchRoutes = require('./routes/intakeBatches');
const declutterDeckRoutes = require('./routes/declutterDeck');
const {
  backendRequestLogger,
  serializeError,
  writeBackendLog,
} = require('./utils/backendLogger');
const { backfillBoxLocations } = require('./services/locationService');
const { recoverQueuedMediaJobs } = require('./services/mediaJobService');
const { backfillMissingMediaIds } = require('./services/mediaProcessingService');

const PORT = process.env.PORT || 7610;
const HOST = process.env.HOST || '0.0.0.0';
const app = express();
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
const FRONTEND_INDEX = path.join(FRONTEND_DIST, 'index.html');

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(MEDIA_URL_BASE, express.static(MEDIA_ROOT, {
  maxAge: '1y',
  immutable: true,
}));
app.use('/api', backendRequestLogger);

// Connect to Mongo
app.use('/api/boxes', boxRoutes);
app.use('/api/boxed-items', boxItemRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/retrieval', retrievalRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/intake-batches', intakeBatchRoutes);
app.use('/api/declutter-deck', declutterDeckRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/assets', express.static(path.join(FRONTEND_DIST, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));
app.use(express.static(FRONTEND_DIST, {
  index: false,
  maxAge: 0,
  setHeaders(res, filePath) {
    if (filePath === FRONTEND_INDEX) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  },
}));

app.get(/^\/(?!api|media).*/, (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
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

  try {
    const backfill = await backfillMissingMediaIds();
    if (backfill.updatedCount > 0) {
      console.log('🆔 Backfilled mediaIds for MediaState:', backfill);
    }
  } catch (err) {
    console.error('⚠️ MediaId backfill failed:', err);
  }

  try {
    const recovery = await recoverQueuedMediaJobs();
    if (recovery.recoveredCount > 0) {
      console.log('🧵 Recovered queued media jobs:', recovery);
    }
  } catch (err) {
    console.error('⚠️ Media job recovery failed:', err);
  }

  app.listen(PORT, HOST, () => {
    writeBackendLog('info', 'server.started', {
      host: HOST,
      port: Number(PORT),
      processId: process.pid,
    });
    console.log(`🚀 Server running at:
  • http://localhost:${PORT}
  • http://<your-local-ip>:${PORT}`);
  });
}

process.on('uncaughtExceptionMonitor', (error, origin) => {
  writeBackendLog('error', 'process.uncaught_exception', {
    origin,
    processId: process.pid,
    error: serializeError(error),
  });
});

startServer().catch((err) => {
  writeBackendLog('error', 'server.start.failed', {
    processId: process.pid,
    error: serializeError(err),
  });
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
