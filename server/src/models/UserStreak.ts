import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserStreak extends Document {
  userId: Types.ObjectId;
  currentStreak: number;
  bestStreak: number;
  lastQualifyingActivityDate?: string; // YYYY-MM-DD
  totalActiveDays: number;
  milestonesAchieved: number[];
  updatedAt: Date;
}

const UserStreakSchema = new Schema<IUserStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    currentStreak: { type: Number, default: 0, min: 0 },
    bestStreak: { type: Number, default: 0, min: 0 },
    lastQualifyingActivityDate: { type: String },
    totalActiveDays: { type: Number, default: 0, min: 0 },
    milestonesAchieved: [{ type: Number }],
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const UserStreak = mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);
