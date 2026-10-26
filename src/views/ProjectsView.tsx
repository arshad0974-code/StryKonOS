import React, { useState } from 'react';
import { Plus, FolderKanban, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { Client, Project, Task } from '../types.js';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  tasks: Task[];
  onOpenProjectModal: (project?: Project) => void;
  onOpenTaskModal: (task?: Task) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  tasks,
  onOpenProjectModal,
  onOpenTaskModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const clientMap = new Map(clients.map(c => [c.id, c]));

  const filteredProjects = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 tracking-tight">Campaigns & Projects</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage multi-week client engagements, ad campaign launches, and internal SOP development.
          </p>
        </div>

        <button
          onClick={() => onOpenProjectModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between text-xs">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ colorScheme: 'dark' }}
          className="bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-violet-500"
        >
          <option value="all" className="bg-neutral-900 text-neutral-100">All Project Statuses</option>
          <option value="planning" className="bg-neutral-900 text-neutral-100">Planning</option>
          <option value="in_progress" className="bg-neutral-900 text-neutral-100">In Progress</option>
          <option value="in_review" className="bg-neutral-900 text-neutral-100">In Review</option>
          <option value="completed" className="bg-neutral-900 text-neutral-100">Completed</option>
          <option value="on_hold" className="bg-neutral-900 text-neutral-100">On Hold</option>
        </select>
        <span className="text-xs font-mono tabular-nums text-neutral-400">{filteredProjects.length} active projects</span>
      </div>

      {/* Projects List / Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/50 space-y-3">
          <FolderKanban size={28} className="mx-auto text-neutral-600" />
          <p className="text-xs text-neutral-400">No agency projects found.</p>
          <button
            onClick={() => onOpenProjectModal()}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map(proj => {
            const client = proj.clientId ? clientMap.get(proj.clientId) : null;
            const projTasks = tasks.filter(t => t.projectId === proj.id);
            const doneTasks = projTasks.filter(t => t.status === 'completed');
            const progressPct = projTasks.length > 0 ? Math.round((doneTasks.length / projTasks.length) * 100) : 0;
            const totalHours = (
              projTasks.reduce((acc, t) => acc + (t.actualDurationMinutes || 0), 0) / 60
            ).toFixed(1);

            return (
              <div
                key={proj.id}
                className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-medium text-violet-400 uppercase tracking-wider block">
                        {client ? client.businessName : 'Internal Agency'}
                      </span>
                      <h3
                        onClick={() => onOpenProjectModal(proj)}
                        className="text-sm font-bold text-neutral-100 hover:text-violet-300 cursor-pointer mt-0.5"
                      >
                        {proj.name}
                      </h3>
                    </div>
                    <span className="capitalize text-xs font-mono text-neutral-300">
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{proj.description}</p>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono tabular-nums text-neutral-400">
                      <span>Deliverables: {doneTasks.length}/{projTasks.length}</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Related tasks snippet */}
                <div className="pt-3 border-t border-neutral-800">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono tabular-nums mb-2">
                    <span>Tracked: {totalHours}h</span>
                    <span>Due: {proj.deadline}</span>
                  </div>

                  <div className="space-y-1">
                    {projTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        onClick={() => onOpenTaskModal(task)}
                        className="text-xs text-neutral-300 hover:text-violet-300 truncate cursor-pointer flex items-center gap-1.5"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                        <span className={task.status === 'completed' ? 'line-through text-neutral-400 truncate' : 'truncate'}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
