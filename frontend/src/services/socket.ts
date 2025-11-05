import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// --- 1. USE THE VITE_API_URL ENV VARIABLE ---
const URL = import.meta.env.VITE_API_URL;
// --- END CHANGE ---

export const socket: Socket = io(URL, {
  autoConnect: false, // We will connect manually
  // This is where we pass the auth token
  auth: (cb) => {
    const token = useAuthStore.getState().token;
    cb({ token });
  },
});

// This is a simple wrapper to connect if we have a token
export const connectSocket = () => {
  const token = useAuthStore.getState().token;
  if (token && !socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};