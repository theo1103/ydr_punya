export interface User {
  username: string;
  passwordHash: string; // SHA256 hex or stored representation
  role: 'admin' | 'user';
  photo?: string | null;
  bio?: string | null;
  twitter?: string | null;
}

export interface DailyDataRecord {
  id: string;
  username: string;
  date: string; // YYYY-MM-DD
  value: number;
  evidence?: string | null; // base64 string
}

export interface AppSettings {
  logoUrl?: string | null;
}

export interface GiftSendbackRecord {
  id: string;
  username: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  evidenceUrl?: string;
  recordedBy: string;
}

export interface SessionState {
  isLoggedIn: boolean;
  currentUser: string | null;
  role: 'admin' | 'user' | null;
}
