import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController';
import { validateRegistration, validateLogin } from '../middleware/validationMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', validateRegistration, registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user
router.post('/login', validateLogin, loginUser);

// @route   GET /api/auth/me
// @desc    Get current user info (protected)
router.get('/me', authMiddleware, getMe);

export default router;