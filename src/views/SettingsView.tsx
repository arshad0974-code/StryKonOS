import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Volume2,
  Moon,
  Sun,
  RotateCcw,
  ShieldCheck,
  Database,
  Check,
} from 'lucide-react';
import type { UserProfile, UserSettings } from '../types.js';
import { playFocusChime } from '../utils/productivity.js';

interface SettingsViewProps {
  settings: UserSettings;
  user: UserProfile | null;
  onSaveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onResetData: () => Promise<void>;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  user,
  onSaveSettings,
  onResetData,
  theme,
  onToggleTheme,
}) => {
  const [workStart, setWorkStart] = useState(settings.workStartHour || 8);
  const [workEnd, setWorkEnd] = useState(settings.workEndHour || 18);
  const [focusTarget, setFocusTarget] = useState(settings.dailyFocusTargetMinutes || 240);
  const [pomoFocus, setPomoFocus] = useState(settings.pomodoroFocusMinutes || 25);
  const [pomoBreak, setPomoBreak] = useState(settings.pomodoroBreakMinutes || 5);
  const [longBreak, setLongBreak] = useState(settings.longBreakMinutes || 15);

  const [weightPriority, setWeightPriority] = useState(settings.scoreWeightPriority || 40);
  const [weightFocus, setWeightFocus] = useState(settings.scoreWeightFocus || 40);
  const [weightSchedule, setWeightSchedule] = useState(settings.scoreWeightSchedule || 20);

  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled !== false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await onSaveSettings({
        workStartHour: Number(workStart),
        workEndHour: Number(workEnd),
        dailyFocusTargetMinutes: Number(focusTarget),
        pomodoroFocusMinutes: Number(pomoFocus),
        pomodoroBreakMinutes: Number(pomoBreak),
        longBreakMinutes: Number(longBreak),
        scoreWeightPriority: Number(weightPriority),
        scoreWeightFocus: Number(weightFocus),
        scoreWeightSchedule: Number(weightSchedule),
        soundEnabled,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const testAudio = () => {
    playFocusChime(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 tracking-tight">System & Workspace Settings</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure working hours, focus thresholds, scoring weights, and storage status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Working Hours & Focus Target */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-100 pb-2 border-b border-neutral-800">
            Work Schedule & Concentration Target
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Work Day Start (Hour)</label>
              <input
                type="number"
                min={5}
                max={12}
                value={workStart}
                onChange={e => setWorkStart(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">e.g. 8 for 08:00 AM</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Work Day End (Hour)</label>
              <input
                type="number"
                min={13}
                max={23}
                value={workEnd}
                onChange={e => setWorkEnd(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">e.g. 18 for 06:00 PM</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Daily Focus Target (Minutes)</label>
              <input
                type="number"
                min={60}
                max={600}
                step={15}
                value={focusTarget}
                onChange={e => setFocusTarget(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                {(focusTarget / 60).toFixed(1)} hours of deep work
              </span>
            </div>
          </div>
        </div>

        {/* Pomodoro Timer Presets */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-100 pb-2 border-b border-neutral-800">
            Pomodoro Durations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Focus Interval (mins)</label>
              <input
                type="number"
                min={10}
                max={90}
                value={pomoFocus}
                onChange={e => setPomoFocus(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Short Break (mins)</label>
              <input
                type="number"
                min={2}
                max={30}
                value={pomoBreak}
                onChange={e => setPomoBreak(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Long Break (mins)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={longBreak}
                onChange={e => setLongBreak(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Productivity Score Weight Distribution */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Productivity Score Formula Weights</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Customize the weighted proportions of your transparent score</p>
            </div>
            <span className="font-mono text-xs tabular-nums text-neutral-300">
              Total: {Number(weightPriority) + Number(weightFocus) + Number(weightSchedule)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Priority Tasks Completion</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightPriority}
                  onChange={e => setWeightPriority(Number(e.target.value))}
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
                />
                <span className="text-xs text-neutral-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Focus Target Achievement</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightFocus}
                  onChange={e => setWeightFocus(Number(e.target.value))}
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
                />
                <span className="text-xs text-neutral-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Schedule Block Adherence</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightSchedule}
                  onChange={e => setWeightSchedule(Number(e.target.value))}
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-violet-500"
                />
                <span className="text-xs text-neutral-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio & Environment */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-100 pb-2 border-b border-neutral-800">
            Audio & Appearance
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-violet-600 focus:ring-0"
                />
                <span>Enable Harmonic Bell Chime on session completion</span>
              </label>
              <button
                type="button"
                onClick={testAudio}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium flex items-center gap-1.5"
              >
                <Volume2 size={13} />
                <span>Test Chime</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Current Theme:</span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3 py-1.5 rounded-lg border border-neutral-750 bg-neutral-850 hover:bg-neutral-800 text-xs font-medium text-neutral-200 flex items-center gap-1.5 capitalize"
              >
                {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
                <span>{theme} Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Database & Persistence Info */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Database size={16} />
            <span>Persistent Backend Storage Active</span>
          </div>
          <p className="text-neutral-400 leading-relaxed">
            All tasks, client accounts, focus sessions, time blocks, and distraction logs persist safely on the backend server (`/data/focusos_db.json`) across page reloads and server restarts.
            The environment is also fully configured with <code>firebase-blueprint.json</code> and zero-trust <code>firestore.rules</code> should you choose to connect a Cloud Firestore instance.
          </p>
        </div>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400">Reset all workspace data to seed demo state?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onResetData();
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-400 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset Workspace to Initial Demo Data</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check size={14} />
                <span>Settings saved!</span>
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
