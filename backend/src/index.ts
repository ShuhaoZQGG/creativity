import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import authRoutes from './routes/auth.js';
import creativeRoutes from './routes/creative.js';
import metaRoutes from './routes/meta.js';
import billingRoutes from './routes/billing.js';
import dashboardRoutes from './routes/dashboard.js';
import dataDeletionRoutes from './routes/data-deletion.js';
import { syncAllActiveTests } from './services/analytics-sync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', creativeRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/data-deletion', dataDeletionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Set up cron job for analytics sync (every hour)
// Only run in non-serverless environment
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Starting hourly analytics sync...');
    try {
      const result = await syncAllActiveTests();
      console.log(
        `[Cron] Analytics sync complete: ${result.synced} synced, ${result.failed} failed`
      );
      if (result.errors.length > 0) {
        console.error('[Cron] Sync errors:', result.errors);
      }
    } catch (error) {
      console.error('[Cron] Analytics sync error:', error);
    }
  });

  console.log('[Cron] Analytics sync job scheduled (runs every hour)');
}

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
