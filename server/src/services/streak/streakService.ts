import { Types } from 'mongoose';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO, differenceInCalendarDays, subDays } from 'date-fns';
import { Activity, IActivity } from '../../models/Activity';
import { UserStreak, IUserStreak } from '../../models/UserStreak';
import { STREAK_MILESTONES } from '../../config/constants';

export interface RecordActivityResult {
  streak: IUserStreak;
  isNewDay: boolean;
  activity: IActivity | null;
  newMilestones: number[];
}

export class StreakService {
  /**
   * Helper to derive local YYYY-MM-DD date from UTC timestamp in the given timezone.
   */
  static getLocalDateString(timestamp: Date = new Date(), timezone: string = 'Asia/Kolkata'): string {
    try {
      return formatInTimeZone(timestamp, timezone, 'yyyy-MM-dd');
    } catch {
      return formatInTimeZone(timestamp, 'UTC', 'yyyy-MM-dd');
    }
  }

  /**
   * Record a qualifying activity and update the streak if today hasn't already been counted.
   */
  static async recordActivity(
    userId: string | Types.ObjectId,
    activityType:
      | 'note_created'
      | 'voice_memo_saved'
      | 'task_completed'
      | 'transaction_confirmed'
      | 'spending_reviewed'
      | 'daily_review_completed',
    options: {
      relatedEntityId?: string;
      idempotencyKey?: string;
      timezone?: string;
      now?: Date; // Injectable clock for testing
    } = {}
  ): Promise<RecordActivityResult> {
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const now = options.now || new Date();
    const timezone = options.timezone || 'Asia/Kolkata';
    const localDate = this.getLocalDateString(now, timezone);

    // Check idempotency if key provided
    if (options.idempotencyKey) {
      const existing = await Activity.findOne({ idempotencyKey: options.idempotencyKey });
      if (existing) {
        const streak = await this.getOrCreateStreak(userObjId, timezone, now);
        return { streak, isNewDay: false, activity: existing, newMilestones: [] };
      }
    }

    // Insert activity into ledger
    let activity: IActivity;
    try {
      activity = await Activity.create({
        userId: userObjId,
        activityType,
        relatedEntityId: options.relatedEntityId,
        eventTimestamp: now,
        localActivityDate: localDate,
        idempotencyKey: options.idempotencyKey,
      });
    } catch (err: any) {
      // In case of duplicate idempotency key race condition
      if (err.code === 11000 && options.idempotencyKey) {
        const existing = await Activity.findOne({ idempotencyKey: options.idempotencyKey });
        const streak = await this.getOrCreateStreak(userObjId, timezone, now);
        return { streak, isNewDay: false, activity: existing, newMilestones: [] };
      }
      throw err;
    }

    // Update or calculate streak
    const streakResult = await this.applyActivityToStreak(userObjId, localDate, timezone, now);

    return {
      streak: streakResult.streak,
      isNewDay: streakResult.isNewDay,
      activity,
      newMilestones: streakResult.newMilestones,
    };
  }

  /**
   * Apply a new local date activity to the user streak document.
   */
  private static async applyActivityToStreak(
    userId: Types.ObjectId,
    localDate: string,
    timezone: string,
    now: Date
  ): Promise<{ streak: IUserStreak; isNewDay: boolean; newMilestones: number[] }> {
    let streakDoc = await UserStreak.findOne({ userId });

    if (!streakDoc) {
      streakDoc = new UserStreak({
        userId,
        currentStreak: 1,
        bestStreak: 1,
        lastQualifyingActivityDate: localDate,
        totalActiveDays: 1,
        milestonesAchieved: [],
      });
      await streakDoc.save();
      return { streak: streakDoc, isNewDay: true, newMilestones: [] };
    }

    const lastDateStr = streakDoc.lastQualifyingActivityDate;

    // If activity is already recorded for today, keep current streak
    if (lastDateStr === localDate) {
      return { streak: streakDoc, isNewDay: false, newMilestones: [] };
    }

    let newCurrentStreak = 1;
    let isNewDay = true;

    if (!lastDateStr) {
      newCurrentStreak = 1;
    } else {
      const lastDate = parseISO(lastDateStr);
      const currentDate = parseISO(localDate);
      const daysDiff = differenceInCalendarDays(currentDate, lastDate);

      if (daysDiff === 1) {
        // Consecutive calendar day!
        newCurrentStreak = streakDoc.currentStreak + 1;
      } else if (daysDiff > 1) {
        // Skipped a day -> reset to 1
        newCurrentStreak = 1;
      } else {
        // Action logged for past date or out-of-order -> recalculate authoritative streak
        return this.recalculateStreak(userId, timezone, now);
      }
    }

    streakDoc.currentStreak = newCurrentStreak;
    if (newCurrentStreak > streakDoc.bestStreak) {
      streakDoc.bestStreak = newCurrentStreak;
    }
    streakDoc.lastQualifyingActivityDate = localDate;
    streakDoc.totalActiveDays += 1;

    // Check milestones
    const newMilestones: number[] = [];
    for (const m of STREAK_MILESTONES) {
      if (newCurrentStreak >= m && !streakDoc.milestonesAchieved.includes(m)) {
        streakDoc.milestonesAchieved.push(m);
        newMilestones.push(m);
      }
    }

    await streakDoc.save();
    return { streak: streakDoc, isNewDay, newMilestones };
  }

