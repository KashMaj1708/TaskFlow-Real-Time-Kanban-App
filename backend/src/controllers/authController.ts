import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db'; // <-- Uses the new Knex db instance
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// A simple color generator for new user avatars
const avatarColors = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
];

const getRandomColor = () => {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)];
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarColor = getRandomColor();

    const [newUser] = await db('users')
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        avatar_color: avatarColor,
      })
      .returning(['id', 'username', 'email', 'avatar_color']);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (err) {
    // --- THIS IS THE UPDATED CATCH BLOCK ---
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.issues });
    }
    // Handle unique constraint error (e.g., email already exists)
    if ((err as any).code === '23505') {
      return res.status(409).json({ success: false, message: 'Email or username already exists' });
    }
    console.error(err);
    // Handle 'unknown' type error
    if (err instanceof Error) {
      res.status(500).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown internal server error occurred' });
    }
    // --- END UPDATE ---
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db('users').where({ email }).first();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // --- 1. DELETE THE res.cookie BLOCK ---
    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'none',
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });
    // --- END DELETE ---

    // --- 2. ADD THE token TO THE JSON RESPONSE ---
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_color: user.avatar_color,
      },
      token: token, // <-- ADD THIS LINE
    });
    // --- END ADD ---

  } catch (err) {
    // --- THIS IS THE UPDATED CATCH BLOCK ---
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.issues });
    }
    console.error(err);
    // Handle 'unknown' type error
    if (err instanceof Error) {
      res.status(500).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown internal server error occurred' });
    }
    // --- END UPDATE ---
  }
};

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
    // --- THIS IS THE UPDATED CATCH BLOCK ---
    console.error(err);
    // Handle 'unknown' type error
    if (err instanceof Error) {
      res.status(500).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown internal server error occurred' });
    }
    // --- END UPDATE ---
  }
};

export const logout = (req: Request, res: Response) => {
  // --- DELETE THE res.cookie BLOCK ---
  // The client will handle its own token deletion from local storage
  // res.cookie('token', '', {
  //   httpOnly: true,
  //   expires: new Date(0),
  // });
  // --- END DELETE ---

  res.json({ success: true, message: 'Logged out successfully' });
};