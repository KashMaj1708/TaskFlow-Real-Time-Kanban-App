import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // This is the default client URL from your .env
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend server
        changeOrigin: true,
      },
      // We also proxy the socket.io connection
      '/socket.io': {
        target: 'ws://localhost:5000', // Your backend socket server
        ws: true,
      }
    }
  }
})