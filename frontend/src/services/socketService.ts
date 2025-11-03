import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  public socket: Socket | null = null;

  connect() {
    // Get token from auth store
    const token = useAuthStore.getState().token;
    if (!token) {
      console.error('Socket: No auth token found, connection aborted.');
      return;
    }

    // Connect with token in auth handshake
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // --- Board Room Actions ---
  joinBoard(boardId: string) {
    if (this.socket) {
      this.socket.emit('board:join', boardId);
    }
  }

  leaveBoard(boardId: string) {
    if (this.socket) {
      this.socket.emit('board:leave', boardId);
    }
  }

  // --- Event Listeners ---
  // We'll pass the store actions as callbacks
  
  listen(eventName: string, callback: (data: any) => void) {
    this.socket?.on(eventName, callback);
  }

  removeListener(eventName: string) {
    this.socket?.off(eventName);
  }
}

// Create a singleton instance
export const socketService = new SocketService();