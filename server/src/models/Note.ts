import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INoteSummary {
  brief?: string;
  standard?: string;
  detailed?: string;
}

export interface INote extends Document {
  userId: Types.ObjectId;
  title: string;
  originalContent: string;
  transcript?: string;
  summary?: INoteSummary;
  keyPoints: string[];
  actionItems: string[];
  tags: string[];
  category: string;
  pinned: boolean;
  archived: boolean;
  sourceMetadata: {
    type: 'voice' | 'text' | 'manual';
    language?: string;
    durationSeconds?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalContent: { type: String, required: true },
    transcript: { type: String },
    summary: {
      brief: { type: String },
      standard: { type: String },
      detailed: { type: String },
    },
    keyPoints: [{ type: String }],
    actionItems: [{ type: String }],
    tags: [{ type: String, trim: true }],
    category: { type: String, default: 'General', trim: true },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    sourceMetadata: {
      type: { type: String, enum: ['voice', 'text', 'manual'], default: 'manual' },
      language: { type: String, default: 'en' },
      durationSeconds: { type: Number },
    },
  },
  { timestamps: true }
);

// MongoDB text search index on title, originalContent, and tags
NoteSchema.index({
  title: 'text',
  originalContent: 'text',
  tags: 'text',
  'summary.standard': 'text',
});

// Composite index for user sorting/filtering
NoteSchema.index({ userId: 1, pinned: -1, createdAt: -1 });
NoteSchema.index({ userId: 1, category: 1 });
NoteSchema.index({ userId: 1, tags: 1 });

export const Note = mongoose.model<INote>('Note', NoteSchema);
