import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support large payloads for base64 photo data
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-memory or persistent store of synced meter records on the server
let serverSyncedRecords: any[] = [];
let lastSyncTimestamp: string | null = null;

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    recordsCount: serverSyncedRecords.length,
  });
});

// Remote Sync Endpoint
app.post('/api/sync', (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid records payload. Expected an array of MeterRecord.',
      });
    }

    serverSyncedRecords = records;
    lastSyncTimestamp = new Date().toISOString();

    console.log(`[VoltGrid Sync] Successfully synced ${records.length} meter records at ${lastSyncTimestamp}`);

    return res.json({
      success: true,
      syncedCount: records.length,
      timestamp: lastSyncTimestamp,
      message: `Successfully synchronized ${records.length} field meter captures with central utility server.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ success: false, error: message });
  }
});

// Retrieve server records
app.get('/api/records', (_req, res) => {
  res.json({
    records: serverSyncedRecords,
    lastSyncTimestamp,
  });
});

async function startServer() {
  if (!isProduction) {
    // Mount Vite middlewares in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoltGrid Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
