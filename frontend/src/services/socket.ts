import { io, Socket } from 'socket.io-client';
// We no longer need useAuthStore here, but it's fine to leave it
import { useAuthStore } from '../store/authStore'; 

// --- 1. USE THE VITE_API_URL ENV VARIABLE ---
const URL = import.meta.env.VITE_API_URL;
// --- END CHANGE ---

// --- 2. CREATE A HELPER FUNCTION (SAME AS IN API.TS) ---
const getAuthToken = () => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authState = JSON.parse(authStorage);
    return authState.state.token; // Get the token from the persisted state
  }
  return null; // No token found
};
// --- END FIX ---

export const socket: Socket = io(URL, {
  autoConnect: false, // We will connect manually
  // This is where we pass the auth token
  auth: (cb) => {
    // --- 3. USE THE NEW HELPER ---
    const token = getAuthToken();
    cb({ token });
    // --- END FIX ---
  },
});

// This is a simple wrapper to connect if we have a token
export const connectSocket = () => {
  // --- 4. USE THE NEW HELPER ---
  const token = getAuthToken();
  // --- END FIX ---
  if (token && !socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};