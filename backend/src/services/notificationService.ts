import Notification from '../models/Notification.js';
import { emitToUser } from '../utils/realtime.js';

export const getUserNotifications = async (userId: string, limit = 20) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

export const getUnreadCount = async (userId: string) => {
  return Notification.countDocuments({ userId, read: false });
};

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) => {
  const notification = await Notification.create({ userId, type, title, message, link });
  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId, 'notification.new', {
    notification: notification.toObject(),
    unreadCount,
  });
  return notification;
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId, 'notification.updated', { unreadCount });
  return notification;
};

export const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ userId, read: false }, { read: true });
  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId, 'notification.updated', { unreadCount });
  return { message: 'All notifications marked as read' };
};
