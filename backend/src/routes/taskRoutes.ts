import { Router } from 'express';
import { protect, checkPermission, adminOnly } from '../middleware/authMiddleware.js';
import { validateTask } from '../middleware/validator.js';
import * as taskController from '../controllers/taskController.js';

const router = Router();

router.use(protect);
router.route('/')
  .get(checkPermission('tasks:read'), taskController.getTasks)
  .post(checkPermission('tasks:write'), validateTask, taskController.createTask);

router.get('/summary', checkPermission('tasks:read'), taskController.getTaskSummary);
// Demo-only: randomly flips real task statuses. Off unless ENABLE_SIMULATION=true, and admin-only.
if (process.env.ENABLE_SIMULATION === 'true') {
  router.post('/simulate', adminOnly, taskController.simulateActivity);
}

router.route('/:id')
  .put(checkPermission('tasks:write'), taskController.updateTask)
  .delete(checkPermission('tasks:delete'), taskController.deleteTask);

export default router;
