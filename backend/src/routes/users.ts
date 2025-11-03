import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { searchUsers } from '../controllers/userController';

const router = Router();

// Apply auth to all user routes
router.use(authMiddleware);

// @route   GET /api/users/search
// @desc    Search for users
router.get('/search', searchUsers);

export default router;