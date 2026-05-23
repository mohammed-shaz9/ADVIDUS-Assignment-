import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityAction =
  | 'LOGIN' | 'REGISTER'
  | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'TASK_STATUS_CHANGE'
  | 'USER_CREATED' | 'USER_STATUS_UPDATED' | 'USER_DELETED'
  | 'AGENT_CREATED' | 'AGENT_DELETED' | 'AGENT_STATUS_UPDATED'
  | 'APPROVAL_CHAIN_CREATED' | 'APPROVAL_GRANTED' | 'APPROVAL_REJECTED' | 'APPROVAL_REQUESTED'
  | 'COMMENT_CREATED' | 'PERFORMANCE_SNAPSHOT';

export interface IActivityLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  action: ActivityAction;
  details: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN', 'REGISTER',
        'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'TASK_STATUS_CHANGE',
        'USER_CREATED', 'USER_STATUS_UPDATED', 'USER_DELETED',
        'AGENT_CREATED', 'AGENT_DELETED', 'AGENT_STATUS_UPDATED',
        'APPROVAL_CHAIN_CREATED', 'APPROVAL_GRANTED', 'APPROVAL_REJECTED', 'APPROVAL_REQUESTED',
        'COMMENT_CREATED', 'PERFORMANCE_SNAPSHOT',
      ],
    },
    details: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

const ActivityLog: Model<IActivityLogDocument> = mongoose.model<IActivityLogDocument>('ActivityLog', activityLogSchema);
export default ActivityLog;
