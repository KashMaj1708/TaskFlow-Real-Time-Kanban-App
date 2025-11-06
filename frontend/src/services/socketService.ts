import { io, Socket } from 'socket.io-client';

// 1. Get the URL
const URL = import.meta.env.VITE_API_URL;

// 2. Helper to get token from localStorage
const getAuthToken = () => {
  // --- DEBUG ---
  console.log('[SocketService.ts] getAuthToken: Trying to get token...');
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authState = JSON.parse(authStorage);
    const token = authState.state.token;
    if (token) {
      console.log('[SocketService.ts] getAuthToken: Found token!');
    } else {
      console.log('[SocketService.ts] getAuthToken: Found auth-storage, but NO TOKEN inside.');
    }
    return token;
  }
  console.log('[SocketService.ts] getAuthToken: NO auth-storage found in localStorage.');
  return null;
  // --- END DEBUG ---
};

// 3. We'll store our single socket instance here
let socket: Socket | null = null;

// 4. This function will create or return the socket
export const getSocket = (): Socket => {
  // --- DEBUG ---
  console.log('[SocketService.ts] getSocket: Function called.');
  // --- END DEBUG ---

  // If the socket doesn't exist *or* is disconnected, create a new one
  if (!socket || !socket.connected) {
    // --- DEBUG ---
    console.log('[SocketService.ts] getSocket: No socket found or socket disconnected. CREATING NEW INSTANCE.');
    // --- END DEBUG ---
    socket = io(URL, {
      autoConnect: false, // <-- This is the most important line
      auth: (cb) => {
        // --- DEBUG ---
        console.log('[SocketService.ts] io.auth: Auth function running. Calling getAuthToken...');
        // --- END DEBUG ---
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
      // This is the log that prints "Authentication error: No token provided"
      console.error('Socket.IO connection error:', err.message);
    });
  } else {
    // --- DEBUG ---
    console.log('[SocketService.ts] getSocket: Returning existing connected socket.');
    // --- END DEBUG ---
  }
  return socket;
};

// 5. These functions are what your components will call
export const connectSocket = () => {
  // --- DEBUG ---
  console.log('[SocketService.ts] connectSocket: Function called.');
  // --- END DEBUG ---
  const s = getSocket();
  if (!s.connected) {
    // --- DEBUG ---
    console.log('[SocketService.ts] connectSocket: Socket not connected. Calling .connect()');
    // --- END DEBUG ---
    s.connect();
  } else {
    // --- DEBUG ---
    console.log('[SocketService.ts] connectSocket: Socket already connected.');
    // --- END DEBUG ---
  }
};

export const disconnectSocket = () => {
  // --- DEBUG ---
  console.log('[SocketService.ts] disconnectSocket: Function called.');
  // --- END DEBUG ---
  if (socket && socket.connected) {
    console.log('[SocketService.ts] disconnectSocket: Disconnecting socket.');
    socket.disconnect();
  } 
};