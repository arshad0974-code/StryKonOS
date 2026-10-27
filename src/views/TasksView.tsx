import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Star,
  Copy,
  Trash2,
  LayoutList,
  Columns3,
  MoreVertical,
  Play,
} from 'lucide-react';
import type { Client, Project, Task, TaskCategory, TaskPriority, TaskStatus } from '../types.js';
import { CustomSelect, type SelectOption } from '../components/CustomSelect.js';

interface TasksViewProps {
  tasks: Task[];
  clients: Client[];
  projects: Project[];
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onOpenTaskModal: (task?: Task) => void;
  onSelectTaskForFocus: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  clients,
  projects,
  onSaveTask,
  onDeleteTask,
  onOpenTaskModal,
  onSelectTaskForFocus,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'client' | 'personal'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'title' | 'duration'>('priority');

  const clientMap = new Map(clients.map(c => [c.id, c]));

  const categoryFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'client', label: 'Client Work' },
    { value: 'personal', label: 'Personal / Internal' },
  ];

  const clientFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Clients' },
    ...clients.map(c => ({ value: c.id, label: c.businessName })),
  ];

  const priorityFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical (P1)', color: '#ef4444' },
    { value: 'high', label: 'High (P2)', color: '#f97316' },
    { value: 'medium', label: 'Medium (P3)', color: '#3b82f6' },
    { value: 'low', label: 'Low (P4)', color: '#10b981' },
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
  ];

  const sortByOptions: SelectOption[] = [
    { value: 'priority', label: 'Sort: Priority' },
    { value: 'deadline', label: 'Sort: Deadline' },
    { value: 'duration', label: 'Sort: Duration' },
    { value: 'title', label: 'Sort: Title' },
  ];

  const taskStatusOptions: SelectOption[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
  ];

  // Filtering
  const filteredTasks = tasks.filter(task => {
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    if (clientFilter !== 'all' && task.clientId !== clientFilter) return false;
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTags = task.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const pOrder: Record<TaskPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return pOrder[b.priority] - pOrder[a.priority];
    }
    if (sortBy === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    if (sortBy === 'duration') {
      return (b.estimatedDurationMinutes || 0) - (a.estimatedDurationMinutes || 0);
    }
    return a.title.localeCompare(b.title);
  });

  const handleDuplicateTask = async (task: Task) => {
    await onSaveTask({
      ...task,
      id: undefined,
      title: `${task.title} (Copy)`,
      status: 'todo',
      createdAt: new Date().toISOString(),
      completedAt: undefined,
    });
  };

  const handleUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
    await onSaveTask({
      ...task,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const kanbanColumns: Array<{ status: TaskStatus; label: string }> = [
    { status: 'backlog', label: 'Backlog' },
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'in_review', label: 'In Review' },
    { status: 'completed', label: 'Completed' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 tracking-tight">Deliverables & Tasks</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {filteredTasks.length} deliverable{filteredTasks.length === 1 ? '' : 's'} matching current filters
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented View Mode Control (Allowed functional tab) */}
          <div className="flex items-center gap-1 p-1 bg-neutral-850 rounded-lg border border-neutral-750">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-neutral-750 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutList size={14} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-neutral-750 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Columns3 size={14} />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => onOpenTaskModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>New Deliverable</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search deliverables..."
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <CustomSelect
            size="sm"
            value={categoryFilter}
            options={categoryFilterOptions}
            onChange={val => setCategoryFilter(val as any)}
            className="min-w-[130px]"
          />

          {/* Client Filter */}
          <CustomSelect
            size="sm"
            value={clientFilter}
            options={clientFilterOptions}
            onChange={val => setClientFilter(val)}
            className="min-w-[130px]"
          />

          {/* Priority Filter */}
          <CustomSelect
            size="sm"
            value={priorityFilter}
            options={priorityFilterOptions}
            onChange={val => setPriorityFilter(val)}
            className="min-w-[130px]"
          />

          {/* Status Filter (in List View) */}
          {viewMode === 'list' && (
            <CustomSelect
              size="sm"
              value={statusFilter}
              options={statusFilterOptions}
              onChange={val => setStatusFilter(val)}
              className="min-w-[130px]"
            />
          )}

          {/* Sort By */}
          <CustomSelect
            size="sm"
            value={sortBy}
            options={sortByOptions}
            onChange={val => setSortBy(val as any)}
            className="min-w-[130px]"
          />
        </div>

      </div>

      {/* Views: List or Kanban */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {sortedTasks.length === 0 ? (
            <div className="p-8 rounded-xl border border-neutral-800 bg-neutral-900/50 text-center">
              <p className="text-xs text-neutral-400 mb-3">No tasks match your selected filter criteria.</p>
              <button
                onClick={() => onOpenTaskModal()}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium"
              >
                Create a Task
              </button>
            </div>
          ) : (
            sortedTasks.map(task => {
              const client = task.clientId ? clientMap.get(task.clientId) : null;
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    isDone
                      ? 'border-neutral-800 bg-neutral-900/40 opacity-60'
                      : 'border-neutral-800 bg-neutral-900/90 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() =>
                        handleUpdateStatus(task, isDone ? 'todo' : 'completed')
                      }
                      className="mt-0.5 sm:mt-0 w-4 h-4 rounded border border-neutral-600 hover:border-emerald-500 flex items-center justify-center shrink-0"
                    >
                      {isDone && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {task.isDailyTop3 && (
                          <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                        )}
                        <h4
                          onClick={() => onOpenTaskModal(task)}
                          className={`text-xs font-semibold cursor-pointer truncate ${
                            isDone ? 'line-through text-neutral-400' : 'text-neutral-100 hover:text-violet-300'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 mt-1">
                        <span className={task.category === 'client' ? 'text-violet-400 font-medium' : 'text-neutral-300'}>
                          {client ? client.businessName : 'Internal'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{task.priority} Priority</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{task.estimatedDurationMinutes}m est</span>
                        {task.actualDurationMinutes > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-emerald-400">
                              {task.actualDurationMinutes}m tracked
                            </span>
                          </>
                        )}
                        {task.deadline && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Due {task.deadline}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <CustomSelect
                      size="sm"
                      value={task.status}
                      options={taskStatusOptions}
                      onChange={val => handleUpdateStatus(task, val as TaskStatus)}
                      className="w-32"
                    />



                    {!isDone && (
                      <button
                        onClick={() => onSelectTaskForFocus(task)}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium flex items-center gap-1"
                        title="Focus"
                      >
                        <Play size={11} className="text-violet-400" />
                        <span>Focus</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDuplicateTask(task)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded"
                      title="Duplicate Task"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const colTasks = sortedTasks.filter(t => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col min-w-[240px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-200">{col.label}</span>
                  <span className="font-mono tabular-nums text-xs text-neutral-400">{colTasks.length}</span>
                </div>

                <div className="space-y-2.5 flex-1 min-h-[300px]">
                  {colTasks.map(task => {
                    const client = task.clientId ? clientMap.get(task.clientId) : null;
                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border border-neutral-800 bg-neutral-850 hover:border-neutral-700 transition-colors space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5
                            onClick={() => onOpenTaskModal(task)}
                            className="text-xs font-semibold text-neutral-100 hover:text-violet-300 cursor-pointer line-clamp-2"
                          >
                            {task.title}
                          </h5>
                          {task.isDailyTop3 && (
                            <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                          <span className="truncate max-w-[120px]">
                            {client ? client.businessName : 'Internal'}
                          </span>
                          <span className="font-mono tabular-nums">{task.estimatedDurationMinutes}m</span>
                        </div>

                        {/* Quick Kanban Move Select */}
                        <div className="pt-1">
                          <CustomSelect
                            size="sm"
                            value={task.status}
                            options={taskStatusOptions}
                            onChange={val => handleUpdateStatus(task, val as TaskStatus)}
                            className="w-full text-[11px]"
                          />
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
