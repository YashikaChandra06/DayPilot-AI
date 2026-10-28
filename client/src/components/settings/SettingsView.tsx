import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Globe, DollarSign, Bell, Clock, Check, Sparkles } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-Latn', name: 'Hinglish (Hindi in Latin script)' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)' },
  { code: 'mr-IN', name: 'मराठी (Marathi)' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

export const SettingsView: React.FC = () => {
  const { user, updateUser, activeLanguage, setActiveLanguage } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [voiceLang, setVoiceLang] = useState(user?.preferredVoiceLanguage || activeLanguage || 'en-IN');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [inAppReminders, setInAppReminders] = useState(
    user?.notificationPreferences?.inAppReminders ?? true
  );
  const [dailyBriefing, setDailyBriefing] = useState(
    user?.notificationPreferences?.dailyBriefing ?? true
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        name,
        preferredVoiceLanguage: voiceLang,
        currency,
        timezone,
        notificationPreferences: {
          inAppReminders,
          dailyBriefing,
        },
      });
      setActiveLanguage(voiceLang);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Preferences & Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Customize languages, voice models, currency, and AI briefing parameters.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Details */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <h2 className="font-semibold text-foreground text-sm">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-foreground">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-input bg-muted/50 text-muted-foreground text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Multilingual & Voice Settings */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-foreground text-sm">Multilingual & Voice Engine</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-foreground">Preferred Voice Language</label>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Default language for STT transcription and daily briefing synthesis
              </p>
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">Default Currency</label>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Currency applied to newly captured expenses and budgets
              </p>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} — {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications & AI Briefings */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-foreground text-sm">Notifications & Daily Briefing</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/40 transition-colors">
              <div>
                <span className="font-semibold text-foreground">Daily Morning Audio Briefing</span>
                <p className="text-[11px] text-muted-foreground">
                  Generate daily personalized audio briefing of today's tasks and spend status
                </p>
              </div>
              <input
                type="checkbox"
                checked={dailyBriefing}
                onChange={(e) => setDailyBriefing(e.target.checked)}
                className="w-4 h-4 accent-primary-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/40 transition-colors">
              <div>
                <span className="font-semibold text-foreground">In-App Task Reminders</span>
                <p className="text-[11px] text-muted-foreground">
                  Alert when high-priority tasks approach their scheduled due time
                </p>
              </div>
              <input
                type="checkbox"
                checked={inAppReminders}
                onChange={(e) => setInAppReminders(e.target.checked)}
                className="w-4 h-4 accent-primary-600 rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-500/25 transition-all"
          >
            {isSaving ? <span className="animate-spin">⏳</span> : <Check className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Changes...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
