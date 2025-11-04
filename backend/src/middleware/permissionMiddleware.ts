import { Response, NextFunction } from 'express';
import db from '../db'; // <-- This is your Knex instance
import { AuthRequest } from '../utils/types';

/**
 * @desc    Checks if the authenticated user is a member of the board
 * associated with the :columnId
 */
export const checkColumnPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id; // Corrected from your authController
  const { columnId } = req.params;

  try {
    const membership = await db('columns as c')
      .join('board_members as bm', 'c.board_id', 'bm.board_id')
      .where('c.id', columnId)
      .andWhere('bm.user_id', userId)
      .first('c.board_id'); // Select the board_id

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not authorized for this column' });
    }
    
    // Attach board_id to request
    (req as any).boardId = membership.board_id;
    next();
  } catch (err) {
    console.error('Column Permission Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Checks if the authenticated user is a member of the board
 * associated with the :cardId
 */
export const checkCardPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id; // Corrected from your authController
  const { cardId } = req.params;

  try {
    const membership = await db('cards as ca')
      .join('columns as c', 'ca.column_id', 'c.id')
      .join('board_members as bm', 'c.board_id', 'bm.board_id')
      .where('ca.id', cardId)
      .andWhere('bm.user_id', userId)
      .first('c.board_id'); // Select the board_id

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not authorized for this card' });
    }

    // Attach board_id to request
    (req as any).boardId = membership.board_id;
    next();
  } catch (err) {
    console.error('Card Permission Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Checks if the authenticated user is a member of the board
 * associated with the :boardId
 */
export const checkBoardPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id; // Corrected from your authController
  const { boardId } = req.params;

  try {
    const membership = await db('board_members')
      .where({
        board_id: boardId,
        user_id: userId,
      })
      .first(); // Just check if a row exists

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not authorized for this board' });
    }
    next();
  } catch (err)
    {
    console.error('Board Permission Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};