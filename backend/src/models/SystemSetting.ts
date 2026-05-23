import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettingDocument extends Document {
  key: string;
  value: string;
  group: 'general' | 'notifications' | 'tasks' | 'security' | 'integrations';
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSettingDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, required: true },
    group: {
      type: String,
      enum: ['general', 'notifications', 'tasks', 'security', 'integrations'],
      default: 'general',
    },
    description: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const SystemSetting: Model<ISystemSettingDocument> = mongoose.model<ISystemSettingDocument>('SystemSetting', systemSettingSchema);
export default SystemSetting;
