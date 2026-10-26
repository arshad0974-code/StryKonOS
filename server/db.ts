import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Client,
  DailyReview,
  DistractionRecord,
  FocusSession,
  Habit,
  HabitCompletion,
  Project,
  Task,
  TimeBlock,
  UserProfile,
  UserSettings,
} from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'focusos_db.json');

export interface DatabaseSchema {
  users: UserProfile[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  focusSessions: FocusSession[];
  distractions: DistractionRecord[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  timeBlocks: TimeBlock[];
  dailyReviews: DailyReview[];
  settings: UserSettings[];
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_USER_ID = 'usr_alex_vance';

function createSeedData(): DatabaseSchema {
  const today = getTodayString();
  const yesterday = getOffsetDateString(-1);
  const tomorrow = getOffsetDateString(1);
  const in3Days = getOffsetDateString(3);
  const in7Days = getOffsetDateString(7);

  const defaultUser: UserProfile = {
    id: DEFAULT_USER_ID,
    name: 'Arshad Qazi',
    email: 'pak40884@gmail.com',
    agencyName: 'Strykon',
    role: 'Solo Operator & Performance Strategist',
    token: 'token_demo_operator',
    createdAt: new Date().toISOString(),
  };

  const clients: Client[] = [];

  const projects: Project[] = [];

  const tasks: Task[] = [];

  const focusSessions: FocusSession[] = [];
  const distractions: DistractionRecord[] = [];

  const habits: Habit[] = [
    {
      id: 'hab_1',
      userId: DEFAULT_USER_ID,
      title: 'Morning Daily Top 3 Planning & Calendar Audit',
      category: 'morning_planning',
      targetFrequency: 'daily',
      dailyTargetMinutes: 15,
      reminderTime: '08:00',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      archived: false,
    },
    {
      id: 'hab_2',
      userId: DEFAULT_USER_ID,
      title: 'Complete Daily Top 3 Priorities First',
      category: 'top_3',
      targetFrequency: 'weekdays',
      dailyTargetMinutes: 180,
      reminderTime: '09:00',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      archived: false,
    },
    {
      id: 'hab_3',
      userId: DEFAULT_USER_ID,
      title: '2+ Deep Focus Work Blocks (Zero Distraction)',
      category: 'deep_work',
      targetFrequency: 'weekdays',
      dailyTargetMinutes: 120,
      reminderTime: '10:00',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      archived: false,
    },
    {
      id: 'hab_4',
      userId: DEFAULT_USER_ID,
      title: 'Agency Growth & Sales Pipeline Outreach (10+ contacts)',
      category: 'sales_outreach',
      targetFrequency: 'weekdays',
      dailyTargetMinutes: 60,
      reminderTime: '14:00',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      archived: false,
    },
    {
      id: 'hab_5',
      userId: DEFAULT_USER_ID,
      title: 'End-of-Day Review & Bottleneck Journaling',
      category: 'eod_review',
      targetFrequency: 'daily',
      dailyTargetMinutes: 15,
      reminderTime: '17:45',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      archived: false,
    },
  ];

  const habitCompletions: HabitCompletion[] = [];
  const timeBlocks: TimeBlock[] = [];
  const dailyReviews: DailyReview[] = [];

  const settings: UserSettings[] = [
    {
      userId: DEFAULT_USER_ID,
      workStartHour: 8,
      workEndHour: 18,
      workDays: [1, 2, 3, 4, 5],
      dailyFocusTargetMinutes: 240, // 4 hours
      pomodoroFocusMinutes: 25,
      pomodoroBreakMinutes: 5,
      longBreakMinutes: 15,
      scoreWeightPriority: 40,
      scoreWeightFocus: 40,
      scoreWeightSchedule: 20,
      theme: 'dark',
      soundEnabled: true,
      browserNotificationsEnabled: false,
    },
  ];

  return {
    users: [defaultUser],
    clients,
    projects,
    tasks,
    focusSessions,
    distractions,
    habits,
    habitCompletions,
    timeBlocks,
    dailyReviews,
    settings,
  };
}

class DatabaseManager {
  private cache: DatabaseSchema | null = null;

  private load(): DatabaseSchema {
    if (this.cache) return this.cache;

    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
        return this.cache!;
      }
    } catch (err) {
      console.error('Error reading DB_FILE, seeding fresh database:', err);
    }

    const initial = createSeedData();
    this.write(initial);
    this.cache = initial;
    return initial;
  }

  private write(data: DatabaseSchema): void {
    this.cache = data;
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database atomically:', err);
    }
  }

