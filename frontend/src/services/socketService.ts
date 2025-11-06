import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL;

// Helper to get token from localStorage
const getAuthToken = () => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authState = JSON.parse(authStorage);
    return authState.state.token;
  }
  return null;
};

// --- THIS IS THE FIX ---
// We will store our single socket instance here
let socket: Socket | null = null;

// This function will create or return the socket
export const getSocket = (): Socket => {
  // Only create a new socket if one doesn't exist
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      auth: (cb) => {
        const token = getAuthToken();
        cb({ token });
      },
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      socket = null; // <-- On disconnect, clear the instance
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      socket = null; // <-- On error, clear the instance
    });
  }
  return socket;
};

// These functions are what your components will call
export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  // We set socket to null in the 'disconnect' event listener
};