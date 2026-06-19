import { Router } from 'express';
import {
  createCard,
  updateCard,
  deleteCard,
} from '../controllers/cardController';
import { authMiddleware } from '../middleware/authMiddleware';
import { syncUser } from '../middleware/syncUser';

const router = Router();
router.use(authMiddleware, syncUser);

router.post('/column/:columnId', createCard);
router.put('/:cardId', updateCard);
router.delete('/:cardId', deleteCard);

export default router;