  // --- Users & Auth ---
  getUserById(userId: string): UserProfile | undefined {
    const db = this.load();
    return db.users.find(u => u.id === userId);
  }

  getUserByEmail(email: string): UserProfile | undefined {
    const db = this.load();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  saveUser(user: UserProfile): UserProfile {
    const db = this.load();
    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      db.users[idx] = user;
    } else {
      db.users.push(user);
    }
    this.write(db);
    return user;
  }

  // --- Clients ---
  getClients(userId: string): Client[] {
    const db = this.load();
    return db.clients.filter(c => c.userId === userId);
  }

  saveClient(client: Client): Client {
    const db = this.load();
    const idx = db.clients.findIndex(c => c.id === client.id);
    if (idx >= 0) {
      db.clients[idx] = client;
    } else {
      db.clients.unshift(client);
    }
    this.write(db);
    return client;
  }

  deleteClient(clientId: string, userId: string): boolean {
    const db = this.load();
    const initLen = db.clients.length;
    db.clients = db.clients.filter(c => !(c.id === clientId && c.userId === userId));
    if (db.clients.length !== initLen) {
      // Also unassign client from tasks and projects
      db.tasks.forEach(t => {
        if (t.clientId === clientId && t.userId === userId) {
          delete t.clientId;
          delete t.projectId;
        }
      });
      db.projects = db.projects.filter(p => !(p.clientId === clientId && p.userId === userId));
      this.write(db);
      return true;
    }
    return false;
  }

  // --- Projects ---
  getProjects(userId: string): Project[] {
    const db = this.load();
    return db.projects.filter(p => p.userId === userId);
  }

