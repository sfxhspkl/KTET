export type Role = 'user' | 'admin';
export type TetCategory = '1' | '2' | '3';
export type QuestionCategory = '1' | '2' | '3' | 'all';

export interface User {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  username: string; // Used for login
  password?: string; // In real app, this is hashed. keeping simple for demo.
  role: Role;
  avatarUrl?: string;

  // Extended Profile
  mobile?: string;
  email?: string;
  district?: string;
  subDistrict?: string;
  status: 'active' | 'blocked';
  tetCategory: TetCategory; // 1, 2, or 3
  selectedSubjects?: string[]; // IDs of selected subjects
  mainSubject?: string; // Tamil, English, Maths, etc.

  // Usage tracking
  totalUsageTime?: number;

  // Permissions
  canManageContent?: boolean;
}

export interface Subject {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  color: string;
  tetCategory: TetCategory; // Subject belongs to a specific category
  icon?: string;
}

export interface Topic {
  _id: string;
  id?: string; // For backward compatibility
  subjectId: string;
  name: string;
  questionCount: number;
}

export interface SyllabusItem {
  _id: string;
  id?: string; // For backward compatibility
  tetCategory: TetCategory;
  subjectId: string;
  unitTitle: string;
  description: string;
  order: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  _id: string;
  id?: string; // For backward compatibility
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  id?: string; // For backward compatibility
  subjectId: string;
  topicId: string;
  text: string;
  options: QuestionOption[];
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
  mistakeCount: number;
  tetCategory: QuestionCategory; // 'all' means available for everyone
  status: 'active' | 'inactive';
}

export interface QuizLog {
  _id: string;
  id?: string; // For backward compatibility
  userId: string;
  date: string; // ISO string
  subjectName: string;
  score: number; // percentage
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracy: number;
}

export interface IssueReport {
  _id: string;
  id?: string; // For backward compatibility
  questionId: string;
  questionText: string;
  userId: string;
  userName: string;
  description: string;
  date: string;
  status: 'pending' | 'resolved';
}

export interface Message {
  _id: string;
  id?: string; // For backward compatibility
  userId: string; // The conversation ID (User's ID)
  sender: 'user' | 'admin';
  userName: string;
  content: string;
  date: string; // ISO string
  isRead?: boolean;
}

export interface AppNotification {
  _id: string;
  id?: string; // For backward compatibility
  type: 'popup' | 'ticker';
  content: string;
  active: boolean;
  // Styling
  color?: string; // Hex or tailwind class
  fontSize?: 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl';
  // Popup specific
  imageUrl?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface DashboardStats {
  totalTests: number;
  averageScore: number;
  globalAccuracy: number;
  questionsAttempted: number;
  bestSubject: string;
  weakZones: { name: string; accuracy: number }[];
  // Legacy fields (optional if needed)
  completionRate?: number;
  pendingQuestions?: number;
}