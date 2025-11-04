import { Router } from 'express';
import {
  getBoards,
  getBoardById,
  createBoard,
  inviteUserToBoard,
} from '../controllers/boardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware); // All board routes are protected

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:boardId', getBoardById);
router.post('/:boardId/invite', inviteUserToBoard);

export default router;