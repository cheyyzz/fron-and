import React, { useState, useEffect } from 'react';
import { X, User, Mail, ShieldCheck, Trophy, Target, Clock, LogOut, Check, Edit2, History, Flame, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchUserQuizHistory } from '../firebase/quizService';
import { LeaderboardEntry } from '../types/quiz';
import { FRONTEND_CATEGORIES } from '../data/frontendQuestions';
import { sound } from '../utils/sound';

export const UserProfileModal: React.FC = () => {
  const { user, isProfileModalOpen, closeProfileModal, logout, updateName } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [history, setHistory] = useState<LeaderboardEntry[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user && isProfileModalOpen) {
      setNameInput(user.displayName);
      const userHistory = fetchUserQuizHistory(user.uid, user.displayName);
      setHistory(userHistory);
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    sound.playClick();
    try {
      await updateName(nameInput.trim());
      setIsEditingName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      sound.playCorrect();
    } catch {
      sound.playWrong();
    }
  };

  const handleLogout = async () => {
    sound.playClick();
    await logout();
  };

  // Stats calculation
  const totalGames = history.length;
  const bestScore = history.reduce((max, h) => Math.max(max, h.percentage || 0), 0);
  const avgScore = totalGames > 0
    ? Math.round(history.reduce((sum, h) => sum + (h.percentage || 0), 0) / totalGames)
    : 0;
  const totalTimeSecs = history.reduce((sum, h) => sum + (h.timeSpentSeconds || 0), 0);

  const formatTotalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins === 0) return `${remainingSecs}d`;
    return `${mins}m ${remainingSecs}d`;
  };

  const getCategoryName = (catId: string) => {
    const found = FRONTEND_CATEGORIES.find(c => c.id === catId);
    return found ? found.name : (catId === 'all' ? 'Semua Topik' : catId);
  };

  // Generate initials
  const initials = user.displayName
    ? user.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="modal-overlay" onClick={closeProfileModal}>
      <div className="modal-content profile-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="auth-icon-badge">
              <User size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="modal-title">Profil Pengguna</h2>
              <p className="text-xs text-slate-400">Statistik dan riwayat aktivitas kuis Anda</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={closeProfileModal} title="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body p-6 space-y-6">
          {/* User Card */}
          <div className="profile-hero-card">
            <div className="flex items-center gap-4">
              <div className="profile-large-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="profile-avatar-initials">{initials}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      className="form-input py-1 px-3 text-sm"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      autoFocus
                    />
                    <button className="action-btn-small success" onClick={handleSaveName} title="Simpan Nama">
                      <Check size={16} />
                    </button>
                    <button className="action-btn-small" onClick={() => setIsEditingName(false)} title="Batal">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="profile-display-name truncate">{user.displayName}</h3>
                    <button
                      className="text-slate-400 hover:text-indigo-400 transition-colors p-1"
                      onClick={() => setIsEditingName(true)}
                      title="Ubah Nama Tampilan"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {user.email ? (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail size={12} /> {user.email}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400">Mode Tamu (Tanpa Email)</span>
                  )}

                  <span className={`provider-pill ${user.provider}`}>
                    <ShieldCheck size={12} />
                    {user.provider === 'firebase'
                      ? (user.photoURL ? 'Google Account' : 'Firebase Verified')
                      : user.provider === 'local'
                        ? 'Akun Lokal'
                        : 'Tamu'}
                  </span>
                </div>

                {saveSuccess && (
                  <p className="text-xs text-emerald-400 mt-1">✓ Nama berhasil diperbarui!</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-card-mini">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                <Award size={14} /> Kuis Selesai
              </div>
              <div className="text-xl font-bold text-white">{totalGames}</div>
            </div>

            <div className="stat-card-mini">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <Trophy size={14} /> Skor Terbaik
              </div>
              <div className="text-xl font-bold text-white">{bestScore}%</div>
            </div>

            <div className="stat-card-mini">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <Target size={14} /> Rata-Rata
              </div>
              <div className="text-xl font-bold text-white">{avgScore}%</div>
            </div>

            <div className="stat-card-mini">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-1">
                <Clock size={14} /> Total Waktu
              </div>
              <div className="text-xl font-bold text-white">{formatTotalTime(totalTimeSecs)}</div>
            </div>
          </div>

          {/* History Section */}
          <div className="history-section">
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
              <History size={16} className="text-indigo-400" />
              Riwayat Kuis Anda ({history.length})
            </h4>

            {history.length === 0 ? (
              <div className="history-empty-box">
                <p className="text-sm text-slate-400">Belum ada riwayat kuis tersimpan untuk akun ini.</p>
                <p className="text-xs text-slate-500 mt-1">Mainkan kuis sekarang untuk melihat rekam jejak progres Anda di sini!</p>
              </div>
            ) : (
              <div className="history-list space-y-2 max-h-60 overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div key={item.id || idx} className="history-item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="history-category-badge">
                          {getCategoryName(item.category)}
                        </span>
                        {item.streak > 1 && (
                          <span className="text-xs text-orange-400 flex items-center gap-0.5">
                            <Flame size={12} /> {item.streak}x
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${item.percentage >= 70 ? 'text-emerald-400' : item.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {item.score}/{item.totalQuestions} ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                      <span>Waktu: {item.timeSpentSeconds} detik</span>
                      <span>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Keluar dari Akun</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={closeProfileModal}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
