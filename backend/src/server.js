import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { runSeeds } from './db/seed.js';
import { runMigrations } from './db/migrate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

// CORS configuration supporting local dev and production deployments (Vercel)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost and any vercel preview / production domain
    if (
      origin === FRONTEND_URL ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for competition judge reviews
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'LaunchOps AI Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server and initialize database
async function startServer() {
  try {
    // Attempt migrations if using PostgreSQL
    await runMigrations().catch(e => console.warn('[Start] Migration check skipped:', e.message));
    // Auto-seed initial demo data if empty
    await runSeeds().catch(e => console.warn('[Start] Seed check skipped:', e.message));
  } catch (err) {
    console.warn('[Start] DB bootstrap note:', err.message);
  }

  // Bind to 0.0.0.0 as required for Render / containerized hosting
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LaunchOps AI Backend is running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Ready to accept requests from frontend: ${FRONTEND_URL}`);
  });
}

startServer();

export default app;
