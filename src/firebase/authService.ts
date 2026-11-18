import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseOnline } from './config';
import { AppUser } from '../types/auth';

const STORAGE_AUTH_USER = 'frontend_quiz_current_user';
const STORAGE_LOCAL_USERS = 'frontend_quiz_registered_users';

interface LocalUserRecord {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
}

// Translate Firebase Auth error codes to friendly Indonesian messages
export const getFriendlyAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan. Silakan daftar terlebih dahulu.';
    case 'auth/wrong-password':
      return 'Kata sandi yang Anda masukkan salah. Silakan coba lagi.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
    case 'auth/popup-closed-by-user':
      return 'Jendela popup Google ditutup sebelum proses login selesai.';
    case 'auth/popup-blocked':
      return 'Popup browser diblokir. Izinkan popup untuk login dengan Google.';
    case 'auth/operation-not-allowed':
      return 'Metode autentikasi ini belum diaktifkan di Firebase Console.';
    case 'auth/network-request-failed':
      return 'Koneksi jaringan terputus. Beralih ke autentikasi lokal.';
    default:
      return message || 'Terjadi kesalahan pada proses autentikasi. Silakan coba lagi.';
  }
};

// Map Firebase User to AppUser
const mapFirebaseUser = (user: FirebaseUser): AppUser => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.isAnonymous ? 'Pengguna Tamu' : (user.email ? user.email.split('@')[0] : 'Ninja Developer')),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    provider: user.isAnonymous ? 'guest' : 'firebase',
    createdAt: user.metadata?.creationTime
  };
};

// Get stored local user accounts
const getLocalUsers = (): LocalUserRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_LOCAL_USERS) || '[]');
  } catch {
    return [];
  }
};

// Simple reversible obfuscation for local offline mock passwords
const simpleHash = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return str;
  }
};

// Save user to localStorage
export const saveCurrentSessionUser = (user: AppUser | null) => {
  if (user) {
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_AUTH_USER);
  }
};

// Get active session user
export const getActiveSessionUser = (): AppUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// 1. LOGIN WITH EMAIL & PASSWORD
export const loginWithEmail = async (email: string, password: string): Promise<AppUser> => {
  const trimmedEmail = email.trim().toLowerCase();

  // Try Firebase first if auth instance is available
  if (auth && isFirebaseOnline) {
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const appUser = mapFirebaseUser(cred.user);
      saveCurrentSessionUser(appUser);
      return appUser;
    } catch (err: any) {
      // If error is invalid credential or user not found, also check local storage before throwing
      if (err.code === 'auth/user-not-found' || err.code === 'auth/network-request-failed') {
        const localMatch = findAndValidateLocalUser(trimmedEmail, password);
        if (localMatch) {
          saveCurrentSessionUser(localMatch);
          return localMatch;
        }
      }
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  }

  // Fallback to local accounts
  const localUser = findAndValidateLocalUser(trimmedEmail, password);
  if (!localUser) {
    throw new Error('Email atau kata sandi tidak ditemukan pada penyimpanan lokal.');
  }
  saveCurrentSessionUser(localUser);
  return localUser;
};

// 2. REGISTER WITH EMAIL & PASSWORD
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<AppUser> => {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = displayName.trim() || trimmedEmail.split('@')[0];

  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error('Silakan masukkan format alamat email yang valid.');
  }
  if (!password || password.length < 6) {
    throw new Error('Kata sandi harus terdiri dari minimal 6 karakter.');
  }

  // Try Firebase first if auth instance is available
  if (auth && isFirebaseOnline) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      // Update display name
      if (trimmedName && cred.user) {
        await updateProfile(cred.user, { displayName: trimmedName });
      }
      const appUser = mapFirebaseUser(cred.user);
      appUser.displayName = trimmedName;
      saveCurrentSessionUser(appUser);

      // Also mirror to local registered users for offline resilience
      saveToLocalRegistry(trimmedEmail, password, trimmedName, cred.user.uid);
      return appUser;
    } catch (err: any) {
      // If Firebase failed due to network or rules, register locally
      if (err.code === 'auth/network-request-failed' || err.code === 'auth/operation-not-allowed') {
        console.warn('Firebase register gagal, menyimpan akun ke local store:', err.message);
        return registerLocally(trimmedEmail, password, trimmedName);
      }
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  }

  // Fallback local registration
  return registerLocally(trimmedEmail, password, trimmedName);
};

