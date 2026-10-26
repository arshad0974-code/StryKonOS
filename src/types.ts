/**
 * FocusOS Core Domain Types
 */

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'completed';
export type TaskCategory = 'client' | 'personal';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  clientId?: string;
  projectId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string;
  deadline?: string;
  timeBlock?: { start: string; end: string };
  estimatedDurationMinutes: number;
  actualDurationMinutes: number;
  tags: string[];
  notes?: string;
  subtasks: Subtask[];
  isDailyTop3: boolean;
  scheduledDate?: string; // YYYY-MM-DD
  createdAt: string;
  completedAt?: string;
  postponedCount: number;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  businessName: string;
  contactEmail?: string;
  contactPhone?: string;
  services: string[];
  status: 'active' | 'retainer' | 'lead' | 'inactive';
  monthlyValue: number;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  clientId?: string;
  name: string;
  description: string;
  startDate: string;
  deadline: string;
  status: 'planning' | 'in_progress' | 'in_review' | 'completed' | 'on_hold';
  createdAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  taskTitle?: string;
  intendedOutcome?: string;
  presetType: 'pomodoro_25' | 'deep_50' | 'custom';
  targetMinutes: number;
  actualElapsedSeconds: number;
  status: 'completed' | 'interrupted' | 'cancelled';
  startTime: string; // ISO string
  endTime: string;   // ISO string
  reflectionNotes?: string;
  distractionsCount: number;
}

export type DistractionCategory =
  | 'phone'
  | 'social_media'
  | 'unexpected_client_fire'
  | 'unclear_priorities'
  | 'fatigue'
  | 'browse_web'
  | 'other';

export interface DistractionRecord {
  id: string;
  userId: string;
  sessionId?: string;
  taskId?: string;
  timestamp: string;
  category: DistractionCategory;
  reason?: string;
  notes?: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  category: 'morning_planning' | 'top_3' | 'deep_work' | 'sales_outreach' | 'eod_review' | 'custom';
  targetFrequency: 'daily' | 'weekdays' | 'custom';
  dailyTargetMinutes?: number;
  reminderTime?: string;
  icon?: string;
  createdAt: string;
  archived: boolean;
}

export interface HabitCompletion {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  minutesLogged?: number;
  notes?: string;
}

export interface TimeBlock {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  taskId?: string;
  title: string;
  category: 'client_work' | 'deep_work' | 'planning' | 'admin' | 'outreach' | 'personal';
  color?: string;
  completed?: boolean;
}

export interface DailyReview {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  topWins: string[];
  bottlenecks: string;
  tomorrowPriorities: string[];
  moodRating: number;
  scoreAchieved: number;
  aiCoachFeedback?: string;
}

export interface UserSettings {
  userId: string;
  workStartHour: number; // 9
  workEndHour: number;   // 18
  workDays: number[];    // [1,2,3,4,5]
  dailyFocusTargetMinutes: number; // default 240
  pomodoroFocusMinutes: number;    // 25
  pomodoroBreakMinutes: number;    // 5
  longBreakMinutes: number;        // 15
  scoreWeightPriority: number;     // 40
  scoreWeightFocus: number;        // 40
  scoreWeightSchedule: number;     // 20
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  agencyName: string;
  role: string;
  token?: string;
  createdAt: string;
}

export interface ProductivityScoreBreakdown {
  score: number; // 0 - 100
  priorityScore: number;
  focusScore: number;
  scheduleScore: number;
  formulaDescription: string;
}

export interface AnalyticsSummary {
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  completionRate: number;
  focusMinutesActual: number;
  focusMinutesTarget: number;
  plannedWorkHours: number;
  actualWorkHours: number;
  distractionCount: number;
  productivityScore: ProductivityScoreBreakdown;
  streakDays: number;
  routineAdherencePercent: number;
  overdueTasksCount: number;
}
