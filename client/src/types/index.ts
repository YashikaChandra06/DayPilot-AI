export interface User {
  id: string;
  name: string;
  email: string;
  preferredInterfaceLanguage: string;
  preferredVoiceLanguage: string;
  timezone: string;
  currency: string;
  notificationPreferences?: {
    inAppReminders?: boolean;
    dailyBriefing?: boolean;
  };
  monthlyBudgetPreferences?: {
    overallBudget?: number;
  };
}

export interface SupportedLanguage {
  code: string;
  name: string;
  label: string;
  script: string;
}

export interface NoteSummary {
  brief?: string;
  standard?: string;
  detailed?: string;
}

export interface Note {
  _id: string;
  title: string;
  originalContent: string;
  transcript?: string;
  summary?: NoteSummary;
  keyPoints?: string[];
  actionItems?: string[];
  tags: string[];
  category: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  dueTime?: string;
  timezone?: string;
  reminderSet: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  category: string;
  merchant?: string;
  notes?: string;
  transactionDate: string;
  confirmationStatus: 'confirmed' | 'pending' | 'planned';
  createdAt: string;
}

export interface Budget {
  _id?: string;
  category: string;
  amount?: number;
  budgetAmount?: number;
  spentAmount?: number;
  remaining?: number;
  percentUsed?: number;
  isExceeded?: boolean;
  currency?: string;
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  totalActiveDays: number;
  lastQualifyingActivityDate?: string;
  milestonesAchieved: number[];
  hasCompletedToday: boolean;
}

export interface ActivityHeatmapDay {
  date: string;
  count: number;
  active: boolean;
}

export interface BriefingData {
  greeting: string;
  streakMessage: string;
  tasksSummary: string;
  financeSummary: string;
  focusQuote: string;
  fullText: string;
  stats: {
    currentStreak: number;
    todayTaskCount: number;
    pendingTaskCount: number;
    monthlySpent: number;
    overallBudget: number;
    budgetPercent: number | null;
  };
  todayTasks: Task[];
  pendingTasks: Task[];
  recentNotes: Note[];
}

export interface ExtractionResult {
  intent: 'capture' | 'clarification' | 'conversation';
  language: string;
  summary: string;
  notes: Array<{
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }>;
  tasks: Array<{
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    dueTime?: string;
  }>;
  transactions: Array<{
    amount: number;
    currency: string;
    type: 'expense' | 'income';
    category: string;
    merchant?: string;
    notes?: string;
    confirmationStatus: 'confirmed' | 'pending' | 'planned';
  }>;
  clarificationQuestions?: string[];
}
