export type AuthProviderType = 'firebase' | 'local' | 'guest';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  isAnonymous: boolean;
  provider: AuthProviderType;
  createdAt?: string;
}

export interface UserStats {
  quizzesPlayed: number;
  highestScore: number;
  averagePercentage: number;
  totalTimeSpentSeconds: number;
}
