import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  category: string;
  merchant?: string;
  transactionDate: Date;
  notes?: string;
  inputSource: 'voice' | 'text' | 'manual';
  sourceRecordRef?: string;
  confirmationStatus: 'confirmed' | 'pending' | 'planned';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    type: { type: String, enum: ['expense', 'income'], required: true },
    category: { type: String, required: true, trim: true },
    merchant: { type: String, trim: true },
    transactionDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    inputSource: { type: String, enum: ['voice', 'text', 'manual'], default: 'manual' },
    sourceRecordRef: { type: String },
    confirmationStatus: {
      type: String,
      enum: ['confirmed', 'pending', 'planned'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

// Indexes
TransactionSchema.index({ userId: 1, transactionDate: -1 });
TransactionSchema.index({ userId: 1, type: 1, confirmationStatus: 1, transactionDate: -1 });
TransactionSchema.index({ userId: 1, category: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
