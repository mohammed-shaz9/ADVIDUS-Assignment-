// Builds any missing indexes. Production runs with autoIndex=false (see config/db.ts), so run this on deploy:
//   npm run build && npm run indexes
// createIndexes() only adds; it never drops existing indexes.
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';
import './models/User.js';
import './models/Task.js';
import './models/ActivityLog.js';
import './models/Agent.js';
import './models/Approval.js';
import './models/Department.js';
import './models/Designation.js';
import './models/Notification.js';
import './models/PerformanceMetric.js';
import './models/SystemSetting.js';
import './models/TaskComment.js';
import './models/TaskTemplate.js';

await connectDB();
for (const name of mongoose.modelNames()) {
  await mongoose.model(name).createIndexes();
  logger.info(`indexes ok: ${name}`);
}
await mongoose.disconnect();
