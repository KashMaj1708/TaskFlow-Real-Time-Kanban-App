import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';

/**
 * Verifies the Firebase ID token sent in the Authorization header.
 * On success attaches `req.user = { id: <firebase uid>, email, username }`.
 *
 * NOTE: `id` is the Firebase UID (a string). The rest of the codebase reads
 * `req.user.id`, so it keeps working unchanged - only the underlying type
 * changed from number to string.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    (req as any).user = {
      id: decoded.uid,
      email: decoded.email,
      // Best-effort username; the canonical value lives in the users table and
      // is set/kept fresh by the syncUser middleware.
      username: decoded.email ? decoded.email.split('@')[0] : undefined,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};
