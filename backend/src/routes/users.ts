import { Router } from 'express';
import { searchUsers } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/search', searchUsers);

export default router;