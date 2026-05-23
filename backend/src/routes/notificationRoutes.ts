import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as notificationService from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const notifications = await notificationService.getUserNotifications((req as any).user._id);
  const unreadCount = await notificationService.getUnreadCount((req as any).user._id);
  res.json({ success: true, data: notifications, unreadCount, serverTime: new Date().toISOString() });
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount((req as any).user._id);
  res.json({ success: true, data: { count }, serverTime: new Date().toISOString() });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id as string, (req as any).user._id);
  res.json({ success: true, data: notification, serverTime: new Date().toISOString() });
}));

router.post('/read-all', asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead((req as any).user._id);
  res.json({ success: true, ...result, serverTime: new Date().toISOString() });
}));

export default router;
