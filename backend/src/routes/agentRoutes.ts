import { Router } from 'express';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import * as agentController from '../controllers/agentController.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(checkPermission('agents:read'), agentController.getAgents)
  .post(checkPermission('agents:write'), agentController.createAgent);

router.patch('/:id/status', checkPermission('agents:write'), agentController.toggleAgentStatus);
router.delete('/:id', checkPermission('agents:write'), agentController.deleteAgent);

export default router;
