import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
  Sparkles,
  Timer,
  ChevronDown,
} from 'lucide-react';
import type { DistractionCategory, FocusSession, Task, UserSettings } from '../types.js';
import { playFocusChime } from '../utils/productivity.js';

interface FocusModeViewProps {
  tasks: Task[];
  activeTask: Task | null;
  onSetActiveTask: (task: Task | null) => void;
  onSaveSession: (session: Partial<FocusSession>) => Promise<FocusSession>;
  onLogDistraction: (data: { category: DistractionCategory; reason?: string; notes?: string; sessionId?: string; taskId?: string }) => Promise<void>;
  focusSessions: FocusSession[];
  settings: UserSettings;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  tasks,
  activeTask,
  onSetActiveTask,
  onSaveSession,
  onLogDistraction,
  focusSessions,
  settings,
}) => {
  // Preset types
  const [preset, setPreset] = useState<'pomodoro_25' | 'deep_50' | 'custom'>('pomodoro_25');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isBreak, setIsBreak] = useState(false);

  // Intended outcome
  const [intendedOutcome, setIntendedOutcome] = useState('');

  // Timer states (timestamp based!)
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [accumulatedElapsedSecs, setAccumulatedElapsedSecs] = useState(0);
  const [currentElapsedSecs, setCurrentElapsedSecs] = useState(0);

  // Active session database record ID
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Distraction modal state
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [distractionCategory, setDistractionCategory] = useState<DistractionCategory>('phone');
  const [distractionReason, setDistractionReason] = useState('');
  const [distractionNotes, setDistractionNotes] = useState('');

  // End of session reflection modal state
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [lastFinishedStatus, setLastFinishedStatus] = useState<'completed' | 'interrupted'>('completed');

  const animationFrameRef = useRef<number | null>(null);

  // Sync preset changes
  const handleSelectPreset = (p: 'pomodoro_25' | 'deep_50' | 'custom') => {
    if (isRunning) return;
    setPreset(p);
    if (p === 'pomodoro_25') {
      setTargetMinutes(25);
      setBreakMinutes(5);
    } else if (p === 'deep_50') {
      setTargetMinutes(50);
      setBreakMinutes(10);
    }
  };

  // Restore active timer from localStorage if page was refreshed
  useEffect(() => {
    try {
      const savedTimer = localStorage.getItem('focusos_active_timer');
      if (savedTimer) {
        const parsed = JSON.parse(savedTimer);
        if (parsed.isRunning && parsed.startTimeMs) {
          setPreset(parsed.preset || 'pomodoro_25');
          setTargetMinutes(parsed.targetMinutes || 25);
          setIntendedOutcome(parsed.intendedOutcome || '');
          setCurrentSessionId(parsed.currentSessionId || null);
          setAccumulatedElapsedSecs(parsed.accumulatedElapsedSecs || 0);
          setIsRunning(true);
          setIsPaused(parsed.isPaused || false);

          if (parsed.isPaused) {
            setCurrentElapsedSecs(parsed.accumulatedElapsedSecs || 0);
          } else {
            const elapsedSinceStart = Math.floor((Date.now() - parsed.startTimeMs) / 1000);
            setCurrentElapsedSecs((parsed.accumulatedElapsedSecs || 0) + elapsedSinceStart);
            setStartTimeMs(parsed.startTimeMs);
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore timer:', e);
    }
  }, []);

  // Save active timer state to localStorage whenever running/paused state changes
  useEffect(() => {
    if (isRunning) {
      localStorage.setItem(
        'focusos_active_timer',
        JSON.stringify({
          isRunning,
          isPaused,
          preset,
          targetMinutes,
          intendedOutcome,
          currentSessionId,
          accumulatedElapsedSecs,
          startTimeMs,
        })
      );
    } else {
      localStorage.removeItem('focusos_active_timer');
    }
  }, [isRunning, isPaused, preset, targetMinutes, intendedOutcome, currentSessionId, accumulatedElapsedSecs, startTimeMs]);

  // High-precision animation frame tick for smooth UI and exact elapsed calculation
  useEffect(() => {
    if (!isRunning || isPaused || !startTimeMs) return;

    const tick = () => {
      const currentSegment = Math.floor((Date.now() - startTimeMs) / 1000);
      const totalElapsed = accumulatedElapsedSecs + currentSegment;
      setCurrentElapsedSecs(totalElapsed);

      const targetSeconds = (isBreak ? breakMinutes : targetMinutes) * 60;
      if (totalElapsed >= targetSeconds) {
        // Natural completion!
        playFocusChime(settings.soundEnabled);
        handleSessionEnd('completed', totalElapsed);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, isPaused, startTimeMs, accumulatedElapsedSecs, targetMinutes, breakMinutes, isBreak, settings.soundEnabled]);

  const handleStart = async () => {
    const now = Date.now();
    const sessionId = `ses_${now}_${Math.random().toString(36).substring(2, 6)}`;
    setStartTimeMs(now);
    setAccumulatedElapsedSecs(0);
    setCurrentElapsedSecs(0);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentSessionId(sessionId);

    // Initial persistence of started session
    await onSaveSession({
      id: sessionId,
      taskId: activeTask?.id,
      taskTitle: activeTask?.title,
      intendedOutcome: intendedOutcome || activeTask?.title || 'Deliverable focus sprint',
      presetType: preset,
      targetMinutes,
      actualElapsedSeconds: 0,
      status: 'completed', // Will update on end
      startTime: new Date(now).toISOString(),
      endTime: new Date(now + targetMinutes * 60000).toISOString(),
      distractionsCount: 0,
    });
  };

  const handlePause = () => {
    if (!startTimeMs) return;
    const currentSegment = Math.floor((Date.now() - startTimeMs) / 1000);
    const newAccumulated = accumulatedElapsedSecs + currentSegment;
    setAccumulatedElapsedSecs(newAccumulated);
    setCurrentElapsedSecs(newAccumulated);
    setIsPaused(true);
    setStartTimeMs(null);
  };

  const handleResume = () => {
    setStartTimeMs(Date.now());
    setIsPaused(false);
  };

  const handleSessionEnd = async (finalStatus: 'completed' | 'interrupted', elapsedSecs: number) => {
    setIsRunning(false);
    setIsPaused(false);
    setStartTimeMs(null);
    setLastFinishedStatus(finalStatus);

    if (currentSessionId) {
      await onSaveSession({
        id: currentSessionId,
        taskId: activeTask?.id,
        taskTitle: activeTask?.title,
        intendedOutcome: intendedOutcome || activeTask?.title,
        presetType: preset,
        targetMinutes,
        actualElapsedSeconds: elapsedSecs,
        status: finalStatus,
        endTime: new Date().toISOString(),
      });
    }

    setShowReflectionModal(true);
  };

  const handleCancelSession = async () => {
    if (!confirm('Cancel this focus session? Elapsed time will be marked as cancelled.')) return;
    setIsRunning(false);
    setIsPaused(false);
    setStartTimeMs(null);

    if (currentSessionId) {
      await onSaveSession({
        id: currentSessionId,
        status: 'cancelled',
        actualElapsedSeconds: currentElapsedSecs,
        endTime: new Date().toISOString(),
      });
    }
  };

  const handleSaveReflection = async () => {
    if (currentSessionId && reflectionText.trim()) {
      await onSaveSession({
        id: currentSessionId,
        reflectionNotes: reflectionText.trim(),
      });
    }
    setShowReflectionModal(false);
    setReflectionText('');
    setAccumulatedElapsedSecs(0);
    setCurrentElapsedSecs(0);
    setCurrentSessionId(null);
  };

  const handleLogDistractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogDistraction({
      category: distractionCategory,
      reason: distractionReason.trim() || undefined,
      notes: distractionNotes.trim() || undefined,
      sessionId: currentSessionId || undefined,
      taskId: activeTask?.id,
    });
    setShowDistractionModal(false);
    setDistractionReason('');
    setDistractionNotes('');
  };

  const totalTargetSecs = (isBreak ? breakMinutes : targetMinutes) * 60;
  const remainingSecs = Math.max(0, totalTargetSecs - currentElapsedSecs);
  const remainingMins = Math.floor(remainingSecs / 60);
  const remainingSecsRemainder = remainingSecs % 60;
  const formattedTime = `${String(remainingMins).padStart(2, '0')}:${String(remainingSecsRemainder).padStart(2, '0')}`;

  const progressPercent = Math.min(100, Math.round((currentElapsedSecs / totalTargetSecs) * 100));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto flex flex-col items-center">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-neutral-100 tracking-tight">Deep Work Chamber</h2>
        <p className="text-xs text-neutral-400">
          Eliminate digital noise, protect billable concentration, and log distractions.
        </p>
      </div>

      {/* Preset Selector */}
      {!isRunning && (
        <div className="flex items-center gap-1 p-1 bg-neutral-850 rounded-lg border border-neutral-750 text-xs">
          <button
            onClick={() => handleSelectPreset('pomodoro_25')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              preset === 'pomodoro_25' ? 'bg-violet-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            25m Pomodoro
          </button>
          <button
            onClick={() => handleSelectPreset('deep_50')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              preset === 'deep_50' ? 'bg-violet-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            50m Deep Block
          </button>
          <button
            onClick={() => handleSelectPreset('custom')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              preset === 'custom' ? 'bg-violet-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Custom
          </button>
        </div>
      )}

      {/* Custom Duration Inputs if Custom selected and not running */}
      {!isRunning && preset === 'custom' && (
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-1.5">
            <span className="text-neutral-400">Focus:</span>
            <input
              type="number"
              min={5}
              max={180}
              value={targetMinutes}
              onChange={e => setTargetMinutes(Math.max(1, Number(e.target.value)))}
              className="w-12 bg-transparent text-right font-mono tabular-nums text-neutral-100 focus:outline-none"
            />
            <span className="text-neutral-400">min</span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-1.5">
            <span className="text-neutral-400">Break:</span>
            <input
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              onChange={e => setBreakMinutes(Math.max(1, Number(e.target.value)))}
              className="w-12 bg-transparent text-right font-mono tabular-nums text-neutral-100 focus:outline-none"
            />
            <span className="text-neutral-400">min</span>
          </div>
        </div>
      )}

      {/* Task & Intended Outcome Selector */}
      <div className="w-full max-w-md p-4 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
            Linked Deliverable / Task
          </label>
          <select
            disabled={isRunning}
            value={activeTask?.id || ''}
            onChange={e => {
              const selected = tasks.find(t => t.id === e.target.value) || null;
              onSetActiveTask(selected);
              if (selected && !intendedOutcome) {
                setIntendedOutcome(selected.title);
              }
            }}
            style={{ colorScheme: 'dark' }}
            className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500 disabled:opacity-70"
          >
            <option value="" className="bg-neutral-900 text-neutral-100">No specific task (General Agency Sprint)</option>
            {tasks.filter(t => t.status !== 'completed').map(t => (
              <option key={t.id} value={t.id} className="bg-neutral-900 text-neutral-100">
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
            Intended Session Outcome
          </label>
          <input
            type="text"
            disabled={isRunning}
            value={intendedOutcome}
            onChange={e => setIntendedOutcome(e.target.value)}
            placeholder="e.g. Audit 4 test ad sets and kill underperformers..."
            className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500 disabled:opacity-70"
          />
        </div>
      </div>

      {/* Circular Timer Visual Display */}
      <div className="relative w-64 h-64 my-4 flex items-center justify-center">
        {/* SVG Progress Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="110"
            className="stroke-neutral-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="128"
            cy="128"
            r="110"
            className="stroke-violet-500 transition-all duration-300"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 110}
            strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Timer Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
          <span className="font-mono text-4xl md:text-5xl font-bold tracking-tight text-neutral-100 tabular-nums">
            {formattedTime}
          </span>
          <span className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
            {isRunning ? (isPaused ? 'Paused' : isBreak ? 'Break Time' : 'Deep Focus') : 'Ready'}
          </span>
          {intendedOutcome && isRunning && (
            <span className="text-[11px] text-violet-300 max-w-[180px] truncate text-center px-2">
              {intendedOutcome}
            </span>
          )}
        </div>
      </div>

      {/* Primary Timer Controls */}
      <div className="flex items-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-violet-900/30 transition-all active:scale-[0.98]"
          >
            <Play size={16} fill="currentColor" />
            <span>Start Session</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition-colors"
              >
                <Play size={15} fill="currentColor" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-medium text-xs flex items-center gap-2 transition-colors border border-neutral-700"
              >
                <Pause size={15} />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={() => handleSessionEnd('completed', currentElapsedSecs)}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-emerald-400 font-medium text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
              title="Complete early and log elapsed minutes"
            >
              <CheckCircle2 size={15} />
              <span>Complete</span>
            </button>

            <button
              onClick={() => setShowDistractionModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs flex items-center gap-1.5 transition-colors border border-amber-500/30"
              title="Record an interruption or context switch"
            >
              <ShieldAlert size={15} />
              <span>Distraction</span>
            </button>

            <button
              onClick={handleCancelSession}
              className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-rose-400 text-xs transition-colors"
              title="Cancel session"
            >
              <XCircle size={15} />
            </button>
          </>
        )}
      </div>

      {/* Recent Sessions List */}
      <div className="w-full mt-6 space-y-3">
        <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
          Completed Sessions Today
        </h3>
        <div className="space-y-2">
          {focusSessions.slice(0, 4).map(sess => (
            <div
              key={sess.id}
              className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/80 text-xs flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${sess.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <div className="truncate">
                  <span className="font-medium text-neutral-200">{sess.taskTitle || sess.intendedOutcome || 'General Focus'}</span>
                  {sess.reflectionNotes && (
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{sess.reflectionNotes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-neutral-400 font-mono tabular-nums text-[11px]">
                <span>{Math.round(sess.actualElapsedSeconds / 60)}m</span>
                {sess.distractionsCount > 0 && (
                  <span className="text-amber-400">{sess.distractionsCount} dist</span>
                )}
                <span className="capitalize text-neutral-300">{sess.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distraction Recording Modal */}
      {showDistractionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-400" />
              <h3 className="text-base font-semibold text-neutral-100">Log Interruption</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Capturing interruptions builds self-awareness without punishment. Identify triggers to optimize your deep-work boundary.
            </p>

            <form onSubmit={handleLogDistractionSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Distraction Category</label>
                <select
                  value={distractionCategory}
                  onChange={e => setDistractionCategory(e.target.value as DistractionCategory)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="phone" className="bg-neutral-900 text-neutral-100">Phone / WhatsApp Ping</option>
                  <option value="unexpected_client_fire" className="bg-neutral-900 text-neutral-100">Unexpected Client Fire / Alert</option>
                  <option value="social_media" className="bg-neutral-900 text-neutral-100">Social Media / News / Twitter</option>
                  <option value="unclear_priorities" className="bg-neutral-900 text-neutral-100">Unclear Priorities / Decision Fatigue</option>
                  <option value="browse_web" className="bg-neutral-900 text-neutral-100">Random Web Browsing / Tab Overload</option>
                  <option value="fatigue" className="bg-neutral-900 text-neutral-100">Energy Slump / Fatigue</option>
                  <option value="other" className="bg-neutral-900 text-neutral-100">Other Interruption</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Specific Trigger / Reason</label>
                <input
                  type="text"
                  value={distractionReason}
                  onChange={e => setDistractionReason(e.target.value)}
                  placeholder="e.g. Client messaged asking about ad spend ceiling"
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Tactical Fix Note</label>
                <textarea
                  rows={2}
                  value={distractionNotes}
                  onChange={e => setDistractionNotes(e.target.value)}
                  placeholder="How will you insulate against this tomorrow? (e.g. Schedule check-in at 4pm)"
                  className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDistractionModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                >
                  Log & Resume Focus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End of Session Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <h3 className="text-base font-semibold text-neutral-100">Session Complete</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Take 20 seconds to log what you completed. This seals cognitive closure before moving to the next task.
            </p>

            <textarea
              rows={3}
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              placeholder="What tangible deliverable was produced or resolved? Any friction?"
              className="w-full bg-neutral-850 border border-neutral-750 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleSaveReflection()}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
              >
                Save & Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
