import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as commentController from '../controllers/commentController.js';

const router = Router({ mergeParams: true });
router.use(protect);

router.get('/', commentController.getComments);
router.post('/', commentController.createComment);
router.delete('/:commentId', commentController.deleteComment);

export default router;
