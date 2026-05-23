import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  head?: mongoose.Types.ObjectId;
  organization: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    head: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    organization: { type: String, default: 'Avidus Interactive' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DepartmentSchema.index({ parentId: 1 });
DepartmentSchema.index({ name: 1, organization: 1 }, { unique: true });

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
