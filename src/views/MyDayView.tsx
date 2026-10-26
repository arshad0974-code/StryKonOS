import React, { useState } from 'react';
import {
  Sun,
  Star,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { Client, Task, TimeBlock, UserSettings } from '../types.js';

interface MyDayViewProps {
  tasks: Task[];
  clients: Client[];
  timeBlocks: TimeBlock[];
  settings: UserSettings;
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onToggleTaskComplete: (task: Task) => void;
  onSelectTaskForFocus: (task: Task) => void;
  onOpenTaskModal: (task?: Task) => void;
  onOpenDistractionModal: () => void;
  onNavigateSection: (section: any) => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({
  tasks,
  clients,
  timeBlocks,
  settings,
  onSaveTask,
  onToggleTaskComplete,
  onSelectTaskForFocus,
  onOpenTaskModal,
  onOpenDistractionModal,
  onNavigateSection,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [quickTitle, setQuickTitle] = useState('');
  const [quickClientId, setQuickClientId] = useState('');
  const [quickMinutes, setQuickMinutes] = useState(45);
  const [quickTop3, setQuickTop3] = useState(false);
  const [savingQuick, setSavingQuick] = useState(false);

  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Today's scheduled or top 3 tasks
  const todayTasks = tasks.filter(
    t => t.scheduledDate === todayStr || t.isDailyTop3 || (t.createdAt.startsWith(todayStr) && t.status !== 'backlog')
  );

  const top3Tasks = todayTasks.filter(t => t.isDailyTop3);
  const otherTodayTasks = todayTasks.filter(t => !t.isDailyTop3);

  const todayBlocks = timeBlocks
    .filter(b => b.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setSavingQuick(true);
    try {
      await onSaveTask({
        title: quickTitle.trim(),
        category: quickClientId ? 'client' : 'personal',
        clientId: quickClientId || undefined,
        priority: quickTop3 ? 'high' : 'medium',
        status: 'todo',
        scheduledDate: todayStr,
        deadline: todayStr,
        estimatedDurationMinutes: quickMinutes,
        actualDurationMinutes: 0,
        isDailyTop3: quickTop3,
        subtasks: [],
        tags: quickClientId && clientMap.get(quickClientId) ? [clientMap.get(quickClientId)!.businessName] : [],
        postponedCount: 0,
      });
      setQuickTitle('');
      setQuickTop3(false);
    } finally {
      setSavingQuick(false);
    }
  };

  const toggleTop3 = async (task: Task) => {
    await onSaveTask({
      ...task,
      isDailyTop3: !task.isDailyTop3,
      scheduledDate: todayStr,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sun className="text-amber-400" size={20} />
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight">My Day</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Concentrate strictly on today's highest-impact client deliverables and deep work sprints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDistractionModal}
            className="px-3 py-1.5 rounded-lg border border-neutral-750 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert size={14} className="text-amber-400" />
            <span>Log Distraction</span>
          </button>
          <button
            onClick={() => onNavigateSection('focus')}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play size={13} fill="currentColor" />
            <span>Start Deep Work</span>
          </button>
        </div>
      </div>

      {/* Quick Task Entry Bar */}
      <form onSubmit={handleQuickSubmit} className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            required
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            placeholder="Add a task for today (e.g. Deploy Meta Ads creative testing batch)..."
            className="flex-1 bg-neutral-850 border border-neutral-750 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={savingQuick || !quickTitle.trim()}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            {savingQuick ? 'Adding...' : 'Add to Today'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={quickClientId}
            onChange={e => setQuickClientId(e.target.value)}
            className="bg-neutral-850 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-violet-500"
          >
            <option value="">No Client (Internal Work)</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.businessName}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 bg-neutral-850 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200">
            <Clock size={13} className="text-neutral-400" />
            <input
              type="number"
              min={10}
              step={5}
              value={quickMinutes}
              onChange={e => setQuickMinutes(Number(e.target.value))}
              className="w-12 bg-transparent text-right font-mono tabular-nums text-xs focus:outline-none"
            />
            <span className="text-neutral-400">min</span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-300 ml-auto">
            <input
              type="checkbox"
              checked={quickTop3}
              onChange={e => setQuickTop3(e.target.checked)}
              className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0"
            />
            <Star size={13} className={quickTop3 ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'} />
            <span>Mark as Daily Top 3</span>
          </label>
        </div>
      </form>

      {/* Daily Top 3 Priorities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-200">Daily Top 3 Focus Priorities</h3>
          </div>
          <span className="text-xs font-mono tabular-nums text-neutral-400">{top3Tasks.filter(t => t.status === 'completed').length} / {top3Tasks.length} Completed</span>
        </div>

        <div className="space-y-2">
          {top3Tasks.length === 0 ? (
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 text-center">
              <p className="text-xs text-neutral-400 mb-2">No tasks are currently designated as Daily Top 3.</p>
              <p className="text-[11px] text-neutral-500">Click the star icon on any task below to promote it to your Top 3.</p>
            </div>
          ) : (
            top3Tasks.map(task => {
              const client = task.clientId ? clientMap.get(task.clientId) : null;
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    isDone
                      ? 'border-neutral-800/60 bg-neutral-900/40 opacity-70'
                      : 'border-amber-500/30 bg-neutral-900/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTaskComplete(task)}
                      className="mt-0.5 w-4 h-4 rounded border border-neutral-600 hover:border-emerald-500 flex items-center justify-center shrink-0 transition-colors"
                    >
                      {isDone && <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/20" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <h4
                        onClick={() => onOpenTaskModal(task)}
                        className={`text-xs font-semibold cursor-pointer truncate ${
                          isDone ? 'line-through text-neutral-400' : 'text-neutral-100 hover:text-violet-300'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-2">
                        <span className={task.category === 'client' ? 'text-violet-400' : 'text-neutral-300'}>
                          {client ? client.businessName : 'Internal'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{task.estimatedDurationMinutes}m est</span>
                        {task.subtasks.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleTop3(task)}
                      className="p-1 rounded text-amber-400 hover:bg-neutral-800"
                      title="Remove from Top 3"
                    >
                      <Star size={14} className="fill-amber-400" />
                    </button>
                    {!isDone && (
                      <button
                        onClick={() => onSelectTaskForFocus(task)}
                        className="px-2.5 py-1.5 rounded-lg border border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/50 text-violet-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Play size={12} className="text-violet-400 fill-violet-400/20" />
                        <span>Focus</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Additional Today's Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">Other Planned Tasks Today</h3>
          <span className="text-xs text-neutral-400">{otherTodayTasks.length} queued</span>
        </div>

        <div className="space-y-2">
          {otherTodayTasks.length === 0 ? (
            <p className="text-xs text-neutral-500 py-3 text-center">No secondary tasks scheduled for today.</p>
          ) : (
            otherTodayTasks.map(task => {
              const client = task.clientId ? clientMap.get(task.clientId) : null;
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 transition-colors flex items-center justify-between gap-4 ${
                    isDone ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTaskComplete(task)}
                      className="w-4 h-4 rounded border border-neutral-600 hover:border-emerald-500 flex items-center justify-center shrink-0"
                    >
                      {isDone && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span
                        onClick={() => onOpenTaskModal(task)}
                        className={`text-xs font-medium cursor-pointer truncate block ${
                          isDone ? 'line-through text-neutral-400' : 'text-neutral-200 hover:text-violet-300'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span>{client ? client.businessName : 'Internal'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{task.estimatedDurationMinutes}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleTop3(task)}
                      className="p-1 text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors"
                      title="Promote to Top 3"
                    >
                      <Star size={14} />
                    </button>
                    {!isDone && (
                      <button
                        onClick={() => onSelectTaskForFocus(task)}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Play size={11} className="text-violet-400" />
                        <span>Focus</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
