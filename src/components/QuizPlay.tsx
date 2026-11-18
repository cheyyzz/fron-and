import React, { useState, useEffect, useRef } from 'react';
import { Clock, Flame, CheckCircle2, XCircle, ArrowRight, HelpCircle, Code, AlertCircle, Sparkles, Bot, RefreshCw } from 'lucide-react';
import { Question, QuizSettings, UserAnswer, QuizResultData } from '../types/quiz';
import { getAIHint, getAIInDepthExplanation } from '../services/llmService';
import { sound } from '../utils/sound';

interface QuizPlayProps {
  questions: Question[];
  settings: QuizSettings;
  onFinishQuiz: (result: QuizResultData) => void;
  onQuitQuiz: () => void;
}

export const QuizPlay: React.FC<QuizPlayProps> = ({
  questions = [],
  settings,
  onFinishQuiz,
  onQuitQuiz
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);

  // AI LLM Interactive State
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false);
  const [aiDeepExplanation, setAiDeepExplanation] = useState<string | null>(null);
  const [isLoadingDeepExp, setIsLoadingDeepExp] = useState<boolean>(false);

  const totalTimerRef = useRef<any>(null);
  const currentQuestion = questions[currentIndex] || null;

  // Track total game time
  useEffect(() => {
    totalTimerRef.current = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(totalTimerRef.current);
  }, []);

  const handleTimeOut = () => {
    if (isAnswered || !currentQuestion) return;
    setIsAnswered(true);
    setSelectedOption(-1); // timed out
    sound.playWrong();
    setStreak(0);

    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      code: currentQuestion.code,
      options: currentQuestion.options,
      correctIndex: currentQuestion.correctIndex,
      selectedIndex: -1,
      isCorrect: false,
      explanation: currentQuestion.explanation,
      timedOut: true
    };

    setUserAnswers(prev => [...prev, answerRecord]);
  };

  // Per-question countdown timer
  useEffect(() => {
    if (!settings.timerEnabled || isAnswered) return;

    if (timeLeft <= 0) {
      handleTimeOut();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, settings.timerEnabled]);

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctIndex;

    if (isCorrect) {
      sound.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
    } else {
      sound.playWrong();
      setStreak(0);
    }

    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      code: currentQuestion.code,
      options: currentQuestion.options,
      correctIndex: currentQuestion.correctIndex,
      selectedIndex: index,
      isCorrect,
      explanation: currentQuestion.explanation,
      timedOut: false
    };

    setUserAnswers(prev => [...prev, answerRecord]);
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(30);
      setAiHint(null);
      setAiDeepExplanation(null);
    } else {
      // Completed all questions
      const score = userAnswers.filter(a => a.isCorrect).length;
      onFinishQuiz({
        answers: userAnswers,
        score,
        totalQuestions: questions.length,
        timeSpentSeconds: totalSeconds,
        maxStreak: Math.max(streak, maxStreak)
      });
    }
  };

  // Ask AI for hint before answering
  const handleRequestHint = async () => {
    if (!currentQuestion || isLoadingHint) return;
    setIsLoadingHint(true);
    sound.playClick();
    try {
      const hint = await getAIHint(currentQuestion.question, currentQuestion.code);
      setAiHint(hint);
    } catch (err: any) {
      setAiHint(`Petunjuk AI: Perhatikan kata kunci utama dan konsep dasar.`);
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Ask AI for deep explanation after answering
  const handleRequestDeepExplanation = async () => {
    if (!currentQuestion || isLoadingDeepExp) return;
    setIsLoadingDeepExp(true);
    sound.playClick();
    try {
      const exp = await getAIInDepthExplanation(
        currentQuestion.question,
        currentQuestion.code,
        currentQuestion.options,
        currentQuestion.correctIndex,
        selectedOption !== null ? selectedOption : undefined
      );
      setAiDeepExplanation(exp);
    } catch (err: any) {
      setAiDeepExplanation(`Gagal memuat penjelasan AI: ${err.message}`);
    } finally {
      setIsLoadingDeepExp(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="card-box text-center py-12">
        <p>Tidak ada pertanyaan yang sesuai dengan filter.</p>
        <button className="btn-primary mt-4" onClick={onQuitQuiz}>Kembali ke Menu</button>
      </div>
    );
  }

  const progressPercentage = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="quiz-play-container">
      {/* Quiz Progress & Stats Bar */}
      <div className="quiz-header-card">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="question-badge">
              Soal {currentIndex + 1} dari {questions.length}
            </span>
            <span className={`difficulty-badge ${currentQuestion.difficulty?.toLowerCase()}`}>
              {currentQuestion.difficulty}
            </span>
            {currentQuestion.source && currentQuestion.source !== 'built-in' && (
              <span className="badge-tag flex items-center gap-1 font-bold" style={{ color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)' }}>
                {currentQuestion.source === 'llm-generated' ? '🤖 AI LLM' : currentQuestion.source === 'rest-api' ? '🌐 REST API' : '☁️ Firebase'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {streak > 1 && (
              <div className="streak-indicator">
                <Flame size={16} className="text-orange-400" />
                <span>{streak}x Streak</span>
              </div>
            )}

            {settings.timerEnabled && (
              <div className={`timer-box ${timeLeft <= 7 ? 'danger' : timeLeft <= 15 ? 'warning' : ''}`}>
                <Clock size={16} />
                <span>{timeLeft}s</span>
              </div>
            )}

            <button
              onClick={onQuitQuiz}
              className="text-xs text-slate-400 hover:text-slate-200 underline ml-2"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="question-card">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="question-title" style={{ margin: 0 }}>
            {currentQuestion.question}
          </h3>

          {/* AI Hint Button (if not yet answered) */}
          {!isAnswered && (
            <button
              type="button"
              className="chip-btn flex items-center gap-1 text-xs shrink-0"
              style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', color: '#a5b4fc' }}
              onClick={handleRequestHint}
              disabled={isLoadingHint}
              title="Minta petunjuk singkat dari AI tanpa membocorkan jawaban"
            >
              {isLoadingHint ? <RefreshCw className="animate-spin" size={13} /> : <Bot size={13} />}
              <span>💡 Hint AI</span>
            </button>
          )}
        </div>

        {/* AI Hint Display */}
        {aiHint && (
          <div className="explanation-card mb-4" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <p className="text-xs text-amber-300 font-medium">{aiHint}</p>
          </div>
        )}

        {/* Optional Code Snippet */}
        {currentQuestion.code && (
          <div className="code-block-container">
            <div className="code-header">
              <Code size={14} />
              <span>Kode Snippet</span>
            </div>
            <pre className="code-content">
              <code>{currentQuestion.code}</code>
            </pre>
          </div>
        )}

        {/* Options List */}
        <div className="options-grid">
          {currentQuestion.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQuestion.correctIndex;

            let optionClass = 'option-btn';
            if (isAnswered) {
              if (isCorrect) {
                optionClass += ' correct';
              } else if (isSelected) {
                optionClass += ' wrong';
              } else {
                optionClass += ' disabled';
              }
            } else if (isSelected) {
              optionClass += ' selected';
            }

            return (
              <button
                key={idx}
                className={optionClass}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
              >
                <div className="option-letter">{letter}</div>
                <div className="option-text">{option}</div>
                {isAnswered && (
                  <div className="option-indicator">
                    {isCorrect && <CheckCircle2 size={20} className="text-emerald-400" />}
                    {isSelected && !isCorrect && <XCircle size={20} className="text-rose-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Timed out message */}
        {isAnswered && selectedOption === -1 && (
          <div className="alert-banner error mt-4">
            <AlertCircle size={18} />
            <span>Waktu habis! Anda tidak sempat menjawab soal ini.</span>
          </div>
        )}

        {/* Standard Explanation Card */}
        {isAnswered && (settings.instantFeedback || true) && (
          <div className="explanation-card">
            <div className="explanation-header justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-400" />
                <h4 className="font-semibold text-slate-200">Pembahasan & Konsep</h4>
              </div>

              {/* Ask LLM for deeper tutor explanation */}
              <button
                type="button"
                className="chip-btn flex items-center gap-1 text-xs"
                style={{ background: 'rgba(99, 102, 241, 0.2)', borderColor: '#818cf8', color: '#c7d2fe' }}
                onClick={handleRequestDeepExplanation}
                disabled={isLoadingDeepExp}
              >
                {isLoadingDeepExp ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />}
                <span>🤖 Tanya AI Tutor</span>
              </button>
            </div>
            <p className="explanation-body">
              {currentQuestion.explanation || 'Jawaban yang tepat adalah opsi ' + String.fromCharCode(65 + currentQuestion.correctIndex) + '.'}
            </p>

            {/* AI Tutor In-Depth Response */}
            {aiDeepExplanation && (
              <div className="mt-3 pt-3 border-t border-indigo-500/30 text-xs text-indigo-200 whitespace-pre-line leading-relaxed">
                {aiDeepExplanation}
              </div>
            )}
          </div>
        )}

        {/* Footer / Next Button */}
        {isAnswered && (
          <div className="question-footer">
            <div className="text-sm text-slate-400">
              {currentIndex + 1 < questions.length
                ? `${questions.length - (currentIndex + 1)} pertanyaan tersisa`
                : 'Ini adalah pertanyaan terakhir!'}
            </div>
            <button className="btn-next-question" onClick={handleNext}>
              <span>{currentIndex + 1 < questions.length ? 'Pertanyaan Berikutnya' : 'Lihat Hasil Akhir'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
