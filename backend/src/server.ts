import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
// --- 1. DELETE COOKIE IMPORTS ---
// import cookieParser from 'cookie-parser';
// import cookie from 'cookie';
// --- END DELETE ---
import 'dotenv/config';
import jwt from 'jsonwebtoken';

// --- ROUTE IMPORTS ---
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import columnRoutes from './routes/columns';
import cardRoutes from './routes/cards';
import userRoutes from './routes/users';

const app = express();
const httpServer = createServer(app);

// --- SOCKET.IO SETUP ---
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// --- 2. UPDATE SOCKET.IO MIDDLEWARE ---
io.use((socket, next) => {
  try {
    // Read token from the 'auth' payload sent by the client
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (socket as any).user = decoded; // Attach user to the socket object
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});
// --- END UPDATE ---

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join:board', (boardId) => {
    socket.join(`board:${boardId}`);
    console.log(`Socket ${socket.id} joined room board:${boardId}`);
  });

  socket.on('leave:board', (boardId) => {
    socket.leave(`board:${boardId}`);
    console.log(`Socket ${socket.id} left room board:${boardId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach io instance to app
app.set('io', io);

// --- MIDDLEWARE ---
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json()); // Parses incoming JSON requests

// --- 3. DELETE COOKIE PARSER ---
// app.use(cookieParser()); // Parses cookies for auth
// --- END DELETE ---

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/users', userRoutes);

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});