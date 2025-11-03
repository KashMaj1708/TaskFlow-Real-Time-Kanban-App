import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../utils/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

// This is an 'extended' Socket interface to include our user payload
export interface AuthSocket extends Socket {
  user?: UserPayload;
}

export const socketAuthMiddleware = (socket: AuthSocket, next: (err?: Error) => void) => {
  // The token is sent in the 'auth' object on connection
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    
    // Add user from payload to the socket object
    socket.user = decoded;
    
    next();
  } catch (err) {
    next(new Error('Authentication error: Token is not valid'));
  }
};