import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  PieChart,
  Layers,
} from 'lucide-react';
import type { Client, DistractionRecord, FocusSession, HabitCompletion, Project, Task } from '../types.js';
import { exportToCSV } from '../utils/productivity.js';

interface AnalyticsViewProps {
  tasks: Task[];
  clients: Client[];
  projects: Project[];
  focusSessions: FocusSession[];
  distractions: DistractionRecord[];
  habitCompletions: HabitCompletion[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  clients,
  projects,
  focusSessions,
  distractions,
  habitCompletions,
}) => {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const todayStr = new Date().toISOString().split('T')[0];

  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Date boundary calculation based on timeframe
  const getFilteredDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (timeframe === 'day') {
      // just today
    } else if (timeframe === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (timeframe === 'month') {
      start.setDate(end.getDate() - 30);
    }
    return {
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
    };
  };

  const { startStr, endStr } = getFilteredDateRange();

  // Metrics for active range
  const filteredSessions = focusSessions.filter(
    s => s.startTime.split('T')[0] >= startStr && s.startTime.split('T')[0] <= endStr
  );
  const completedSessions = filteredSessions.filter(s => s.status === 'completed');
  const totalFocusSeconds = completedSessions.reduce((acc, s) => acc + s.actualElapsedSeconds, 0);
  const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);

  const filteredDistractions = distractions.filter(
    d => d.timestamp.split('T')[0] >= startStr && d.timestamp.split('T')[0] <= endStr
  );

  const totalTrackedMinutes = tasks.reduce((acc, t) => acc + (t.actualDurationMinutes || 0), 0);
  const totalTrackedHours = (totalTrackedMinutes / 60).toFixed(1);

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const overdueTasksCount = tasks.filter(
    t => t.status !== 'completed' && t.deadline && t.deadline < todayStr
  ).length;

  const postponedTasks = tasks.filter(t => (t.postponedCount || 0) > 0);

  // Client time distribution
  const clientTimeMap: Record<string, number> = {};
  let totalClientMins = 0;
  tasks.forEach(t => {
    const cid = t.clientId || 'internal';
    const mins = t.actualDurationMinutes || 0;
    clientTimeMap[cid] = (clientTimeMap[cid] || 0) + mins;
    totalClientMins += mins;
  });

  // Client workload chart data
  const clientDistribution = Object.entries(clientTimeMap).map(([cid, mins]) => {
    const name = cid === 'internal' ? 'Internal / Personal' : clientMap.get(cid)?.businessName || 'Client Work';
    const hours = (mins / 60).toFixed(1);
    const pct = totalClientMins > 0 ? Math.round((mins / totalClientMins) * 100) : 0;
    return { name, hours, pct };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 tracking-tight">Analytics & Executive Reports</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Empirical data derived from actual completed timers, task history, and distraction logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-850 rounded-lg border border-neutral-750 text-xs">
            <button
              onClick={() => setTimeframe('day')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                timeframe === 'day' ? 'bg-neutral-750 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                timeframe === 'week' ? 'bg-neutral-750 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                timeframe === 'month' ? 'bg-neutral-750 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* CSV Export Button */}
          <button
            onClick={() => exportToCSV(tasks, clients, focusSessions)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors shadow-sm"
            title="Download CSV export"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-1">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Deep Focus Time</span>
          <div className="flex items-baseline gap-1 text-2xl font-bold font-mono tabular-nums text-violet-300">
            <span>{totalFocusHours}</span>
            <span className="text-xs text-neutral-400 font-sans">hours</span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono tabular-nums">{completedSessions.length} sessions completed</span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-1">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Total Work Tracked</span>
          <div className="flex items-baseline gap-1 text-2xl font-bold font-mono tabular-nums text-cyan-300">
            <span>{totalTrackedHours}</span>
            <span className="text-xs text-neutral-400 font-sans">hours</span>
          </div>
          <span className="text-[11px] text-neutral-400">All client & internal tasks</span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-1">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Completion Rate</span>
          <div className="flex items-baseline gap-1 text-2xl font-bold font-mono tabular-nums text-emerald-400">
            <span>{taskCompletionRate}%</span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono tabular-nums">{completedTasksCount} / {tasks.length} deliverables</span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-1">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Friction / Interrupted</span>
          <div className="flex items-baseline gap-1 text-2xl font-bold font-mono tabular-nums text-amber-400">
            <span>{filteredDistractions.length}</span>
            <span className="text-xs text-neutral-400 font-sans">events</span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono tabular-nums">{overdueTasksCount} overdue tasks</span>
        </div>
      </div>

      {/* Two Column Grid: Client Time Distribution & Repeatedly Postponed Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Client Time Distribution */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Client & Project Time Allocation</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Distribution of actual tracked hours across agency accounts</p>
            </div>
            <span className="font-mono tabular-nums text-xs text-neutral-400">{totalTrackedHours}h total</span>
          </div>

          <div className="space-y-3">
            {clientDistribution.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No client time records logged yet.</p>
            ) : (
              clientDistribution.map(item => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-200">{item.name}</span>
                    <span className="font-mono tabular-nums text-neutral-400">
                      {item.hours}h ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Postponed & Bottleneck Tasks */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Repeatedly Postponed Deliverables</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Tasks deferred more than once (potential bottlenecks)</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {postponedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Zero deferred deliverables. Clean execution velocity!
              </div>
            ) : (
              postponedTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-neutral-800 bg-neutral-850 text-xs flex items-center justify-between gap-3"
                >
                  <div className="truncate min-w-0">
                    <span className="font-medium text-neutral-200 truncate block">{task.title}</span>
                    <span className="text-[11px] text-neutral-400 capitalize">
                      {task.priority} Priority · {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-amber-400 font-semibold shrink-0">
                    {task.postponedCount}x deferred
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
