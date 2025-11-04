import { Router } from 'express';
import {
  createCard,
  updateCard,
  deleteCard,
} from '../controllers/cardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.post('/column/:columnId', createCard);
router.put('/:cardId', updateCard);
router.delete('/:cardId', deleteCard);

export default router;