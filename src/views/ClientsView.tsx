import React, { useState } from 'react';
import { Plus, Users, Search, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Client, Task } from '../types.js';
import { CustomSelect, type SelectOption } from '../components/CustomSelect.js';

interface ClientsViewProps {
  clients: Client[];
  tasks: Task[];
  onOpenClientModal: (client?: Client) => void;
  onOpenTaskModal: (task?: Task) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  tasks,
  onOpenClientModal,
  onOpenTaskModal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'retainer', label: 'Retainer', color: '#10b981' },
    { value: 'active', label: 'Active', color: '#3b82f6' },
    { value: 'lead', label: 'Lead', color: '#f59e0b' },
    { value: 'inactive', label: 'Inactive', color: '#6b7280' },
  ];

  const filteredClients = clients.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchBiz = c.businessName.toLowerCase().includes(q);
      const matchServices = c.services.some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchBiz && !matchServices) return false;
    }
    return true;
  });

  const totalMonthlyRetainers = clients
    .filter(c => c.status === 'retainer' || c.status === 'active')
    .reduce((acc, c) => acc + (c.monthlyValue || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 tracking-tight">Agency Clients</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage client scopes, service retainers, deliverables, and tracked billable hours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
            <span className="text-neutral-400">Total Active Retainers:</span>
            <span className="font-mono tabular-nums text-emerald-400 font-bold">
              ${totalMonthlyRetainers.toLocaleString()}/mo
            </span>
          </div>

          <button
            onClick={() => onOpenClientModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients or services (e.g. Meta Ads, Shopify)..."
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none"
          />
        </div>

        <CustomSelect
          size="sm"
          value={statusFilter}
          options={statusFilterOptions}
          onChange={val => setStatusFilter(val)}
          className="min-w-[140px]"
        />
      </div>


      {/* Clients Cards Grid / Empty State */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/50 space-y-3">
          <Users size={28} className="mx-auto text-neutral-600" />
          <p className="text-xs text-neutral-400">No agency clients found.</p>
          <button
            onClick={() => onOpenClientModal()}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            Add First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => {
            const clientTasks = tasks.filter(t => t.clientId === client.id);
            const completedTasks = clientTasks.filter(t => t.status === 'completed');
            const overdueTasks = clientTasks.filter(
              t => t.status !== 'completed' && t.deadline && t.deadline < todayStr
            );
            const totalTrackedMinutes = clientTasks.reduce(
              (acc, t) => acc + (t.actualDurationMinutes || 0),
              0
            );
            const trackedHours = (totalTrackedMinutes / 60).toFixed(1);

            return (
              <div
                key={client.id}
                className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        onClick={() => onOpenClientModal(client)}
                        className="text-sm font-bold text-neutral-100 hover:text-violet-300 cursor-pointer"
                      >
                        {client.businessName}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">Contact: {client.name}</p>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-emerald-400">
                      ${client.monthlyValue.toLocaleString()}/mo
                    </span>
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-neutral-400 mt-2.5 line-clamp-2">{client.notes}</p>
                  )}

                  {/* Services list (clean text with dots, no pill clutter) */}
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Services</span>
                    <div className="text-xs text-neutral-300 space-x-1.5">
                      {client.services.map((srv, idx) => (
                        <span key={srv}>
                          {srv}
                          {idx < client.services.length - 1 && <span className="text-neutral-500"> · </span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Client Performance Stats */}
                <div className="pt-3 border-t border-neutral-800 grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums text-neutral-400">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Deliverables</span>
                    <span className="text-neutral-200 font-semibold">
                      {completedTasks.length}/{clientTasks.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Logged</span>
                    <span className="text-neutral-200 font-semibold">{trackedHours}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Overdue</span>
                    <span className={overdueTasks.length > 0 ? 'text-rose-400 font-semibold' : 'text-neutral-400'}>
                      {overdueTasks.length}
                    </span>
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
