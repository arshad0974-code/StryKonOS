import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Client } from '../types.js';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-100">
            {initialClient ? 'Edit Client Account' : 'Add Agency Client'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Business / Brand Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Athletic Goods"
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Primary Contact Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Marcus Brody"
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="contact@brand.com"
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Client Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
              >
                <option value="retainer" className="bg-neutral-900 text-neutral-100">Monthly Retainer</option>
                <option value="active" className="bg-neutral-900 text-neutral-100">Active Project</option>
                <option value="lead" className="bg-neutral-900 text-neutral-100">Sales Lead</option>
                <option value="inactive" className="bg-neutral-900 text-neutral-100">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Monthly Value ($)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={monthlyValue}
                onChange={e => setMonthlyValue(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">Services Provided</label>
            <div className="space-y-1.5">
              {AVAILABLE_SERVICES.map(srv => {
                const checked = selectedServices.includes(srv);
                return (
                  <label
                    key={srv}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-850 border border-neutral-800 text-xs text-neutral-200 cursor-pointer hover:bg-neutral-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(srv)}
                      className="rounded border-neutral-700 bg-neutral-800 text-violet-600 focus:ring-0"
                    />
                    <span className="truncate">{srv}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Strategic Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Campaign objectives, target ROAS/CAC, communication preferences..."
              className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
            <div>
              {initialClient && onDelete && (
                <div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-400">Confirm?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true);
                          await onDelete(initialClient.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs"
                      >
                        Delete
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
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
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
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : initialClient ? 'Update Client' : 'Save Client'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
