import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../utils/types';
import { io } from '../server';

/**
 * @route   GET /api/boards
 * @desc    Get all boards for current user (owned + member of)
 */
export const getBoards = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const boards = await pool.query(
      `SELECT 
         b.id, b.title, b.description, b.owner_id, bm.role, b.created_at
       FROM boards b
       JOIN board_members bm ON b.id = bm.board_id
       WHERE bm.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: boards.rows,
    });
  } catch (err) {
    console.error('GetBoards Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   POST /api/boards
 * @desc    Create a new board
 */
export const createBoard = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { title, description } = req.body;

  const client = await pool.connect();
  try {
    // We use a transaction to create the board AND add the owner as a member
    await client.query('BEGIN');

    // Insert new board
    const newBoard = await client.query(
      "INSERT INTO boards (title, description, owner_id) VALUES ($1, $2, $3) RETURNING id, title, description, owner_id, created_at",
      [title, description || null, userId]
    );
    const board = newBoard.rows[0];

    // Add the creator as the 'owner' in board_members
    await client.query(
      "INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'owner')",
      [board.id, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: board,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CreateBoard Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

/**
 * @route   GET /api/boards/:boardId
 * @desc    Get board details with columns and cards
 */
export const getBoardById = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { boardId } = req.params;

  try {
    // First, check if the user is a member of the board
    const memberCheck = await pool.query(
      "SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this board' });
    }

    // This complex query fetches the board, its members, and its columns,
    // with cards nested inside columns, all matching the spec's JSON structure.
    const boardQuery = `
      SELECT 
        b.id, b.title, b.description, b.owner_id,
        (
          SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'avatar_color', u.avatar_color, 'role', bm.role))
          FROM board_members bm
          JOIN users u ON u.id = bm.user_id
          WHERE bm.board_id = b.id
        ) as members,
        (
          SELECT COALESCE(json_agg(c.* ORDER BY c.position), '[]'::json)
          FROM (
            SELECT 
              col.id, col.title, col.position,
              (
                SELECT COALESCE(json_agg(cards.* ORDER BY cards.position), '[]'::json)
                FROM (
                  SELECT
                    ca.id, ca.title, ca.description, ca.position, ca.due_date, ca.labels, ca.created_by,
                    json_build_object('id', u_assign.id, 'username', u_assign.username, 'avatar_color', u_assign.avatar_color) as assigned_user
                  FROM cards ca
                  LEFT JOIN users u_assign ON u_assign.id = ca.assigned_user_id
                  WHERE ca.column_id = col.id
                ) as cards
              ) as cards
            FROM columns col
            WHERE col.board_id = b.id
          ) as c
        ) as columns
      FROM boards b
      WHERE b.id = $1
    `;

    const boardResult = await pool.query(boardQuery, [boardId]);

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    res.status(200).json({
      success: true,
      data: boardResult.rows[0],
    });

  } catch (err) {
    console.error('GetBoardById Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   PUT /api/boards/:boardId
 * @desc    Update board details (title, description)
 */
export const updateBoard = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { boardId } = req.params;
  const { title, description } = req.body;

  try {
    // Check if user is the owner
    const board = await pool.query(
      "SELECT owner_id FROM boards WHERE id = $1",
      [boardId]
    );
    
    if (board.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    
    if (board.rows[0].owner_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this board' });
    }

    // Update the board
    const updatedBoard = await pool.query(
      "UPDATE boards SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, title, description, updated_at",
      [title, description, boardId]
    );

    res.status(200).json({
      success: true,
      data: updatedBoard.rows[0],
    });

  } catch (err) {
    console.error('UpdateBoard Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/boards/:boardId
 * @desc    Delete a board (owner only)
 */
export const deleteBoard = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { boardId } = req.params;

  try {
    // Check if user is the owner
    const board = await pool.query(
      "SELECT owner_id FROM boards WHERE id = $1",
      [boardId]
    );

    if (board.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    if (board.rows[0].owner_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this board' });
    }

    // Delete the board. 'ON DELETE CASCADE' in SQL schema handles cleanup.
    await pool.query("DELETE FROM boards WHERE id = $1", [boardId]);

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully',
    });

  } catch (err) {
    console.error('DeleteBoard Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   POST /api/boards/:boardId/invite
 * @desc    Invite a user to a board
 */
export const inviteUserToBoard = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params;
  const { userId: userIdToInvite } = req.body; // The ID of the user to invite
  const currentUserId = req.user?.userId;

  try {
    // 1. Check if current user is the owner
    const board = await pool.query("SELECT owner_id FROM boards WHERE id = $1", [boardId]);
    if (board.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    if (board.rows[0].owner_id !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Only the board owner can invite users' });
    }

    // 2. Check if user is already a member
    const member = await pool.query(
      "SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userIdToInvite]
    );
    if (member.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User is already a member of this board' });
    }

    // 3. Add user to board_members as 'member'
    await pool.query(
      "INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'member')",
      [boardId, userIdToInvite]
    );

    // 4. Get the full member data to send to clients
    const newMember = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar_color, bm.role
       FROM users u
       JOIN board_members bm ON u.id = bm.user_id
       WHERE bm.board_id = $1 AND bm.user_id = $2`,
      [boardId, userIdToInvite]
    );

    // 5. Emit socket event
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('board:member:added', newMember.rows[0]);

    res.status(200).json({
      success: true,
      data: newMember.rows[0],
    });
  } catch (err) {
    console.error('InviteUser Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/boards/:boardId/members/:userId
 * @desc    Remove a user from a board
 */
export const removeUserFromBoard = async (req: AuthRequest, res: Response) => {
  const { boardId, userId: userIdToRemove } = req.params;
  const currentUserId = req.user?.userId;

  try {
    // 1. Check if current user is the owner
    const board = await pool.query("SELECT owner_id FROM boards WHERE id = $1", [boardId]);
    if (board.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    if (board.rows[0].owner_id !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Only the board owner can remove users' });
    }
    
    // 2. Check if user is trying to remove themselves (the owner)
    if (board.rows[0].owner_id === parseInt(userIdToRemove, 10)) {
        return res.status(400).json({ success: false, message: 'Owner cannot be removed from the board' });
    }

    // 3. Remove the user
    const result = await pool.query(
      "DELETE FROM board_members WHERE board_id = $1 AND user_id = $2",
      [boardId, userIdToRemove]
    );
    
    if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Member not found on this board' });
    }

    // 4. Emit socket event
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('board:member:removed', { userId: parseInt(userIdToRemove, 10) });

    res.status(200).json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (err) {
    console.error('RemoveUser Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};