// 3. LOGIN WITH GOOGLE POPUP
export const loginWithGoogle = async (): Promise<AppUser> => {
  if (!auth || !isFirebaseOnline) {
    throw new Error('Login Google memerlukan koneksi Firebase Cloud aktif. Silakan gunakan Login Email atau Mode Tamu.');
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const appUser = mapFirebaseUser(cred.user);
    saveCurrentSessionUser(appUser);
    return appUser;
  } catch (err: any) {
    throw new Error(getFriendlyAuthErrorMessage(err));
  }
};

// 4. LOGIN AS GUEST (TAMU)
export const loginAsGuest = async (customName?: string): Promise<AppUser> => {
  const guestName = customName?.trim() || `Guest-${Math.floor(1000 + Math.random() * 9000)}`;

  if (auth && isFirebaseOnline) {
    try {
      const cred = await signInAnonymously(auth);
      if (customName) {
        await updateProfile(cred.user, { displayName: guestName });
      }
      const appUser = mapFirebaseUser(cred.user);
      appUser.displayName = guestName;
      appUser.provider = 'guest';
      saveCurrentSessionUser(appUser);
      return appUser;
    } catch (err) {
      console.warn('Anonymous firebase auth gagal, menggunakan sesi tamu lokal:', err);
    }
  }

  // Local Guest User
  const guestUser: AppUser = {
    uid: 'guest-' + Date.now(),
    email: null,
    displayName: guestName,
    photoURL: null,
    isAnonymous: true,
    provider: 'guest',
    createdAt: new Date().toISOString()
  };

  saveCurrentSessionUser(guestUser);
  return guestUser;
};

// 5. LOGOUT
export const logoutUser = async (): Promise<void> => {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  } finally {
    saveCurrentSessionUser(null);
  }
};

// 6. UPDATE PROFILE NAME
export const updateUserDisplayName = async (newName: string): Promise<AppUser> => {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Nama tampilan tidak boleh kosong.');

  if (auth && auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
    } catch (err) {
      console.warn('Update Firebase profile error:', err);
    }
  }

  const current = getActiveSessionUser();
  if (current) {
    current.displayName = trimmed;
    saveCurrentSessionUser(current);
    return current;
  }

  const fallback: AppUser = {
    uid: 'local-' + Date.now(),
    email: null,
    displayName: trimmed,
    photoURL: null,
    isAnonymous: false,
    provider: 'local'
  };
  saveCurrentSessionUser(fallback);
  return fallback;
};

// 7. LISTEN TO AUTH STATE CHANGES
export const subscribeToAuth = (onUserChanged: (user: AppUser | null) => void): (() => void) => {
  if (auth && isFirebaseOnline) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser = mapFirebaseUser(firebaseUser);
        saveCurrentSessionUser(appUser);
        onUserChanged(appUser);
      } else {
        // Check if there is a local session user
        const local = getActiveSessionUser();
        if (local && local.provider !== 'firebase') {
          onUserChanged(local);
        } else {
          saveCurrentSessionUser(null);
          onUserChanged(null);
        }
      }
    });
  }

  // In offline/local mode, simply notify with local stored user
  const stored = getActiveSessionUser();
  onUserChanged(stored);
  return () => {};
};

// Helpers for Local Registry
function findAndValidateLocalUser(email: string, password: string): AppUser | null {
  const users = getLocalUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found && found.passwordHash === simpleHash(password)) {
    return {
      uid: found.uid,
      email: found.email,
      displayName: found.displayName,
      photoURL: null,
      isAnonymous: false,
      provider: 'local',
      createdAt: found.createdAt
    };
  }
  return null;
}

function saveToLocalRegistry(email: string, password: string, displayName: string, uid?: string) {
  try {
    const users = getLocalUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    const record: LocalUserRecord = {
      uid: uid || 'user-' + Date.now(),
      email,
      passwordHash: simpleHash(password),
      displayName,
      createdAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      users[existingIndex] = record;
    } else {
      users.push(record);
    }
    localStorage.setItem(STORAGE_LOCAL_USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('Gagal menyimpan ke local registry:', e);
  }
}

function registerLocally(email: string, password: string, displayName: string): AppUser {
  const users = getLocalUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error('Email ini sudah terdaftar di penyimpanan lokal. Silakan gunakan menu Masuk.');
  }

  const uid = 'local-' + Date.now();
  saveToLocalRegistry(email, password, displayName, uid);

  const newUser: AppUser = {
    uid,
    email,
    displayName,
    photoURL: null,
    isAnonymous: false,
    provider: 'local',
    createdAt: new Date().toISOString()
  };

  saveCurrentSessionUser(newUser);
  return newUser;
}
