import { Response, NextFunction } from 'express';
import pool from '../db';
import { AuthRequest } from '../utils/types';

/**
 * @desc    Checks if the authenticated user is a member of the board
 * associated with the :columnId
 */
export const checkColumnPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { columnId } = req.params;

  try {
    const query = `
      SELECT c.board_id 
      FROM columns c
      JOIN board_members bm ON c.board_id = bm.board_id
      WHERE c.id = $1 AND bm.user_id = $2
    `;
    const result = await pool.query(query, [columnId, userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this column' });
    }
    
    // Attach board_id to request for potential use in controllers
    (req as any).boardId = result.rows[0].board_id;
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
  const userId = req.user?.userId;
  const { cardId } = req.params;

  try {
    const query = `
      SELECT c.board_id 
      FROM cards ca
      JOIN columns c ON ca.column_id = c.id
      JOIN board_members bm ON c.board_id = bm.board_id
      WHERE ca.id = $1 AND bm.user_id = $2
    `;
    const result = await pool.query(query, [cardId, userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this card' });
    }

    // Attach board_id to request
    (req as any).boardId = result.rows[0].board_id;
    next();
  } catch (err) {
    console.error('Card Permission Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Checks if the authenticated user is a member of the board
 * associated with the :boardId (used for creating columns)
 */
export const checkBoardPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { boardId } = req.params;

  try {
    const memberCheck = await pool.query(
      "SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this board' });
    }
    next();
  } catch (err) {
    console.error('Board Permission Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};