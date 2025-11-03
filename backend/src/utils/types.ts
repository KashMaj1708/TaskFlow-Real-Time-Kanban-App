import { Request } from 'express';

// Define the shape of the user payload stored in the JWT
export interface UserPayload {
  userId: number;
  username: string;
  email: string;
}

// Extend the Express Request interface to include the 'user' property
export interface AuthRequest extends Request {
  user?: UserPayload;
}