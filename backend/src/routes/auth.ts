import { Router } from 'express';
import { getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { syncUser } from '../middleware/syncUser';

const router = Router();

// Registration/login/logout are handled by Firebase Auth on the client.
// The only auth endpoint the backend still needs is "who am I", which also
// mirrors the Firebase user into our local users table via syncUser.
router.get('/me', authMiddleware, syncUser, getMe);

export default router;
