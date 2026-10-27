import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Star } from 'lucide-react';
import type { Client, Project, Subtask, Task, TaskCategory, TaskPriority, TaskStatus } from '../types.js';
import { CustomSelect, type SelectOption } from './CustomSelect.js';

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
      setTitle('');
      setDescription('');
      setCategory('client');
      setClientId(clients[0]?.id || '');
      setProjectId('');
      setPriority('medium');
      setStatus('todo');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setDeadline('');
      setEstimatedDurationMinutes(45);
      setIsDailyTop3(false);
      setTagsInput('');
      setNotes('');
      setSubtasks([]);
    }
    setShowDeleteConfirm(false);
  }, [initialTask, clients, isOpen]);

  const filteredProjects = projects.filter(p => !clientId || p.clientId === clientId);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
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

  // Dropdown options
  const categoryOptions: SelectOption[] = [
    { value: 'client', label: 'Client Work' },
    { value: 'personal', label: 'Internal / Personal' },
  ];

  const clientOptions: SelectOption[] = [
    { value: '', label: 'No Client (Internal)' },
    ...clients.map(c => ({ value: c.id, label: c.businessName })),
  ];

  const projectOptions: SelectOption[] = [
    { value: '', label: 'No Project' },
    ...filteredProjects.map(p => ({ value: p.id, label: p.name })),
  ];

  const priorityOptions: SelectOption[] = [
    { value: 'critical', label: 'Critical (P1)', color: '#ef4444' },
    { value: 'high', label: 'High (P2)', color: '#f97316' },
    { value: 'medium', label: 'Medium (P3)', color: '#3b82f6' },
    { value: 'low', label: 'Low (P4)', color: '#10b981' },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100">
              {initialTask ? 'Edit Deliverable' : 'Create New Deliverable'}
            </h2>
            <button
              type="button"
              onClick={() => setIsDailyTop3(!isDailyTop3)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                isDailyTop3
                  ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
              title="Pin to Daily Top 3 Priorities"
            >
              <Star size={13} className={isDailyTop3 ? 'fill-amber-400 text-amber-400' : ''} />
              <span>Daily Top 3</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Audit Meta Ads ROAS and deploy Winning UGC Creatives"
              className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3.5 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Scope & Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Key deliverables, acceptance criteria, or target outcomes..."
              className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Category & Client & Project using CustomSelect */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <CustomSelect
                label="Category"
                value={category}
                options={categoryOptions}
                onChange={val => setCategory(val as TaskCategory)}
              />
            </div>

            {category === 'client' && (
              <>
                <div>
                  <CustomSelect
                    label="Client"
                    value={clientId}
                    options={clientOptions}
                    onChange={val => {
                      setClientId(val);
                      setProjectId('');
                    }}
                    placeholder="Select client"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Project"
                    value={projectId}
                    options={projectOptions}
                    onChange={val => setProjectId(val)}
                    placeholder="Select project"
                  />
                </div>
              </>
            )}
          </div>

          {/* Priority, Status, Duration with CustomSelect */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <CustomSelect
                label="Priority"
                value={priority}
                options={priorityOptions}
                onChange={val => setPriority(val as TaskPriority)}
              />
            </div>

            <div>
              <CustomSelect
                label="Status"
                value={status}
                options={statusOptions}
                onChange={val => setStatus(val as TaskStatus)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Est Duration (mins)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={estimatedDurationMinutes}
                onChange={e => setEstimatedDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Hard Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. Meta Ads, ROAS, Scaling, Q4"
              className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Subtasks Checklist */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Subtasks & Milestones</label>
            <div className="space-y-1.5 mb-2">
              {subtasks.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-neutral-850 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={s.completed}
                      onChange={() => handleToggleSubtask(s.id)}
                      className="rounded border-slate-300 dark:border-neutral-700 text-violet-600 focus:ring-0"
                    />
                    <span className={s.completed ? 'line-through text-slate-400 dark:text-neutral-500 truncate' : 'text-slate-800 dark:text-neutral-200 truncate'}>
                      {s.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(s.id)}
                    className="text-slate-400 dark:text-neutral-500 hover:text-rose-500 p-0.5"
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
                className="flex-1 bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-750 text-slate-800 dark:text-neutral-200 text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Internal Strategy Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, links, or client feedback..."
              className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div>
              {initialTask && onDelete && (
                <div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-500">Confirm delete?</span>
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
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-750 text-slate-700 dark:text-neutral-300 text-xs font-medium transition-colors"
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
