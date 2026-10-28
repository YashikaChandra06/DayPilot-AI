import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Task } from '../models/Task';
import { StreakService } from '../services/streak/streakService';

const router = Router();

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    dueDate: z.string().optional(),
    dueTime: z.string().optional(),
    reminderSet: z.boolean().optional(),
    sourceNoteId: z.string().optional(),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['pending', 'completed', 'archived']).optional(),
    dueDate: z.string().nullable().optional(),
    dueTime: z.string().nullable().optional(),
    reminderSet: z.boolean().optional(),
  }),
});

// GET /api/tasks - list tasks with filtering
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, priority, search, dueToday } = req.query;

    const query: any = { userId: user._id };

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'archived' };
    }

    if (priority) {
      query.priority = priority;
    }

    if (search && typeof search === 'string') {
      query.$text = { $search: search };
    }

    if (dueToday === 'true') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const tasks = await Task.find(query)
      .sort({
        status: 1, // 'pending' before 'completed'
        dueDate: 1,
        priority: -1,
        createdAt: -1,
      });

    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const task = await Task.findOne({ _id: req.params.id, userId: user._id });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch task' });
  }
});

// POST /api/tasks - create new task
router.post('/', authenticate, validate(createTaskSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, description, priority, dueDate, dueTime, reminderSet, sourceNoteId } = req.body;

    const task = await Task.create({
      userId: user._id,
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dueTime,
      reminderSet: reminderSet || false,
      sourceNoteId,
      timezone: user.timezone,
    });

    res.status(201).json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id - update task / toggle completion
router.patch('/:id', authenticate, validate(updateTaskSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const task = await Task.findOne({ _id: req.params.id, userId: user._id });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const { title, description, priority, status, dueDate, dueTime, reminderSet } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (reminderSet !== undefined) task.reminderSet = reminderSet;

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }
    if (dueTime !== undefined) {
      task.dueTime = dueTime || undefined;
    }

    let streakResult = null;
    if (status !== undefined) {
      const wasPending = task.status !== 'completed';
      task.status = status;
      if (status === 'completed' && wasPending) {
        task.completedAt = new Date();
        // Completing a task is a qualifying activity for the streak!
        streakResult = await StreakService.recordActivity(user._id, 'task_completed', {
          timezone: user.timezone,
          relatedEntityId: task._id.toString(),
        });
      } else if (status !== 'completed') {
        task.completedAt = undefined;
      }
    }

    await task.save();

    res.json({
      success: true,
      task,
      streak: streakResult?.streak,
      isNewDay: streakResult?.isNewDay,
      newMilestones: streakResult?.newMilestones,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - delete task
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: user._id });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete task' });
  }
});

export default router;
