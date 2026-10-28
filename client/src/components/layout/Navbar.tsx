import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Mic,
  Sun,
  Moon,
  Flame,
  Globe,
  Sparkles,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onOpenCapture: () => void;
  streakCount?: number;
}

const LANGUAGES = [
  { code: 'en-IN', name: 'English', flag: '🇮🇳' },
  { code: 'hi-Latn', name: 'Hinglish', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenCapture, streakCount = 1 }) => {
  const { user, logout, activeLanguage, setActiveLanguage } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === activeLanguage) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-2 ring-primary-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-300 bg-clip-text text-transparent">
                DayPilot AI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                Gnani Voice
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Multilingual Memory & Money Assistant
            </p>
          </div>
        </div>

        {/* Center / Right Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Streak Indicator Pill */}
          <div
            title={`Active streak: ${streakCount} days. Keep completing daily tasks and logging expenses to extend your streak!`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold cursor-default"
          >
            <Flame className="w-4 h-4 text-orange-500 animate-pulse fill-orange-500" />
            <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
          </div>

          {/* Quick Voice / Text Capture CTA */}
          <button
            onClick={onOpenCapture}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-primary-500/25 transition-all transform active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>Quick Capture</span>
          </button>

          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
              title="Change active speech/interface language"
            >
              <Globe className="w-3.5 h-3.5 text-primary-500" />
              <span className="hidden sm:inline">{currentLang.name}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border">
                    Select Voice & Input Language
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setActiveLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-muted transition-colors ${
                        activeLanguage === lang.code
                          ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold'
                          : 'text-foreground'
                      }`}
                    >
                      <span>{lang.name}</span>
                      <span className="text-[10px] text-muted-foreground">{lang.code}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary-600" />}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 py-1 px-2 rounded-xl hover:bg-muted/70 transition-colors"
                title={`Logged in as ${user.name}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-primary-500/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-semibold text-xs text-foreground max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:inline" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 py-1 text-xs">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
