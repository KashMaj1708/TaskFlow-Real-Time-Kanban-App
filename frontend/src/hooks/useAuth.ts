import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, setUser, logout } = useAuthStore();

  // You can add more complex logic here later, e.g., auto-logout on token expiry
  
  return {
    user,
    token,
    isAuthenticated,
    setUser,
    logout,
  };
};