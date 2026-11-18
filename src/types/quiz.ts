export type Difficulty = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

export interface Question {
  id: string | number;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  code?: string | null;
  options: string[];
  correctIndex: number;
  explanation: string;
  author?: string;
  source?: 'built-in' | 'firebase' | 'rest-api' | 'llm-generated';
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  count?: number;
}

export interface QuizSettings {
  playerName: string;
  category: string;
  difficulty: Difficulty;
  questionCount: number;
  timerEnabled: boolean;
  instantFeedback: boolean;
}

export interface UserAnswer {
  questionId: string | number;
  question: string;
  code?: string | null;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  explanation: string;
  timedOut?: boolean;
}

export interface QuizResultData {
  answers: UserAnswer[];
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  maxStreak: number;
}

export interface LeaderboardEntry {
  id?: string;
  userId?: string;
  userPhoto?: string | null;
  playerName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  category: string;
  timeSpentSeconds: number;
  streak: number;
  createdAt?: any;
}

export interface FirebaseConfigObject {
  apiKey: string;
  projectId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface LLMConfig {
  apiKey: string;
  provider: 'gemini' | 'groq' | 'openai-compatible' | 'demo-simulated';
  model?: string;
}

export interface TriviaApiResponse {
  response_code: number;
  results: Array<{
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }>;
}
