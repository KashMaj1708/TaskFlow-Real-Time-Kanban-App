import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../utils/types';

/**
 * @route   GET /api/users/search
 * @desc    Search for users by username or email
 */
export const searchUsers = async (req: AuthRequest, res: Response) => {
  const { query } = req.query;
  const currentUserId = req.user?.userId;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  try {
    // Search for users who are NOT the current user
    // We use ILIKE for case-insensitive search
    const users = await pool.query(
      "SELECT id, username, email, avatar_color FROM users WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2 LIMIT 10",
      [`%${query}%`, currentUserId]
    );

    res.status(200).json({
      success: true,
      data: users.rows,
    });
  } catch (err) {
    console.error('SearchUsers Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};