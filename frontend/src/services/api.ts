import { useAuthStore } from '../store/authStore'; // Keep this, it's fine

// Get the API base URL from your Vercel environment variables
const API_URL = import.meta.env.VITE_API_URL;

// Helper to get the token from the Zustand store
const getAuthToken = () => {
  // --- THIS IS THE FIX ---
  // Read directly from localStorage to avoid the race condition
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authState = JSON.parse(authStorage);
    return authState.state.token; // Get the token from the persisted state
  }
  return null; // No token found
  // --- END FIX ---
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

  const response = await fetch(fullUrl, { // <-- Use fullUrl here
    ...options,
    headers,
  });

  // Handle case where response might be empty (e.g., DELETE)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  // For 200 OK on DELETE, just return a success object
  if (response.ok) {
    return { success: true, status: response.status };
  }
  return response.json(); // Let it return the error JSON
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