import { Request, Response } from 'express';
import db from '../db';

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const currentUserId = (req as any).user.id;
    
    if (!query || typeof query !== 'string') {
      return res.json({ success: true, data: [] });
    }

    const users = await db('users')
      .where('email', 'like', `%${query}%`)
      .andWhereNot('id', currentUserId) // Don't include self
      .select('id', 'username', 'email', 'avatar_color')
      .limit(5);
      
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error searching users' });
  }
};