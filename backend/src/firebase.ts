import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

/**
 * Loads the Firebase service account credentials.
 *
 * Two supported sources (in priority order):
 *   1. FIREBASE_SERVICE_ACCOUNT_B64 - the service account JSON, base64 encoded.
 *      This is the recommended option for hosted environments (Render, etc.)
 *      where you cannot ship a JSON file.
 *   2. FIREBASE_SERVICE_ACCOUNT_PATH - a filesystem path to the service account
 *      JSON file. Handy for local development.
 */
function loadServiceAccount(): ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    const json = Buffer.from(b64, 'base64').toString('utf-8');
    return JSON.parse(json);
  }

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path) {
    const json = fs.readFileSync(path, 'utf-8');
    return JSON.parse(json);
  }

  throw new Error(
    'Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT_B64 ' +
      '(base64-encoded service account JSON) or FIREBASE_SERVICE_ACCOUNT_PATH ' +
      '(path to the service account JSON file) in your backend .env.'
  );
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(loadServiceAccount()) });

export const auth = getAuth(app);
export default app;
