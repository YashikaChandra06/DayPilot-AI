# DayPilot AI — Multilingual Personal Memory & Money Assistant

DayPilot AI is a personal AI assistant that turns voice and text inputs into organized notes, summaries, tasks, and reminders while tracking expenses, daily habits, and productivity streaks across Indian languages.

---

## 🌟 Key Features

1. **🎙️ Multilingual Universal Voice & Text Capture**
   - Natural speech and text input supported across **9 Indian languages & dialects**: English (India), Hinglish, हिन्दी (Hindi), தமிழ் (Tamil), తెలుగు (Telugu), ಕನ್ನಡ (Kannada), বাংলা (Bengali), मराठी (Marathi), and ગુજરાતી (Gujarati).
   - Powered by Gnani AI voice recognition with built-in resilient offline/mock adapters.
   - Dual-engine parsing: external LLM (OpenAI / Groq / Gemini) or fast deterministic local regex/NLP extractor.

2. **📝 Notes & 3-Level Summarization**
   - Stores raw transcripts alongside structured notes.
   - Generates multi-level summaries on demand: **Quick Brief**, **Standard Summary**, and **Detailed Analysis**.
   - Automatically extracts action items and suggested categorical tags.

3. **✅ Task Pilot**
   - Smart priority assignments (`urgent`, `high`, `medium`, `low`) and deadline tracking.
   - Completing tasks automatically logs qualifying activity in the streak engine.

4. **💰 Money & Budget Tracker**
   - Extracts transactions from conversational speech (*e.g., "Spent 180 on lunch and 60 on metro"*).
   - Real-time monthly budget alerts, category breakdowns, and 7-day spending trend charts via Recharts.

5. **🔥 Streak & Habit Engine**
   - Authoritative streak ledger based on calendar dates in the user's local timezone.
   - 35-day activity heatmap (similar to contribution graphs).
   - Milestone badges: Spark (3d), Flame (7d), Blaze (14d), Master (30d), and Titan (100d).

6. **🤖 Grounded Multilingual Assistant Q&A**
   - Chat with DayPilot about your notes, spending, or tasks.
   - Strict grounding in your personal library with clickable source citations.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# In the root directory:
npm run install:all
```

### 2. Run the Full Application (Client + Server)
```bash
npm run dev
```
- **Backend API**: [http://localhost:5000](http://localhost:5000) (Health: `/api/health`)
- **Frontend App**: [http://localhost:5173](http://localhost:5173)

### 3. Run Automated Integration Tests
```bash
npm test
```
Runs the 15-test suite testing Auth, Universal Capture, Notes, Tasks, Expenses, Streak engine, AI Briefing, and Voice APIs against an in-memory MongoDB instance.

---

## 📁 Project Architecture

```
DayPilot-AI/
├── package.json               # Root scripts (dev, test, build)
├── server/                    # Node.js + Express + TypeScript + MongoDB Backend
│   ├── src/
│   │   ├── config/            # Environment (env.ts), constants, db connector
│   │   ├── middleware/        # JWT auth, Zod validation, error handler
│   │   ├── models/            # User, Note, Task, Transaction, Budget, Activity, UserStreak
│   │   ├── routes/            # auth, capture, note, task, expense, streak, voice, ai
│   │   ├── services/
│   │   │   ├── ai/            # AIService (extraction, 3-level summaries, grounded Q&A)
│   │   │   ├── streak/        # Authoritative streak service & milestone calculation
│   │   │   └── voice/         # Gnani voice provider + mock fallback
│   │   ├── tests/             # Comprehensive Vitest integration test suite (15/15 passing)
│   │   ├── app.ts             # Express app setup & route mounting
│   │   └── index.ts           # Server bootstrap
├── client/                    # React 18 + TypeScript + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Navbar (streak, language picker, CTA), Sidebar
│   │   │   ├── capture/       # UniversalCaptureModal (waveform recording, AI preview)
│   │   │   ├── dashboard/     # DailyBriefingCard (TTS audio playback), QuickStats
│   │   │   ├── notes/         # NotesView (3-level summary tabs, category filters)
│   │   │   ├── tasks/         # TasksView (priority filters, completion celebrations)
│   │   │   ├── expenses/      # ExpensesView (Recharts charts, budget bar, transactions)
│   │   │   ├── streak/        # StreakView (35-day heatmap, milestone badges)
│   │   │   ├── assistant/     # AssistantView (grounded conversational chat)
│   │   │   ├── settings/      # SettingsView (voice language, currency, reminders)
│   │   │   └── auth/          # AuthModal with 1-Click Instant Demo Login
│   │   ├── context/           # AuthContext, ThemeContext (dark/light)
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx            # Root application layout
│   │   └── main.tsx           # Entry point
```
