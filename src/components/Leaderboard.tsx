import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Clock, Flame, RefreshCw, UserCheck } from 'lucide-react';
import { fetchLeaderboard } from '../firebase/quizService';
import { FRONTEND_CATEGORIES } from '../data/frontendQuestions';
import { LeaderboardEntry } from '../types/quiz';
import { useAuth } from '../context/AuthContext';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [source, setSource] = useState<string>('loading');
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchLeaderboard();
      setLeaderboardData(result.data || []);
      setSource(result.source);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = filterCategory === 'all'
    ? leaderboardData
    : leaderboardData.filter(item => item.category === filterCategory);

  const getRankBadge = (index: number) => {
    if (index === 0) return <div className="rank-badge gold"><Trophy size={16} /> 1</div>;
    if (index === 1) return <div className="rank-badge silver"><Medal size={16} /> 2</div>;
    if (index === 2) return <div className="rank-badge bronze"><Medal size={16} /> 3</div>;
    return <div className="rank-badge default">{index + 1}</div>;
  };

  const getCategoryName = (catId: string) => {
    const found = FRONTEND_CATEGORIES.find(c => c.id === catId);
    return found ? found.name : 'Semua';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            <div>
              <h2 className="modal-title">Papan Peringkat (Leaderboard)</h2>
              <p className="text-xs text-slate-400">
                {source === 'firebase' ? '🌐 Sinkronisasi Cloud Firestore Aktif' : '💾 Penyimpanan Cache Lokal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="nav-icon-btn" onClick={loadData} title="Muat Ulang Data">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="category-chips-bar">
          <button
            className={`chip-btn ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Semua
          </button>
          {FRONTEND_CATEGORIES.filter(c => c.id !== 'all').map(c => (
            <button
              key={c.id}
              className={`chip-btn ${filterCategory === c.id ? 'active' : ''}`}
              onClick={() => setFilterCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="modal-body modal-scroll-area">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto mb-2 text-indigo-400" size={28} />
              <p>Memuat daftar peringkat...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Trophy className="mx-auto mb-2 text-slate-500" size={36} />
              <p className="font-medium text-slate-300">Belum ada skor kuis tercatat.</p>
              <p className="text-xs text-slate-500 mt-1">Selesaikan kuis pertamamu untuk masuk ke papan peringkat!</p>
            </div>
          ) : (
            <div className="leaderboard-table">
              {filtered.map((item, index) => {
                const isCurrentUser = Boolean(
                  user && (
                    (item.userId && item.userId === user.uid) ||
                    (!item.userId && item.playerName.toLowerCase() === user.displayName.toLowerCase())
                  )
                );

                return (
                  <div key={item.id || index} className={`leaderboard-row ${isCurrentUser ? 'current-user-highlight' : ''}`}>
                    <div className="flex items-center gap-3">
                      {getRankBadge(index)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{item.playerName}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-indigo-600/50 text-indigo-200 px-1.5 py-0.5 rounded-full border border-indigo-500/40">
                              Anda
                            </span>
                          )}
                          {item.streak > 1 && (
                            <span className="text-xs text-orange-400 flex items-center gap-0.5">
                              <Flame size={12} /> {item.streak}x
                            </span>
                          )}
                        </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="badge-tag">{getCategoryName(item.category)}</span>
                        {item.timeSpentSeconds > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {item.timeSpentSeconds}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-400">
                      {item.percentage}%
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.score} / {item.totalQuestions} Benar
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p className="text-xs text-slate-400">Menampilkan peringkat teratas berdasar akurasi jawaban.</p>
          <button className="btn-outline" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
