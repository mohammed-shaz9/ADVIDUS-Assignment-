import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.use(protect);
router.get('/', adminController.getPublicAnalytics);

export default router;
