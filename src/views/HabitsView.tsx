import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Check,
  ShieldAlert,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { DistractionRecord, Habit, HabitCompletion } from '../types.js';

interface HabitsViewProps {
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  distractions: DistractionRecord[];
  onSaveHabit: (habit: Partial<Habit>) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onToggleHabit: (habitId: string, date: string) => Promise<void>;
  onOpenDistractionModal: () => void;
  onNavigateAiDistractions: () => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  habitCompletions,
  distractions,
  onSaveHabit,
  onDeleteHabit,
  onToggleHabit,
  onOpenDistractionModal,
  onNavigateAiDistractions,
}) => {
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<Habit['category']>('custom');
  const [newHabitMinutes, setNewHabitMinutes] = useState(30);

  const todayStr = new Date().toISOString().split('T')[0];

  // Last 7 days for adherence grid
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isToday = dateStr === todayStr;
    return { dateStr, dayLabel, isToday };
  });

  const completionSet = new Set(
    habitCompletions.filter(c => c.completed).map(c => `${c.habitId}_${c.date}`)
  );

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    await onSaveHabit({
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      targetFrequency: 'weekdays',
      dailyTargetMinutes: newHabitMinutes,
      archived: false,
    });

    setNewHabitTitle('');
    setShowAddHabit(false);
  };

  // Group distractions by category
  const categoryCounts: Record<string, number> = {};
  distractions.forEach(d => {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="text-amber-400" size={20} />
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight">
              Habits & Distraction Journal
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Non-punitive consistency tracking. Build deep-work stamina and audit environmental triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDistractionModal}
            className="px-3.5 py-2 rounded-lg border border-neutral-750 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert size={14} className="text-amber-400" />
            <span>Log Distraction</span>
          </button>
          <button
            onClick={() => setShowAddHabit(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* Routine Tracker Table */}
      <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-100">7-Day Consistency Matrix</h3>
          <span className="text-xs text-neutral-400">Click any day node to toggle completion</span>
        </div>

        <div className="space-y-3">
          {habits.map(habit => {
            return (
              <div
                key={habit.id}
                className="p-3.5 rounded-lg bg-neutral-850/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-neutral-100 truncate">{habit.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    <span className="capitalize">{habit.category.replace('_', ' ')}</span>
                    {habit.dailyTargetMinutes && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{habit.dailyTargetMinutes}m target</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 7-day checkboxes */}
                <div className="flex items-center gap-2 shrink-0">
                  {days.map(d => {
                    const isDone = completionSet.has(`${habit.id}_${d.dateStr}`);
                    return (
                      <button
                        key={d.dateStr}
                        onClick={() => onToggleHabit(habit.id, d.dateStr)}
                        className={`w-7 h-8 rounded flex flex-col items-center justify-center text-[10px] font-mono transition-colors ${
                          isDone
                            ? 'bg-violet-600 text-white font-bold'
                            : d.isToday
                            ? 'bg-neutral-750 text-neutral-300 hover:bg-neutral-700 border border-violet-500/40'
                            : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-750'
                        }`}
                        title={`${habit.title} on ${d.dateStr}`}
                      >
                        <span>{d.dayLabel}</span>
                        {isDone && <Check size={10} className="stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distraction Journal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Distraction Log History */}
        <div className="lg:col-span-8 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Distraction Journal</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Recorded friction points & context switches</p>
            </div>
            <button
              onClick={onNavigateAiDistractions}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>AI Pattern Audit</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {distractions.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No interruptions logged yet. High concentration maintained!</p>
            ) : (
              distractions.slice(0, 8).map(dist => (
                <div
                  key={dist.id}
                  className="p-3 rounded-lg border border-neutral-800 bg-neutral-850 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200 capitalize">
                        {dist.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono tabular-nums">
                        {new Date(dist.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {dist.reason && <p className="text-neutral-300">{dist.reason}</p>}
                    {dist.notes && <p className="text-neutral-400 text-[11px] italic">Fix: {dist.notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Category Breakdown */}
        <div className="lg:col-span-4 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-100">Trigger Frequency</h3>
          <div className="space-y-2.5 text-xs">
            {Object.entries(categoryCounts).length === 0 ? (
              <p className="text-xs text-neutral-400">No data collected.</p>
            ) : (
              Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => {
                  const pct = Math.round((count / distractions.length) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-neutral-300 text-xs">
                        <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                        <span className="font-mono tabular-nums text-neutral-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-neutral-100">Create New Habit / Routine</h3>
            <form onSubmit={handleCreateHabit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  value={newHabitTitle}
                  onChange={e => setNewHabitTitle(e.target.value)}
                  placeholder="e.g. Sales Pipeline Outreach (10 video audits)"
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Target Daily Minutes</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={newHabitMinutes}
                  onChange={e => setNewHabitMinutes(Number(e.target.value))}
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHabit(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
