import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivity extends Document {
  userId: Types.ObjectId;
  activityType:
    | 'note_created'
    | 'voice_memo_saved'
    | 'task_completed'
    | 'transaction_confirmed'
    | 'spending_reviewed'
    | 'daily_review_completed';
  relatedEntityId?: string;
  eventTimestamp: Date;
  localActivityDate: string; // YYYY-MM-DD in user's timezone
  idempotencyKey?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityType: {
      type: String,
      required: true,
      enum: [
        'note_created',
        'voice_memo_saved',
        'task_completed',
        'transaction_confirmed',
        'spending_reviewed',
        'daily_review_completed',
      ],
      index: true,
    },
    relatedEntityId: { type: String },
    eventTimestamp: { type: Date, required: true, default: Date.now },
    localActivityDate: { type: String, required: true, index: true },
    idempotencyKey: { type: String, sparse: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for fast streak and calendar lookups
ActivitySchema.index({ userId: 1, localActivityDate: 1 });
ActivitySchema.index({ userId: 1, eventTimestamp: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
