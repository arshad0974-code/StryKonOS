import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Check, Clock, Calendar as CalendarIcon, Tag, Star } from 'lucide-react';
import type { Client, Project, Subtask, Task, TaskCategory, TaskPriority, TaskStatus } from '../types.js';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  initialTask?: Task | null;
  clients: Client[];
  projects: Project[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  clients,
  projects,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('client');
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(45);
  const [isDailyTop3, setIsDailyTop3] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setCategory(initialTask.category || 'client');
      setClientId(initialTask.clientId || '');
      setProjectId(initialTask.projectId || '');
      setPriority(initialTask.priority || 'medium');
      setStatus(initialTask.status || 'todo');
      setScheduledDate(initialTask.scheduledDate || '');
      setDeadline(initialTask.deadline || '');
      setEstimatedDurationMinutes(initialTask.estimatedDurationMinutes || 45);
      setIsDailyTop3(initialTask.isDailyTop3 || false);
      setTagsInput(initialTask.tags ? initialTask.tags.join(', ') : '');
      setNotes(initialTask.notes || '');
      setSubtasks(initialTask.subtasks || []);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setCategory('client');
      setClientId(clients[0]?.id || '');
      setProjectId('');
      setPriority('medium');
      setStatus('todo');
      setScheduledDate(todayStr);
      setDeadline(todayStr);
      setEstimatedDurationMinutes(45);
      setIsDailyTop3(false);
      setTagsInput('');
      setNotes('');
      setSubtasks([]);
    }
    setShowDeleteConfirm(false);
  }, [initialTask, isOpen, clients]);

  const filteredProjects = projects.filter(p => !clientId || p.clientId === clientId);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `sub_${Date.now()}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSave({
        ...(initialTask || {}),
        title: title.trim(),
        description: description.trim(),
        category,
        clientId: category === 'client' ? clientId || undefined : undefined,
        projectId: category === 'client' ? projectId || undefined : undefined,
        priority,
        status,
        scheduledDate: scheduledDate || undefined,
        deadline: deadline || undefined,
        estimatedDurationMinutes: Number(estimatedDurationMinutes) || 30,
        isDailyTop3,
        tags,
        notes: notes.trim() || undefined,
        subtasks,
        completedAt: status === 'completed' && !initialTask?.completedAt ? new Date().toISOString() : initialTask?.completedAt,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-100">
              {initialTask ? 'Edit Deliverable' : 'Create New Deliverable'}
            </h2>
            <button
              type="button"
              onClick={() => setIsDailyTop3(!isDailyTop3)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                isDailyTop3
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Pin to Daily Top 3 Priorities"
            >
              <Star size={13} className={isDailyTop3 ? 'fill-amber-400 text-amber-400' : ''} />
              <span>Daily Top 3</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Audit Meta Ads ROAS and deploy Winning UGC Creatives"
              className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Scope & Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Key deliverables, acceptance criteria, or target outcomes..."
              className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Category & Client & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              >
                <option value="client" className="bg-neutral-900 text-neutral-100">Client Work</option>
                <option value="personal" className="bg-neutral-900 text-neutral-100">Internal / Personal</option>
              </select>
            </div>

            {category === 'client' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Client</label>
                  <select
                    value={clientId}
                    onChange={e => {
                      setClientId(e.target.value);
                      setProjectId('');
                    }}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="" className="bg-neutral-900 text-neutral-100">No Client (Internal)</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-neutral-900 text-neutral-100">
                        {c.businessName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Project</label>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="" className="bg-neutral-900 text-neutral-100">No Project</option>
                    {filteredProjects.map(p => (
                      <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-100">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Priority, Status, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              >
                <option value="critical" className="bg-neutral-900 text-neutral-100">Critical (P1)</option>
                <option value="high" className="bg-neutral-900 text-neutral-100">High (P2)</option>
                <option value="medium" className="bg-neutral-900 text-neutral-100">Medium (P3)</option>
                <option value="low" className="bg-neutral-900 text-neutral-100">Low (P4)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              >
                <option value="backlog" className="bg-neutral-900 text-neutral-100">Backlog</option>
                <option value="todo" className="bg-neutral-900 text-neutral-100">To Do</option>
                <option value="in_progress" className="bg-neutral-900 text-neutral-100">In Progress</option>
                <option value="in_review" className="bg-neutral-900 text-neutral-100">In Review</option>
                <option value="completed" className="bg-neutral-900 text-neutral-100">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Est Duration (mins)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={estimatedDurationMinutes}
                onChange={e => setEstimatedDurationMinutes(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Scheduled Date & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Hard Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. Meta Ads, ROAS, Scaling, Q4"
              className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Subtasks Checklist */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Subtasks & Milestones</label>
            <div className="space-y-1.5 mb-2">
              {subtasks.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 p-2 bg-neutral-850 rounded-lg border border-neutral-800 text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={s.completed}
                      onChange={() => handleToggleSubtask(s.id)}
                      className="rounded border-neutral-700 bg-neutral-800 text-violet-600 focus:ring-0"
                    />
                    <span className={s.completed ? 'line-through text-neutral-500 truncate' : 'text-neutral-200 truncate'}>
                      {s.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(s.id)}
                    className="text-neutral-500 hover:text-rose-400 p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask..."
                className="flex-1 bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Internal Strategy Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, links, or client feedback..."
              className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
            <div>
              {initialTask && onDelete && (
                <div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-400">Confirm delete?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true);
                          await onDelete(initialTask.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Delete Task</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : initialTask ? 'Update Deliverable' : 'Create Deliverable'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
