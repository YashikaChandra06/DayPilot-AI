import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Note } from '../../types';
import {
  Search,
  Plus,
  Pin,
  Tag,
  Sparkles,
  Trash2,
  Calendar,
  CheckCircle,
  FileText,
  X,
  Volume2,
} from 'lucide-react';

interface NotesViewProps {
  onRefreshTrigger?: number;
}

const CATEGORIES = ['All', 'General', 'Work', 'Personal', 'Learning', 'Ideas', 'Meetings'];

export const NotesView: React.FC<NotesViewProps> = ({ onRefreshTrigger = 0 }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'brief' | 'standard' | 'detailed'>('standard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [selectedCategory, search, onRefreshTrigger]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await api.getNotes({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: search.trim() ? search : undefined,
      });
      setNotes(res.notes);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    try {
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await api.createNote({
        title: newTitle,
        content: newContent,
        category: newCategory,
        tags: tagsArray,
        autoSummarize: true,
      });

      setNotes([res.note, ...notes]);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.updateNote(note._id, { pinned: !note.pinned });
      setNotes(notes.map((n) => (n._id === note._id ? res.note : n)));
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(id);
      setNotes(notes.filter((n) => n._id !== id));
      if (selectedNote?._id === id) setSelectedNote(null);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Notes & Memories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-organized voice memos, meeting notes, action items and 3-level summaries.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in notes & tags..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-primary-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-primary-600 text-white font-semibold shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-xs">Loading notes library...</div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs space-y-3">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p>No notes found in this category.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-300 font-semibold text-xs"
          >
            Create your first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note._id}
              onClick={() => setSelectedNote(note)}
              className="p-5 rounded-2xl border border-border bg-card hover:border-primary-500/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {note.title}
                  </h3>
                  <button
                    onClick={(e) => handleTogglePin(note, e)}
                    className={`p-1 rounded-md transition-colors ${
                      note.pinned ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-amber-500' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {note.summary?.brief || note.originalContent}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                  {note.category}
                </span>
                <span className="text-[10px]">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Detail Modal with 3-Level AI Summary */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-border flex items-start justify-between bg-muted/40">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                    {selectedNote.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedNote.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{selectedNote.title}</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteNote(selectedNote._id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* AI 3-Level Summary Switcher */}
              {selectedNote.summary && (
                <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-primary-700 dark:text-primary-300 font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Multi-Level Summary</span>
                    </div>

                    <div className="flex items-center bg-card rounded-lg p-0.5 border border-border">
                      {(['brief', 'standard', 'detailed'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveSummaryTab(tab)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all ${
                            activeSummaryTab === tab
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-foreground leading-relaxed text-xs">
                    {activeSummaryTab === 'brief' &&
                      (selectedNote.summary.brief || 'Brief summary not available.')}
                    {activeSummaryTab === 'standard' &&
                      (selectedNote.summary.standard || 'Standard summary not available.')}
                    {activeSummaryTab === 'detailed' &&
                      (selectedNote.summary.detailed || 'Detailed analysis not available.')}
                  </p>
                </div>
              )}

              {/* Action Items extracted from Note */}
              {selectedNote.actionItems && selectedNote.actionItems.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-foreground text-xs flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Action Items Extracted</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedNote.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs text-foreground flex items-start space-x-2"
                      >
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Content */}
              <div className="space-y-2">
                <span className="font-bold text-foreground text-xs">Original Note Content</span>
                <div className="p-4 rounded-xl border border-border bg-card whitespace-pre-wrap leading-relaxed text-muted-foreground text-xs">
                  {selectedNote.originalContent}
                </div>
              </div>

              {/* Tags */}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedNote.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Note Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-bold text-foreground text-sm">Create New Note</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Weekly Sync Notes"
                  className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="meeting, product"
                    className="w-full mt-1 p-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Content</label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your note here. DayPilot will automatically generate key points and summaries..."
                  className="w-full mt-1 p-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary-500/30 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-colors"
                >
                  {isSubmitting ? 'Saving with AI...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
