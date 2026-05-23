import ActivityLog from '../models/ActivityLog.js';
import { emitEvent } from './realtime.js';
import { ActivityAction } from '../types/index.js';
import { logger } from '../config/logger.js';

export const logActivity = async (
  userId: string,
  action: ActivityAction,
  details: string
): Promise<void> => {
  try {
    const log = await ActivityLog.create({ userId, action, details });
    emitEvent('activity.created', { logId: log._id.toString(), action });
  } catch (error) {
    logger.error('Failed to create activity log', { error, userId, action });
  }
};
