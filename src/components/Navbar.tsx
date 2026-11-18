import React from 'react';
import { Volume2, VolumeX, Trophy, PlusCircle, Settings, Flame, Layers, Bot, LogIn, User } from 'lucide-react';
import { sound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  firebaseOnline: boolean;
  onOpenLeaderboard: () => void;
  onOpenAddQuestion: () => void;
  onOpenAIGenerator: () => void;
  onOpenConfig: () => void;
  currentStreak?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  muted,
  setMuted,
  firebaseOnline,
  onOpenLeaderboard,
  onOpenAddQuestion,
  onOpenAIGenerator,
  onOpenConfig,
  currentStreak = 0
}) => {
  const { user, openAuthModal, openProfileModal } = useAuth();

  const handleToggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
    if (!isMuted) {
      sound.playClick();
    }
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon-wrapper">
            <Layers className="brand-icon" size={24} />
          </div>
          <div>
            <h1 className="brand-title">DevQuiz <span className="brand-accent">Front-End</span></h1>
            <p className="brand-subtitle">ReactJS • TypeScript • Firebase • REST API • LLM</p>
          </div>
        </div>

        {/* Center / Stats */}
        <div className="navbar-stats">
          {currentStreak > 1 && (
            <div className="streak-badge animate-pulse">
              <Flame size={16} className="text-orange-500" />
              <span>{currentStreak}x Streak!</span>
            </div>
          )}

          <div
            className={`firebase-status-pill ${firebaseOnline ? 'online' : 'offline'}`}
            onClick={onOpenConfig}
            title="Klik untuk konfigurasi Firebase & LLM"
          >
            <span className="status-dot"></span>
            <span className="status-text">
              {firebaseOnline ? 'Firebase Cloud' : 'Offline / Local'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* AI Generator Button */}
          <button
            className="nav-btn"
            style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))', borderColor: 'rgba(99, 102, 241, 0.4)' }}
            onClick={onOpenAIGenerator}
            title="Generate Kuis Menggunakan AI Large Language Model"
          >
            <Bot size={17} className="text-indigo-400" />
            <span className="btn-label font-bold text-indigo-300">AI Generator</span>
          </button>

          <button
            className="nav-btn"
            onClick={onOpenLeaderboard}
            title="Papan Peringkat (Leaderboard)"
          >
            <Trophy size={17} />
            <span className="btn-label">Peringkat</span>
          </button>

          <button
            className="nav-btn"
            onClick={onOpenAddQuestion}
            title="Tambah Pertanyaan Kuis Baru Manual"
          >
            <PlusCircle size={17} />
            <span className="btn-label">Buat Soal</span>
          </button>

          <button
            className="nav-icon-btn"
            onClick={handleToggleSound}
            title={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>

          <button
            className="nav-icon-btn"
            onClick={onOpenConfig}
            title="Pengaturan Firebase & LLM"
          >
            <Settings size={19} />
          </button>

          {/* User Auth Profile Button */}
          {user ? (
            <button
              className="nav-user-pill"
              onClick={openProfileModal}
              title={`Akun: ${user.displayName} (Klik untuk buka profil)`}
            >
              <div className="nav-user-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <span className="nav-user-name">{user.displayName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              className="nav-btn nav-btn-auth"
              onClick={() => openAuthModal('login')}
              title="Masuk atau Daftar Akun"
            >
              <LogIn size={16} className="text-indigo-400" />
              <span className="btn-label font-semibold text-indigo-300">Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
