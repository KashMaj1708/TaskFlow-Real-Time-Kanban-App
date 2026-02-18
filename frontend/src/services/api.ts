import { useAuthStore } from '../store/authStore'; // Keep this, it's fine

// Get the API base URL (fallback for local dev when .env is missing)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to get the token from the Zustand persisted store (localStorage)
const getAuthToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return null;
    const parsed = JSON.parse(authStorage);
    // Zustand persist can store as { state: {...} } or sometimes just the state
    const token = parsed?.state?.token ?? parsed?.token ?? null;
    return token && typeof token === 'string' ? token : null;
  } catch {
    return null;
  }
};

// Base function for fetch with auth
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken(); // This now reads from localStorage
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

  // If unauthorized, clear auth so user is sent to login (fixes stale/missing token)
  if (response.status === 401) {
    useAuthStore.getState().logout();
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

// Our new API client object
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