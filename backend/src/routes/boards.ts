import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBoard, validateBoardId, validateColumn, validateInvite,
  validateRemoveMember } from '../middleware/validationMiddleware';
import { checkBoardPermission } from '../middleware/permissionMiddleware';
import {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteUserToBoard,
  removeUserFromBoard
} from '../controllers/boardController';
import { createColumn } from '../controllers/columnController';
const router = Router();

// Apply auth middleware to all board routes
router.use(authMiddleware);

// @route   GET /api/boards
// @desc    Get all boards for current user
router.get('/', getBoards);

// @route   POST /api/boards
// @desc    Create a new board
router.post('/', validateBoard, createBoard);

// @route   GET /api/boards/:boardId
// @desc    Get board details
router.get('/:boardId', validateBoardId, getBoardById);

// @route   PUT /api/boards/:boardId
// @desc    Update board details
router.put('/:boardId', validateBoardId, validateBoard, updateBoard);

// @route   DELETE /api/boards/:boardId
// @desc    Delete a board
router.delete('/:boardId', validateBoardId, deleteBoard);
// @route   POST /api/boards/:boardId/columns
// @desc    Create a new column
router.post(
    '/:boardId/columns',
    validateBoardId,
    validateColumn,
    checkBoardPermission, // Checks if user is member of :boardId
    createColumn
  );
// @route   POST /api/boards/:boardId/invite
// @desc    Invite a user to a board
router.post(
  '/:boardId/invite',
  validateBoardId,
  validateInvite,
  inviteUserToBoard
);

// @route   DELETE /api/boards/:boardId/members/:userId
// @desc    Remove a user from a board
router.delete(
  '/:boardId/members/:userId',
  validateRemoveMember,
  removeUserFromBoard
);
export default router;