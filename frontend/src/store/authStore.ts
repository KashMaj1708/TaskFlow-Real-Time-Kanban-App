import create from 'zustand'

// User profile mirrored from our backend (`/api/auth/me`). `id` is the Firebase
// UID (a string).
interface User {
  id: string
  username: string
  email: string
  avatar_color: string
}

interface AuthState {
  user: User | null
  // True until Firebase's onAuthStateChanged has fired at least once. Used to
  // avoid redirecting to /login before we know whether a session exists.
  loading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setLoading: (loading) => set({ loading }),

  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}))
