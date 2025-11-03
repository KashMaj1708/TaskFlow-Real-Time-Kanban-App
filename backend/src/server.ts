import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './db';

// --- Route Imports ---
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import columnRoutes from './routes/columns';
import cardRoutes from './routes/cards';
import userRoutes from './routes/users';
// --- Socket.IO Middleware ---
import { socketAuthMiddleware, AuthSocket } from './middleware/socketAuthMiddleware';
import { UserPayload } from './utils/types';

// Load environment variables
dotenv.config();

// --- App Setup ---
const app: Express = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// --- Middleware ---
app.use(cors({
  origin: clientUrl,
}));
app.use(express.json());

// --- HTTP Server Setup ---
const httpServer = createServer(app);

// --- Socket.IO Server Setup ---
export const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
  },
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);   // Handles /api/boards and /api/boards/:boardId/columns
app.use('/api/columns', columnRoutes); // Handles /api/columns/:columnId and /api/columns/:columnId/cards
app.use('/api/cards', cardRoutes);     // Handles /api/cards/:cardId
app.use('/api/users', userRoutes);
// --- Health Check Route ---
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// --- Socket.IO connection handling ---

// Apply the auth middleware to all incoming connections
io.use(socketAuthMiddleware);

io.on('connection', (socket: AuthSocket) => {
  console.log(`[Socket] User connected: ${socket.user?.username} (ID: ${socket.id})`);

  // Handle a user joining a board
  socket.on('board:join', (boardId: string) => {
    const roomId = `board:${boardId}`;
    socket.join(roomId);
    console.log(`[Socket] User ${socket.user?.username} joined room: ${roomId}`);
    
    // We'll use this for presence later
    // socket.to(roomId).emit('user:joined', { ...socket.user });
  });

  // Handle a user leaving a board
  socket.on('board:leave', (boardId: string) => {
    const roomId = `board:${boardId}`;
    socket.leave(roomId);
    console.log(`[Socket] User ${socket.user?.username} left room: ${roomId}`);
    
    // We'll use this for presence later
    // socket.to(roomId).emit('user:left', { userId: socket.user?.userId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.user?.username} (ID: ${socket.id})`);
    // We'll add presence cleanup here later
  });
});
// --- End Socket.IO handling ---

// --- Start Server ---
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
    
    // Start listening
    httpServer.listen(port, () => {
      console.log(`[Server] Backend server is running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();