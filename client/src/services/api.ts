import {
  User,
  Note,
  Task,
  Transaction,
  Budget,
  StreakInfo,
  ActivityHeatmapDay,
  BriefingData,
  ExtractionResult,
  SupportedLanguage,
} from '../types';

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('daypilot_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async register(userData: Partial<User> & { password: string }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch user');
    return data;
  },

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    return data;
  },

  // Universal Capture
  async captureText(text: string, source: 'voice' | 'text' = 'text', language?: string): Promise<{ success: boolean; extraction: ExtractionResult }> {
    const res = await fetch(`${API_BASE}/capture`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, source, language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Capture parsing failed');
    return data;
  },

  async confirmCapture(payload: {
    originalText: string;
    source: 'voice' | 'text';
    notes?: any[];
    tasks?: any[];
    transactions?: any[];
  }): Promise<{ success: boolean; saved: any; streak: StreakInfo }> {
    const res = await fetch(`${API_BASE}/capture/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to confirm items');
    return data;
  },

  // Notes
  async getNotes(params?: { category?: string; tag?: string; search?: string; pinned?: boolean }): Promise<{ success: boolean; notes: Note[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.tag) query.append('tag', params.tag);
    if (params?.search) query.append('search', params.search);
    if (params?.pinned) query.append('pinned', 'true');

    const res = await fetch(`${API_BASE}/notes?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch notes');
    return data;
  },

  async createNote(note: { title: string; content: string; category?: string; tags?: string[]; pinned?: boolean; autoSummarize?: boolean }): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(note),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create note');
    return data;
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update note');
    return data;
  },

  async deleteNote(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete note');
    return data;
  },

  async summarizeNote(id: string): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}/summarize`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Summarization failed');
    return data;
  },

  // Tasks
  async getTasks(params?: { status?: string; priority?: string; dueToday?: boolean; search?: string }): Promise<{ success: boolean; tasks: Task[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.dueToday) query.append('dueToday', 'true');
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/tasks?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch tasks');
    return data;
  },

  async createTask(task: Partial<Task>): Promise<{ success: boolean; task: Task }> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(task),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create task');
    return data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<{ success: boolean; task: Task; streak?: StreakInfo }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update task');
    return data;
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete task');
    return data;
  },

  // Expenses & Budgets
  async getExpenses(params?: { type?: string; category?: string }): Promise<{ success: boolean; transactions: Transaction[] }> {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.category) query.append('category', params.category);

    const res = await fetch(`${API_BASE}/expenses?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch transactions');
    return data;
  },

  async createExpense(tx: Partial<Transaction>): Promise<{ success: boolean; transaction: Transaction; streak?: StreakInfo }> {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tx),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create transaction');
    return data;
  },

  async deleteExpense(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete transaction');
    return data;
  },

  async getExpenseAnalytics(): Promise<{
    success: boolean;
    analytics: {
      totalExpenseThisMonth: number;
      totalIncomeThisMonth: number;
      netSavings: number;
      categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
      dailyTrend: Array<{ date: string; day: string; amount: number }>;
      overallBudget: number;
      currency: string;
    };
  }> {
    const res = await fetch(`${API_BASE}/expenses/analytics`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch analytics');
    return data;
  },

  async getBudgets(): Promise<{
    success: boolean;
    overallBudget: number;
    totalSpent: number;
    budgets: Budget[];
  }> {
    const res = await fetch(`${API_BASE}/expenses/budgets`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch budgets');
    return data;
  },

  async setBudget(budget: { category: string; amount: number; currency?: string }): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/expenses/budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(budget),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to set budget');
    return data;
  },

  // Streak
  async getStreak(): Promise<{
    success: boolean;
    streak: StreakInfo;
    heatmap: ActivityHeatmapDay[];
  }> {
    const res = await fetch(`${API_BASE}/streak`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch streak');
    return data;
  },

  // AI Briefing & Q&A
  async getBriefing(): Promise<{ success: boolean; briefing: BriefingData }> {
    const res = await fetch(`${API_BASE}/ai/briefing`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch briefing');
    return data;
  },

  async askAssistant(query: string, language?: string): Promise<{
    success: boolean;
    answer: string;
    confidence: number;
    sourceNotes: Array<{ id: string; title: string }>;
    sourceTasks: Array<{ id: string; title: string }>;
    sourceTransactions: Array<{ id: string; details: string }>;
  }> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to get assistant response');
    return data;
  },

  // Voice
  async getLanguages(): Promise<{ success: boolean; languages: SupportedLanguage[] }> {
    const res = await fetch(`${API_BASE}/voice/languages`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch languages');
    return data;
  },

  async transcribeAudio(audioBlob: Blob, language: string): Promise<{
    success: boolean;
    transcript: string;
    confidence: number;
    detectedLanguage: string;
    isMock: boolean;
  }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.wav');
    formData.append('language', language);

    const token = localStorage.getItem('daypilot_token');
    const res = await fetch(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Transcription failed');
    return data;
  },
};
