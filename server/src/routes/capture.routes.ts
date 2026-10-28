import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AIService } from '../services/ai/aiService';
import { Note } from '../models/Note';
import { Task } from '../models/Task';
import { Transaction } from '../models/Transaction';
import { StreakService } from '../services/streak/streakService';

const router = Router();

const captureSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Text cannot be empty'),
    source: z.enum(['voice', 'text', 'manual']).default('text'),
    language: z.string().optional(),
    rawNoteOnly: z.boolean().optional(),
  }),
});

const confirmSchema = z.object({
  body: z.object({
    originalText: z.string(),
    source: z.enum(['voice', 'text', 'manual']).default('text'),
    notes: z
      .array(
        z.object({
          title: z.string(),
          content: z.string(),
          category: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .optional(),
    tasks: z
      .array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
          dueDate: z.string().optional(),
          dueTime: z.string().optional(),
        })
      )
      .optional(),
    transactions: z
      .array(
        z.object({
          amount: z.number().positive(),
          currency: z.string().default('INR'),
          type: z.enum(['expense', 'income']),
          category: z.string(),
          merchant: z.string().optional(),
          notes: z.string().optional(),
          confirmationStatus: z.enum(['confirmed', 'pending', 'planned']).default('confirmed'),
          transactionDate: z.string().optional(),
        })
      )
      .optional(),
  }),
});

// POST /api/capture
// Processes raw text or voice transcript and produces proposed items for review
router.post('/', authenticate, validate(captureSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { text, source, language, rawNoteOnly } = req.body;

    // If user opts to save directly as a raw note without AI structuring
    if (rawNoteOnly) {
      const title = text.slice(0, 50).trim() + (text.length > 50 ? '...' : '');
      const note = await Note.create({
        userId: user._id,
        title,
        originalContent: text,
        transcript: source === 'voice' ? text : undefined,
        category: 'Quick Note',
        tags: ['raw-capture'],
        sourceMetadata: {
          type: source,
          language: language || user.preferredVoiceLanguage,
        },
      });

      // Record qualifying activity
      const activityResult = await StreakService.recordActivity(
        user._id,
        source === 'voice' ? 'voice_memo_saved' : 'note_created',
        {
          relatedEntityId: note._id.toString(),
          timezone: user.timezone,
        }
      );

      res.status(201).json({
        success: true,
        savedDirectly: true,
        note,
        streak: activityResult.streak,
        isNewDay: activityResult.isNewDay,
      });
      return;
    }

    // Run AI structured extraction
    const extraction = await AIService.extractStructuredData(text, user.timezone, user.currency);

    res.json({
      success: true,
      savedDirectly: false,
      extraction,
      originalText: text,
      source,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Capture processing failed' });
  }
});

// POST /api/capture/confirm
// Commits user-reviewed & approved items into persistent database and updates streak
router.post('/confirm', authenticate, validate(confirmSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { originalText, source, notes = [], tasks = [], transactions = [] } = req.body;

    const savedNotes = [];
    const savedTasks = [];
    const savedTransactions = [];

    // 1. Save approved notes
    for (const n of notes) {
      const summaryData = await AIService.summarizeNote(n.content, n.title);
      const noteDoc = await Note.create({
        userId: user._id,
        title: n.title,
        originalContent: n.content,
        transcript: source === 'voice' ? originalText : undefined,
        summary: {
          brief: summaryData.brief,
          standard: summaryData.standard,
          detailed: summaryData.detailed,
        },
        keyPoints: summaryData.keyPoints,
        actionItems: summaryData.actionItems,
        tags: n.tags && n.tags.length > 0 ? n.tags : summaryData.suggestedTags,
        category: n.category || summaryData.suggestedCategory,
        sourceMetadata: {
          type: source,
          language: user.preferredVoiceLanguage,
        },
      });
      savedNotes.push(noteDoc);
    }

    // 2. Save approved tasks
    for (const t of tasks) {
      const taskDoc = await Task.create({
        userId: user._id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        dueTime: t.dueTime,
        timezone: user.timezone,
        sourceNoteId: savedNotes.length > 0 ? savedNotes[0]._id : undefined,
      });
      savedTasks.push(taskDoc);
    }

    // 3. Save approved transactions
    for (const tx of transactions) {
      const txDoc = await Transaction.create({
        userId: user._id,
        amount: tx.amount,
        currency: tx.currency || user.currency,
        type: tx.type,
        category: tx.category,
        merchant: tx.merchant,
        notes: tx.notes,
        confirmationStatus: tx.confirmationStatus,
        transactionDate: tx.transactionDate ? new Date(tx.transactionDate) : new Date(),
        inputSource: source,
        sourceRecordRef: originalText,
      });
      savedTransactions.push(txDoc);
    }

    // 4. Record qualifying activity in streak engine
    let streakResult = null;
    let qualifyingType: any = null;

    if (savedTransactions.length > 0) {
      qualifyingType = 'transaction_confirmed';
    } else if (source === 'voice' && savedNotes.length > 0) {
      qualifyingType = 'voice_memo_saved';
    } else if (savedNotes.length > 0) {
      qualifyingType = 'note_created';
    } else if (savedTasks.length > 0) {
      qualifyingType = 'note_created';
    }

    if (qualifyingType) {
      streakResult = await StreakService.recordActivity(user._id, qualifyingType, {
        timezone: user.timezone,
        relatedEntityId:
          savedTransactions[0]?._id?.toString() ||
          savedNotes[0]?._id?.toString() ||
          savedTasks[0]?._id?.toString(),
      });
    } else {
      streakResult = {
        streak: await StreakService.getOrCreateStreak(user._id, user.timezone),
        isNewDay: false,
        newMilestones: [],
      };
    }

    res.status(201).json({
      success: true,
      message: 'Items confirmed and saved successfully.',
      saved: {
        notes: savedNotes,
        tasks: savedTasks,
        transactions: savedTransactions,
      },
      streak: streakResult.streak,
      isNewDay: streakResult.isNewDay,
      newMilestones: streakResult.newMilestones,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Confirmation failed' });
  }
});

export default router;
