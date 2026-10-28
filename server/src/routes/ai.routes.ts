import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AIService } from '../services/ai/aiService';
import { Note } from '../models/Note';
import { Task } from '../models/Task';
import { Transaction } from '../models/Transaction';
import { StreakService } from '../services/streak/streakService';

const router = Router();

const askSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query is required'),
    language: z.string().optional(),
  }),
});

// GET /api/ai/briefing - personalized daily briefing
router.get('/briefing', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const timezone = user.timezone || 'Asia/Kolkata';

    // 1. Fetch Streak
    const streak = await StreakService.getOrCreateStreak(user._id, timezone);

    // 2. Fetch Tasks (pending, prioritized)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [todayTasks, pendingTasks, recentNotes, monthTxs] = await Promise.all([
      Task.find({
        userId: user._id,
        status: 'pending',
        dueDate: { $gte: startOfDay, $lte: endOfDay },
      }),
      Task.find({ userId: user._id, status: 'pending' }).sort({ priority: -1, dueDate: 1 }).limit(5),
      Note.find({ userId: user._id, archived: { $ne: true } }).sort({ createdAt: -1 }).limit(3),
      Transaction.find({
        userId: user._id,
        confirmationStatus: 'confirmed',
        type: 'expense',
        transactionDate: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      }),
    ]);

    const totalSpentThisMonth = monthTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const overallBudget = user.monthlyBudgetPreferences?.overallBudget || 0;
    const budgetPct = overallBudget > 0 ? Math.round((totalSpentThisMonth / overallBudget) * 100) : null;

    // Greeting by time of day
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }).format(now),
      10
    );
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    // Build multilingual-friendly personalized briefing script
    const greetingText = `${greeting}, ${user.name}!`;
    const streakText = `🔥 You are on a ${streak.currentStreak}-day streak! Best streak: ${streak.bestStreak} days.`;

    const tasksSummary =
      todayTasks.length > 0
        ? `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} scheduled for today, including "${todayTasks[0].title}".`
        : pendingTasks.length > 0
        ? `No tasks scheduled specifically for today, but you have ${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''} on your radar.`
        : 'Your task list is clear today! Great job staying ahead.';

    const financeSummary =
      overallBudget > 0
        ? `Monthly spending is at ${user.currency} ${totalSpentThisMonth.toLocaleString()} of your ${user.currency} ${overallBudget.toLocaleString()} budget (${budgetPct}% used).`
        : `You have spent ${user.currency} ${totalSpentThisMonth.toLocaleString()} this month.`;

    const focusQuote =
      streak.currentStreak >= 7
        ? 'Consistency is your superpower. Keep this momentum rolling!'
        : 'Every small action recorded today builds lasting momentum. Capture thoughts freely!';

    res.json({
      success: true,
      briefing: {
        greeting: greetingText,
        streakMessage: streakText,
        tasksSummary,
        financeSummary,
        focusQuote,
        fullText: `${greetingText} ${streakText} ${tasksSummary} ${financeSummary} ${focusQuote}`,
        stats: {
          currentStreak: streak.currentStreak,
          todayTaskCount: todayTasks.length,
          pendingTaskCount: pendingTasks.length,
          monthlySpent: totalSpentThisMonth,
          overallBudget,
          budgetPercent: budgetPct,
        },
        todayTasks,
        pendingTasks,
        recentNotes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate briefing' });
  }
});

// POST /api/ai/ask - multilingual grounded memory Q&A
router.post('/ask', authenticate, validate(askSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { query } = req.body;

    const [notes, tasks, transactions] = await Promise.all([
      Note.find({ userId: user._id, archived: { $ne: true } }).sort({ createdAt: -1 }).limit(50),
      Task.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
      Transaction.find({ userId: user._id }).sort({ transactionDate: -1 }).limit(50),
    ]);

    const result = await AIService.answerMemoryQuery(query, notes, tasks, transactions);

    res.json({
      success: true,
      query,
      answer: result.answer,
      confidence: result.confidence,
      sourceNotes: result.sourceNotes,
      sourceTasks: result.sourceTasks,
      sourceTransactions: result.sourceTransactions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'AI inquiry failed' });
  }
});

export default router;
