import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  activeLanguage: string;
  setActiveLanguage: (lang: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('daypilot_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeLanguage, setActiveLanguageState] = useState<string>('en-IN');

  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.user.preferredVoiceLanguage) {
        setActiveLanguageState(data.user.preferredVoiceLanguage);
      }
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      localStorage.removeItem('daypilot_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('daypilot_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user.preferredVoiceLanguage) {
        setActiveLanguageState(data.user.preferredVoiceLanguage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    setIsLoading(true);
    try {
      const data = await api.register(userData);
      localStorage.setItem('daypilot_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user.preferredVoiceLanguage) {
        setActiveLanguageState(data.user.preferredVoiceLanguage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('daypilot_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    const data = await api.updateProfile(updates);
    setUser(data.user);
    if (updates.preferredVoiceLanguage) {
      setActiveLanguageState(updates.preferredVoiceLanguage);
    }
  };

  const setActiveLanguage = (lang: string) => {
    setActiveLanguageState(lang);
    if (user) {
      updateUser({ preferredVoiceLanguage: lang }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        activeLanguage,
        setActiveLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
