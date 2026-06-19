import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthStore } from '../store/authStore';

// Get the API base URL (fallback for local dev when .env is missing)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get a fresh Firebase ID token. getIdToken() automatically refreshes the token
// if it has expired (Firebase ID tokens last 1 hour), so we call it per request
// rather than caching.
const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
};

// Base function for fetch with auth
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {
    'Content-Type': 'application/json',
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Create the full, absolute URL
  const fullUrl = `${API_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // If unauthorized, sign out so the user is sent to login
  if (response.status === 401) {
    await signOut(auth).catch(() => {});
    useAuthStore.getState().reset();
    window.location.href = '/login';
    return Promise.reject(new Error('Unauthorized'));
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  if (response.ok) {
    return { success: true, status: response.status };
  }
  return response.json();
};

// Our API client object
export const api = {
  get: async (url: string) => {
    return fetchWithAuth(url, { method: 'GET' });
  },

  post: async (url: string, body: unknown) => {
    return fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put: async (url: string, body: unknown) => {
    return fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete: async (url: string) => {
    return fetchWithAuth(url, { method: 'DELETE' });
  },
};
