
export enum View {
  Tasks = 'tasks',
  Calendar = 'calendar',
  Stats = 'stats',
  Settings = 'settings',
}

export enum GoalStatus {
  Pending = 'pending',
  Completed = 'completed',
}

export type User = '모두' | '가족' | '은' | '미랑' | '재성';

export type Category = '건강' | '취미' | '운동' | '학습' | '일상' | '기타';

export interface Goal {
  id: string;
  title: string;
  assignee: User;
  category: Category;
  dueDate: string; // ISO string for date
  dueTime?: string; // HH:mm format
  status: GoalStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  description?: string;
}

export interface Completion {
    id: string;
    goalId: string;
    completedAt: string; // ISO string
    completedBy: User;
}

export interface CompletionStats {
  completed: number;
  pending: number;
  total: number;
  completionRate: number;
}

export interface DailyChartData {
  date: string;
  count: number;
  dayName: string;
}

export interface CategoryStatsData {
  category: Category;
  count: number;
  percentage: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}