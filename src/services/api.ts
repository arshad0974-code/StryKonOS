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
} from '../types.js';

class ApiService {
  private token: string | null = null;
  private currentUserId: string = 'usr_alex_vance';

  setUserId(id: string) {
    this.currentUserId = id;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': this.currentUserId,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Auth
  async getCurrentUser(): Promise<UserProfile> {
    const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();
    return data.user;
  }

  async login(email: string, name?: string, agencyName?: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, name, agencyName }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    this.currentUserId = data.user.id;
    return data.user;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const res = await fetch('/api/tasks', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load tasks');
    const data = await res.json();
    return data.tasks || [];
  }

  async saveTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to save task');
    const data = await res.json();
    return data.task;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete task');
    const data = await res.json();
    return data.success;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    const res = await fetch('/api/clients', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load clients');
    const data = await res.json();
    return data.clients || [];
  }

  async saveClient(client: Partial<Client>): Promise<Client> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error('Failed to save client');
    const data = await res.json();
    return data.client;
  }

  async deleteClient(clientId: string): Promise<boolean> {
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete client');
    const data = await res.json();
    return data.success;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load projects');
    const data = await res.json();
    return data.projects || [];
  }

  async saveProject(project: Partial<Project>): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error('Failed to save project');
    const data = await res.json();
    return data.project;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete project');
    const data = await res.json();
    return data.success;
  }

  // Focus Sessions
  async getFocusSessions(): Promise<FocusSession[]> {
    const res = await fetch('/api/focus-sessions', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load focus sessions');
    const data = await res.json();
    return data.sessions || [];
  }

  async saveFocusSession(session: Partial<FocusSession>): Promise<FocusSession> {
    const res = await fetch('/api/focus-sessions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error('Failed to save focus session');
    const data = await res.json();
    return data.session;
  }

  // Distractions
  async getDistractions(): Promise<DistractionRecord[]> {
    const res = await fetch('/api/distractions', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load distractions');
    const data = await res.json();
    return data.distractions || [];
  }

  async saveDistraction(distraction: Partial<DistractionRecord>): Promise<DistractionRecord> {
    const res = await fetch('/api/distractions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(distraction),
    });
    if (!res.ok) throw new Error('Failed to save distraction');
    const data = await res.json();
    return data.distraction;
  }

  // Habits
  async getHabits(): Promise<{ habits: Habit[]; completions: HabitCompletion[] }> {
    const res = await fetch('/api/habits', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load habits');
    return await res.json();
  }

  async saveHabit(habit: Partial<Habit>): Promise<Habit> {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(habit),
    });
    if (!res.ok) throw new Error('Failed to save habit');
    const data = await res.json();
    return data.habit;
  }

  async deleteHabit(habitId: string): Promise<boolean> {
    const res = await fetch(`/api/habits/${habitId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete habit');
    const data = await res.json();
    return data.success;
  }

  async toggleHabit(habitId: string, date: string, minutesLogged?: number, notes?: string): Promise<HabitCompletion> {
    const res = await fetch('/api/habits/toggle', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ habitId, date, minutesLogged, notes }),
    });
    if (!res.ok) throw new Error('Failed to toggle habit completion');
    const data = await res.json();
    return data.completion;
  }

  // Time Blocks
  async getTimeBlocks(): Promise<TimeBlock[]> {
    const res = await fetch('/api/time-blocks', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load time blocks');
    const data = await res.json();
    return data.timeBlocks || [];
  }

  async saveTimeBlock(block: Partial<TimeBlock>): Promise<TimeBlock> {
    const res = await fetch('/api/time-blocks', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(block),
    });
    if (!res.ok) throw new Error('Failed to save time block');
    const data = await res.json();
    return data.timeBlock;
  }

  async deleteTimeBlock(blockId: string): Promise<boolean> {
    const res = await fetch(`/api/time-blocks/${blockId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete time block');
    const data = await res.json();
    return data.success;
  }

  // Daily Reviews
  async getDailyReviews(): Promise<DailyReview[]> {
    const res = await fetch('/api/daily-reviews', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load daily reviews');
    const data = await res.json();
    return data.reviews || [];
  }

  async saveDailyReview(review: Partial<DailyReview>): Promise<DailyReview> {
    const res = await fetch('/api/daily-reviews', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(review),
    });
    if (!res.ok) throw new Error('Failed to save daily review');
    const data = await res.json();
    return data.review;
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    const res = await fetch('/api/settings', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load settings');
    const data = await res.json();
    return data.settings;
  }

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    const data = await res.json();
    return data.settings;
  }

  // Reset Data
  async resetData(): Promise<void> {
    const res = await fetch('/api/reset-data', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset data');
  }

  // AI
  async getAiDailyPlan(): Promise<any> {
    const res = await fetch('/api/ai/daily-plan', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('AI daily plan request failed');
    return await res.json();
  }

  async getAiDistractionAnalysis(): Promise<any> {
    const res = await fetch('/api/ai/distraction-analysis', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('AI distraction analysis request failed');
    return await res.json();
  }

  async chatWithCoach(messages: Array<{ role: 'user' | 'assistant'; text: string }>): Promise<string> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error('AI coach request failed');
    const data = await res.json();
    return data.reply;
  }
}

export const api = new ApiService();
