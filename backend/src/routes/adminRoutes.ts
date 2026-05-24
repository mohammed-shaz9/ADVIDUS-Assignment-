import { Router, Response } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';
import * as adminService from '../services/adminService.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(protect, adminOnly);

// Batched endpoint for admin dashboard — reduces 6 calls to 1
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const [users, tasks, logs, metrics, analytics] = await Promise.all([
      adminService.getUsers(),
      adminService.getAdminTasks(req.query as Record<string, string>),
      adminService.getActivityLogs(req.query as Record<string, string>),
      adminService.getMetrics(),
      adminService.getAnalytics(),
    ]);
    res.json({
      success: true,
      data: { users, tasks, logs, metrics, analytics },
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

router.get('/tasks', adminController.getAdminTasks);
router.get('/logs', adminController.getActivityLogs);
router.get('/metrics', adminController.getMetrics);
router.get('/analytics', adminController.getAnalytics);

export default router;