  saveProject(project: Project): Project {
    const db = this.load();
    const idx = db.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      db.projects[idx] = project;
    } else {
      db.projects.unshift(project);
    }
    this.write(db);
    return project;
  }

  deleteProject(projectId: string, userId: string): boolean {
    const db = this.load();
    const initLen = db.projects.length;
    db.projects = db.projects.filter(p => !(p.id === projectId && p.userId === userId));
    if (db.projects.length !== initLen) {
      db.tasks.forEach(t => {
        if (t.projectId === projectId && t.userId === userId) {
          delete t.projectId;
        }
      });
      this.write(db);
      return true;
    }
    return false;
  }

  // --- Tasks ---
  getTasks(userId: string): Task[] {
    const db = this.load();
    return db.tasks.filter(t => t.userId === userId);
  }

  saveTask(task: Task): Task {
    const db = this.load();
    const idx = db.tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      db.tasks[idx] = task;
    } else {
      db.tasks.unshift(task);
    }
    this.write(db);
    return task;
  }

  deleteTask(taskId: string, userId: string): boolean {
    const db = this.load();
    const initLen = db.tasks.length;
    db.tasks = db.tasks.filter(t => !(t.id === taskId && t.userId === userId));
    if (db.tasks.length !== initLen) {
      this.write(db);
      return true;
    }
    return false;
  }

  // --- Focus Sessions ---
  getFocusSessions(userId: string): FocusSession[] {
    const db = this.load();
    return db.focusSessions.filter(s => s.userId === userId);
  }

  saveFocusSession(session: FocusSession): FocusSession {
    const db = this.load();
    const idx = db.focusSessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      db.focusSessions[idx] = session;
    } else {
      db.focusSessions.unshift(session);
    }
    // Update linked task actualDurationMinutes if completed
    if (session.taskId && session.status === 'completed' && session.actualElapsedSeconds > 0) {
      const task = db.tasks.find(t => t.id === session.taskId && t.userId === session.userId);
      if (task) {
        task.actualDurationMinutes = Math.round((task.actualDurationMinutes || 0) + (session.actualElapsedSeconds / 60));
      }
    }
    this.write(db);
    return session;
  }

  // --- Distractions ---
  getDistractions(userId: string): DistractionRecord[] {
    const db = this.load();
    return db.distractions.filter(d => d.userId === userId);
  }

  saveDistraction(distraction: DistractionRecord): DistractionRecord {
    const db = this.load();
    db.distractions.unshift(distraction);
    // If associated with an active focus session, increment its count
    if (distraction.sessionId) {
      const sess = db.focusSessions.find(s => s.id === distraction.sessionId);
      if (sess) {
        sess.distractionsCount = (sess.distractionsCount || 0) + 1;
      }
    }
    this.write(db);
    return distraction;
  }

  // --- Habits & Routines ---
  getHabits(userId: string): Habit[] {
    const db = this.load();
    return db.habits.filter(h => h.userId === userId && !h.archived);
  }

  saveHabit(habit: Habit): Habit {
    const db = this.load();
    const idx = db.habits.findIndex(h => h.id === habit.id);
    if (idx >= 0) {
      db.habits[idx] = habit;
    } else {
      db.habits.push(habit);
    }
    this.write(db);
    return habit;
  }

  deleteHabit(habitId: string, userId: string): boolean {
    const db = this.load();
    const habit = db.habits.find(h => h.id === habitId && h.userId === userId);
    if (habit) {
      habit.archived = true;
      this.write(db);
      return true;
    }
    return false;
  }

  getHabitCompletions(userId: string): HabitCompletion[] {
    const db = this.load();
    return db.habitCompletions.filter(c => c.userId === userId);
  }

  toggleHabitCompletion(userId: string, habitId: string, date: string, minutesLogged?: number, notes?: string): HabitCompletion {
    const db = this.load();
    const existingIdx = db.habitCompletions.findIndex(c => c.userId === userId && c.habitId === habitId && c.date === date);

    if (existingIdx >= 0) {
      const curr = db.habitCompletions[existingIdx];
      curr.completed = !curr.completed;
      if (minutesLogged !== undefined) curr.minutesLogged = minutesLogged;
      if (notes !== undefined) curr.notes = notes;
      this.write(db);
      return curr;
    } else {
      const created: HabitCompletion = {
        id: `hc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        habitId,
        date,
        completed: true,
        minutesLogged: minutesLogged || 15,
        notes,
      };
      db.habitCompletions.push(created);
      this.write(db);
      return created;
    }
  }

  // --- Time Blocks ---
  getTimeBlocks(userId: string): TimeBlock[] {
    const db = this.load();
    return db.timeBlocks.filter(b => b.userId === userId);
  }

  saveTimeBlock(block: TimeBlock): TimeBlock {
    const db = this.load();
    const idx = db.timeBlocks.findIndex(b => b.id === block.id);
    if (idx >= 0) {
      db.timeBlocks[idx] = block;
    } else {
      db.timeBlocks.push(block);
    }
    this.write(db);
    return block;
  }

  deleteTimeBlock(blockId: string, userId: string): boolean {
    const db = this.load();
    const initLen = db.timeBlocks.length;
    db.timeBlocks = db.timeBlocks.filter(b => !(b.id === blockId && b.userId === userId));
    if (db.timeBlocks.length !== initLen) {
      this.write(db);
      return true;
    }
    return false;
  }

  // --- Daily Reviews ---
  getDailyReviews(userId: string): DailyReview[] {
    const db = this.load();
    return db.dailyReviews.filter(r => r.userId === userId);
  }

  saveDailyReview(review: DailyReview): DailyReview {
    const db = this.load();
    const idx = db.dailyReviews.findIndex(r => r.userId === review.userId && r.date === review.date);
    if (idx >= 0) {
      db.dailyReviews[idx] = review;
    } else {
      db.dailyReviews.unshift(review);
    }
    this.write(db);
    return review;
  }

  // --- Settings ---
  getSettings(userId: string): UserSettings {
    const db = this.load();
    const found = db.settings.find(s => s.userId === userId);
    if (found) return found;

    const defaultSettings: UserSettings = {
      userId,
      workStartHour: 8,
      workEndHour: 18,
      workDays: [1, 2, 3, 4, 5],
      dailyFocusTargetMinutes: 240,
      pomodoroFocusMinutes: 25,
      pomodoroBreakMinutes: 5,
      longBreakMinutes: 15,
      scoreWeightPriority: 40,
      scoreWeightFocus: 40,
      scoreWeightSchedule: 20,
      theme: 'dark',
      soundEnabled: true,
      browserNotificationsEnabled: false,
    };
    db.settings.push(defaultSettings);
    this.write(db);
    return defaultSettings;
  }

  saveSettings(settings: UserSettings): UserSettings {
    const db = this.load();
    const idx = db.settings.findIndex(s => s.userId === settings.userId);
    if (idx >= 0) {
      db.settings[idx] = settings;
    } else {
      db.settings.push(settings);
    }
    this.write(db);
    return settings;
  }

  // Reset database with default seed data
  resetWithSeed(): DatabaseSchema {
    const fresh = createSeedData();
    this.write(fresh);
    return fresh;
  }
}

export const dbManager = new DatabaseManager();
