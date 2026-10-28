import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Note } from '../models/Note';
import { Task } from '../models/Task';
import { Transaction } from '../models/Transaction';
import { Activity } from '../models/Activity';
import { UserStreak } from '../models/UserStreak';

const app = createApp();

describe('DayPilot AI Backend API Test Suite', () => {
  let authToken = '';
  let userId = '';

  beforeAll(async () => {
    // Connect to test db (MongoMemoryServer fallback automatically if local Mongo not present)
    await connectDB();

    // Clean up test collections
    await Promise.all([
      User.deleteMany({}),
      Note.deleteMany({}),
      Task.deleteMany({}),
      Transaction.deleteMany({}),
      Activity.deleteMany({}),
      UserStreak.deleteMany({}),
    ]);
  }, 60000);

  afterAll(async () => {
    await disconnectDB();
  }, 30000);

  // 1. Health Endpoint
  it('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('DayPilot AI');
  });

  // 2. Authentication Flow
  it('POST /api/auth/register creates a new user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Arjun Sharma',
        email: 'arjun@daypilot.ai',
        password: 'securePassword123!',
        preferredInterfaceLanguage: 'en',
        preferredVoiceLanguage: 'hi-Latn',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Arjun Sharma');
    expect(res.body.user.email).toBe('arjun@daypilot.ai');

    authToken = res.body.token;
    userId = res.body.user.id;
  });

  it('POST /api/auth/login authenticates with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'arjun@daypilot.ai',
        password: 'securePassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('GET /api/auth/me returns current authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('arjun@daypilot.ai');
    expect(res.body.user.currency).toBe('INR');
  });

  // 3. Multilingual Universal Capture & Confirm
  it('POST /api/capture parses Hinglish voice transcript into structured tasks & transactions', async () => {
    const speechText =
      'Aaj maine 180 rupees lunch pe aur 60 metro pe spend kiya. Friday tak DBMS assignment submit karna hai.';

    const res = await request(app)
      .post('/api/capture')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        text: speechText,
        source: 'voice',
        language: 'hi-Latn',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.extraction).toBeDefined();

    // Check extracted items
    const { extraction } = res.body;
    expect(extraction.transactions.length).toBeGreaterThanOrEqual(1);
    expect(extraction.tasks.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/capture/confirm commits parsed items to DB and increments streak', async () => {
    const confirmPayload = {
      originalText: 'Paid 350 for groceries at supermarket. Finish quarterly report by tomorrow.',
      source: 'text',
      notes: [
        {
          title: 'Quarterly Planning Notes',
          content: 'Discussed key targets for next quarter with product team.',
          category: 'Work',
          tags: ['planning', 'q3'],
        },
      ],
      tasks: [
        {
          title: 'Finish quarterly report',
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
      transactions: [
        {
          amount: 350,
          currency: 'INR',
          type: 'expense',
          category: 'Shopping',
          merchant: 'Supermarket',
          confirmationStatus: 'confirmed',
        },
      ],
    };

    const res = await request(app)
      .post('/api/capture/confirm')
      .set('Authorization', `Bearer ${authToken}`)
      .send(confirmPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.saved.notes.length).toBe(1);
    expect(res.body.saved.tasks.length).toBe(1);
    expect(res.body.saved.transactions.length).toBe(1);
    expect(res.body.streak.currentStreak).toBeGreaterThanOrEqual(1);
  });

  // 4. Notes API & AI Summaries
  it('GET /api/notes retrieves notes with tags and AI summary', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notes.length).toBeGreaterThanOrEqual(1);
    expect(res.body.notes[0].title).toBe('Quarterly Planning Notes');
    expect(res.body.notes[0].summary).toBeDefined();
  });

  it('POST /api/notes creates manual note with auto AI summarization', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Deep Learning Study Roadmap',
        content:
          'Step 1: Master linear algebra and calculus. Step 2: Understand gradient descent and backpropagation. Step 3: Implement CNNs and Transformer attention heads from scratch in PyTorch.',
        category: 'Learning',
        tags: ['ai', 'study', 'deep-learning'],
        autoSummarize: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.note.summary).toBeDefined();
    expect(res.body.note.keyPoints.length).toBeGreaterThan(0);
  });

  // 5. Tasks API & Completion Streak Trigger
  it('GET /api/tasks lists tasks and PATCH /api/tasks/:id marks task completed', async () => {
    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks.length).toBeGreaterThanOrEqual(1);

    const taskId = listRes.body.tasks[0]._id;

    // Toggle complete
    const patchRes = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'completed' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.task.status).toBe('completed');
    expect(patchRes.body.task.completedAt).toBeDefined();
  });

  // 6. Expenses & Budget API
  it('POST /api/expenses/budgets sets overall budget and category budgets', async () => {
    const overallRes = await request(app)
      .post('/api/expenses/budgets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'Overall',
        amount: 25000,
        currency: 'INR',
      });

    expect(overallRes.status).toBe(200);

    const catRes = await request(app)
      .post('/api/expenses/budgets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'Food',
        amount: 8000,
        currency: 'INR',
      });

    expect(catRes.status).toBe(200);
  });

  it('GET /api/expenses/analytics calculates category breakdown and trend', async () => {
    const res = await request(app)
      .get('/api/expenses/analytics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.analytics).toBeDefined();
    expect(res.body.analytics.totalExpenseThisMonth).toBeGreaterThan(0);
    expect(res.body.analytics.dailyTrend.length).toBe(7);
  });

  // 7. Streak & Activity Heatmap
  it('GET /api/streak returns streak metrics and 35-day activity heatmap', async () => {
    const res = await request(app)
      .get('/api/streak')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.streak.currentStreak).toBeGreaterThanOrEqual(1);
    expect(res.body.heatmap.length).toBe(35);
  });

  // 8. AI Briefing & Grounded Memory Assistant
  it('GET /api/ai/briefing delivers daily audio-ready briefing', async () => {
    const res = await request(app)
      .get('/api/ai/briefing')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.briefing).toBeDefined();
    expect(res.body.briefing.greeting).toContain('Arjun');
    expect(res.body.briefing.fullText).toBeDefined();
    expect(res.body.briefing.stats).toBeDefined();
  });

  it('POST /api/ai/ask answers user query grounded in personal library', async () => {
    const res = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: 'What did I plan for deep learning and transformers?',
      });

    expect(res.status).toBe(200);
    expect(res.body.answer).toContain('Deep Learning Study Roadmap');
    expect(res.body.sourceNotes.length).toBeGreaterThan(0);
  });

  // 9. Voice Languages
  it('GET /api/voice/languages returns 9 Indian languages', async () => {
    const res = await request(app).get('/api/voice/languages');
    expect(res.status).toBe(200);
    expect(res.body.languages.length).toBeGreaterThanOrEqual(9);
    expect(res.body.languages.some((l: any) => l.code === 'hi-Latn')).toBe(true);
  });
});
