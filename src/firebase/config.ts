import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { FirebaseConfigObject } from '../types/quiz';

// Helper to retrieve config from localStorage or Vite environment variables
export const getActiveFirebaseConfig = (): { config: FirebaseConfigObject; source: 'localStorage' | 'env' | 'unconfigured' } => {
  try {
    const saved = localStorage.getItem('frontend_quiz_firebase_config');
    if (saved) {
      const parsed: FirebaseConfigObject = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return { config: parsed, source: 'localStorage' };
      }
    }
  } catch (e) {
    console.warn('Gagal membaca konfigurasi Firebase dari localStorage:', e);
  }

  const envConfig: FirebaseConfigObject = {
    apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
    authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || ''
  };

  const isConfigured = Boolean(
    envConfig.apiKey &&
    envConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    envConfig.projectId &&
    envConfig.projectId !== 'your-project-id'
  );

  return {
    config: envConfig,
    source: isConfigured ? 'env' : 'unconfigured'
  };
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isFirebaseOnline: boolean = false;
let connectionStatusMessage: string = 'Local Fallback Mode';

export const initFirebase = () => {
  const { config, source } = getActiveFirebaseConfig();

  if (source === 'unconfigured') {
    isFirebaseOnline = false;
    connectionStatusMessage = 'Mode Offline (Local Storage)';
    return { app: null, db: null, auth: null, isFirebaseOnline, connectionStatusMessage };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config as any);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);

    // Try signing in anonymously so Firestore security rules allow read/write
    signInAnonymously(auth).catch((err) => {
      console.warn('Anonymous auth notice (Firestore tetap dapat bekerja jika rules diset publik):', err.message);
    });

    isFirebaseOnline = true;
    connectionStatusMessage = `Terhubung ke Firebase (${config.projectId})`;
  } catch (err: any) {
    console.error('Inisialisasi Firebase gagal, beralih ke Local Storage:', err);
    isFirebaseOnline = false;
    connectionStatusMessage = `Error Firebase: ${err.message || 'Koneksi gagal'}`;
  }

  return { app, db, auth, isFirebaseOnline, connectionStatusMessage };
};

// Initial run
const initialInit = initFirebase();
app = initialInit.app;
db = initialInit.db;
auth = initialInit.auth;
isFirebaseOnline = initialInit.isFirebaseOnline;
connectionStatusMessage = initialInit.connectionStatusMessage;

export { app, db, auth, isFirebaseOnline, connectionStatusMessage };
