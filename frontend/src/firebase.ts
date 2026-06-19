import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Config is read from Vite env vars (VITE_FIREBASE_*). The literal values are
// kept as a fallback so the app still runs if .env.local is missing - these are
// public client identifiers, not secrets.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCQQuLsag7KxsMEh_MlPcqHm19UiqnX6B0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'taskflow-c5c95.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'taskflow-c5c95',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'taskflow-c5c95.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '605492214439',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:605492214439:web:4a39d2444b23b52e2bb982',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
