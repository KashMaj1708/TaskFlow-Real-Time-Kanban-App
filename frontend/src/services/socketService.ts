import { io } from 'socket.io-client';
// We no longer need js-cookie

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true // <-- THE FIX: tells client to send cookies
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});

export const connectSocket = () => {
  // No auth check needed, cookie is sent automatically
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};