import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBudget extends Document {
  userId: Types.ObjectId;
  category: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

// Unique compound index for user + category + period
BudgetSchema.index({ userId: 1, category: 1, period: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
