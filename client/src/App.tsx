import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { NotesView } from './components/notes/NotesView';
import { TasksView } from './components/tasks/TasksView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { StreakView } from './components/streak/StreakView';
import { AssistantView } from './components/assistant/AssistantView';
import { SettingsView } from './components/settings/SettingsView';
import { UniversalCaptureModal } from './components/capture/UniversalCaptureModal';
import { AuthModal } from './components/auth/AuthModal';
import { api } from './services/api';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [streakCount, setStreakCount] = useState(1);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadBadges();
    }
  }, [isAuthenticated, refreshTrigger]);

  const loadBadges = async () => {
    try {
      const [streakRes, tasksRes] = await Promise.allSettled([
        api.getStreak(),
        api.getTasks({ status: 'pending' }),
      ]);

      if (streakRes.status === 'fulfilled') {
        setStreakCount(streakRes.value.streak.currentStreak || 1);
      }
      if (tasksRes.status === 'fulfilled') {
        setPendingTasksCount(tasksRes.value.tasks.length);
      }
    } catch {}
  };

  const handleCaptureSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-xs">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-muted-foreground">Loading DayPilot AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        onOpenCapture={() => setIsCaptureOpen(true)}
        streakCount={streakCount}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'capture') {
              setIsCaptureOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          pendingTasksCount={pendingTasksCount}
          streakCount={streakCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenCapture={() => setIsCaptureOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'notes' && <NotesView onRefreshTrigger={refreshTrigger} />}

          {activeTab === 'tasks' && (
            <TasksView
              onRefreshTrigger={refreshTrigger}
              onStreakUpdate={() => setRefreshTrigger((p) => p + 1)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              onRefreshTrigger={refreshTrigger}
              onOpenCapture={() => setIsCaptureOpen(true)}
            />
          )}

          {activeTab === 'streak' && <StreakView onRefreshTrigger={refreshTrigger} />}

          {activeTab === 'assistant' && <AssistantView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Universal Capture Modal */}
      <UniversalCaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onSuccess={handleCaptureSuccess}
      />
    </div>
  );
};

export default AppContent;
