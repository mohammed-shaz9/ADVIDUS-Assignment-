import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

router.get('/tasks', adminController.getAdminTasks);
router.get('/logs', adminController.getActivityLogs);
router.get('/metrics', adminController.getMetrics);
router.get('/analytics', adminController.getAnalytics);

export default router;
