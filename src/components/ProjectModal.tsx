import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Client, Project } from '../types.js';
import { CustomSelect, type SelectOption } from './CustomSelect.js';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => Promise<void>;
  onDelete?: (projectId: string) => Promise<void>;
  initialProject?: Project | null;
  clients: Client[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialProject,
  clients,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<Project['status']>('in_progress');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name || '');
      setDescription(initialProject.description || '');
      setClientId(initialProject.clientId || '');
      setStartDate(initialProject.startDate || '');
      setDeadline(initialProject.deadline || '');
      setStatus(initialProject.status || 'in_progress');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setName('');
      setDescription('');
      setClientId(clients[0]?.id || '');
      setStartDate(todayStr);
      setDeadline(todayStr);
      setStatus('in_progress');
    }
    setShowDeleteConfirm(false);
  }, [initialProject, isOpen, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        ...(initialProject || {}),
        name: name.trim(),
        description: description.trim(),
        clientId: clientId || undefined,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const clientOptions: SelectOption[] = [
    { value: '', label: 'No Client (Internal / Personal)' },
    ...clients.map(c => ({ value: c.id, label: c.businessName })),
  ];

  const statusOptions: SelectOption[] = [
    { value: 'planning', label: 'Planning', color: '#9333ea' },
    { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { value: 'in_review', label: 'In Review', color: '#f59e0b' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
    { value: 'on_hold', label: 'On Hold', color: '#6b7280' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100">
            {initialProject ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Q4 Meta Ads Scaling & Creative Testing"
              className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <CustomSelect
              label="Associated Client"
              value={clientId}
              options={clientOptions}
              onChange={val => setClientId(val)}
              placeholder="Select client"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Project Scope</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Campaign deliverables, milestones, and success criteria..."
              className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Target Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <CustomSelect
                label="Status"
                value={status}
                options={statusOptions}
                onChange={val => setStatus(val as any)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div>
              {initialProject && onDelete && (
                <div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-500">Delete project?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true);
                          await onDelete(initialProject.id);
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
                      <span>Delete</span>
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
                {saving ? 'Saving...' : initialProject ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