  /**
   * Get the current streak status for a user, correctly taking into account whether today has ended or yesterday was active.
   */
  static async getOrCreateStreak(
    userId: string | Types.ObjectId,
    timezone: string = 'Asia/Kolkata',
    now: Date = new Date()
  ): Promise<IUserStreak> {
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    let streakDoc = await UserStreak.findOne({ userId: userObjId });

    if (!streakDoc) {
      // Check if user has past activities
      return (await this.recalculateStreak(userObjId, timezone, now)).streak;
    }

    // Evaluate if streak has expired based on current local date
    const localDateToday = this.getLocalDateString(now, timezone);
    const lastDateStr = streakDoc.lastQualifyingActivityDate;

    if (lastDateStr) {
      const lastDate = parseISO(lastDateStr);
      const todayDate = parseISO(localDateToday);
      const daysDiff = differenceInCalendarDays(todayDate, lastDate);

      // If last activity was 2 or more days ago in local calendar, current streak has lapsed to 0
      // (If last activity was yesterday, diff is 1, so streak is PRESERVED until today ends!)
      if (daysDiff > 1 && streakDoc.currentStreak > 0) {
        streakDoc.currentStreak = 0;
        await streakDoc.save();
      }
    }

    return streakDoc;
  }

  /**
   * Authoritative recalculation of streak directly from the immutable activity ledger.
   */
  static async recalculateStreak(
    userId: string | Types.ObjectId,
    timezone: string = 'Asia/Kolkata',
    now: Date = new Date()
  ): Promise<{ streak: IUserStreak; isNewDay: boolean; newMilestones: number[] }> {
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Get all distinct localActivityDates in ascending order
    const distinctDates: string[] = await Activity.distinct('localActivityDate', { userId: userObjId });
    distinctDates.sort(); // ascending ISO strings sort chronologically

    const totalActiveDays = distinctDates.length;
    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of distinctDates) {
      const date = parseISO(dateStr);
      if (!prevDate) {
        runningStreak = 1;
      } else {
        const diff = differenceInCalendarDays(date, prevDate);
        if (diff === 1) {
          runningStreak += 1;
        } else if (diff > 1) {
          runningStreak = 1;
        }
      }
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
      prevDate = date;
    }

    const todayStr = this.getLocalDateString(now, timezone);
    const lastDateStr = distinctDates.length > 0 ? distinctDates[distinctDates.length - 1] : undefined;

    if (lastDateStr) {
      const lastDate = parseISO(lastDateStr);
      const todayDate = parseISO(todayStr);
      const diff = differenceInCalendarDays(todayDate, lastDate);

      if (diff === 0 || diff === 1) {
        // Active today or active yesterday (today still in progress)
        currentStreak = runningStreak;
      } else {
        // Missed yesterday and today
        currentStreak = 0;
      }
    } else {
      currentStreak = 0;
    }

    // Milestones achieved
    const milestonesAchieved = STREAK_MILESTONES.filter((m) => bestStreak >= m);

    const streakDoc = await UserStreak.findOneAndUpdate(
      { userId: userObjId },
      {
        currentStreak,
        bestStreak,
        lastQualifyingActivityDate: lastDateStr,
        totalActiveDays,
        milestonesAchieved,
      },
      { new: true, upsert: true }
    );

    return { streak: streakDoc, isNewDay: false, newMilestones: [] };
  }

  /**
   * Get activity heatmap and calendar data for the last N days (default: 90 days).
   */
  static async getActivityCalendar(
    userId: string | Types.ObjectId,
    daysBack: number = 90,
    timezone: string = 'Asia/Kolkata',
    now: Date = new Date()
  ): Promise<{
    today: string;
    activitiesByDate: Record<string, { count: number; types: string[] }>;
    recentActivities: IActivity[];
  }> {
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const today = this.getLocalDateString(now, timezone);

    // Calculate start date
    const startDate = subDays(now, daysBack);
    const startStr = this.getLocalDateString(startDate, timezone);

    const activities = await Activity.find({
      userId: userObjId,
      localActivityDate: { $gte: startStr },
    })
      .sort({ eventTimestamp: -1 })
      .lean();

    const activitiesByDate: Record<string, { count: number; types: string[] }> = {};

    for (const act of activities) {
      const d = act.localActivityDate;
      if (!activitiesByDate[d]) {
        activitiesByDate[d] = { count: 0, types: [] };
      }
      activitiesByDate[d].count += 1;
      if (!activitiesByDate[d].types.includes(act.activityType)) {
        activitiesByDate[d].types.push(act.activityType);
      }
    }

    return {
      today,
      activitiesByDate,
      recentActivities: activities.slice(0, 30) as unknown as IActivity[],
    };
  }
}
