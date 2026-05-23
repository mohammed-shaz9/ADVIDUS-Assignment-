import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as performanceController from '../controllers/performanceController.js';

const router = Router();
router.use(protect);

router.get('/me', performanceController.getMyPerformance);
router.get('/user/:userId', performanceController.getUserPerformance);
router.get('/all', adminOnly, performanceController.getAllPerformance);
router.post('/snapshot', adminOnly, performanceController.takeSnapshot);

export default router;
