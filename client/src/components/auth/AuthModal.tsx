import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Globe,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-Latn', name: 'Hinglish (Hindi in English Script)' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)' },
  { code: 'mr-IN', name: 'मराठी (Marathi)' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)' },
];

export const AuthModal: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      try {
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          preferredVoiceLanguage: voiceLanguage,
          preferredInterfaceLanguage: 'en',
        });
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try a different email.');
      }
    } else {
      // Sign In
      if (!email.trim()) {
        setError('Please enter your email.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      try {
        await login(email.trim().toLowerCase(), password);
      } catch (err: any) {
        setError(err.message || 'Invalid email or password. Please try again.');
      }
    }
  };

  const switchTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 rounded-3xl border border-border bg-card shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-300 bg-clip-text text-transparent">
            DayPilot AI
          </h1>
          <p className="text-xs text-muted-foreground">
            Multilingual Personal Memory, Task Organizer & Money Assistant
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/60 border border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchTab('signin')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {activeTab === 'signup' && (
            <div>
              <label className="block font-semibold text-foreground mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yashika Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-foreground mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {activeTab === 'signup' && (
            <div>
              <label className="block font-semibold text-foreground mb-1">Preferred Voice Language</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none transition-all cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-primary-500/25 transition-all transform active:scale-98 flex items-center justify-center space-x-2"
          >
            <span>
              {isLoading
                ? activeTab === 'signup'
                  ? 'Creating your account...'
                  : 'Signing in...'
                : activeTab === 'signup'
                ? 'Create DayPilot Account'
                : 'Sign In to DayPilot'}
            </span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Bottom Switcher Link */}
        <div className="text-center pt-2">
          {activeTab === 'signin' ? (
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchTab('signup')}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchTab('signin')}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
