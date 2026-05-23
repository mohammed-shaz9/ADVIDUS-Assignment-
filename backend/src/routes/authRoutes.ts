import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/register', authLimiter, validateRegister, authController.registerUser);
router.post('/login', authLimiter, validateLogin, authController.loginUser);
router.get('/me', protect, authController.getMe);
router.post('/ensure-demo', authController.ensureDemo);
router.get('/credentials', authController.getCredentials);

export default router;
