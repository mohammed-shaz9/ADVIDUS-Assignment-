import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskComment extends Document {
  task: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

TaskCommentSchema.index({ task: 1, createdAt: -1 });

export default mongoose.model<ITaskComment>('TaskComment', TaskCommentSchema);
