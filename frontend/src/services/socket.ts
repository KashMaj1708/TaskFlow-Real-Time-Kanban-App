import { io, Socket } from 'socket.io-client';

// 1. Get the URL
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

// 4. This function will create or return the socket
export const getSocket = (): Socket => {
  // If the socket doesn't exist *or* is disconnected, create a new one
  if (!socket || !socket.connected) {
    socket = io(URL, {
      autoConnect: false, // <-- This is the most important line
      auth: (cb) => {
        // This function now runs *when we call .connect()*
        // by which time the token will be ready.
        const token = getAuthToken();
        cb({ token });
      },
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
    });
  }
  return socket;
};

// 5. These functions are what your components will call
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