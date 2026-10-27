import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Client } from '../types.js';
import { CustomSelect, type SelectOption } from './CustomSelect.js';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => Promise<void>;
  onDelete?: (clientId: string) => Promise<void>;
  initialClient?: Client | null;
}

const AVAILABLE_SERVICES = [
  'Meta Ads',
  'Google Ads',
  'SEO, AEO and GEO',
  'Shopify and website development',
  'Lead generation and conversion optimization',
  'AI automation and workflow development',
  'Sales outreach, learning and agency growth',
];

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialClient,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'retainer' | 'lead' | 'inactive'>('active');
  const [monthlyValue, setMonthlyValue] = useState(3500);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialClient) {
      setName(initialClient.name || '');
      setBusinessName(initialClient.businessName || '');
      setContactEmail(initialClient.contactEmail || '');
      setContactPhone(initialClient.contactPhone || '');
      setStatus(initialClient.status || 'active');
      setMonthlyValue(initialClient.monthlyValue || 0);
      setSelectedServices(initialClient.services || []);
      setNotes(initialClient.notes || '');
    } else {
      setName('');
      setBusinessName('');
      setContactEmail('');
      setContactPhone('');
      setStatus('retainer');
      setMonthlyValue(4000);
      setSelectedServices(['Meta Ads', 'Shopify and website development']);
      setNotes('');
    }
    setShowDeleteConfirm(false);
  }, [initialClient, isOpen]);

  const toggleService = (srv: string) => {
    if (selectedServices.includes(srv)) {
      setSelectedServices(selectedServices.filter(s => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessName.trim()) return;

    setSaving(true);
    try {
      await onSave({
        ...(initialClient || {}),
        name: name.trim(),
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        status,
        monthlyValue: Number(monthlyValue) || 0,
        services: selectedServices,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: SelectOption[] = [
    { value: 'retainer', label: 'Monthly Retainer', color: '#10b981' },
    { value: 'active', label: 'Active Project', color: '#3b82f6' },
    { value: 'lead', label: 'Sales Lead', color: '#f59e0b' },
    { value: 'inactive', label: 'Inactive', color: '#6b7280' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100">
            {initialClient ? 'Edit Client Account' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">
                Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Miller"
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">
                Business / Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Velox Footwear"
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="contact@brand.com"
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Client Status"
                value={status}
                options={statusOptions}
                onChange={val => setStatus(val as any)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Monthly Value ($)</label>
              <input
                type="number"
                min={0}
                step={250}
                value={monthlyValue}
                onChange={e => setMonthlyValue(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-2">Agency Services Provided</label>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 dark:bg-neutral-850/60 rounded-lg border border-slate-200 dark:border-neutral-800">
              {AVAILABLE_SERVICES.map(srv => {
                const checked = selectedServices.includes(srv);
                return (
                  <label
                    key={srv}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 font-medium'
                        : 'text-slate-700 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(srv)}
                      className="rounded border-slate-300 dark:border-neutral-700 text-violet-600 focus:ring-0"
                    />
                    <span>{srv}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">Client Notes & Requirements</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ROAS targets, primary ad platforms, key deadlines..."
              className="w-full bg-slate-50 dark:bg-neutral-850 border border-slate-300 dark:border-neutral-750 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div>
              {initialClient && onDelete && (
                <div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-500">Delete client?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true);
                          await onDelete(initialClient.id);
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
                {saving ? 'Saving...' : initialClient ? 'Update Client' : 'Add Client'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
