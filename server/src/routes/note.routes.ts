import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Note } from '../models/Note';
import { AIService } from '../services/ai/aiService';
import { StreakService } from '../services/streak/streakService';

const router = Router();

const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    pinned: z.boolean().optional(),
    autoSummarize: z.boolean().optional(),
  }),
});

const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
  }),
});

// GET /api/notes - list notes with filtering, search, pagination
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { category, tag, search, pinned, archived = 'false', page = '1', limit = '20' } = req.query;

    const query: any = { userId: user._id };

    if (archived === 'true') {
      query.archived = true;
    } else {
      query.archived = { $ne: true };
    }

    if (pinned === 'true') {
      query.pinned = true;
    }

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search && typeof search === 'string') {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Note.countDocuments(query),
    ]);

    res.json({
      success: true,
      notes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id - get single note
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const note = await Note.findOne({ _id: req.params.id, userId: user._id });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }
    res.json({ success: true, note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch note' });
  }
});

// POST /api/notes - create new note
router.post('/', authenticate, validate(createNoteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, content, category, tags = [], pinned = false, autoSummarize = true } = req.body;

    let summaryData = null;
    if (autoSummarize && content.length > 30) {
      summaryData = await AIService.summarizeNote(content, title);
    }

    const note = await Note.create({
      userId: user._id,
      title,
      originalContent: content,
      summary: summaryData
        ? {
            brief: summaryData.brief,
            standard: summaryData.standard,
            detailed: summaryData.detailed,
          }
        : undefined,
      keyPoints: summaryData?.keyPoints || [],
      actionItems: summaryData?.actionItems || [],
      tags: tags.length > 0 ? tags : summaryData?.suggestedTags || ['general'],
      category: category || summaryData?.suggestedCategory || 'General',
      pinned,
      sourceMetadata: {
        type: 'manual',
        language: user.preferredVoiceLanguage,
      },
    });

    const streakResult = await StreakService.recordActivity(user._id, 'note_created', {
      timezone: user.timezone,
      relatedEntityId: note._id.toString(),
    });

    res.status(201).json({
      success: true,
      note,
      streak: streakResult.streak,
      isNewDay: streakResult.isNewDay,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create note' });
  }
});

// PATCH /api/notes/:id - update note
router.patch('/:id', authenticate, validate(updateNoteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const note = await Note.findOne({ _id: req.params.id, userId: user._id });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const { title, content, category, tags, pinned, archived } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.originalContent = content;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = tags;
    if (pinned !== undefined) note.pinned = pinned;
    if (archived !== undefined) note.archived = archived;

    await note.save();
    res.json({ success: true, note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update note' });
  }
});

// POST /api/notes/:id/summarize - regenerate AI summary
router.post('/:id/summarize', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const note = await Note.findOne({ _id: req.params.id, userId: user._id });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const summaryData = await AIService.summarizeNote(note.originalContent, note.title);

    note.summary = {
      brief: summaryData.brief,
      standard: summaryData.standard,
      detailed: summaryData.detailed,
    };
    note.keyPoints = summaryData.keyPoints;
    note.actionItems = summaryData.actionItems;
    if (!note.tags || note.tags.length === 0) {
      note.tags = summaryData.suggestedTags;
    }

    await note.save();
    res.json({ success: true, note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Summarization failed' });
  }
});

// DELETE /api/notes/:id - delete note
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const deleted = await Note.findOneAndDelete({ _id: req.params.id, userId: user._id });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }
    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete note' });
  }
});

export default router;
