import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Flame,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Bot,
  RefreshCw,
  LogIn,
  UserCheck
} from 'lucide-react';
import { sound } from '../utils/sound';
import { saveQuizScore } from '../firebase/quizService';
import { getAIInDepthExplanation } from '../services/llmService';
import { QuizResultData, QuizSettings, UserAnswer } from '../types/quiz';
import { useAuth } from '../context/AuthContext';

interface QuizResultProps {
  resultData: QuizResultData;
  settings: QuizSettings;
  onPlayAgain: () => void;
  onRetryIncorrectOnly: (incorrectAnswers: UserAnswer[]) => void;
  onViewLeaderboard: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  resultData,
  settings,
  onPlayAgain,
  onRetryIncorrectOnly,
  onViewLeaderboard
}) => {
  const { user, openAuthModal } = useAuth();
  const [showReview, setShowReview] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ state: string; text: string }>({ state: 'syncing', text: 'Menyimpan skor...' });
  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string | number, string>>({});
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | number | null>(null);

  const { score, totalQuestions, answers, timeSpentSeconds, maxStreak } = resultData;
  const percentage = Math.round((score / (totalQuestions || 1)) * 100);
  const incorrectAnswers = answers.filter(a => !a.isCorrect);

  // Trigger fanfare and confetti on mount
  useEffect(() => {
    sound.playFanfare();

    if (percentage >= 60) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Save score to Firebase & Local
    const persistScore = async () => {
      try {
        const response = await saveQuizScore({
          userId: user?.uid,
          userPhoto: user?.photoURL,
          playerName: user?.displayName || settings.playerName,
          score,
          totalQuestions,
          category: settings.category,
          timeSpentSeconds,
          streak: maxStreak
        });

        if (response.syncedToFirebase) {
          setSyncStatus({ state: 'cloud', text: 'Skor tersinkron ke Firebase Cloud Firestore!' });
        } else {
          setSyncStatus({ state: 'local', text: 'Skor tersimpan di Local Storage.' });
        }
      } catch (err: any) {
        setSyncStatus({ state: 'error', text: 'Gagal sinkron cloud: ' + err.message });
      }
    };

    persistScore();
  }, [user]);

  const getRankAssessment = (pct: number) => {
    if (pct >= 90) return { title: 'Front-End Master 🏆', color: '#10b981', msg: 'Luar biasa! Pemahaman konsep front-end Anda sangat mendalam.' };
    if (pct >= 75) return { title: 'Senior Developer 🚀', color: '#6366f1', msg: 'Hebat! Anda menguasai sebagian besar materi modern front-end.' };
    if (pct >= 50) return { title: 'Mid-Level Coder 💻', color: '#f59e0b', msg: 'Bagus! Latihan lebih lanjut pada konsep closure dan hooks akan membawa Anda ke tingkat berikutnya.' };
    return { title: 'Junior Explorer 🌱', color: '#ec4899', msg: 'Awal yang baik! Pelajari kembali pembahasan di bawah untuk meningkatkan pemahaman Anda.' };
  };

  const assessment = getRankAssessment(percentage);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    if (mins > 0) return `${mins}m ${remaining}s`;
    return `${remaining} detik`;
  };

  const handleAskAIAboutQuestion = async (ans: UserAnswer) => {
    setLoadingAnalysisId(ans.questionId);
    sound.playClick();
    try {
      const exp = await getAIInDepthExplanation(
        ans.question,
        ans.code,
        ans.options,
        ans.correctIndex,
        ans.selectedIndex
      );
      setAiAnalysisMap(prev => ({ ...prev, [ans.questionId]: exp }));
    } catch (err: any) {
      setAiAnalysisMap(prev => ({ ...prev, [ans.questionId]: `Gagal memuat analisis AI: ${err.message}` }));
    } finally {
      setLoadingAnalysisId(null);
    }
  };

  return (
    <div className="quiz-result-container">
      {/* Result Card */}
      <div className="result-card">
        <div className="result-header">
          <div className="trophy-avatar" style={{ borderColor: assessment.color }}>
            <Trophy size={42} style={{ color: assessment.color }} />
          </div>

          <div className="rank-title" style={{ color: assessment.color }}>
            {assessment.title}
          </div>
          <h2 className="result-player-name">{settings.playerName}</h2>
          <p className="result-description">{assessment.msg}</p>
        </div>

        {/* Score Ring / Overview */}
        <div className="score-overview-grid">
          <div className="score-stat-box">
            <div className="stat-label">Akurasi</div>
            <div className="stat-number text-gradient">{percentage}%</div>
            <div className="stat-subtext">{score} dari {totalQuestions} benar</div>
          </div>

          <div className="score-stat-box">
            <div className="stat-label">Waktu</div>
            <div className="stat-number">{formatTime(timeSpentSeconds)}</div>
            <div className="stat-subtext">Total pengerjaan</div>
          </div>

          <div className="score-stat-box">
            <div className="stat-label">Rekor Streak</div>
            <div className="stat-number text-orange-400">
              <Flame size={20} className="inline mr-1" />
              {maxStreak}x
            </div>
            <div className="stat-subtext">Beruntun benar</div>
          </div>
        </div>

        {/* Sync Pill */}
        <div className="sync-pill-banner">
          <span>{syncStatus.text}</span>
        </div>

        {/* Guest prompt to save history permanently */}
        {!user && (
          <div className="guest-login-cta-banner">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-400" />
              <span className="text-xs text-slate-300">
                Ingin rekam jejak kuis ini tersimpan di akun Anda?
              </span>
            </div>
            <button
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              onClick={() => openAuthModal('register')}
            >
              <LogIn size={14} /> Daftar / Masuk
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="result-actions">
          <button className="btn-primary" onClick={onPlayAgain}>
            <RotateCcw size={18} />
            <span>Main Lagi</span>
          </button>

          {incorrectAnswers.length > 0 && (
            <button className="btn-warning" onClick={() => onRetryIncorrectOnly(incorrectAnswers)}>
              <span>Ulangi {incorrectAnswers.length} Soal Salah</span>
            </button>
          )}

          <button className="btn-outline" onClick={onViewLeaderboard}>
            <Trophy size={18} />
            <span>Lihat Papan Peringkat</span>
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="review-wrapper">
        <button
          className="review-toggle-btn"
          onClick={() => setShowReview(!showReview)}
        >
          <div className="flex items-center gap-2">
            <Award size={18} className="text-indigo-400" />
            <span className="font-semibold">Tinjau Detail Jawaban & Pembahasan ({answers.length} Soal)</span>
          </div>
          {showReview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showReview && (
          <div className="review-list">
            {answers.map((ans, idx) => (
              <div
                key={ans.questionId || idx}
                className={`review-item ${ans.isCorrect ? 'correct' : 'wrong'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="review-index">#{idx + 1}</span>
                    {ans.isCorrect ? (
                      <span className="badge-correct flex items-center gap-1">
                        <CheckCircle2 size={14} /> Benar
                      </span>
                    ) : (
                      <span className="badge-wrong flex items-center gap-1">
                        <XCircle size={14} /> {ans.timedOut ? 'Waktu Habis' : 'Salah'}
                      </span>
                    )}
                  </div>

                  {/* AI Analysis Button for this reviewed question */}
                  <button
                    type="button"
                    className="chip-btn flex items-center gap-1 text-xs"
                    style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: '#818cf8', color: '#c7d2fe' }}
                    onClick={() => handleAskAIAboutQuestion(ans)}
                    disabled={loadingAnalysisId === ans.questionId}
                  >
                    {loadingAnalysisId === ans.questionId ? (
                      <RefreshCw className="animate-spin" size={13} />
                    ) : (
                      <Bot size={13} />
                    )}
                    <span>Tanya AI Tutor</span>
                  </button>
                </div>

                <h4 className="review-question">{ans.question}</h4>

                {ans.code && (
                  <pre className="review-code">
                    <code>{ans.code}</code>
                  </pre>
                )}

                <div className="review-answers-grid">
                  {ans.options.map((opt, optIdx) => {
                    const isUserChoice = ans.selectedIndex === optIdx;
                    const isRightAnswer = ans.correctIndex === optIdx;

                    let optStyle = 'review-option';
                    if (isRightAnswer) optStyle += ' is-correct-answer';
                    if (isUserChoice && !ans.isCorrect) optStyle += ' is-wrong-choice';

                    return (
                      <div key={optIdx} className={optStyle}>
                        <span className="font-mono text-xs mr-2 font-bold">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                        {isRightAnswer && <span className="ml-auto text-xs font-semibold text-emerald-400">(Kunci Benar)</span>}
                        {isUserChoice && !ans.isCorrect && <span className="ml-auto text-xs font-semibold text-rose-400">(Pilihanmu)</span>}
                      </div>
                    );
                  })}
                </div>

                {ans.explanation && (
                  <div className="review-explanation">
                    <strong>💡 Pembahasan: </strong> {ans.explanation}
                  </div>
                )}

                {/* AI Tutor breakdown if requested */}
                {aiAnalysisMap[ans.questionId] && (
                  <div className="review-explanation mt-3 bg-indigo-950/40 border-indigo-500/30 text-indigo-200 whitespace-pre-line">
                    <strong className="flex items-center gap-1 text-indigo-400 mb-1">
                      <Bot size={14} /> Analisis AI Senior Front-End Mentor:
                    </strong>
                    {aiAnalysisMap[ans.questionId]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
