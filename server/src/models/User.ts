import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  preferredInterfaceLanguage: string;
  preferredVoiceLanguage: string;
  timezone: string;
  currency: string;
  notificationPreferences: {
    inAppReminders: boolean;
    dailyBriefing: boolean;
  };
  monthlyBudgetPreferences: {
    overallBudget: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    preferredInterfaceLanguage: { type: String, default: 'en' },
    preferredVoiceLanguage: { type: String, default: 'en-IN' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    notificationPreferences: {
      inAppReminders: { type: Boolean, default: true },
      dailyBriefing: { type: Boolean, default: true },
    },
    monthlyBudgetPreferences: {
      overallBudget: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);


export const User = mongoose.model<IUser>('User', UserSchema);
