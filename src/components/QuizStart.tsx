import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Palette, FileCode2, Atom, Zap, CheckCircle, BookOpen, User, Globe, Bot, RefreshCw, LogIn, ShieldCheck } from 'lucide-react';
import { FRONTEND_CATEGORIES } from '../data/frontendQuestions';
import { Question, QuizSettings, Difficulty } from '../types/quiz';
import { fetchQuestionsFromRestApi } from '../services/restApiService';
import { sound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';

interface QuizStartProps {
  allQuestions: Question[];
  onStartQuiz: (settings: QuizSettings) => void;
  onOpenAIGenerator: () => void;
  onAddQuestions: (questions: Question[]) => void;
}

export const QuizStart: React.FC<QuizStartProps> = ({
  allQuestions = [],
  onStartQuiz,
  onOpenAIGenerator,
  onAddQuestions
}) => {
  const { user, openAuthModal } = useAuth();
  const [playerName, setPlayerName] = useState<string>(() => {
    return user?.displayName || localStorage.getItem('frontend_quiz_player_name') || 'Frontend Ninja';
  });

  useEffect(() => {
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);
  const [isLoadingRest, setIsLoadingRest] = useState<boolean>(false);
  const [restStatus, setRestStatus] = useState<string | null>(null);

  // Icon resolver
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Palette': return <Palette size={20} />;
      case 'FileCode2': return <FileCode2 size={20} />;
      case 'Atom': return <Atom size={20} />;
      case 'Zap': return <Zap size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  // Filter count preview
  const availableQuestions = allQuestions.filter(q => {
    const matchCat = selectedCategory === 'all' || q.category === selectedCategory;
    const matchDiff = difficulty === 'all' || q.difficulty.toLowerCase() === difficulty.toLowerCase();
    return matchCat && matchDiff;
  });

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    localStorage.setItem('frontend_quiz_player_name', playerName.trim() || 'Frontend Ninja');

    onStartQuiz({
      playerName: playerName.trim() || 'Frontend Ninja',
      category: selectedCategory,
      difficulty,
      questionCount: Math.min(questionCount, availableQuestions.length),
      timerEnabled,
      instantFeedback
    });
  };

  // Fetch live questions from REST API
  const handleFetchRestApi = async () => {
    setIsLoadingRest(true);
    setRestStatus(null);
    try {
      const restQuestions = await fetchQuestionsFromRestApi(5, difficulty);
      sound.playCorrect();
      onAddQuestions(restQuestions);
      setRestStatus(`Berhasil memuat ${restQuestions.length} soal baru via REST API Open Trivia!`);
      setTimeout(() => setRestStatus(null), 4000);
    } catch (err: any) {
      sound.playWrong();
      setRestStatus(`Gagal memuat REST API: ${err.message || 'Coba lagi'}`);
    } finally {
      setIsLoadingRest(false);
    }
  };

  return (
    <div className="quiz-start-container">
      {/* Hero Banner */}
      <div className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} className="text-amber-400" />
          <span>Full-Stack Tech: ReactJS • TypeScript • Firebase • REST API • LLM</span>
        </div>
        <h2 className="hero-title">
          Tantang Pemahaman <span className="text-gradient">Front-End</span> Anda!
        </h2>
        <p className="hero-desc">
          Platform kuis interaktif dengan evaluasi otomatis, integrasi Cloud Firestore, pengambil soal REST API, dan Generator Soal AI berbasis Large Language Model.
        </p>

        {/* Integration Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            type="button"
            className="chip-btn flex items-center gap-1.5"
            style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', color: '#a5b4fc' }}
            onClick={onOpenAIGenerator}
          >
            <Bot size={15} />
            <span>🤖 Buat Soal Topik Bebas dengan AI</span>
          </button>

          <button
            type="button"
            className="chip-btn flex items-center gap-1.5"
            style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#6ee7b7' }}
            onClick={handleFetchRestApi}
            disabled={isLoadingRest}
          >
            {isLoadingRest ? <RefreshCw className="animate-spin" size={15} /> : <Globe size={15} />}
            <span>🌐 Tarik Soal dari REST API (Open Trivia)</span>
          </button>
        </div>

        {restStatus && (
          <div className="alert-banner success mx-auto mt-3 max-w-2xl text-xs py-2">
            <span>{restStatus}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleStart} className="start-card">
        {/* Player Name */}
        <div className="form-group mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 font-semibold text-slate-200 mb-0">
              <User size={18} className="text-indigo-400" />
              Nama Pemain / Developer Handle
            </label>
            {user ? (
              <span className="text-xs text-indigo-300 flex items-center gap-1 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                <ShieldCheck size={13} className="text-emerald-400" />
                Terhubung: {user.displayName}
              </span>
            ) : (
              <button
                type="button"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
                onClick={() => openAuthModal('login')}
              >
                <LogIn size={13} />
                Sudah punya akun? Masuk
              </button>
            )}
          </div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Masukkan nama untuk papan peringkat..."
            className="form-input text-base"
            required
          />
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-3 font-semibold text-slate-200">
            <BookOpen size={18} className="text-indigo-400" />
            Pilih Kategori Materi
          </label>
          <div className="categories-grid">
            {FRONTEND_CATEGORIES.map(cat => {
              const count = allQuestions.filter(q => cat.id === 'all' || q.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat.id);
                  }}
                >
                  <div className="cat-icon-box" style={{ color: cat.color }}>
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <div className="cat-info">
                    <div className="cat-name">{cat.name}</div>
                    <div className="cat-count">{count} soal tersedia</div>
                  </div>
                  {isSelected && <CheckCircle className="check-icon" size={18} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Difficulty */}
          <div className="form-group">
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Tingkat Kesulitan
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="form-select"
            >
              <option value="all">Semua Tingkat</option>
              <option value="Beginner">Beginner (Pemula)</option>
              <option value="Intermediate">Intermediate (Menengah)</option>
              <option value="Advanced">Advanced (Mahir)</option>
            </select>
          </div>

          {/* Question Limit */}
          <div className="form-group">
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Jumlah Pertanyaan
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="form-select"
            >
              <option value={5}>5 Pertanyaan (Cepat)</option>
              <option value={10}>10 Pertanyaan (Standar)</option>
              <option value={999}>Semua Soal yang Cocok</option>
            </select>
          </div>

          {/* Timer Toggle */}
          <div className="form-group">
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Timer Per Soal
            </label>
            <select
              value={timerEnabled ? 'yes' : 'no'}
              onChange={(e) => setTimerEnabled(e.target.value === 'yes')}
              className="form-select"
            >
              <option value="yes">⏱️ Aktif (30 Detik)</option>
              <option value="no">☕ Santai (Tanpa Batas)</option>
            </select>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="quiz-mode-pill mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={instantFeedback}
              onChange={(e) => setInstantFeedback(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded"
            />
            <span className="text-sm text-slate-300">
              Tampilkan pembahasan jawaban langsung setelah menjawab tiap soal
            </span>
          </label>
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={availableQuestions.length === 0}
          className="btn-start-quiz"
        >
          <Play size={22} fill="currentColor" />
          <span>
            Mulai Kuis ({Math.min(questionCount, availableQuestions.length)} dari {availableQuestions.length} Soal)
          </span>
        </button>
      </form>
    </div>
  );
};
