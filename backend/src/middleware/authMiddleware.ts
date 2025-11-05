import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // --- 1. GET TOKEN FROM AUTHORIZATION HEADER ---
  const authHeader = req.headers.authorization;
  // The header format is "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];
  // --- END CHANGE ---

  if (!token) {
    // Removing the debug console.log
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    // Removing the debug console.log
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