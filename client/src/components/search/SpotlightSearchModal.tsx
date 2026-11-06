import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Note, Task, Transaction } from '../../types';
import {
  Search,
  X,
  FileText,
  CheckSquare,
  DollarSign,
  ArrowRight,
  Clock,
  Sparkles,
  Command,
} from 'lucide-react';

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      loadData();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesRes, tasksRes, expensesRes] = await Promise.allSettled([
        api.getNotes(),
        api.getTasks(),
        api.getExpenses(),
      ]);

      if (notesRes.status === 'fulfilled') setNotes(notesRes.value.notes || []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.tasks || []);
      if (expensesRes.status === 'fulfilled') setTransactions(expensesRes.value.transactions || []);
    } catch {}
    setLoading(false);
  };

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredNotes = q
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.originalContent.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      ).slice(0, 5)
    : [];

  const filteredTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      ).slice(0, 5)
    : [];

  const filteredTransactions = q
    ? transactions.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          (t.merchant && t.merchant.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          t.amount.toString().includes(q)
      ).slice(0, 5)
    : [];

  const totalResults = filteredNotes.length + filteredTasks.length + filteredTransactions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-muted/30">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, tasks, transactions, amounts..."
            className="flex-1 bg-transparent border-0 text-foreground placeholder-muted-foreground focus:outline-none text-base sm:text-lg"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded border border-border">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          )}
        </div>

        {/* Search Results Area */}
        <div className="overflow-y-auto p-3 space-y-4 max-h-[60vh]">
          {loading && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Indexing your memory library...
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Global Spotlight Search</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Type any keyword, task title, merchant name, or amount to find matching records instantly across your workspace.
              </p>
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-medium text-foreground">No matches found for &quot;{query}&quot;</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for broader keywords, or capture this information into your DayPilot.
              </p>
            </div>
          )}

          {/* Notes Matches */}
          {filteredNotes.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Notes ({filteredNotes.length})
                </span>
                <button
                  onClick={() => {
                    onNavigateTab('notes');
                    onClose();
                  }}
                  className="text-xs text-primary-500 hover:underline flex items-center"
                >
                  View all <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
              <div className="space-y-1">
                {filteredNotes.map((note) => (
                  <div
                    key={note._id}
                    onClick={() => {
                      onNavigateTab('notes');
                      onClose();
                    }}
                    className="flex items-start justify-between p-2.5 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors border border-transparent hover:border-border"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {note.originalContent}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 shrink-0">
                      {note.category || 'General'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Matches */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Tasks ({filteredTasks.length})
                </span>
                <button
                  onClick={() => {
                    onNavigateTab('tasks');
                    onClose();
                  }}
                  className="text-xs text-primary-500 hover:underline flex items-center"
                >
                  View all <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
              <div className="space-y-1">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => {
                      onNavigateTab('tasks');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors border border-transparent hover:border-border"
                  >
                    <div className="min-w-0 flex-1 pr-3 flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-emerald-500'
                            : task.priority === 'urgent'
                            ? 'bg-red-500'
                            : task.priority === 'high'
                            ? 'bg-orange-500'
                            : 'bg-primary-500'
                        }`}
                      />
                      <p
                        className={`text-sm font-medium truncate ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {task.dueDate && (
                        <span className="text-[11px] text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Matches */}
          {filteredTransactions.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Expenses & Spending ({filteredTransactions.length})
                </span>
                <button
                  onClick={() => {
                    onNavigateTab('expenses');
                    onClose();
                  }}
                  className="text-xs text-primary-500 hover:underline flex items-center"
                >
                  View all <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
              <div className="space-y-1">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx._id}
                    onClick={() => {
                      onNavigateTab('expenses');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors border border-transparent hover:border-border"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.merchant || tx.category}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {tx.notes || tx.category} • {new Date(tx.transactionDate || tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {tx.currency || '₹'} {tx.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] mr-1">↵</kbd>
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] mr-1">ESC</kbd>
              to close
            </span>
          </div>
          <span>DayPilot Unified Spotlight</span>
        </div>
      </div>
    </div>
  );
};

