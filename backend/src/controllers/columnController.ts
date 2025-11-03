import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../utils/types';
import { io } from '../server';
/**
 * @route   POST /api/boards/:boardId/columns
 * @desc    Create a new column in a board
 */
export const createColumn = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params;
  const { title } = req.body;
  const userId = req.user?.userId;
  try {
    // Get the highest current position in this board
    const maxPos = await pool.query(
      "SELECT MAX(position) as max_pos FROM columns WHERE board_id = $1",
      [boardId]
    );
    const newPosition = (maxPos.rows[0].max_pos || 0) + 1;

    // Insert new column
    const newColumn = await pool.query(
      "INSERT INTO columns (board_id, title, position) VALUES ($1, $2, $3) RETURNING id, title, position",
      [boardId, title, newPosition]
    );
    const columnData = { ...newColumn.rows[0], cards: [], createdBy: userId };
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('column:created', columnData);
    // We'll add socket.io emit here in Phase 4
    // io.to(boardId).emit('column:created', newColumn.rows[0]);

    res.status(201).json({
      success: true,
      data: newColumn.rows[0],
    });
  } catch (err) {
    console.error('CreateColumn Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   PUT /api/columns/:columnId
 * @desc    Update a column's title
 */
export const updateColumn = async (req: AuthRequest, res: Response) => {
  const { columnId } = req.params;
  const { title } = req.body;
  const boardId = (req as any).boardId;

  try {
    const updatedColumn = await pool.query(
      "UPDATE columns SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, title",
      [title, columnId]
    );

    if (updatedColumn.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }
    
    // We'll add socket.io emit here in Phase 4
    // const boardId = (req as any).boardId;
    // io.to(boardId).emit('column:updated', updatedColumn.rows[0]);
    const columnData = updatedColumn.rows[0];
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('column:updated', columnData);
    res.status(200).json({
      success: true,
      data: updatedColumn.rows[0],
    });
  } catch (err) {
    console.error('UpdateColumn Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/columns/:columnId
 * @desc    Delete a column
 */
export const deleteColumn = async (req: AuthRequest, res: Response) => {
  const { columnId } = req.params;
  const boardId = (req as any).boardId;
  try {
    const deletedColumn = await pool.query(
      "DELETE FROM columns WHERE id = $1 RETURNING id",
      [columnId]
    );
    
    if (deletedColumn.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }

    // We'll add socket.io emit here in Phase 4
    // const boardId = (req as any).boardId;
    // io.to(boardId).emit('column:deleted', { columnId });
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('column:deleted', { columnId: deletedColumn.rows[0].id });

    res.status(200).json({
      success: true,
      message: 'Column deleted successfully',
    });
  } catch (err) {
    console.error('DeleteColumn Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
/**
 * @route   PUT /api/columns/:columnId/move
 * @desc    Move a column to a new position
 */
export const moveColumn = async (req: AuthRequest, res: Response) => {
    const { columnId } = req.params;
    const { newPosition } = req.body;
    
    // boardId is attached by the checkColumnPermission middleware
    const boardId = (req as any).boardId;
  
    const client = await pool.connect();
    const movedBy = req.user?.userId;
    try {
      await client.query('BEGIN');
  
      // Get current position
      const colRes = await client.query(
        "SELECT position FROM columns WHERE id = $1",
        [columnId]
      );
      if (colRes.rows.length === 0) {
        throw new Error('Column not found');
      }
      const oldPosition = colRes.rows[0].position;
  
      // Remove from old position
      await client.query(
        `UPDATE columns SET position = position - 1 
         WHERE board_id = $1 AND position > $2`,
        [boardId, oldPosition]
      );
  
      // Add to new position
      await client.query(
        `UPDATE columns SET position = position + 1 
         WHERE board_id = $1 AND position >= $2`,
        [boardId, newPosition]
      );
  
      // Update target column
      const updatedCol = await client.query(
        "UPDATE columns SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, position",
        [newPosition, columnId]
      );
  
      await client.query('COMMIT');
  
      // We'll add socket.io emit here in Phase 4
      // io.to(boardId).emit('column:moved', {
      //   columnId: updatedCol.rows[0].id,
      //   newPosition: updatedCol.rows[0].position,
      //   movedBy: req.user?.userId
      // });
      const eventData = {
        columnId: updatedCol.rows[0].id,
        newPosition: updatedCol.rows[0].position,
        movedBy: movedBy, // Send who moved it
      };
      const roomId = `board:${boardId}`;
      io.to(roomId).emit('column:moved', eventData); // Emit to everyone
  
      res.status(200).json({
        success: true,
        data: updatedCol.rows[0],
      });
  
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('MoveColumn Error:', (err as Error).message);
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      client.release();
    }
  };