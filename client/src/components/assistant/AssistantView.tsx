import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Bot, Send, User as UserIcon, Sparkles, BookOpen, CheckSquare, Wallet } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: {
    notes?: Array<{ id: string; title: string }>;
    tasks?: Array<{ id: string; title: string }>;
    transactions?: Array<{ id: string; details: string }>;
  };
}

export const AssistantView: React.FC = () => {
  const { user, activeLanguage } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name || 'there'}! I am your DayPilot Personal AI Assistant. You can ask me anything about your notes, tasks, deadlines, or spending in any language (English, Hinglish, Hindi, etc.). I will search strictly across your personal library to answer!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.askAssistant(q, activeLanguage);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: {
          notes: res.sourceNotes,
          tasks: res.sourceTasks,
          transactions: res.sourceTransactions,
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: err.message || 'Sorry, I encountered an error while searching your library.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-foreground text-sm">Ask DayPilot</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold">
                Personal Memory Grounded
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Multilingual grounded Q&A across your notes, tasks & spending records
            </p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-primary-600 text-white font-bold'
                  : 'bg-muted border border-border text-foreground'
              }`}
            >
              {msg.sender === 'user' ? (
                user?.name.charAt(0).toUpperCase() || 'U'
              ) : (
                <Bot className="w-4 h-4 text-primary-500" />
              )}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-muted/50 border border-border/80 text-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Grounded Citation Sources */}
              {msg.sources &&
                (msg.sources.notes?.length ||
                  msg.sources.tasks?.length ||
                  msg.sources.transactions?.length) && (
                  <div className="pt-2 border-t border-border/60 space-y-1 text-[11px]">
                    <span className="font-semibold text-muted-foreground flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-primary-500" />
                      <span>Grounded in your library:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {msg.sources.notes?.map((n) => (
                        <span
                          key={n.id}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium flex items-center space-x-1"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>{n.title}</span>
                        </span>
                      ))}
                      {msg.sources.tasks?.map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium flex items-center space-x-1"
                        >
                          <CheckSquare className="w-2.5 h-2.5" />
                          <span>{t.title}</span>
                        </span>
                      ))}
                      {msg.sources.transactions?.map((tx) => (
                        <span
                          key={tx.id}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium flex items-center space-x-1"
                        >
                          <Wallet className="w-2.5 h-2.5" />
                          <span>{tx.details}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <span className="text-[9px] opacity-70 block text-right">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs">
              <Bot className="w-4 h-4 text-primary-500" />
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center space-x-2">
              <span className="animate-spin">⏳</span>
              <span>Searching memory library & structuring response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>


      {/* Input Bar */}
      <div className="p-4 border-t border-border bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask in ${activeLanguage || 'English'} about your notes, tasks, or expenses...`}
            className="flex-1 p-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white disabled:opacity-40 shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
