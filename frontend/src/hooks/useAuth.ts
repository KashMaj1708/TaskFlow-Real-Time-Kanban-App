import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, loading } = useAuthStore();

  // Signing out of Firebase triggers onAuthStateChanged, which clears the store
  // (see useAuthListener). Components just call this.
  const logout = () => signOut(auth);

  return {
    user,
    isAuthenticated,
    loading,
    logout,
  };
};
