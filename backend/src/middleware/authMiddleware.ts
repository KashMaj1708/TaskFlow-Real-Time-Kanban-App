import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    // Verify the token and get the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // Attach the payload (which should be { id: ..., username: ... }) to the request
    (req as any).user = decoded; 
    
    // Continue to the next function (the controller)
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};