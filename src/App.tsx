import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { QuizStart } from './components/QuizStart';
import { QuizPlay } from './components/QuizPlay';
import { QuizResult } from './components/QuizResult';
import { Leaderboard } from './components/Leaderboard';
import { AddQuestionModal } from './components/AddQuestionModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { AIQuestionGeneratorModal } from './components/AIQuestionGeneratorModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';

import { INITIAL_QUESTIONS } from './data/frontendQuestions';
import { fetchCustomQuestions } from './firebase/quizService';
import { isFirebaseOnline } from './firebase/config';
import { Question, QuizSettings, QuizResultData, UserAnswer } from './types/quiz';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState<'start' | 'play' | 'result'>('start');
  const [allQuestions, setAllQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    playerName: user?.displayName || 'Frontend Ninja',
    category: 'all',
    difficulty: 'all',
    questionCount: 10,
    timerEnabled: true,
    instantFeedback: true
  });
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState<boolean>(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // Status
  const [muted, setMuted] = useState<boolean>(false);
  const [firebaseOnline, setFirebaseOnline] = useState<boolean>(isFirebaseOnline);

  // Load custom questions on mount
  const refreshQuestionBank = async () => {
    try {
      const customOnes = await fetchCustomQuestions();
      if (customOnes && customOnes.length > 0) {
        // Merge without duplicating IDs
        const existingIds = new Set(INITIAL_QUESTIONS.map(q => q.id));
        const filteredCustom = customOnes.filter(q => !existingIds.has(q.id));
        setAllQuestions([...INITIAL_QUESTIONS, ...filteredCustom]);
      } else {
        setAllQuestions(INITIAL_QUESTIONS);
      }
    } catch (e) {
      console.warn('Gagal memuat soal tambahan:', e);
      setAllQuestions(INITIAL_QUESTIONS);
    }
  };

  useEffect(() => {
    refreshQuestionBank();
  }, []);

  // Sync player name when logged in user changes
  useEffect(() => {
    if (user?.displayName) {
      setQuizSettings(prev => ({
        ...prev,
        playerName: user.displayName
      }));
    }
  }, [user]);

  // Add dynamically fetched or generated questions (from REST API or LLM)
  const handleAddDynamicQuestions = (newQuestions: Question[]) => {
    setAllQuestions(prev => {
      const existingIds = new Set(prev.map(q => q.id));
      const freshOnes = newQuestions.filter(q => !existingIds.has(q.id));
      return [...freshOnes, ...prev];
    });
  };

  // Shuffle array using Fisher-Yates
  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Start new quiz
  const handleStartQuiz = (settings: QuizSettings) => {
    setQuizSettings(settings);

    // Filter questions
    const matching = allQuestions.filter(q => {
      const matchCat = settings.category === 'all' || q.category === settings.category;
      const matchDiff = settings.difficulty === 'all' || q.difficulty.toLowerCase() === settings.difficulty.toLowerCase();
      return matchCat && matchDiff;
    });

    // Shuffle and slice
    const shuffled = shuffle(matching);
    const selected = shuffled.slice(0, settings.questionCount);

    setActiveQuizQuestions(selected);
    setView('play');
  };

  // Finish quiz handler
  const handleFinishQuiz = (resultData: QuizResultData) => {
    setQuizResult(resultData);
    setView('result');
  };

  // Play again with same or new filter
  const handlePlayAgain = () => {
    setView('start');
  };

  // Retry only questions that were answered incorrectly
  const handleRetryIncorrectOnly = (incorrectAnswers: UserAnswer[]) => {
    const incorrectIds = new Set(incorrectAnswers.map(a => a.questionId));
    const subsetQuestions = allQuestions.filter(q => incorrectIds.has(q.id));

    if (subsetQuestions.length > 0) {
      setActiveQuizQuestions(shuffle(subsetQuestions));
      setView('play');
    } else {
      setView('start');
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        muted={muted}
        setMuted={setMuted}
        firebaseOnline={firebaseOnline}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenAddQuestion={() => setIsAddQuestionOpen(true)}
        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      <main className="main-content">
        {view === 'start' && (
          <QuizStart
            allQuestions={allQuestions}
            onStartQuiz={handleStartQuiz}
            onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            onAddQuestions={handleAddDynamicQuestions}
          />
        )}

        {view === 'play' && (
          <QuizPlay
            questions={activeQuizQuestions}
            settings={quizSettings}
            onFinishQuiz={handleFinishQuiz}
            onQuitQuiz={() => setView('start')}
          />
        )}

        {view === 'result' && quizResult && (
          <QuizResult
            resultData={quizResult}
            settings={quizSettings}
            onPlayAgain={handlePlayAgain}
            onRetryIncorrectOnly={handleRetryIncorrectOnly}
            onViewLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        )}
      </main>

      {/* Global Modals */}
      <Leaderboard
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        onQuestionAdded={refreshQuestionBank}
      />

      <AIQuestionGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onQuestionsGenerated={(newQuestions) => {
          handleAddDynamicQuestions(newQuestions);
        }}
      />

      <FirebaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigUpdated={() => {
          setFirebaseOnline(isFirebaseOnline);
          refreshQuestionBank();
        }}
      />

      {/* Auth & Profile Modals */}
      <AuthModal />
      <UserProfileModal />

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 DevQuiz Front-End • ReactJS • TypeScript • Firebase • REST API • LLM (Large Language Model)</p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
