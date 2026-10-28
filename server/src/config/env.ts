import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const gnaniKey = process.env.GNANI_API_KEY || process.env.GNANI_TOKEN || '';
const useMockExplicit = process.env.GNANI_USE_MOCK;

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/daypilot-ai',
  jwtSecret: process.env.JWT_SECRET || 'daypilot-super-secret-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
  defaultLocale: process.env.DEFAULT_LOCALE || 'en-IN',

  // Gnani AI (Vachana) credentials & endpoints
  gnani: {
    apiKey: gnaniKey,
    token: process.env.GNANI_TOKEN || gnaniKey,
    sttEndpoint: process.env.GNANI_STT_ENDPOINT || 'https://api.vachana.ai/stt/v3',
    ttsEndpoint: process.env.GNANI_TTS_ENDPOINT || 'https://api.vachana.ai/api/v1/tts/inference',
    // When API key is provided and GNANI_USE_MOCK is not 'true', use real Gnani provider
    useMock: useMockExplicit === 'true' ? true : !gnaniKey,
  },

  // LLM Provider Configuration
  llm: {
    provider: process.env.LLM_PROVIDER || 'local',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    endpoint: process.env.LLM_ENDPOINT || '',
  },
};
