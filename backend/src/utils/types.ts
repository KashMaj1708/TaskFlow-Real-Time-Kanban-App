import { Request } from 'express';

// Shape of the user we attach to requests/sockets after verifying a Firebase
// ID token. `id` is the Firebase UID (a string).
export interface UserPayload {
  id: string;
  email?: string;
  username?: string;
}

// Extend the Express Request interface to include the 'user' property
export interface AuthRequest extends Request {
  user?: UserPayload;
}
