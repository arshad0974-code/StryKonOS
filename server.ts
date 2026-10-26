import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbManager } from './server/db.js';
import {
  generateDailyPlanRecommendations,
  analyzeDistractionPatterns,
  coachChatResponse,
} from './server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Auth extraction helper: extract userId from header or default to seed user
function getUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const dbUser = dbManager.getUserByEmail(token);
    if (dbUser) return dbUser.id;
  }
  const customUserHeader = req.headers['x-user-id'];
  if (typeof customUserHeader === 'string' && customUserHeader) {
    return customUserHeader;
  }
  return 'usr_alex_vance';
}

// --- Auth Routes ---
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  let user = dbManager.getUserById(userId);
  if (!user) {
    user = dbManager.getUserById('usr_alex_vance');
  }
  res.json({ user });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, name, agencyName } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  let user = dbManager.getUserByEmail(email);
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      agencyName: agencyName || 'Strykon',
      role: 'Agency Operator',
      token: `token_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    dbManager.saveUser(user);
  }
  res.json({ user });
});

// --- Tasks CRUD ---
app.get('/api/tasks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const tasks = dbManager.getTasks(userId);
  res.json({ tasks });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const taskData = req.body;
  if (!taskData.title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const task = {
    ...taskData,
    id: taskData.id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    createdAt: taskData.createdAt || new Date().toISOString(),
    subtasks: taskData.subtasks || [],
    tags: taskData.tags || [],
    estimatedDurationMinutes: Number(taskData.estimatedDurationMinutes) || 30,
    actualDurationMinutes: Number(taskData.actualDurationMinutes) || 0,
    postponedCount: Number(taskData.postponedCount) || 0,
    isDailyTop3: Boolean(taskData.isDailyTop3),
  };

  const saved = dbManager.saveTask(task);
  res.json({ task: saved });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const taskId = req.params.id;
  const deleted = dbManager.deleteTask(taskId, userId);
  res.json({ success: deleted });
});

// --- Clients CRUD ---
app.get('/api/clients', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const clients = dbManager.getClients(userId);
  res.json({ clients });
});

app.post('/api/clients', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const clientData = req.body;
  if (!clientData.name || !clientData.businessName) {
    return res.status(400).json({ error: 'Client name and business name are required' });
  }

  const client = {
    ...clientData,
    id: clientData.id || `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    services: clientData.services || [],
    monthlyValue: Number(clientData.monthlyValue) || 0,
    createdAt: clientData.createdAt || new Date().toISOString(),
  };

  const saved = dbManager.saveClient(client);
  res.json({ client: saved });
});

app.delete('/api/clients/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const clientId = req.params.id;
  const deleted = dbManager.deleteClient(clientId, userId);
  res.json({ success: deleted });
});

// --- Projects CRUD ---
app.get('/api/projects', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const projects = dbManager.getProjects(userId);
  res.json({ projects });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const projectData = req.body;
  if (!projectData.name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const project = {
    ...projectData,
    id: projectData.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    createdAt: projectData.createdAt || new Date().toISOString(),
  };

  const saved = dbManager.saveProject(project);
  res.json({ project: saved });
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const projectId = req.params.id;
  const deleted = dbManager.deleteProject(projectId, userId);
  res.json({ success: deleted });
});

// --- Focus Sessions ---
app.get('/api/focus-sessions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sessions = dbManager.getFocusSessions(userId);
  res.json({ sessions });
});

app.post('/api/focus-sessions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sessionData = req.body;

  const session = {
    ...sessionData,
    id: sessionData.id || `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    startTime: sessionData.startTime || new Date().toISOString(),
    endTime: sessionData.endTime || new Date().toISOString(),
    targetMinutes: Number(sessionData.targetMinutes) || 25,
    actualElapsedSeconds: Number(sessionData.actualElapsedSeconds) || 0,
    distractionsCount: Number(sessionData.distractionsCount) || 0,
  };

  const saved = dbManager.saveFocusSession(session);
  res.json({ session: saved });
});

// --- Distractions ---
app.get('/api/distractions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const distractions = dbManager.getDistractions(userId);
  res.json({ distractions });
});

app.post('/api/distractions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const data = req.body;

  const distraction = {
    ...data,
    id: data.id || `dist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    timestamp: data.timestamp || new Date().toISOString(),
    category: data.category || 'other',
  };

  const saved = dbManager.saveDistraction(distraction);
  res.json({ distraction: saved });
});

// --- Habits & Routines ---
app.get('/api/habits', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const habits = dbManager.getHabits(userId);
  const completions = dbManager.getHabitCompletions(userId);
  res.json({ habits, completions });
});

