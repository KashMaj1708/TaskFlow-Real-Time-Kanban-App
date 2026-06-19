import { io, Socket } from 'socket.io-client';
import { auth } from '../firebase';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get a fresh Firebase ID token for the socket handshake. Firebase ID tokens
// expire after 1 hour; getIdToken() auto-refreshes, and because this runs on
// every (re)connection attempt, reconnects always send a valid token.
const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
};

// We store our single socket instance here
let socket: Socket | null = null;

// This function will create or return the socket
export const getSocket = (): Socket => {
  // Only create a new socket if one doesn't exist
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      auth: async (cb) => {
        const token = await getAuthToken();
        cb({ token });
      },
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      socket = null; // On disconnect, clear the instance
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      socket = null; // On error, clear the instance
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
  // socket is set to null in the 'disconnect' event listener
};
