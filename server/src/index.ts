import { createApp } from './app';
import { connectDB } from './config/db';
import { config } from './config/env';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB (or embedded memory server fallback)
    await connectDB();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start listening
    const server = app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`🚀 DayPilot AI Server running on port ${config.port}`);
      console.log(`   Health: http://localhost:${config.port}/api/health`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   LLM: ${config.llm.provider}`);
      console.log(`   Voice Provider: ${config.gnani.useMock ? 'MockVoiceAdapter' : 'Gnani AI'}`);
      console.log(`===============================================`);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('\n[DayPilot] Shutting down gracefully...');
      server.close(() => {
        console.log('[DayPilot] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[DayPilot] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
