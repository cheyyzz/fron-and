import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser } from '../types/auth';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginAsGuest,
  logoutUser,
  updateUserDisplayName,
  subscribeToAuth,
  getActiveSessionUser
} from '../firebase/authService';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  isProfileModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginGuest: (name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => getActiveSessionUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setError(null);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const clearError = () => setError(null);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await loginWithEmail(email, pass);
      setUser(loggedUser);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal login.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const registered = await registerWithEmail(email, pass, name);
      setUser(registered);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal registrasi.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const googleUser = await loginWithGoogle();
      setUser(googleUser);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginGuest = async (name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const guest = await loginAsGuest(name);
      setUser(guest);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal login tamu.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setIsProfileModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal logout.');
    } finally {
      setLoading(false);
    }
  };

  const updateName = async (name: string) => {
    try {
      const updated = await updateUserDisplayName(name);
      setUser({ ...updated });
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui nama.');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthModalOpen,
        authModalMode,
        isProfileModalOpen,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        login,
        register,
        loginGoogle,
        loginGuest,
        logout,
        updateName,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
