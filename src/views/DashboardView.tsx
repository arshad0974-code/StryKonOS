import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  AlertTriangle,
  Play,
  TrendingUp,
  Target,
  Info,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Star,
} from 'lucide-react';
import type {
  Client,
  FocusSession,
  HabitCompletion,
  Project,
  Task,
  TimeBlock,
  UserProfile,
  UserSettings,
} from '../types.js';
import { calculateProductivityScore, calculateStreakDays } from '../utils/productivity.js';

interface DashboardViewProps {
  user: UserProfile | null;
  tasks: Task[];
  clients: Client[];
  projects: Project[];
  focusSessions: FocusSession[];
  habitCompletions: HabitCompletion[];
  timeBlocks: TimeBlock[];
  settings: UserSettings;
  onSelectTaskForFocus: (task: Task) => void;
  onToggleTaskComplete: (task: Task) => void;
  onOpenTaskModal: (task?: Task) => void;
  onNavigateSection: (section: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  tasks,
  clients,
  projects,
  focusSessions,
  habitCompletions,
  timeBlocks,
  settings,
  onSelectTaskForFocus,
  onToggleTaskComplete,
  onOpenTaskModal,
  onNavigateSection,
}) => {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic calculations from persistent data
  const todayTasks = tasks.filter(t => t.scheduledDate === todayStr || t.createdAt.startsWith(todayStr));
  const plannedCount = todayTasks.length;
  const completedTodayTasks = tasks.filter(t => t.status === 'completed' && t.completedAt?.startsWith(todayStr));
  const completedCount = completedTodayTasks.length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.deadline) return false;
    return t.deadline < todayStr;
  });

  const dailyTop3 = tasks.filter(t => t.isDailyTop3 && t.status !== 'completed');

  // Focus time today
  const todayCompletedSessions = focusSessions.filter(
    s => s.startTime.startsWith(todayStr) && s.status === 'completed'
  );
  const actualFocusSeconds = todayCompletedSessions.reduce((acc, s) => acc + s.actualElapsedSeconds, 0);
  const actualFocusMinutes = Math.round(actualFocusSeconds / 60);
  const targetFocusMinutes = settings.dailyFocusTargetMinutes || 240;
  const focusPercent = Math.min(100, Math.round((actualFocusMinutes / targetFocusMinutes) * 100));

  // Planned vs actual work hours
  const plannedMinutes = tasks
    .filter(t => t.scheduledDate === todayStr || t.isDailyTop3)
    .reduce((acc, t) => acc + (t.estimatedDurationMinutes || 0), 0);
  const actualTrackedMinutes = tasks.reduce((acc, t) => acc + (t.actualDurationMinutes || 0), 0);
  const plannedHours = (plannedMinutes / 60).toFixed(1);
  const actualHours = (actualTrackedMinutes / 60).toFixed(1);

  // Distraction count today
  const todayDistractionsCount = todayCompletedSessions.reduce(
    (acc, s) => acc + (s.distractionsCount || 0),
    0
  );

  // Productivity score calculation
  const scoreBreakdown = calculateProductivityScore(todayStr, tasks, focusSessions, timeBlocks, settings);

  // Current streak
  const streakDays = calculateStreakDays(habitCompletions, focusSessions);

  // Routine adherence today (e.g. 5 suggested routines)
  const todayHabitDone = habitCompletions.filter(c => c.date === todayStr && c.completed).length;
  const routineAdherencePercent = Math.min(100, Math.round((todayHabitDone / 5) * 100));

  // Today time blocks sorted
  const todayBlocks = timeBlocks
    .filter(b => b.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Client map
  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Weekly focus trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const weeklyFocusData = last7Days.map(date => {
    const daySessions = focusSessions.filter(s => s.startTime.startsWith(date) && s.status === 'completed');
    const mins = Math.round(daySessions.reduce((acc, s) => acc + s.actualElapsedSeconds, 0) / 60);
    const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    return { date, dayName, mins };
  });

  const maxWeeklyMins = Math.max(120, ...weeklyFocusData.map(d => d.mins));

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-100 tracking-tight">
            {greeting}, {user?.name || 'Arshad'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span>{user?.agencyName || 'Strykon'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">System Active</span>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateSection('my_day')}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-750 bg-neutral-850 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <span>My Day Cockpit</span>
            <ChevronRight size={14} className="text-neutral-400" />
          </button>
          <button
            onClick={() => onNavigateSection('ai_coach')}
            className="px-3.5 py-1.5 rounded-lg border border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/40 text-xs font-medium text-violet-200 transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-violet-400" />
            <span>AI Daily Brief</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert Banner if any overdue tasks exist */}
      {overdueTasks.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>
              <strong className="font-semibold text-rose-300">{overdueTasks.length} deliverable{overdueTasks.length > 1 ? 's are' : ' is'} past deadline.</strong> Review deliverables to reschedule or fulfill.
            </span>
          </div>
          <button
            onClick={() => onNavigateSection('tasks')}
            className="text-xs font-medium text-rose-300 hover:text-white underline underline-offset-2 shrink-0 ml-4"
          >
            View Overdue Tasks
          </button>
        </div>
      )}

      {/* Primary KPI Grid (6 metrics, no pills, strict tabular numbers) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Tasks Today */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Planned / Done</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-100">{completedCount}</span>
            <span className="text-sm font-mono tabular-nums text-neutral-400">/ {plannedCount}</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1">{pendingCount} total active</span>
        </div>

        {/* Metric 2: Focus Time vs Target */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Focus Time</span>
            <span className="text-[11px] font-mono tabular-nums text-violet-400 font-semibold">{focusPercent}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-violet-300">{actualFocusMinutes}</span>
            <span className="text-xs font-mono tabular-nums text-neutral-400">/ {targetFocusMinutes}m</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden mt-1.5">
            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${focusPercent}%` }} />
          </div>
        </div>

        {/* Metric 3: Planned vs Tracked Hours */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Tracked Hours</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-cyan-300">{actualHours}</span>
            <span className="text-xs font-mono tabular-nums text-neutral-400">/ {plannedHours}h plan</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1">Agency billable flow</span>
        </div>

        {/* Metric 4: Productivity Score */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Focus Score</span>
            <button
              onClick={() => setShowFormulaModal(true)}
              className="text-neutral-400 hover:text-neutral-200"
              title="Explain score calculation"
            >
              <Info size={13} />
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">{scoreBreakdown.score}</span>
            <span className="text-xs text-neutral-400">/ 100</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 truncate">Transparent weight</span>
        </div>

        {/* Metric 5: Streak & Routines */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Habit Streak</span>
            <Flame size={13} className="text-amber-400 fill-amber-400/20" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-300">{streakDays}</span>
            <span className="text-xs text-neutral-400">days</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 font-mono tabular-nums">{routineAdherencePercent}% routine today</span>
        </div>

        {/* Metric 6: Distractions Logged */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Distractions</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${todayDistractionsCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {todayDistractionsCount}
            </span>
            <span className="text-xs text-neutral-400">logged</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1">{todayDistractionsCount === 0 ? 'Zero friction' : 'Logged & audited'}</span>
        </div>
      </div>

      {/* Two Column Layout: Top 3 Priorities & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Daily Top 3 Priorities */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400/20" />
              <h3 className="text-sm font-semibold text-neutral-200">Daily Top 3 Priorities</h3>
            </div>
            <span className="text-xs text-neutral-400">High-leverage focus items</span>
          </div>

          <div className="space-y-2">
            {dailyTop3.length === 0 ? (
              <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 text-center">
                <p className="text-xs text-neutral-400 mb-3">All Daily Top 3 priorities have been executed or not yet designated.</p>
                <button
                  onClick={() => onNavigateSection('my_day')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-xs text-neutral-200 font-medium"
                >
                  Pick Top 3 in My Day
                </button>
              </div>
            ) : (
              dailyTop3.map(task => {
                const client = task.clientId ? clientMap.get(task.clientId) : null;
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleTaskComplete(task)}
                        className="mt-0.5 w-4 h-4 rounded border border-neutral-600 hover:border-emerald-500 flex items-center justify-center shrink-0 transition-colors"
                        title="Mark complete"
                      >
                        {task.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/20" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <h4
                          onClick={() => onOpenTaskModal(task)}
                          className="text-xs font-semibold text-neutral-100 hover:text-violet-300 cursor-pointer truncate"
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-2">
                          <span className={task.category === 'client' ? 'text-violet-400' : 'text-neutral-300'}>
                            {client ? client.businessName : 'Internal Work'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{task.estimatedDurationMinutes}m est</span>
                          {task.deadline && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className={task.deadline < todayStr ? 'text-rose-400 font-medium' : ''}>
                                Due {task.deadline === todayStr ? 'Today' : task.deadline}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onSelectTaskForFocus(task)}
                        className="px-2.5 py-1.5 rounded-lg border border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/50 text-violet-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Start Focus Session on this task"
                      >
                        <Play size={12} className="text-violet-400 fill-violet-400/20" />
                        <span>Focus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Today's Time-Blocked Schedule */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-neutral-200">Today's Schedule</h3>
            </div>
            <button
              onClick={() => onNavigateSection('calendar')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-2.5">
            {todayBlocks.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No time blocks scheduled for today yet.</p>
            ) : (
              todayBlocks.map(block => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-850 border border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-neutral-400 tabular-nums shrink-0">
                      {block.startTime} - {block.endTime}
                    </span>
                    <span className="font-medium text-neutral-200 truncate">{block.title}</span>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: block.color || '#8B5CF6' }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts & Trends Row: Weekly Focus Trend & Client Workload Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Focus Trend SVG Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Weekly Focus Hours Trend</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Deep work session duration logged per day</p>
            </div>
            <span className="text-xs font-mono tabular-nums text-neutral-400">Target: {targetFocusMinutes}m / day</span>
          </div>

          {/* SVG Bar Chart with Tabular Numbers */}
          <div className="h-44 w-full flex items-end justify-between gap-3 pt-6 pb-2">
            {weeklyFocusData.map(d => {
              const heightPct = Math.min(100, Math.round((d.mins / maxWeeklyMins) * 100));
              const isToday = d.date === todayStr;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono tabular-nums text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.mins}m
                  </span>
                  <div className="w-full max-w-[36px] bg-neutral-800 rounded-t-md overflow-hidden flex flex-col justify-end h-32">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isToday ? 'bg-gradient-to-t from-violet-600 to-indigo-500' : 'bg-neutral-700 hover:bg-neutral-600'
                      }`}
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-violet-400 font-bold' : 'text-neutral-400'}`}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client-Wise Workload & Deliverable Distribution */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-100">Client Retainer Workload</h3>
            <button
              onClick={() => onNavigateSection('clients')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              All Clients
            </button>
          </div>

          <div className="space-y-3">
            {clients.slice(0, 4).map(client => {
              const clientTasks = tasks.filter(t => t.clientId === client.id);
              const activeCount = clientTasks.filter(t => t.status !== 'completed').length;
              const trackedHours = (
                clientTasks.reduce((acc, t) => acc + (t.actualDurationMinutes || 0), 0) / 60
              ).toFixed(1);

              return (
                <div key={client.id} className="p-3 rounded-lg bg-neutral-850/80 border border-neutral-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200 truncate">{client.businessName}</span>
                    <span className="font-mono tabular-nums text-emerald-400 font-medium">
                      ${client.monthlyValue.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{client.services.slice(0, 2).join(' · ')}</span>
                    <span className="font-mono tabular-nums">{activeCount} active · {trackedHours}h logged</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transparent Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-neutral-100">Transparent Productivity Score Formula</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              StrykonOS uses a transparent, non-gamified formula to calculate your daily focus execution without vanity bias:
            </p>
            <div className="p-3 bg-neutral-850 rounded-lg border border-neutral-800 space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-neutral-300">
                <span>Priority Deliverables ({settings.scoreWeightPriority}% weight):</span>
                <span className="text-violet-400">{scoreBreakdown.priorityScore}%</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Daily Focus Target ({settings.scoreWeightFocus}% weight):</span>
                <span className="text-violet-400">{scoreBreakdown.focusScore}%</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Schedule Adherence ({settings.scoreWeightSchedule}% weight):</span>
                <span className="text-violet-400">{scoreBreakdown.scheduleScore}%</span>
              </div>
              <div className="pt-2 border-t border-neutral-750 flex justify-between font-bold text-emerald-400">
                <span>Final Score:</span>
                <span>{scoreBreakdown.score} / 100</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400">
              You can adjust the weight distribution anytime in <strong>Settings</strong> to match your personal operating style.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
