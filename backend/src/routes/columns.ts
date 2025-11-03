import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateColumnId, validateColumn, validateCard, validateColumnMove } from '../middleware/validationMiddleware';
import { checkColumnPermission } from '../middleware/permissionMiddleware';
import {
  updateColumn,
  deleteColumn,
  moveColumn
} from '../controllers/columnController';
import { createCard } from '../controllers/cardController';
const router = Router();

// All routes in this file are protected
router.use(authMiddleware);

// These routes operate on a specific column, so we check permission
router.put(
    '/:columnId/move',
    validateColumnId,
    validateColumnMove,
    checkColumnPermission, // This attaches boardId to req
    moveColumn
  );
router.post(
    '/:columnId/cards',
    validateColumnId,
    validateCard,
    checkColumnPermission, // Checks if user is member of board for :columnId
    createCard
  );
router.put(
  '/:columnId',
  validateColumnId,
  validateColumn,
  checkColumnPermission,
  updateColumn
);

router.delete(
  '/:columnId',
  validateColumnId,
  checkColumnPermission,
  deleteColumn
);

export default router;