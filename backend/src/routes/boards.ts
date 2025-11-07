import { Router } from 'express';
import {
  getBoards,
  getBoardById,
  createBoard,
  inviteUserToBoard,
  removeUserFromBoard, // <-- 1. Import the new function
} from '../controllers/boardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware); // All board routes are protected

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:boardId', getBoardById);
router.post('/:boardId/invite', inviteUserToBoard);

// --- 2. ADD THIS NEW ROUTE ---
router.delete('/:boardId/members/:userId', removeUserFromBoard);
// --- END ADD ---

export default router;