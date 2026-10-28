import mongoose from 'mongoose';
import { config } from './env';

let memoryServer: any = null;

export const connectDB = async (): Promise<void> => {
  try {
    // First try configured MONGODB_URI (e.g. local or atlas) with a short timeout
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully: ${mongoose.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to ${config.mongoUri}. Initializing embedded MongoDB Memory Server...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`[MongoDB] Connected to in-memory MongoDB at: ${uri}`);
    } catch (memError) {
      console.error('[MongoDB] Fatal: Could not connect to Mongo or launch in-memory server:', memError);
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
