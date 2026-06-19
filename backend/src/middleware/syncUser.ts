import { Request, Response, NextFunction } from 'express';
import db from '../db';

const avatarColors = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899',
];

const getRandomColor = () => avatarColors[Math.floor(Math.random() * avatarColors.length)];

/**
 * Mirrors the authenticated Firebase user into our local Postgres `users` table.
 *
 * Firebase Auth is not a queryable directory we can JOIN against in SQL, but
 * invite-by-username/email and assign-to-member features need one. So the first
 * time a Firebase user hits the API we upsert them here.
 *
 * Known limitation: a user who registered in Firebase but has never made an
 * authenticated API call won't be in this table yet, so they are un-inviteable
 * until their first login. Acceptable for a demo.
 *
 * Must run AFTER authMiddleware.
 */
export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const email: string = user.email ?? `${user.id}@unknown.local`;
    const username = email.split('@')[0];

    await db('users')
      .insert({
        id: user.id,
        email,
        username,
        avatar_color: getRandomColor(),
      })
      .onConflict('id')
      .merge({ email }); // keep email fresh, don't clobber username/avatar_color

    next();
  } catch (err) {
    console.error('syncUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to sync user' });
  }
};
