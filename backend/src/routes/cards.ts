import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateCardId, validateCardUpdate, validateCardMove } from '../middleware/validationMiddleware';
import { checkCardPermission } from '../middleware/permissionMiddleware';
import {
  updateCard,
  deleteCard,
  getCardById,
  moveCard
} from '../controllers/cardController';

const router = Router();

// All routes in this file are protected
router.use(authMiddleware);

// These routes operate on a specific card, so we check permission
router.put(
    '/:cardId/move',
    validateCardId,
    validateCardMove,
    checkCardPermission, // This attaches boardId to req
    moveCard
  );
  
router.get(
  '/:cardId',
  validateCardId,
  checkCardPermission,
  getCardById
);

router.put(
  '/:cardId',
  validateCardId,
  validateCardUpdate,
  checkCardPermission,
  updateCard
);

router.delete(
  '/:cardId',
  validateCardId,
  checkCardPermission,
  deleteCard
);

export default router;