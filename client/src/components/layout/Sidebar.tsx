import React from 'react';
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  CheckSquare,
  Wallet,
  Flame,
  Bot,
  Settings,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'capture'
  | 'notes'
  | 'tasks'
  | 'expenses'
  | 'streak'
  | 'assistant'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingTasksCount?: number;
  streakCount?: number;
}

const NAV_ITEMS: Array<{
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: (props: { pendingTasksCount?: number; streakCount?: number }) => React.ReactNode;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'capture', label: 'Universal Capture', icon: Mic },
  { id: 'notes', label: 'Notes & Memories', icon: BookOpen },
  {
    id: 'tasks',
    label: 'Task Pilot',
    icon: CheckSquare,
    badge: ({ pendingTasksCount }) =>
      pendingTasksCount && pendingTasksCount > 0 ? (
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-300/40">
          {pendingTasksCount}
        </span>
      ) : null,
  },
  { id: 'expenses', label: 'Money & Budget', icon: Wallet },
  {
    id: 'streak',
    label: 'Streak & Habits',
    icon: Flame,
    badge: ({ streakCount }) =>
      streakCount ? (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300/40">
          {streakCount}d
        </span>
      ) : null,
  },
  { id: 'assistant', label: 'Ask DayPilot', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingTasksCount,
  streakCount,
}) => {
  return (
    <aside className="w-full md:w-64 bg-card border-r border-border shrink-0 md:min-h-[calc(100vh-4rem)] p-3 flex md:flex-col justify-between overflow-x-auto md:overflow-y-auto">
      <nav className="flex md:flex-col space-x-1 md:space-x-0 md:space-y-1.5 w-full">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-300 shadow-sm border border-primary-200 dark:border-primary-800/60 font-semibold'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-muted-foreground'
                }`}
              />
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge && item.badge({ pendingTasksCount, streakCount })}
            </button>
          );
        })}
      </nav>

      {/* Multilingual Voice Assistant Promo Pill */}
      <div className="hidden md:block mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-primary-500/10 via-indigo-500/5 to-purple-500/10 border border-primary-500/20">
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="text-base">🎙️</span>
          <span className="text-xs font-bold text-foreground">Gnani Voice Powered</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Speak naturally in Hindi, Hinglish, Tamil, Telugu, Kannada, or English.
        </p>
      </div>
    </aside>
  );
};
