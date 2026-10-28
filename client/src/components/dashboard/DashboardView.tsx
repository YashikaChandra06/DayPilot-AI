import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BriefingData, Task, Note, Transaction, StreakInfo } from '../../types';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Circle,
  Wallet,
  ArrowUpRight,
  Play,
  Pause,
  Volume2,
  Calendar,
  Layers,
  Plus,
  Mic,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenCapture: () => void;
  onNavigateTab: (tab: any) => void;
  onRefreshTrigger?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCapture,
  onNavigateTab,
  onRefreshTrigger = 0,
}) => {
  const { user, activeLanguage } = useAuth();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [onRefreshTrigger]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [briefingRes, streakRes, tasksRes, notesRes, expRes] = await Promise.allSettled([
        api.getBriefing(),
        api.getStreak(),
        api.getTasks({ dueToday: true }),
        api.getNotes(),
        api.getExpenses(),
      ]);

      if (briefingRes.status === 'fulfilled') setBriefing(briefingRes.value.briefing);
      if (streakRes.status === 'fulfilled') setStreak(streakRes.value.streak);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.tasks);
      if (notesRes.status === 'fulfilled') setNotes(notesRes.value.notes.slice(0, 3));
      if (expRes.status === 'fulfilled') setTransactions(expRes.value.transactions.slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task._id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
      );
      // Reload streak
      const s = await api.getStreak();
      setStreak(s.streak);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handlePlayBriefing = () => {
    if (!briefing) return;
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    } else {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(briefing.fullText);
        utterance.lang = activeLanguage || 'en-IN';
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero AI Morning Briefing Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-950 text-white shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-primary-200" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                Personalized AI Daily Briefing
              </span>
            </div>

            {/* Audio Playback Pill */}
            <button
              onClick={handlePlayBriefing}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-semibold text-white border border-white/20 transition-all active:scale-95"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span>Pause Briefing</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                  <span>Listen to Briefing</span>
                </>
              )}
            </button>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {briefing?.greeting || `Hello, ${user?.name || 'Explorer'}!`}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-primary-100/90 leading-relaxed max-w-3xl">
              {briefing?.tasksSummary || 'Ready to seize the day with organized notes and smart spend tracking.'}{' '}
              {briefing?.financeSummary}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-xs text-primary-100">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>{briefing?.streakMessage || `${streak?.currentStreak || 1}-day active streak`}</span>
            </div>
            <p className="text-xs italic text-primary-200/80">
              "{briefing?.focusQuote || 'Every note and task recorded builds lasting productivity.'}"
            </p>
          </div>
        </div>

        {/* Ambient Decorative Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div
          onClick={() => onNavigateTab('streak')}
          className="p-5 rounded-2xl border border-border bg-card hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Streak</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {streak?.currentStreak || 1} <span className="text-sm font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Best: {streak?.bestStreak || 1} days • {streak?.hasCompletedToday ? 'Completed today ✅' : 'Action needed'}
            </p>
          </div>
        </div>

        {/* Tasks Due Today */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="p-5 rounded-2xl border border-border bg-card hover:border-primary-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Today's Tasks</span>
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {tasks.filter((t) => t.status === 'pending').length}{' '}
              <span className="text-sm font-normal text-muted-foreground">pending</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {tasks.filter((t) => t.status === 'completed').length} completed today
            </p>
          </div>
        </div>

        {/* Monthly Spending */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="p-5 rounded-2xl border border-border bg-card hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Monthly Spend</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {user?.currency || 'INR'} {(briefing?.stats.monthlySpent || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {briefing?.stats.budgetPercent !== null
                ? `${briefing?.stats.budgetPercent}% of monthly budget`
                : 'Budget not set'}
            </p>
          </div>
        </div>

        {/* Memory Notes */}
        <div
          onClick={() => onNavigateTab('notes')}
          className="p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Saved Notes</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {notes.length}{' '}
              <span className="text-sm font-normal text-muted-foreground">recent</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Summarized with action items
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks Section */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-foreground text-sm">Tasks on Radar</h2>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs space-y-2">
                <p>No tasks scheduled for today.</p>
                <button
                  onClick={onOpenCapture}
                  className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-300 font-semibold"
                >
                  Capture a new task
                </button>
              </div>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div
                  key={task._id}
                  onClick={() => handleToggleTask(task)}
                  className={`p-3 rounded-xl border border-border flex items-center justify-between cursor-pointer transition-all ${
                    task.status === 'completed'
                      ? 'bg-muted/40 opacity-70'
                      : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary-600"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-xs font-medium text-foreground ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      task.priority === 'urgent'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : task.priority === 'high'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notes & Summaries */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h2 className="font-semibold text-foreground text-sm">Recent Memories & Notes</h2>
            </div>
            <button
              onClick={() => onNavigateTab('notes')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {notes.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs space-y-2">
                <p>No notes saved yet.</p>
                <button
                  onClick={onOpenCapture}
                  className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-300 font-semibold"
                >
                  Record first note
                </button>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => onNavigateTab('notes')}
                  className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{note.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                      {note.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {note.summary?.brief || note.originalContent}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
