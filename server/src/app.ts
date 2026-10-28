import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import captureRoutes from './routes/capture.routes';
import noteRoutes from './routes/note.routes';
import taskRoutes from './routes/task.routes';
import expenseRoutes from './routes/expense.routes';
import streakRoutes from './routes/streak.routes';
import voiceRoutes from './routes/voice.routes';
import aiRoutes from './routes/ai.routes';

export const createApp = () => {
  const app = express();

  // Basic security rate limiter for API endpoints (generous for dev/demo)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Global Middleware
  app.use(
    cors({
      origin: [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use('/api', limiter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DayPilot AI Backend',
      timestamp: new Date().toISOString(),
      llmProvider: config.llm.provider,
      voiceAdapter: config.gnani.useMock ? 'mock-voice-adapter' : 'gnani-ai',
    });
  });

  // Mount API route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/capture', captureRoutes);
  app.use('/api/notes', noteRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/streak', streakRoutes);
  app.use('/api/voice', voiceRoutes);
  app.use('/api/ai', aiRoutes);

  // 404 handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
};
