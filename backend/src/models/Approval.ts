import mongoose, { Schema, Document } from 'mongoose';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalLevel = number;

export interface IApproval extends Document {
  task: mongoose.Types.ObjectId;
  level: ApprovalLevel;
  approver: mongoose.Types.ObjectId;
  status: ApprovalStatus;
  comment?: string;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    level: { type: Number, required: true, default: 1 },
    approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    comment: { type: String, trim: true },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

ApprovalSchema.index({ task: 1, level: 1 }, { unique: true });
ApprovalSchema.index({ approver: 1, status: 1 });

export default mongoose.model<IApproval>('Approval', ApprovalSchema);
