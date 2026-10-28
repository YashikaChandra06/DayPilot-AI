import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ExtractionResult } from '../../types';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface UniversalCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UniversalCaptureModal: React.FC<UniversalCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, activeLanguage } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setInputText('');
      setExtraction(null);
      setError(null);
      setSavedSuccess(false);
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Audio recording simulation & live timer
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Check if browser SpeechRecognition is available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = activeLanguage || 'en-IN';

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((r: any) => r[0].transcript)
              .join('');
            setInputText(transcript);
          };

          recognition.onerror = () => {
            // fallback gracefully
          };

          recognition.start();
          (window as any).__daypilot_recognition = recognition;
        } catch {
          // fallback
        }
      }
    } else {
      setIsRecording(false);
      clearInterval(timerRef.current);
      if ((window as any).__daypilot_recognition) {
        try {
          (window as any).__daypilot_recognition.stop();
        } catch {}
      }
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please enter or speak some text to capture.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const res = await api.captureText(inputText, isRecording ? 'voice' : 'text', activeLanguage);
      setExtraction(res.extraction);
    } catch (err: any) {
      setError(err.message || 'Failed to process capture');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!extraction) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.confirmCapture({
        originalText: inputText,
        source: isRecording ? 'voice' : 'text',
        notes: extraction.notes,
        tasks: extraction.tasks,
        transactions: extraction.transactions,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save items');
    } finally {
      setIsSaving(false);
    }
  };

  const removeTask = (idx: number) => {
    if (!extraction) return;
    const tasks = [...extraction.tasks];
    tasks.splice(idx, 1);
    setExtraction({ ...extraction, tasks });
  };

  const removeTransaction = (idx: number) => {
    if (!extraction) return;
    const transactions = [...extraction.transactions];
    transactions.splice(idx, 1);
    setExtraction({ ...extraction, transactions });
  };

  const removeNote = (idx: number) => {
    if (!extraction) return;
    const notes = [...extraction.notes];
    notes.splice(idx, 1);
    setExtraction({ ...extraction, notes });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-base">Universal Capture Studio</h2>
              <p className="text-xs text-muted-foreground">
                Speak or type in any Indian language. DayPilot extracts tasks, expenses & notes automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center justify-center space-x-2 animate-in zoom-in-95">
              <Check className="w-5 h-5" />
              <span>Items successfully saved to your DayPilot library! Streak updated! 🔥</span>
            </div>
          )}

          {!extraction ? (
            <>
              {/* Input Box with Voice controls */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Speak or type anything naturally... e.g., 'Paid 150 for coffee with Aman. Submit project report before Thursday 5 PM.'"
                    className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none transition-all"
                  />

                  {/* Pulsing Voice Recorder Banner */}
                  {isRecording && (
                    <div className="absolute inset-x-2 bottom-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                          Listening in {activeLanguage}... ({recordingSeconds}s)
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[40, 70, 95, 60, 80, 45, 90, 65].map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${h}%` }}
                            className="w-1 bg-red-500 rounded-full animate-pulse"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-primary-500" />}
                    <span>{isRecording ? 'Stop Recording' : 'Voice Record'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAnalyzing || !inputText.trim()}
                    onClick={handleAnalyze}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-primary-500/25 disabled:opacity-50 transition-all"
                  >
                    {isAnalyzing ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isAnalyzing ? 'Extracting with AI...' : 'Parse & Structure'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* AI Parsed Results Review */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primary-800 dark:text-primary-200">
                    AI Structuring Complete
                  </span>
                  <p className="text-[11px] text-primary-700/80 dark:text-primary-300/80">
                    Review and edit proposed items before committing to your database.
                  </p>
                </div>
                <button
                  onClick={() => setExtraction(null)}
                  className="text-xs text-primary-600 hover:underline font-semibold"
                >
                  Edit Input Text
                </button>
              </div>

              {/* Extracted Tasks */}
              {extraction.tasks && extraction.tasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
                    <Check className="w-4 h-4 text-primary-500" />
                    <span>Tasks ({extraction.tasks.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {extraction.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border bg-card flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">{task.title}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold uppercase">
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeTask(idx)}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Transactions */}
              {extraction.transactions && extraction.transactions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Expenses / Income ({extraction.transactions.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {extraction.transactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border bg-card flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-foreground">
                              {tx.type === 'expense' ? '-' : '+'}
                              {tx.currency} {tx.amount}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                              {tx.category}
                            </span>
                          </div>
                          {tx.merchant && (
                            <p className="text-[11px] text-muted-foreground">{tx.merchant}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeTransaction(idx)}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Notes */}
              {extraction.notes && extraction.notes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Notes ({extraction.notes.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {extraction.notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border bg-card flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-foreground">{note.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {note.content}
                          </p>
                        </div>
                        <button
                          onClick={() => removeNote(idx)}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {extraction && (
          <div className="px-6 py-3.5 border-t border-border bg-muted/40 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Confirming automatically extends your daily streak!
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmAndSave}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 transition-all"
              >
                {isSaving ? <span className="animate-spin">⏳</span> : <Check className="w-4 h-4" />}
                <span>{isSaving ? 'Saving...' : 'Confirm & Save All'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
