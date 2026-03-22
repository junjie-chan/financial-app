import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';

// Routes
import transactionRoutes from './routes/transactions';
import incomeRoutes from './routes/income';
import investmentRoutes from './routes/investments';
import analysisRoutes from './routes/analysis';
import economicRoutes from './routes/economic';
import receiptRoutes from './routes/receipt';
import exportRoutes from './routes/export';

// Middleware
import { errorHandler } from './middleware/error.middleware';

// Services
import { aiAnalysisService } from './services/ai-analysis.service';

// ============================================================
// Configuration
// ============================================================

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Ensure data directory exists
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ============================================================
// Middleware
// ============================================================

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:19006,http://localhost:3000').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================================
// Routes
// ============================================================

const API_PREFIX = '/api';

app.use(`${API_PREFIX}/transactions`, transactionRoutes);
app.use(`${API_PREFIX}/income`, incomeRoutes);
app.use(`${API_PREFIX}/investments`, investmentRoutes);
app.use(`${API_PREFIX}/analysis`, analysisRoutes);
app.use(`${API_PREFIX}/economic`, economicRoutes);
app.use(`${API_PREFIX}/receipt`, receiptRoutes);
app.use(`${API_PREFIX}/export`, exportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// Error Handler (must be last)
// ============================================================

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================================
// Scheduled Jobs
// ============================================================

// Generate weekly AI report every Monday at 8:00 AM
cron.schedule('0 8 * * 1', async () => {
  console.log('[CRON] Running weekly AI analysis report generation...');
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    await aiAnalysisService.generateWeeklyReport({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
    console.log('[CRON] Weekly report generated successfully');
  } catch (error) {
    console.error('[CRON] Failed to generate weekly report:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/New_York',
});

// Update economic data every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Updating economic data...');
  // Would normally call economic data service
  console.log('[CRON] Economic data update scheduled (requires API keys)');
});

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════╗
║         FinanceAI Backend Server             ║
╠══════════════════════════════════════════════╣
║  Status:  Running                            ║
║  Port:    ${PORT}                               ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                      ║
║  API:     http://localhost:${PORT}/api          ║
║  Health:  http://localhost:${PORT}/health       ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
