import { Request, Response } from 'express';
import db from '../db';

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const currentUserId = (req as any).user.id;
    
    if (!query || typeof query !== 'string') {
      return res.json({ success: true, data: [] });
    }

    // --- THIS IS THE FIX ---
    // We update the query to check for email OR username
    const users = await db('users')
      .where(function() {
        this.where('email', 'like', `%${query}%`)
            .orWhere('username', 'like', `%${query}%`); // <-- ADDED THIS
      })
      .andWhereNot('id', currentUserId) // Don't include self
      .select('id', 'username', 'email', 'avatar_color')
      .limit(5);
    // --- END FIX ---
      
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error searching users' });
  }
};