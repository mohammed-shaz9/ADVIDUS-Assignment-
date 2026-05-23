import mongoose, { Schema, Document } from 'mongoose';

export interface IDesignation extends Document {
  title: string;
  level: number;
  department?: mongoose.Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema<IDesignation>(
  {
    title: { type: String, required: true, trim: true },
    level: { type: Number, required: true, default: 1 },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DesignationSchema.index({ title: 1 }, { unique: true });

export default mongoose.model<IDesignation>('Designation', DesignationSchema);
