import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { LeaderboardEntry, Question } from '../types/quiz';

const LOCAL_SCORES_KEY = 'frontend_quiz_local_scores';
const LOCAL_QUESTIONS_KEY = 'frontend_quiz_custom_questions';

// --- LEADERBOARD & SCORES ---

export interface SaveScorePayload {
  userId?: string;
  userPhoto?: string | null;
  playerName: string;
  score: number;
  totalQuestions: number;
  category: string;
  timeSpentSeconds: number;
  streak: number;
}

export const saveQuizScore = async (scoreRecord: SaveScorePayload): Promise<{ success: boolean; id: string; syncedToFirebase: boolean; error?: string }> => {
  const preparedData: LeaderboardEntry = {
    userId: scoreRecord.userId,
    userPhoto: scoreRecord.userPhoto,
    playerName: scoreRecord.playerName || 'Guest Developer',
    score: Number(scoreRecord.score) || 0,
    totalQuestions: Number(scoreRecord.totalQuestions) || 0,
    percentage: Math.round((Number(scoreRecord.score) / (Number(scoreRecord.totalQuestions) || 1)) * 100),
    category: scoreRecord.category || 'all',
    timeSpentSeconds: Number(scoreRecord.timeSpentSeconds) || 0,
    streak: Number(scoreRecord.streak) || 0,
    createdAt: new Date().toISOString()
  };

  // Always save locally first for guaranteed preservation
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
    existing.unshift({ ...preparedData, id: 'local-' + Date.now() });
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.warn('Gagal menyimpan skor ke localStorage:', e);
  }

  // If Firebase Firestore is active, save to cloud
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'quiz_leaderboard'), {
        ...preparedData,
        timestamp: serverTimestamp()
      });
      return { success: true, id: docRef.id, syncedToFirebase: true };
    } catch (err: any) {
      console.warn('Gagal menyinkronkan skor ke Firebase Firestore:', err.message);
      return { success: true, id: 'local-' + Date.now(), syncedToFirebase: false, error: err.message };
    }
  }

  return { success: true, id: 'local-' + Date.now(), syncedToFirebase: false };
};

export const fetchLeaderboard = async (): Promise<{ data: LeaderboardEntry[]; source: 'firebase' | 'local' | 'empty' }> => {
  // If Firebase is available, attempt to read from Firestore
  if (db) {
    try {
      const q = query(
        collection(db, 'quiz_leaderboard'),
        orderBy('percentage', 'desc'),
        limit(25)
      );
      const snapshot = await getDocs(q);
      const firestoreScores: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        firestoreScores.push({
          id: doc.id,
          playerName: data.playerName,
          score: data.score,
          totalQuestions: data.totalQuestions,
          percentage: data.percentage,
          category: data.category,
          timeSpentSeconds: data.timeSpentSeconds,
          streak: data.streak,
          createdAt: data.createdAt || (data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString())
        });
      });

      if (firestoreScores.length > 0) {
        return { data: firestoreScores, source: 'firebase' };
      }
    } catch (err: any) {
      console.warn('Gagal memuat leaderboard dari Firestore, beralih ke cache lokal:', err.message);
    }
  }

  // Local storage fallback
  try {
    const local: LeaderboardEntry[] = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
    // Sort descending by percentage, then by score
    local.sort((a, b) => b.percentage - a.percentage || b.score - a.score);
    return { data: local.slice(0, 25), source: 'local' };
  } catch (e) {
    return { data: [], source: 'empty' };
  }
};

export const fetchUserQuizHistory = (userId?: string, playerName?: string): LeaderboardEntry[] => {
  try {
    const local: LeaderboardEntry[] = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
    return local.filter(item => {
      if (userId && item.userId === userId) return true;
      if (playerName && item.playerName.toLowerCase() === playerName.toLowerCase()) return true;
      return false;
    });
  } catch (e) {
    return [];
  }
};

// --- CUSTOM QUESTIONS (FIRESTORE & LOCAL) ---

export const saveCustomQuestion = async (newQuestion: Partial<Question>): Promise<{ success: boolean; id: string; syncedToFirebase: boolean }> => {
  const preparedQuestion: Question = {
    id: 'custom-' + Date.now(),
    category: newQuestion.category || 'all',
    difficulty: newQuestion.difficulty || 'Intermediate',
    question: newQuestion.question || '',
    code: newQuestion.code || null,
    options: newQuestion.options || [],
    correctIndex: Number(newQuestion.correctIndex) || 0,
    explanation: newQuestion.explanation || '',
    author: newQuestion.author || 'Contributor',
    source: 'firebase'
  };

  // Save locally
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_QUESTIONS_KEY) || '[]');
    existing.push(preparedQuestion);
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Gagal menyimpan soal ke localStorage:', e);
  }

  // Sync to Firebase if online
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'quiz_questions'), {
        ...preparedQuestion,
        timestamp: serverTimestamp()
      });
      return { success: true, id: docRef.id, syncedToFirebase: true };
    } catch (err: any) {
      console.warn('Gagal menyinkronkan pertanyaan ke Firebase:', err.message);
      return { success: true, id: String(preparedQuestion.id), syncedToFirebase: false };
    }
  }

  return { success: true, id: String(preparedQuestion.id), syncedToFirebase: false };
};

export const fetchCustomQuestions = async (): Promise<Question[]> => {
  if (db) {
    try {
      const q = query(collection(db, 'quiz_questions'), limit(50));
      const snapshot = await getDocs(q);
      const questions: Question[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        questions.push({
          id: doc.id,
          category: data.category,
          difficulty: data.difficulty,
          question: data.question,
          code: data.code,
          options: data.options,
          correctIndex: data.correctIndex,
          explanation: data.explanation,
          author: data.author,
          source: 'firebase'
        });
      });
      if (questions.length > 0) {
        return questions;
      }
    } catch (err: any) {
      console.warn('Gagal memuat soal custom dari Firestore:', err.message);
    }
  }

  try {
    return JSON.parse(localStorage.getItem(LOCAL_QUESTIONS_KEY) || '[]');
  } catch (e) {
    return [];
  }
};
