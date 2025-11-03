import create from 'zustand'
import { persist } from 'zustand/middleware'

// Define the shape of the user object
interface User {
  id: number
  username: string
  email: string
  avatar_color: string
}

// Define the state shape
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User, token: string) => void
  logout: () => void
}

// Create the store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Action: Set user and token (on login/register)
      setUser: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      // Action: Clear user and token (on logout)
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'auth-storage', // Key for localStorage
    }
  )
)