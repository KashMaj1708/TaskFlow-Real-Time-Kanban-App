import { Router } from 'express';
import { searchUsers } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { syncUser } from '../middleware/syncUser';

const router = Router();
router.use(authMiddleware, syncUser);

router.get('/search', searchUsers);

export default router;