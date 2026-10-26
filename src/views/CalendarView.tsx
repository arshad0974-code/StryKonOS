import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import type { Task, TimeBlock, UserSettings } from '../types.js';

interface CalendarViewProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  settings: UserSettings;
  onSaveTimeBlock: (block: Partial<TimeBlock>) => Promise<void>;
  onDeleteTimeBlock: (blockId: string) => Promise<void>;
  onSaveTask: (task: Partial<Task>) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  timeBlocks,
  settings,
  onSaveTimeBlock,
  onDeleteTimeBlock,
  onSaveTask,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [calendarMode, setCalendarMode] = useState<'day' | 'week'>('day');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Block Form state
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:30');
  const [newCategory, setNewCategory] = useState<TimeBlock['category']>('deep_work');
  const [newTaskId, setNewTaskId] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue tasks
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.deadline && t.deadline < todayStr);

  const handleRescheduleOverdue = async (task: Task, targetDate: string) => {
    await onSaveTask({
      ...task,
      scheduledDate: targetDate,
      deadline: targetDate,
      postponedCount: (task.postponedCount || 0) + 1,
    });
  };

  // Conflict Detection: check if any two blocks on selectedDate overlap
  const dayBlocks = timeBlocks
    .filter(b => b.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const hasConflict = dayBlocks.some((b1, idx) => {
    return dayBlocks.slice(idx + 1).some(b2 => {
      // Overlap if (b1.start < b2.end) and (b1.end > b2.start)
      return b1.startTime < b2.endTime && b1.endTime > b2.startTime;
    });
  });

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const colors: Record<TimeBlock['category'], string> = {
      deep_work: '#8B5CF6',
      client_work: '#3B82F6',
      planning: '#EC4899',
      admin: '#F59E0B',
      outreach: '#10B981',
      personal: '#6B7280',
    };

    await onSaveTimeBlock({
      title: newTitle.trim(),
      date: selectedDate,
      startTime: newStartTime,
      endTime: newEndTime,
      category: newCategory,
      taskId: newTaskId || undefined,
      color: colors[newCategory],
      completed: false,
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  // Date navigation
  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const hoursArray = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 tracking-tight">Time-Blocked Schedule</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Block intentional focus periods, eliminate calendar fragmentation, and prevent overlaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Selector Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-850 rounded-lg border border-neutral-750 text-xs">
            <button
              onClick={() => navigateDay(-1)}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono tabular-nums px-2 font-medium text-neutral-200">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <button
              onClick={() => navigateDay(1)}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Overdue Deliverables Rescheduling Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <AlertTriangle size={15} />
            <span>{overdueTasks.length} Overdue Deliverable(s) Require Rescheduling:</span>
          </div>
          <div className="space-y-1.5">
            {overdueTasks.slice(0, 3).map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-900/60 border border-neutral-800"
              >
                <span className="text-neutral-200 truncate">{task.title}</span>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleRescheduleOverdue(task, todayStr)}
                    className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium"
                  >
                    Reschedule to Today
                  </button>
                  <button
                    onClick={() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      handleRescheduleOverdue(task, tom.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px]"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Detection Alert */}
      {hasConflict && (
        <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <span>
            <strong>Schedule Overlap Detected:</strong> Two or more scheduled blocks have conflicting time slots on this day. Adjust start or end times to prevent double-booking.
          </span>
        </div>
      )}

      {/* Hourly Schedule View */}
      <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <span className="text-xs font-semibold text-neutral-200">
            Day Schedule ({dayBlocks.length} Block{dayBlocks.length === 1 ? '' : 's'})
          </span>
          <span className="text-xs text-neutral-400">Working hours: 08:00 – 19:00</span>
        </div>

        <div className="relative space-y-3">
          {dayBlocks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-neutral-400 mb-2">No time blocks scheduled for this date.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium"
              >
                Schedule First Block
              </button>
            </div>
          ) : (
            dayBlocks.map(block => (
              <div
                key={block.id}
                className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-850 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: block.color || '#8B5CF6' }}
                  />
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-neutral-400 tabular-nums">
                      {block.startTime} – {block.endTime}
                    </span>
                    <h4 className="text-xs font-semibold text-neutral-100 truncate mt-0.5">
                      {block.title}
                    </h4>
                    <span className="text-[11px] text-neutral-400 capitalize">
                      {block.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteTimeBlock(block.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Block"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Time Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-neutral-100">Schedule Time Block</h3>

            <form onSubmit={handleCreateBlock} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Block Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Deep Work: Meta Ads ROAS Optimization"
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="deep_work" className="bg-neutral-900 text-neutral-100">Deep Focus Sprint</option>
                  <option value="client_work" className="bg-neutral-900 text-neutral-100">Client Deliverable Execution</option>
                  <option value="outreach" className="bg-neutral-900 text-neutral-100">Sales & Pipeline Outreach</option>
                  <option value="planning" className="bg-neutral-900 text-neutral-100">Strategy & Planning</option>
                  <option value="admin" className="bg-neutral-900 text-neutral-100">Client Meetings / Admin</option>
                  <option value="personal" className="bg-neutral-900 text-neutral-100">Personal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Link to Task (Optional)</label>
                <select
                  value={newTaskId}
                  onChange={e => setNewTaskId(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="" className="bg-neutral-900 text-neutral-100">None</option>
                  {tasks.filter(t => t.status !== 'completed').map(t => (
                    <option key={t.id} value={t.id} className="bg-neutral-900 text-neutral-100">
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
                >
                  Schedule Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
