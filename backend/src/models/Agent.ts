import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgentDocument extends Document {
  name: string;
  role: string;
  systemPrompt: string;
  modelName: string;
  status: 'active' | 'inactive';
  creator: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgentDocument>(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      unique: true,
    },
    role: {
      type: String,
      required: [true, 'Agent role specification is required'],
      trim: true,
    },
    systemPrompt: {
      type: String,
      required: [true, 'System prompt context is required'],
    },
    modelName: {
      type: String,
      default: 'gpt-4o',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Agent: Model<IAgentDocument> = mongoose.model<IAgentDocument>('Agent', agentSchema);
export default Agent;
