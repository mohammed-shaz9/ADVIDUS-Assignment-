import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplateChecklistStep {
  text: string;
  completed?: boolean;
}

export interface ITaskTemplateDocument extends Document {
  name: string;
  description?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority: 'low' | 'medium' | 'high' | 'critical';
  checklistSteps: ITemplateChecklistStep[];
  isRecurring: boolean;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  version: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskTemplateSchema = new Schema<ITaskTemplateDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    defaultTitle: { type: String, trim: true },
    defaultDescription: { type: String, trim: true },
    defaultPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    checklistSteps: [
      {
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    isRecurring: { type: Boolean, default: false },
    recurrenceRule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
    },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskTemplateSchema.index({ isActive: 1 });
taskTemplateSchema.index({ createdBy: 1 });

const TaskTemplate: Model<ITaskTemplateDocument> = mongoose.model<ITaskTemplateDocument>('TaskTemplate', taskTemplateSchema);
export default TaskTemplate;
