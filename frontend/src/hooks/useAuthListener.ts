import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

/**
 * Subscribes to Firebase auth state. This is the single source of truth for
 * whether someone is logged in and it survives page refreshes automatically.
 *
 * When a Firebase user is present we fetch our local profile (`/api/auth/me`),
 * which also upserts the user into Postgres (syncUser on the backend).
 */
export const useAuthListener = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (res?.success && res.data) {
          setUser(res.data);
        } else {
          // Fall back to the Firebase identity if the profile fetch fails.
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            username: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'user',
            avatar_color: '#3B82F6',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          username: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'user',
          avatar_color: '#3B82F6',
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setUser, setLoading]);
};
