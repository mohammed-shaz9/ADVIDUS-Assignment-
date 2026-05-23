import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'task_assigned' | 'task_updated' | 'approval_requested' | 'approval_decided' | 'comment_added' | 'status_change' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['task_assigned', 'task_updated', 'approval_requested', 'approval_decided', 'comment_added', 'status_change', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification: Model<INotificationDocument> = mongoose.model<INotificationDocument>('Notification', notificationSchema);
export default Notification;
