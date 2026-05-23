import { Router } from 'express';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import * as approvalController from '../controllers/approvalController.js';

const router = Router();
router.use(protect);

router.get('/my', approvalController.getMyApprovals);
router.get('/task/:taskId', approvalController.getTaskApprovals);
router.post('/task/:taskId', checkPermission('tasks:write'), approvalController.createApprovalChain);
router.post('/:approvalId/decide', approvalController.decideApproval);

export default router;
