import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExecutionLog {
  timestamp: Date;
  step: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner: mongoose.Types.ObjectId;
  assignedTo?: {
    assigneeType: 'human' | 'agent';
    user?: mongoose.Types.ObjectId;
    agent?: mongoose.Types.ObjectId;
  };
  executionLogs: IExecutionLog[];
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      assigneeType: {
        type: String,
        enum: ['human', 'agent'],
        default: 'human',
      },
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    },
    executionLogs: [
      {
        timestamp: { type: Date, default: Date.now },
        step: { type: String, required: true },
        description: { type: String, required: true },
        status: {
          type: String,
          enum: ['info', 'success', 'warning', 'error'],
          default: 'info',
        },
      },
    ],
    result: { type: String, trim: true },
  },
  { timestamps: true }
);

taskSchema.index({ owner: 1, status: 1, createdAt: -1 });
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ title: 'text', description: 'text' });

const Task: Model<ITaskDocument> = mongoose.model<ITaskDocument>('Task', taskSchema);
export default Task;
