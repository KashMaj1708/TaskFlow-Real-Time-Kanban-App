import { Router } from 'express';
import {
  createColumn,
  deleteColumn,
  updateColumnOrder,
  updateCardOrder,
} from '../controllers/columnController';
import { authMiddleware } from '../middleware/authMiddleware';
import { syncUser } from '../middleware/syncUser';

const router = Router();
router.use(authMiddleware, syncUser);

router.post('/board/:boardId', createColumn);
router.delete('/:columnId', deleteColumn);
router.put('/board/:boardId/order', updateColumnOrder);
router.put('/board/:boardId/cards/order', updateCardOrder);

export default router;