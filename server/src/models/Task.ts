import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  dueTime?: string; // HH:mm format
  timezone?: string;
  sourceNoteId?: Types.ObjectId;
  completedAt?: Date;
  reminderSet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'archived'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: { type: Date },
    dueTime: { type: String },
    timezone: { type: String },
    sourceNoteId: { type: Schema.Types.ObjectId, ref: 'Note' },
    completedAt: { type: Date },
    reminderSet: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
TaskSchema.index({ userId: 1, status: 1, dueDate: 1 });
TaskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