app.post('/api/habits', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const habitData = req.body;
  if (!habitData.title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const habit = {
    ...habitData,
    id: habitData.id || `hab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    createdAt: habitData.createdAt || new Date().toISOString(),
    archived: false,
  };

  const saved = dbManager.saveHabit(habit);
  res.json({ habit: saved });
});

app.delete('/api/habits/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const habitId = req.params.id;
  const deleted = dbManager.deleteHabit(habitId, userId);
  res.json({ success: deleted });
});

app.post('/api/habits/toggle', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { habitId, date, minutesLogged, notes } = req.body;
  if (!habitId || !date) {
    return res.status(400).json({ error: 'habitId and date are required' });
  }

  const updated = dbManager.toggleHabitCompletion(userId, habitId, date, minutesLogged, notes);
  res.json({ completion: updated });
});

// --- Time Blocks ---
app.get('/api/time-blocks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const timeBlocks = dbManager.getTimeBlocks(userId);
  res.json({ timeBlocks });
});

app.post('/api/time-blocks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const blockData = req.body;

  const block = {
    ...blockData,
    id: blockData.id || `tb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
  };

  const saved = dbManager.saveTimeBlock(block);
  res.json({ timeBlock: saved });
});

app.delete('/api/time-blocks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const blockId = req.params.id;
  const deleted = dbManager.deleteTimeBlock(blockId, userId);
  res.json({ success: deleted });
});

// --- Daily Reviews ---
app.get('/api/daily-reviews', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const reviews = dbManager.getDailyReviews(userId);
  res.json({ reviews });
});

app.post('/api/daily-reviews', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const reviewData = req.body;

  const review = {
    ...reviewData,
    id: reviewData.id || `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    topWins: reviewData.topWins || [],
    tomorrowPriorities: reviewData.tomorrowPriorities || [],
  };

  const saved = dbManager.saveDailyReview(review);
  res.json({ review: saved });
});

// --- Settings ---
app.get('/api/settings', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const settings = dbManager.getSettings(userId);
  res.json({ settings });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const settingsData = req.body;
  const updated = dbManager.saveSettings({ ...settingsData, userId });
  res.json({ settings: updated });
});

// --- Reset Data ---
app.post('/api/reset-data', (req: Request, res: Response) => {
  dbManager.resetWithSeed();
  res.json({ success: true, message: 'Database reset to initial demo state.' });
});

// --- Gemini AI Endpoints ---
app.post('/api/ai/daily-plan', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const tasks = dbManager.getTasks(userId);
    const settings = dbManager.getSettings(userId);
    const distractions = dbManager.getDistractions(userId);

    const plan = await generateDailyPlanRecommendations({
      tasks,
      focusTargetMinutes: settings.dailyFocusTargetMinutes,
      workHours: { start: settings.workStartHour, end: settings.workEndHour },
      distractions,
    });

    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI daily plan generation failed' });
  }
});

app.post('/api/ai/distraction-analysis', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const distractions = dbManager.getDistractions(userId);
    const sessions = dbManager.getFocusSessions(userId);

    const analysis = await analyzeDistractionPatterns(distractions, sessions);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Distraction analysis failed' });
  }
});

app.post('/api/ai/coach', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { messages } = req.body;
    const tasks = dbManager.getTasks(userId);
    const clients = dbManager.getClients(userId);
    const sessions = dbManager.getFocusSessions(userId);
    const distractions = dbManager.getDistractions(userId);
    const settings = dbManager.getSettings(userId);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr));
    const todayDistractions = distractions.filter(d => d.timestamp.startsWith(todayStr));
    const focusMinutesToday = Math.round(
      todaySessions.reduce((acc, s) => acc + (s.status === 'completed' ? s.actualElapsedSeconds : 0), 0) / 60
    );

    const context = {
      activeTasksCount: tasks.filter(t => t.status !== 'completed').length,
      completedTodayCount: tasks.filter(t => t.status === 'completed' && t.completedAt?.startsWith(todayStr)).length,
      focusMinutesToday,
      targetFocusMinutes: settings.dailyFocusTargetMinutes,
      distractionsToday: todayDistractions.length,
      clientsList: clients.map(c => `${c.businessName} (${c.services.slice(0, 2).join(', ')})`),
    };

    const reply = await coachChatResponse(messages || [], context);
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Coach request failed' });
  }
});

// --- Dev & Prod Server Mounting ---
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StrykonOS server running on http://0.0.0.0:${PORT}`);
  });
}

start();
