import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformanceMetric extends Document {
  user: mongoose.Types.ObjectId;
  period: string;
  tasksCompleted: number;
  tasksAssigned: number;
  onTimeCompletion: number;
  overdueTasks: number;
  avgCompletionHours: number;
  score: number;
  snapshotDate: Date;
  createdAt: Date;
}

const PerformanceMetricSchema = new Schema<IPerformanceMetric>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, required: true, default: 'daily' },
    tasksCompleted: { type: Number, default: 0 },
    tasksAssigned: { type: Number, default: 0 },
    onTimeCompletion: { type: Number, default: 0 },
    overdueTasks: { type: Number, default: 0 },
    avgCompletionHours: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    snapshotDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PerformanceMetricSchema.index({ user: 1, period: 1, snapshotDate: -1 });

export default mongoose.model<IPerformanceMetric>('PerformanceMetric', PerformanceMetricSchema);
