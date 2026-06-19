import { Request, Response } from 'express';
import db from '../db';

/**
 * Returns the currently authenticated user's profile from our local mirror of
 * Firebase users. Registration/login/password handling now live entirely in
 * Firebase Auth (frontend), so those routes were removed.
 *
 * This route runs after authMiddleware + syncUser, so the user row is
 * guaranteed to exist by the time we get here.
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await db('users')
      .select('id', 'username', 'email', 'avatar_color')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'An unknown internal server error occurred';
    res.status(500).json({ success: false, message });
  }
};
