export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English (India)', label: 'English', script: 'Latin' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)', label: 'Hindi', script: 'Devanagari' },
  { code: 'hi-Latn', name: 'Hinglish (Hindi in English Script)', label: 'Hinglish', script: 'Latin' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', label: 'Tamil', script: 'Tamil' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', label: 'Telugu', script: 'Telugu' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', label: 'Kannada', script: 'Kannada' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)', label: 'Bengali', script: 'Bengali' },
  { code: 'mr-IN', name: 'मराठी (Marathi)', label: 'Marathi', script: 'Devanagari' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', label: 'Gujarati', script: 'Gujarati' },
] as const;

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Education',
  'Entertainment',
  'Bills',
  'Health',
  'Travel',
  'Other',
] as const;

export const STREAK_MILESTONES = [3, 7, 14, 30, 100] as const;

export const QUALIFYING_ACTIVITY_TYPES = [
  'note_created',
  'voice_memo_saved',
  'task_completed',
  'transaction_confirmed',
  'spending_reviewed',
  'daily_review_completed',
] as const;
