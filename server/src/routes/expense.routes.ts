import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { StreakService } from '../services/streak/streakService';
import { EXPENSE_CATEGORIES } from '../config/constants';

const router = Router();

const createTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().default('INR'),
    type: z.enum(['expense', 'income']).default('expense'),
    category: z.string().min(1, 'Category is required'),
    merchant: z.string().optional(),
    notes: z.string().optional(),
    transactionDate: z.string().optional(),
    confirmationStatus: z.enum(['confirmed', 'pending', 'planned']).default('confirmed'),
  }),
});

const updateTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
    type: z.enum(['expense', 'income']).optional(),
    category: z.string().optional(),
    merchant: z.string().optional(),
    notes: z.string().optional(),
    transactionDate: z.string().optional(),
    confirmationStatus: z.enum(['confirmed', 'pending', 'planned']).optional(),
  }),
});

const setBudgetSchema = z.object({
  body: z.object({
    category: z.string().min(1),
    amount: z.number().min(0),
    currency: z.string().default('INR'),
    period: z.enum(['monthly', 'yearly']).default('monthly'),
  }),
});

// GET /api/expenses - list transactions with filtering
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { type, category, startDate, endDate, status, limit = '50', page = '1' } = req.query;

    const query: any = { userId: user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.confirmationStatus = status;

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate as string);
      if (endDate) query.transactionDate.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch transactions' });
  }
});

// GET /api/expenses/analytics - aggregated spending, category breakdown, monthly totals
router.get('/analytics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Current month transactions
    const currentMonthTxs = await Transaction.find({
      userId: user._id,
      confirmationStatus: 'confirmed',
      transactionDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    });

    let totalExpenseThisMonth = 0;
    let totalIncomeThisMonth = 0;
    const categoryTotals: Record<string, number> = {};

    for (const cat of EXPENSE_CATEGORIES) {
      categoryTotals[cat] = 0;
    }

    currentMonthTxs.forEach((tx) => {
      if (tx.type === 'expense') {
        totalExpenseThisMonth += tx.amount;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      } else if (tx.type === 'income') {
        totalIncomeThisMonth += tx.amount;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenseThisMonth > 0 ? Math.round((amount / totalExpenseThisMonth) * 100) : 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Recent 7 days trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentTxs = await Transaction.find({
      userId: user._id,
      confirmationStatus: 'confirmed',
      type: 'expense',
      transactionDate: { $gte: sevenDaysAgo },
    });

    const dailyTrendMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      dailyTrendMap[key] = 0;
    }

    recentTxs.forEach((tx) => {
      const key = tx.transactionDate.toISOString().split('T')[0];
      if (dailyTrendMap[key] !== undefined) {
        dailyTrendMap[key] += tx.amount;
      }
    });

    const dailyTrend = Object.entries(dailyTrendMap).map(([date, amount]) => ({
      date,
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount,
    }));

    // Record review activity in streak if appropriate
    await StreakService.recordActivity(user._id, 'spending_reviewed', {
      timezone: user.timezone,
    });

    res.json({
      success: true,
      analytics: {
        totalExpenseThisMonth,
        totalIncomeThisMonth,
        netSavings: totalIncomeThisMonth - totalExpenseThisMonth,
        categoryBreakdown,
        dailyTrend,
        overallBudget: user.monthlyBudgetPreferences?.overallBudget || 0,
        currency: user.currency,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to compute analytics' });
  }
});

// GET /api/expenses/budgets - get budgets and category usage
router.get('/budgets', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const budgets = await Budget.find({ userId: user._id });

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTxs = await Transaction.find({
      userId: user._id,
      type: 'expense',
      confirmationStatus: 'confirmed',
      transactionDate: { $gte: firstDay, $lte: lastDay },
    });

    const spentByCategory: Record<string, number> = {};
    let totalSpent = 0;
    monthTxs.forEach((tx) => {
      spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
      totalSpent += tx.amount;
    });

    const budgetStatus = budgets.map((b) => {
      const spent = spentByCategory[b.category] || 0;
      return {
        _id: b._id,
        category: b.category,
        budgetAmount: b.amount,
        spentAmount: spent,
        remaining: Math.max(0, b.amount - spent),
        percentUsed: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
        isExceeded: spent > b.amount,
      };
    });

    res.json({
      success: true,
      overallBudget: user.monthlyBudgetPreferences?.overallBudget || 0,
      totalSpent,
      budgets: budgetStatus,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch budgets' });
  }
});

// POST /api/expenses/budgets - set/update category or overall budget
router.post('/budgets', authenticate, validate(setBudgetSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { category, amount, currency, period } = req.body;

    if (category.toLowerCase() === 'overall') {
      user.monthlyBudgetPreferences = { overallBudget: amount };
      await user.save();
      res.json({ success: true, message: 'Overall monthly budget updated', overallBudget: amount });
      return;
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: user._id, category, period },
      { amount, currency, period },
      { upsert: true, new: true }
    );

    res.json({ success: true, budget });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to set budget' });
  }
});

// POST /api/expenses - manual transaction create
router.post('/', authenticate, validate(createTransactionSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amount, currency, type, category, merchant, notes, transactionDate, confirmationStatus } = req.body;

    const tx = await Transaction.create({
      userId: user._id,
      amount,
      currency: currency || user.currency,
      type,
      category,
      merchant,
      notes,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      confirmationStatus: confirmationStatus || 'confirmed',
      inputSource: 'manual',
    });

    const streakResult = await StreakService.recordActivity(user._id, 'transaction_confirmed', {
      timezone: user.timezone,
      relatedEntityId: tx._id.toString(),
    });

    res.status(201).json({
      success: true,
      transaction: tx,
      streak: streakResult.streak,
      isNewDay: streakResult.isNewDay,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create transaction' });
  }
});

// PATCH /api/expenses/:id
router.patch('/:id', authenticate, validate(updateTransactionSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const tx = await Transaction.findOne({ _id: req.params.id, userId: user._id });
    if (!tx) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    const updates = req.body;
    if (updates.amount !== undefined) tx.amount = updates.amount;
    if (updates.currency !== undefined) tx.currency = updates.currency;
    if (updates.type !== undefined) tx.type = updates.type;
    if (updates.category !== undefined) tx.category = updates.category;
    if (updates.merchant !== undefined) tx.merchant = updates.merchant;
    if (updates.notes !== undefined) tx.notes = updates.notes;
    if (updates.confirmationStatus !== undefined) tx.confirmationStatus = updates.confirmationStatus;
    if (updates.transactionDate !== undefined) tx.transactionDate = new Date(updates.transactionDate);

    await tx.save();
    res.json({ success: true, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update transaction' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: user._id });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }
    res.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete transaction' });
  }
});

export default router;
