import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
    loginGoogle,
    loginGuest,
    error,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync mode with parent prop when modal opens
  React.useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setValidationError(null);
      clearError();
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleTabChange = (newMode: 'login' | 'register') => {
    sound.playClick();
    setMode(newMode);
    setValidationError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setValidationError(null);
    clearError();

    if (!email.trim()) {
      setValidationError('Silakan masukkan alamat email Anda.');
      sound.playWrong();
      return;
    }

    if (!password) {
      setValidationError('Silakan masukkan kata sandi Anda.');
      sound.playWrong();
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setValidationError('Kata sandi harus minimal 6 karakter.');
        sound.playWrong();
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Konfirmasi kata sandi tidak cocok.');
        sound.playWrong();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      sound.playCorrect();
    } catch (err: any) {
      sound.playWrong();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    sound.playClick();
    setValidationError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await loginGoogle();
      sound.playCorrect();
    } catch (err: any) {
      sound.playWrong();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    sound.playClick();
    setValidationError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await loginGuest();
      sound.playCorrect();
    } catch (err: any) {
      sound.playWrong();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    sound.playClick();
    setEmail('demo.developer@frontendquiz.dev');
    setPassword('demo12345');
    setValidationError(null);
    clearError();
  };

  const activeError = validationError || error;

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-content auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="auth-icon-badge">
              {mode === 'login' ? <LogIn size={20} className="text-indigo-400" /> : <UserPlus size={20} className="text-pink-400" />}
            </div>
            <div>
              <h2 className="modal-title">
                {mode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun DevQuiz'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Akses rekor kuis, papan peringkat, dan generator soal AI'
                  : 'Daftar sekarang untuk menyimpan skor dan pencapaian Anda'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={closeAuthModal} title="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="modal-tabs">
          <button
            className={`tab-btn flex-1 text-center ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            <LogIn size={15} className="inline mr-2" />
            Masuk
          </button>
          <button
            className={`tab-btn flex-1 text-center ${mode === 'register' ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
          >
            <UserPlus size={15} className="inline mr-2" />
            Daftar Akun
          </button>
        </div>

        <div className="modal-body p-6">
          {/* Error Message */}
          {activeError && (
            <div className="auth-alert-box error animate-fadeIn mb-4">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-400" />
              <div className="text-sm text-red-200">{activeError}</div>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            className="auth-google-btn mb-4"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Lanjut dengan Akun Google</span>
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span>atau dengan email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="form-group">
                <label>Nama Lengkap / Username</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-input with-icon"
                    placeholder="Contoh: Alex Frontend Ninja"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Alamat Email</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-input with-icon"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="mb-0">Kata Sandi</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    onClick={handleFillDemo}
                  >
                    ✨ Pakai Akun Demo
                  </button>
                )}
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-icon pr-10"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Konfirmasi Kata Sandi</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input with-icon"
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="submit-btn w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="auth-spinner"></div>
                  <span>Memproses...</span>
                </div>
              ) : mode === 'login' ? (
                <div className="flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  <span>Masuk Sekarang</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus size={18} />
                  <span>Daftar Akun Baru</span>
                </div>
              )}
            </button>
          </form>

          {/* Guest Mode Alternative */}
          <div className="auth-footer-prompt mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              className="guest-login-btn text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Hanya ingin mencoba? <strong>Masuk sebagai Tamu</strong></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
