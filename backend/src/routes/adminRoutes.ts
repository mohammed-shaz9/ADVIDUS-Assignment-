import { Router, Response } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';
import * as adminService from '../services/adminService.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(protect);

// Batched endpoint for admin dashboard — reduces 6 calls to 1
router.get('/dashboard', adminOnly, async (req: AuthenticatedRequest, res: Response, next) => {
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

// Read endpoints — accessible to all authenticated users (UI widgets)
router.get('/users', adminController.getUsers);
router.get('/logs', adminController.getActivityLogs);

// Mutation/admin-only endpoints
router.patch('/users/:id/status', adminOnly, adminController.toggleUserStatus);
router.delete('/users/:id', adminOnly, adminController.deleteUser);

router.get('/tasks', adminOnly, adminController.getAdminTasks);
router.get('/metrics', adminOnly, adminController.getMetrics);
router.get('/analytics', adminOnly, adminController.getAnalytics);

export default router;
