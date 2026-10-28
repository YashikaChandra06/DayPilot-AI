import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { StreakService } from '../services/streak/streakService';
import { Activity } from '../models/Activity';

const router = Router();

const recordActivitySchema = z.object({
  body: z.object({
    activityType: z.enum([
      'note_created',
      'voice_memo_saved',
      'task_completed',
      'transaction_confirmed',
      'spending_reviewed',
      'daily_review_completed',
    ]),
    relatedEntityId: z.string().optional(),
  }),
});

// GET /api/streak - get current streak info & 30-day activity calendar
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const streak = await StreakService.getOrCreateStreak(user._id, user.timezone);

    // Get last 35 days of activity history for contribution heatmap
    const today = new Date();
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(today.getDate() - 34);

    const activities = await Activity.find({
      userId: user._id,
      eventTimestamp: { $gte: thirtyFiveDaysAgo },
    }).sort({ eventTimestamp: 1 });

    // Build calendar map: { 'YYYY-MM-DD': count }
    const activityMap: Record<string, number> = {};
    for (let i = 0; i < 35; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (34 - i));
      const key = StreakService.getLocalDateString(d, user.timezone);
      activityMap[key] = 0;
    }

    activities.forEach((act) => {
      const dateKey = act.localActivityDate;
      if (activityMap[dateKey] !== undefined) {
        activityMap[dateKey] += 1;
      }
    });

    const activityHeatmap = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count,
      active: count > 0,
    }));

    const todayKey = StreakService.getLocalDateString(today, user.timezone);
    const hasCompletedToday = (activityMap[todayKey] || 0) > 0;

    res.json({
      success: true,
      streak: {
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
        totalActiveDays: streak.totalActiveDays,
        lastQualifyingActivityDate: streak.lastQualifyingActivityDate,
        milestonesAchieved: streak.milestonesAchieved,
        hasCompletedToday,
      },
      heatmap: activityHeatmap,
      recentActivities: activities.slice(-10).reverse(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch streak' });
  }
});

// POST /api/streak/activity - record an activity (e.g., daily_review_completed)
router.post('/activity', authenticate, validate(recordActivitySchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { activityType, relatedEntityId } = req.body;

    const result = await StreakService.recordActivity(user._id, activityType, {
      timezone: user.timezone,
      relatedEntityId,
    });

    res.json({
      success: true,
      streak: result.streak,
      isNewDay: result.isNewDay,
      newMilestones: result.newMilestones,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to record activity' });
  }
});

export default router;
