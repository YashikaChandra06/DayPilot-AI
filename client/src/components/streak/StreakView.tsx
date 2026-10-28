import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StreakInfo, ActivityHeatmapDay } from '../../types';
import {
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Star,
} from 'lucide-react';

interface StreakViewProps {
  onRefreshTrigger?: number;
}

const MILESTONES_DEF = [
  { days: 3, title: 'Spark of Habit', icon: '✨', description: 'Record qualifying activity for 3 consecutive days.' },
  { days: 7, title: 'Flame of Consistency', icon: '🔥', description: 'Complete a full 7-day week streak.' },
  { days: 14, title: 'Blaze of Discipline', icon: '⚡', description: 'Sustain 14 days of active memory & money logging.' },
  { days: 30, title: 'Productivity Master', icon: '🏆', description: 'Achieve a 1-month unbroken streak.' },
  { days: 100, title: 'DayPilot Titan', icon: '👑', description: 'Join the legendary 100-day elite club.' },
];

export const StreakView: React.FC<StreakViewProps> = ({ onRefreshTrigger = 0 }) => {
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [heatmap, setHeatmap] = useState<ActivityHeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  useEffect(() => {
    loadStreak();
  }, [onRefreshTrigger]);

  const loadStreak = async () => {
    setLoading(true);
    try {
      const res = await api.getStreak();
      setStreak(res.streak);
      setHeatmap(res.heatmap);
    } catch (err) {
      console.error('Failed to load streak:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckin = async () => {
    try {
      const res = await (api as any).recordActivity?.('daily_review_completed') ||
        fetch('/api/streak/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('daypilot_token')}`,
          },
          body: JSON.stringify({ activityType: 'daily_review_completed' }),
        }).then((r) => r.json());

      setCheckinSuccess(true);
      loadStreak();
      setTimeout(() => setCheckinSuccess(false), 4000);
    } catch (err) {
      console.error('Checkin failed:', err);
    }
  };

  const currentStreak = streak?.currentStreak || 1;
  const bestStreak = streak?.bestStreak || 1;
  const totalDays = streak?.totalActiveDays || 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Streak & Habit Engine</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Habits form when daily effort is recognized. Log thoughts, complete tasks, or review spending daily.
        </p>
      </div>

      {/* Main Flame Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20 shrink-0">
            <Flame className="w-10 h-10 text-white fill-white animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {currentStreak}
              </span>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Day Streak
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {streak?.hasCompletedToday
                ? 'Streak active today! You have logged qualifying activity.'
                : 'Complete a task or log an expense today to keep your streak burning!'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:items-end space-y-2 w-full sm:w-auto">
          <button
            onClick={handleManualCheckin}
            disabled={checkinSuccess}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-70"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{checkinSuccess ? 'Checked In for Today! 🔥' : 'Complete Daily Review'}</span>
          </button>
          <span className="text-[10px] text-muted-foreground text-center sm:text-right">
            Best streak: {bestStreak} days • {totalDays} total active days
          </span>
        </div>
      </div>

      {/* 35-Day Activity Calendar Heatmap */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-foreground text-sm">35-Day Activity Heatmap</h2>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-muted" />
            <span className="w-2.5 h-2.5 rounded-sm bg-primary-200 dark:bg-primary-900" />
            <span className="w-2.5 h-2.5 rounded-sm bg-primary-400 dark:bg-primary-700" />
            <span className="w-2.5 h-2.5 rounded-sm bg-primary-600 dark:bg-primary-500" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-7 gap-2">
          {heatmap.map((day) => {
            const dateObj = new Date(day.date);
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <div
                key={day.date}
                title={`${dateLabel}: ${day.count} activities`}
                className={`h-12 rounded-xl border flex flex-col justify-between p-1.5 transition-transform hover:scale-105 cursor-default ${
                  day.count >= 3
                    ? 'bg-primary-600 text-white border-primary-500 shadow-sm'
                    : day.count === 2
                    ? 'bg-primary-400 text-white border-primary-400'
                    : day.count === 1
                    ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                    : 'bg-muted/40 text-muted-foreground border-border/60'
                }`}
              >
                <span className="text-[10px] font-semibold">{dateObj.getDate()}</span>
                <span className="text-[9px] opacity-80">{day.count > 0 ? `${day.count}x` : '—'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-foreground text-sm">Milestone Badges</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MILESTONES_DEF.map((m) => {
            const isAchieved = currentStreak >= m.days || bestStreak >= m.days;
            const progress = Math.min(Math.round((currentStreak / m.days) * 100), 100);

            return (
              <div
                key={m.days}
                className={`p-4 rounded-xl border transition-all ${
                  isAchieved
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-card border-border opacity-70'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <h3 className="font-bold text-xs text-foreground">{m.title}</h3>
                      <span className="text-[10px] text-muted-foreground">{m.days} Days Goal</span>
                    </div>
                  </div>
                  {isAchieved ? (
                    <span className="p-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground">{progress}%</span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  {m.description}
                </p>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progress}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAchieved ? 'bg-amber-500' : 'bg-primary-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
