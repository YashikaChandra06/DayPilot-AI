import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Task } from '../../types';
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Filter,
  Check,
  AlertCircle,
  Flame,
} from 'lucide-react';

interface TasksViewProps {
  onRefreshTrigger?: number;
  onStreakUpdate?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  onRefreshTrigger = 0,
  onStreakUpdate,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [activeTab, priorityFilter, onRefreshTrigger]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({
        status: activeTab === 'completed' ? 'completed' : activeTab === 'all' ? undefined : 'pending',
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        dueToday: activeTab === 'today' ? true : undefined,
      });

      let filtered = res.tasks;
      if (activeTab === 'upcoming') {
        const todayStr = new Date().toISOString().split('T')[0];
        filtered = res.tasks.filter(
          (t) => t.dueDate && t.dueDate.split('T')[0] > todayStr && t.status === 'pending'
        );
      }
      setTasks(filtered);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      const res = await api.createTask({
        title: quickTitle,
        priority: quickPriority,
        dueDate: quickDueDate || undefined,
      });
      setTasks([res.task, ...tasks]);
      setQuickTitle('');
      setQuickDueDate('');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await api.updateTask(task._id, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === task._id ? res.task : t)));

      if (newStatus === 'completed') {
        setCelebrationMessage('Task completed! Streak updated! 🔥');
        onStreakUpdate?.();
        setTimeout(() => setCelebrationMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Celebration Message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Task Pilot</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize priorities, schedule due dates, and build consistent momentum.
          </p>
        </div>

        {celebrationMessage && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-2">
            <Flame className="w-4 h-4 fill-amber-500 animate-bounce" />
            <span>{celebrationMessage}</span>
          </div>
        )}
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAddTask}
        className="p-3.5 rounded-2xl border border-border bg-card shadow-sm flex flex-wrap items-center gap-2.5"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <Plus className="w-4 h-4 text-primary-500 shrink-0 ml-1" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Add a new task..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Priority Selector */}
        <select
          value={quickPriority}
          onChange={(e: any) => setQuickPriority(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 text-[11px] font-semibold text-foreground outline-none cursor-pointer"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Due Date Picker */}
        <input
          type="date"
          value={quickDueDate}
          onChange={(e) => setQuickDueDate(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 text-[11px] text-foreground outline-none cursor-pointer"
        />

        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="px-4 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all"
        >
          Add Task
        </button>
      </form>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center space-x-1.5">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground text-xs outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs space-y-2">
          <Check className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p>No tasks found in this view.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`p-3.5 rounded-2xl border border-border flex items-center justify-between transition-all group ${
                task.status === 'completed'
                  ? 'bg-muted/30 opacity-75'
                  : 'bg-card hover:border-primary-500/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleTask(task)}
                  className="p-1 text-muted-foreground hover:text-primary-600 transition-colors"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold text-foreground truncate ${
                      task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 ml-3 shrink-0">
                {task.dueDate && (
                  <div className="flex items-center space-x-1 text-[11px] text-muted-foreground">
                    <Calendar className="w-3 h-3 text-primary-500" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    task.priority === 'urgent'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : task.priority === 'high'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
