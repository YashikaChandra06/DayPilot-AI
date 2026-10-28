import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Transaction, Budget } from '../../types';
import {
  Wallet,
  Plus,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Mic,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface ExpensesViewProps {
  onRefreshTrigger?: number;
  onOpenCapture?: () => void;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#14b8a6', '#f43f5e'];
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Bills', 'Health', 'Travel', 'Other'];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onRefreshTrigger = 0,
  onOpenCapture,
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [overallBudget, setOverallBudget] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Food');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('Overall');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExpenseData();
  }, [onRefreshTrigger]);

  const loadExpenseData = async () => {
    setLoading(true);
    try {
      const [txRes, analyticsRes, budgetRes] = await Promise.allSettled([
        api.getExpenses(),
        api.getExpenseAnalytics(),
        api.getBudgets(),
      ]);

      if (txRes.status === 'fulfilled') setTransactions(txRes.value.transactions);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.analytics);
      if (budgetRes.status === 'fulfilled') {
        setBudgets(budgetRes.value.budgets);
        setOverallBudget(budgetRes.value.overallBudget);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    setIsSubmitting(true);
    try {
      const res = await api.createExpense({
        amount: Number(amount),
        type,
        category,
        merchant: merchant.trim() || undefined,
        notes: notes.trim() || undefined,
        currency: user?.currency || 'INR',
      });

      setTransactions([res.transaction, ...transactions]);
      setIsAddModalOpen(false);
      setAmount('');
      setMerchant('');
      setNotes('');
      // Refresh analytics
      loadExpenseData();
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetAmount || isNaN(Number(budgetAmount))) return;
    setIsSubmitting(true);
    try {
      await api.setBudget({
        category: budgetCategory,
        amount: Number(budgetAmount),
        currency: user?.currency || 'INR',
      });
      setIsBudgetModalOpen(false);
      setBudgetAmount('');
      loadExpenseData();
    } catch (err) {
      console.error('Failed to set budget:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.deleteExpense(id);
      setTransactions(transactions.filter((t) => t._id !== id));
      loadExpenseData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const totalSpent = analytics?.totalExpenseThisMonth || 0;
  const budgetPercentage = overallBudget > 0 ? Math.round((totalSpent / overallBudget) * 100) : 0;
  const isBudgetExceeded = overallBudget > 0 && totalSpent > overallBudget;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Money & Budget Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Voice-captured expenses, category breakdowns, and real-time monthly budget alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            Set Budget
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Monthly Budget Card */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Monthly Budget Overview</span>
              <p className="text-[11px] text-muted-foreground">
                Current month spend vs configured overall limit
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg sm:text-xl font-bold text-foreground">
              {user?.currency || 'INR'} {totalSpent.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              / {overallBudget > 0 ? `${user?.currency || 'INR'} ${overallBudget.toLocaleString()}` : 'No Limit'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {overallBudget > 0 ? (
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                className={`h-full transition-all duration-500 ${
                  isBudgetExceeded
                    ? 'bg-red-500'
                    : budgetPercentage > 80
                    ? 'bg-amber-500'
                    : 'bg-primary-500'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span
                className={`font-semibold ${
                  isBudgetExceeded
                    ? 'text-red-500'
                    : budgetPercentage > 80
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {budgetPercentage}% used
              </span>
              <span className="text-muted-foreground">
                {isBudgetExceeded
                  ? `Over budget by ${user?.currency || 'INR'} ${(totalSpent - overallBudget).toLocaleString()}`
                  : `${user?.currency || 'INR'} ${(overallBudget - totalSpent).toLocaleString()} remaining`}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground flex items-center justify-between">
            <span>You haven't set a monthly budget yet. Setting one helps DayPilot warn you early.</span>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline text-xs"
            >
              Set Budget Now
            </button>
          </div>
        )}
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown (Donut/Pie) */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-foreground text-sm">Category Breakdown</h2>
            </div>

            {analytics.categoryBreakdown.length > 0 ? (
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {analytics.categoryBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${user?.currency || 'INR'} ${val}`, 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
                No spending data recorded this month.
              </div>
            )}
          </div>

          {/* 7-Day Spending Trend (Bar) */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold text-foreground text-sm">Last 7 Days Trend</h2>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: number) => [`${user?.currency || 'INR'} ${val}`, 'Spent']}
                  />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Recent Transactions</h2>
          <span className="text-xs text-muted-foreground">{transactions.length} total entries</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            No transactions found. Speak or add your first expense!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Merchant / Note</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tx.type === 'expense'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-foreground">{tx.category}</td>
                    <td className="py-3 text-muted-foreground">
                      {tx.merchant || tx.notes || '—'}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(tx.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right font-bold text-foreground">
                      {tx.type === 'expense' ? '-' : '+'}
                      {tx.currency} {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteTransaction(tx._id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-bold text-foreground text-sm">Add Transaction</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`p-2 rounded-xl font-bold border transition-all ${
                    type === 'expense'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-600 dark:text-red-400'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`p-2 rounded-xl font-bold border transition-all ${
                    type === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-600 dark:text-emerald-400'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Income (+)
                </button>
              </div>

              <div>
                <label className="font-semibold text-foreground">Amount ({user?.currency || 'INR'})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Merchant / Store (Optional)</label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g., Starbucks, Swiggy, Metro"
                  className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Team lunch celebration"
                  className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-bold text-foreground text-sm">Set Monthly Budget</h2>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSetBudget} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Budget Scope</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                >
                  <option value="Overall">Overall Monthly Spend</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Budget Limit ({user?.currency || 'INR'})</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
