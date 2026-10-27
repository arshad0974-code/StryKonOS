import React, { useState, useEffect, useCallback } from 'react';
import type {
  Client,
  DistractionCategory,
  DistractionRecord,
  FocusSession,
  Habit,
  HabitCompletion,
  Project,
  Task,
  TimeBlock,
  UserProfile,
  UserSettings,
} from './types.js';
import { api } from './services/api.js';
import { Sidebar, type NavSection } from './components/Sidebar.js';
import { TopBar } from './components/TopBar.js';
import { TaskModal } from './components/TaskModal.js';
import { ClientModal } from './components/ClientModal.js';
import { ProjectModal } from './components/ProjectModal.js';
import { DashboardView } from './views/DashboardView.js';
import { MyDayView } from './views/MyDayView.js';
import { TasksView } from './views/TasksView.js';
import { ClientsView } from './views/ClientsView.js';
import { ProjectsView } from './views/ProjectsView.js';
import { CalendarView } from './views/CalendarView.js';
import { FocusModeView } from './views/FocusModeView.js';
import { HabitsView } from './views/HabitsView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { AiCoachView } from './views/AiCoachView.js';
import { SettingsView } from './views/SettingsView.js';
import { CustomSelect, type SelectOption } from './components/CustomSelect.js';
import { calculateStreakDays } from './utils/productivity.js';
import { ShieldAlert, X } from 'lucide-react';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('strykon_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark';
  });

  // Core Data State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [distractions, setDistractions] = useState<DistractionRecord[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userId: 'usr_alex_vance',
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
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active focus session state
  const [activeTaskForFocus, setActiveTaskForFocus] = useState<Task | null>(null);
  const [activeTimerRunning, setActiveTimerRunning] = useState(false);
  const [activeTimerRemaining, setActiveTimerRemaining] = useState('25:00');

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Quick Distraction Modal
  const [quickDistractionModalOpen, setQuickDistractionModalOpen] = useState(false);
  const [quickDistCat, setQuickDistCat] = useState<DistractionCategory>('phone');
  const [quickDistReason, setQuickDistReason] = useState('');

  // Initial load from server
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, t, c, p, fs, d, hData, tb, s] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.getTasks().catch(() => []),
        api.getClients().catch(() => []),
        api.getProjects().catch(() => []),
        api.getFocusSessions().catch(() => []),
        api.getDistractions().catch(() => []),
        api.getHabits().catch(() => ({ habits: [], completions: [] })),
        api.getTimeBlocks().catch(() => []),
        api.getSettings().catch(() => null),
      ]);

      if (u) setUser(u);
      setTasks(t);
      setClients(c);
      setProjects(p);
      setFocusSessions(fs);
      setDistractions(d);
      setHabits(hData.habits);
      setHabitCompletions(hData.completions);
      setTimeBlocks(tb);
      if (s) {
        setSettings(s);
        if (s.theme) setTheme(s.theme);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Reactively synchronize theme on <html> and <body> and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
    try {
      localStorage.setItem('strykon_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Handle Theme Switch
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    api.saveSettings({ ...settings, theme: nextTheme }).catch(() => {});
  };


  // Sync active timer from localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem('focusos_active_timer');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.isRunning) {
            setActiveTimerRunning(true);
            const targetSecs = (parsed.targetMinutes || 25) * 60;
            let totalElapsed = parsed.accumulatedElapsedSecs || 0;
            if (!parsed.isPaused && parsed.startTimeMs) {
              totalElapsed += Math.floor((Date.now() - parsed.startTimeMs) / 1000);
            }
            const remSecs = Math.max(0, targetSecs - totalElapsed);
            const mins = Math.floor(remSecs / 60);
            const secs = remSecs % 60;
            setActiveTimerRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            return;
          }
        }
        setActiveTimerRunning(false);
      } catch (e) {}
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // --- Handlers: Tasks ---
  const handleSaveTask = async (taskData: Partial<Task>) => {
    const saved = await api.saveTask(taskData);
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await api.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleToggleTaskComplete = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    await handleSaveTask({
      ...task,
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const handleSelectTaskForFocus = (task: Task) => {
    setActiveTaskForFocus(task);
    setCurrentSection('focus');
  };

  // --- Handlers: Clients ---
  const handleSaveClient = async (clientData: Partial<Client>) => {
    const saved = await api.saveClient(clientData);
    setClients(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteClient = async (clientId: string) => {
    await api.deleteClient(clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  // --- Handlers: Projects ---
  const handleSaveProject = async (projectData: Partial<Project>) => {
    const saved = await api.saveProject(projectData);
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    await api.deleteProject(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  // --- Handlers: Focus Sessions ---
  const handleSaveFocusSession = async (sessionData: Partial<FocusSession>) => {
    const saved = await api.saveFocusSession(sessionData);
    setFocusSessions(prev => {
      const idx = prev.findIndex(s => s.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    // Refresh tasks to pull updated actualDurationMinutes
    api.getTasks().then(setTasks).catch(() => {});
    return saved;
  };

  // --- Handlers: Distractions ---
  const handleLogDistraction = async (data: {
    category: DistractionCategory;
    reason?: string;
    notes?: string;
    sessionId?: string;
    taskId?: string;
  }) => {
    const saved = await api.saveDistraction(data);
    setDistractions(prev => [saved, ...prev]);
  };

  const handleQuickDistractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogDistraction({
      category: quickDistCat,
      reason: quickDistReason.trim() || undefined,
    });
    setQuickDistractionModalOpen(false);
    setQuickDistReason('');
  };

  // --- Handlers: Habits ---
  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    const saved = await api.saveHabit(habitData);
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
  };

  const handleDeleteHabit = async (habitId: string) => {
    await api.deleteHabit(habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  const handleToggleHabit = async (habitId: string, date: string) => {
    const completion = await api.toggleHabit(habitId, date);
    setHabitCompletions(prev => {
      const idx = prev.findIndex(c => c.habitId === habitId && c.date === date);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = completion;
        return updated;
      }
      return [...prev, completion];
    });
  };

  // --- Handlers: Time Blocks ---
  const handleSaveTimeBlock = async (blockData: Partial<TimeBlock>) => {
    const saved = await api.saveTimeBlock(blockData);
    setTimeBlocks(prev => {
      const idx = prev.findIndex(b => b.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
  };

  const handleDeleteTimeBlock = async (blockId: string) => {
    await api.deleteTimeBlock(blockId);
    setTimeBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  // --- Handlers: Settings & Reset ---
  const handleSaveSettings = async (settingsData: Partial<UserSettings>) => {
    const saved = await api.saveSettings(settingsData);
    setSettings(saved);
  };

  const handleResetData = async () => {
    await api.resetData();
    await loadInitialData();
  };

  const streakDays = calculateStreakDays(habitCompletions, focusSessions);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-3 text-neutral-400">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 animate-pulse flex items-center justify-center font-bold text-white text-sm">
          S
        </div>
        <span className="text-xs font-mono tracking-wider">INITIALIZING STRYKONOS...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={sec => setCurrentSection(sec)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenQuickTask={() => {
          setEditingTask(null);
          setTaskModalOpen(true);
        }}
        activeTimerRunning={activeTimerRunning}
        activeTimerRemaining={activeTimerRemaining}
        activeTaskTitle={activeTaskForFocus?.title}
        user={user}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          currentSection={currentSection}
          onOpenQuickTask={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          onStartFocusShortcut={() => setCurrentSection('focus')}
          onOpenAiChat={() => setCurrentSection('ai_coach')}
          activeTimerRunning={activeTimerRunning}
          activeTimerRemaining={activeTimerRemaining}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          theme={theme}
          onToggleTheme={toggleTheme}
          streakCount={streakDays}
        />


        {/* View Routing */}
        <main className="flex-1 overflow-y-auto">
          {currentSection === 'dashboard' && (
            <DashboardView
              user={user}
              tasks={tasks}
              clients={clients}
              projects={projects}
              focusSessions={focusSessions}
              habitCompletions={habitCompletions}
              timeBlocks={timeBlocks}
              settings={settings}
              onSelectTaskForFocus={handleSelectTaskForFocus}
              onToggleTaskComplete={handleToggleTaskComplete}
              onOpenTaskModal={task => {
                setEditingTask(task || null);
                setTaskModalOpen(true);
              }}
              onNavigateSection={setCurrentSection}
            />
          )}

          {currentSection === 'my_day' && (
            <MyDayView
              tasks={tasks}
              clients={clients}
              timeBlocks={timeBlocks}
              settings={settings}
              onSaveTask={handleSaveTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onSelectTaskForFocus={handleSelectTaskForFocus}
              onOpenTaskModal={task => {
                setEditingTask(task || null);
                setTaskModalOpen(true);
              }}
              onOpenDistractionModal={() => setQuickDistractionModalOpen(true)}
              onNavigateSection={setCurrentSection}
            />
          )}

          {currentSection === 'tasks' && (
            <TasksView
              tasks={tasks}
              clients={clients}
              projects={projects}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
              onOpenTaskModal={task => {
                setEditingTask(task || null);
                setTaskModalOpen(true);
              }}
              onSelectTaskForFocus={handleSelectTaskForFocus}
            />
          )}

          {currentSection === 'clients' && (
            <ClientsView
              clients={clients}
              tasks={tasks}
              onOpenClientModal={client => {
                setEditingClient(client || null);
                setClientModalOpen(true);
              }}
              onOpenTaskModal={task => {
                setEditingTask(task || null);
                setTaskModalOpen(true);
              }}
            />
          )}

          {currentSection === 'projects' && (
            <ProjectsView
              projects={projects}
              clients={clients}
              tasks={tasks}
              onOpenProjectModal={proj => {
                setEditingProject(proj || null);
                setProjectModalOpen(true);
              }}
              onOpenTaskModal={task => {
                setEditingTask(task || null);
                setTaskModalOpen(true);
              }}
            />
          )}

          {currentSection === 'calendar' && (
            <CalendarView
              tasks={tasks}
              timeBlocks={timeBlocks}
              settings={settings}
              onSaveTimeBlock={handleSaveTimeBlock}
              onDeleteTimeBlock={handleDeleteTimeBlock}
              onSaveTask={handleSaveTask}
            />
          )}

          {currentSection === 'focus' && (
            <FocusModeView
              tasks={tasks}
              activeTask={activeTaskForFocus}
              onSetActiveTask={setActiveTaskForFocus}
              onSaveSession={handleSaveFocusSession}
              onLogDistraction={handleLogDistraction}
              focusSessions={focusSessions}
              settings={settings}
            />
          )}

          {currentSection === 'habits' && (
            <HabitsView
              habits={habits}
              habitCompletions={habitCompletions}
              distractions={distractions}
              onSaveHabit={handleSaveHabit}
              onDeleteHabit={handleDeleteHabit}
              onToggleHabit={handleToggleHabit}
              onOpenDistractionModal={() => setQuickDistractionModalOpen(true)}
              onNavigateAiDistractions={() => setCurrentSection('ai_coach')}
            />
          )}

          {currentSection === 'analytics' && (
            <AnalyticsView
              tasks={tasks}
              clients={clients}
              projects={projects}
              focusSessions={focusSessions}
              distractions={distractions}
              habitCompletions={habitCompletions}
            />
          )}

          {currentSection === 'ai_coach' && (
            <AiCoachView
              tasks={tasks}
              clients={clients}
              focusSessions={focusSessions}
              distractions={distractions}
              timeBlocks={timeBlocks}
              settings={settings}
              onSaveTask={handleSaveTask}
              onSaveTimeBlock={handleSaveTimeBlock}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView
              settings={settings}
              user={user}
              onSaveSettings={handleSaveSettings}
              onResetData={handleResetData}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
        </main>
      </div>

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
        clients={clients}
        projects={projects}
      />

      {/* Client Creation & Editing Modal */}
      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSave={handleSaveClient}
        onDelete={handleDeleteClient}
        initialClient={editingClient}
      />

      {/* Project Creation & Editing Modal */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        initialProject={editingProject}
        clients={clients}
      />

      {/* Quick Distraction Modal */}
      {quickDistractionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-neutral-100">Quick Interruption Log</h3>
              </div>
              <button
                onClick={() => setQuickDistractionModalOpen(false)}
                className="text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickDistractionSubmit} className="space-y-3.5">
              <div>
                <CustomSelect
                  label="Interruption Category"
                  value={quickDistCat}
                  options={[
                    { value: 'phone', label: 'Phone / WhatsApp Ping' },
                    { value: 'unexpected_client_fire', label: 'Unexpected Client Emergency' },
                    { value: 'social_media', label: 'Social Media / News / Twitter' },
                    { value: 'unclear_priorities', label: 'Unclear Priorities / Decision Fatigue' },
                    { value: 'browse_web', label: 'Random Web Browsing' },
                    { value: 'fatigue', label: 'Energy Slump / Fatigue' },
                    { value: 'other', label: 'Other Friction' },
                  ]}
                  onChange={val => setQuickDistCat(val as DistractionCategory)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Trigger / Context</label>
                <input
                  type="text"
                  value={quickDistReason}
                  onChange={e => setQuickDistReason(e.target.value)}
                  placeholder="e.g. Client phoned about ad account budget..."
                  className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickDistractionModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-750 text-slate-700 dark:text-neutral-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-sm"
                >
                  Record Friction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
