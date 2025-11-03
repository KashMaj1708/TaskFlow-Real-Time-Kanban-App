import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { AuthRequest, UserPayload } from '../utils/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Function to generate JWT
const generateToken = (user: UserPayload): string => {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists (by email or username)
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Create a random avatar color (simple example)
    const avatar_color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    // Insert new user into DB
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, username, email, avatar_color",
      [username, email, password_hash, avatar_color]
    );

    const user = newUser.rows[0];

    // Create payload and generate token
    const payload: UserPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };
    const token = generateToken(payload);

    // Respond as per the spec
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_color: user.avatar_color,
        },
        token,
      },
    });

  } catch (err) {
    console.error('Registration Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Create payload and generate token
    const payload: UserPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };
    const token = generateToken(payload);

    // Respond as per the spec
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_color: user.avatar_color,
        },
        token,
      },
    });

  } catch (err) {
    console.error('Login Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  // The user ID is attached to req.user by the authMiddleware
  const userId = req.user?.userId;

  if (!userId) {
     return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const userResult = await pool.query(
      "SELECT id, username, email, avatar_color FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Respond as per the spec
    res.status(200).json({
      success: true,
      data: userResult.rows[0],
    });

  } catch (err) {
    console.error('GetMe Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};