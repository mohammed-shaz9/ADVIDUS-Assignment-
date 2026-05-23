import { Router } from 'express';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { validateTask } from '../middleware/validator.js';
import * as taskController from '../controllers/taskController.js';

const router = Router();

router.use(protect);
router.route('/')
  .get(checkPermission('tasks:read'), taskController.getTasks)
  .post(checkPermission('tasks:write'), validateTask, taskController.createTask);

router.get('/summary', checkPermission('tasks:read'), taskController.getTaskSummary);

router.route('/:id')
  .put(checkPermission('tasks:write'), taskController.updateTask)
  .delete(checkPermission('tasks:delete'), taskController.deleteTask);

export default router;
