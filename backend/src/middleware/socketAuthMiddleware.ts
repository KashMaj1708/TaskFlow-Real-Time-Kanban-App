import { Socket } from 'socket.io';
import { auth } from '../firebase';
import { UserPayload } from '../utils/types';

// This is an 'extended' Socket interface to include our user payload
export interface AuthSocket extends Socket {
  user?: UserPayload;
}

export const socketAuthMiddleware = async (socket: AuthSocket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    socket.user = { id: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    next(new Error('Authentication error: Token is not valid'));
  }
};
