import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { config } from '../config/env';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { StreakService } from '../services/streak/streakService';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    preferredInterfaceLanguage: z.string().optional(),
    preferredVoiceLanguage: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    preferredInterfaceLanguage: z.string().optional(),
    preferredVoiceLanguage: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    notificationPreferences: z
      .object({
        inAppReminders: z.boolean().optional(),
        dailyBriefing: z.boolean().optional(),
      })
      .optional(),
    monthlyBudgetPreferences: z
      .object({
        overallBudget: z.number().min(0).optional(),
      })
      .optional(),
  }),
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, preferredInterfaceLanguage, preferredVoiceLanguage, timezone, currency } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      preferredInterfaceLanguage: preferredInterfaceLanguage || 'en',
      preferredVoiceLanguage: preferredVoiceLanguage || 'en-IN',
      timezone: timezone || config.defaultTimezone,
      currency: currency || config.defaultCurrency,
    });

    // Initialize streak document
    await StreakService.getOrCreateStreak(user._id, user.timezone);

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredInterfaceLanguage: user.preferredInterfaceLanguage,
        preferredVoiceLanguage: user.preferredVoiceLanguage,
        timezone: user.timezone,
        currency: user.currency,
        notificationPreferences: user.notificationPreferences,
        monthlyBudgetPreferences: user.monthlyBudgetPreferences,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredInterfaceLanguage: user.preferredInterfaceLanguage,
        preferredVoiceLanguage: user.preferredVoiceLanguage,
        timezone: user.timezone,
        currency: user.currency,
        notificationPreferences: user.notificationPreferences,
        monthlyBudgetPreferences: user.monthlyBudgetPreferences,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: AuthRequest, res: Response) => {
  // Stateless JWT: Frontend clears localStorage
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferredInterfaceLanguage: user.preferredInterfaceLanguage,
      preferredVoiceLanguage: user.preferredVoiceLanguage,
      timezone: user.timezone,
      currency: user.currency,
      notificationPreferences: user.notificationPreferences,
      monthlyBudgetPreferences: user.monthlyBudgetPreferences,
    },
  });
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const updates = req.body;

    if (updates.name) user.name = updates.name;
    if (updates.preferredInterfaceLanguage) user.preferredInterfaceLanguage = updates.preferredInterfaceLanguage;
    if (updates.preferredVoiceLanguage) user.preferredVoiceLanguage = updates.preferredVoiceLanguage;
    if (updates.timezone) user.timezone = updates.timezone;
    if (updates.currency) user.currency = updates.currency;
    if (updates.notificationPreferences) {
      user.notificationPreferences = { ...user.notificationPreferences, ...updates.notificationPreferences };
    }
    if (updates.monthlyBudgetPreferences) {
      user.monthlyBudgetPreferences = { ...user.monthlyBudgetPreferences, ...updates.monthlyBudgetPreferences };
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredInterfaceLanguage: user.preferredInterfaceLanguage,
        preferredVoiceLanguage: user.preferredVoiceLanguage,
        timezone: user.timezone,
        currency: user.currency,
        notificationPreferences: user.notificationPreferences,
        monthlyBudgetPreferences: user.monthlyBudgetPreferences,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Profile update failed' });
  }
});

export default router;
