import { io, Socket } from 'socket.io-client';

// 1. Use the VITE_API_URL
const URL = import.meta.env.VITE_API_URL;

// 2. Helper to get token from localStorage
const getAuthToken = () => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authState = JSON.parse(authStorage);
    return authState.state.token;
  }
  return null;
};

// 3. We'll store our single socket instance here
let socket: Socket | null = null;

// 4. This is the new function your app will use
export const getSocket = (): Socket => {
  // If the socket doesn't exist, create it
  if (!socket) {
    const token = getAuthToken();

    socket = io(URL, {
      auth: {
        token: token, // Pass the token on creation
      },
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      socket = null; // Set to null so it can be re-created
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
    });
  }

  // Return the existing or new socket
  return socket;
};

// 5. We simplify the connect/disconnect logic
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
};