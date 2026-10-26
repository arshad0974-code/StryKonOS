import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Calendar,
  AlertTriangle,
  Check,
  Star,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import type { Client, DistractionRecord, FocusSession, Task, TimeBlock, UserSettings } from '../types.js';
import { api } from '../services/api.js';

interface AiCoachViewProps {
  tasks: Task[];
  clients: Client[];
  focusSessions: FocusSession[];
  distractions: DistractionRecord[];
  timeBlocks: TimeBlock[];
  settings: UserSettings;
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onSaveTimeBlock: (block: Partial<TimeBlock>) => Promise<void>;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  tasks,
  clients,
  focusSessions,
  distractions,
  timeBlocks,
  settings,
  onSaveTask,
  onSaveTimeBlock,
}) => {
  const [activeTab, setActiveTab] = useState<'daily_plan' | 'distractions' | 'chat'>('daily_plan');

  // Daily plan state
  const [dailyPlanLoading, setDailyPlanLoading] = useState(false);
  const [dailyPlanResult, setDailyPlanResult] = useState<any | null>(null);
  const [appliedTop3, setAppliedTop3] = useState(false);

  // Distraction analysis state
  const [distractionLoading, setDistractionLoading] = useState(false);
  const [distractionResult, setDistractionResult] = useState<any | null>(null);

  // Chat coach state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Good day, Operator. I have analyzed your active client pipeline and daily focus records. How can I assist you with agency prioritization or schedule triage today?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Generate AI Daily Plan
  const handleGenerateDailyPlan = async () => {
    setDailyPlanLoading(true);
    setAppliedTop3(false);
    try {
      const plan = await api.getAiDailyPlan();
      setDailyPlanResult(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setDailyPlanLoading(false);
    }
  };

  // User Approval: Apply suggested Top 3
  const handleApplySuggestedTop3 = async () => {
    if (!dailyPlanResult?.top3TaskIds) return;
    const todayStr = new Date().toISOString().split('T')[0];

    for (const taskId of dailyPlanResult.top3TaskIds) {
      const task = taskMap.get(taskId);
      if (task) {
        await onSaveTask({
          ...task,
          isDailyTop3: true,
          scheduledDate: todayStr,
        });
      }
    }
    setAppliedTop3(true);
  };

  // User Approval: Add suggested schedule block to calendar
  const handleApplyScheduleBlock = async (slot: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const parts = slot.timeSlot.split(' - ');
    const startTime = parts[0]?.trim() || '09:00';
    const endTime = parts[1]?.trim() || '10:30';

    await onSaveTimeBlock({
      title: slot.title,
      date: todayStr,
      startTime,
      endTime,
      category: 'deep_work',
      taskId: slot.taskId || undefined,
      color: '#8B5CF6',
      completed: false,
    });
  };

  // Generate Distraction Pattern Audit
  const handleGenerateDistractionAudit = async () => {
    setDistractionLoading(true);
    try {
      const analysis = await api.getAiDistractionAnalysis();
      setDistractionResult(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setDistractionLoading(false);
    }
  };

  // Conversational Coach Chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    const newHistory = [...chatMessages, { role: 'user' as const, text: userText }];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const reply = await api.chatWithCoach(newHistory);
      setChatMessages([...newHistory, { role: 'assistant', text: reply }]);
    } catch (err) {
      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          text: 'Focus on finishing your highest-priority client deliverable before responding to inbound communications.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-violet-400" size={20} />
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight">AI Executive Coach</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Grounded in your real client workload, time-blocks, and distraction records. Powered by Gemini.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-neutral-850 rounded-lg border border-neutral-750 text-xs">
          <button
            onClick={() => setActiveTab('daily_plan')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'daily_plan' ? 'bg-violet-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Daily Planning
          </button>
          <button
            onClick={() => setActiveTab('distractions')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'distractions' ? 'bg-violet-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Distraction Audit
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'chat' ? 'bg-violet-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Coach Dialogue
          </button>
        </div>
      </div>

      {/* Tab 1: Daily Planning & Schedule Triage */}
      {activeTab === 'daily_plan' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">Automated Daily Priority & Schedule Optimizer</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Evaluates deadlines, client retainers, and working hours to craft an unfragmented daily flow.
                </p>
              </div>
              <button
                onClick={handleGenerateDailyPlan}
                disabled={dailyPlanLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                {dailyPlanLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{dailyPlanLoading ? 'Analyzing Workload...' : 'Generate Daily Plan'}</span>
              </button>
            </div>

            {/* Overload Notice if detected */}
            {dailyPlanResult?.overloaded && (
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Schedule Overload Warning:</strong> {dailyPlanResult.overloadNotes || 'Too many active tasks queued for realistic completion today.'}
                </span>
              </div>
            )}

            {dailyPlanResult ? (
              <div className="space-y-5 pt-2">
                {/* Recommended Top 3 Priorities */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">Recommended Daily Top 3:</span>
                    <button
                      onClick={handleApplySuggestedTop3}
                      disabled={appliedTop3}
                      className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {appliedTop3 ? <Check size={12} /> : <Star size={12} className="fill-amber-400" />}
                      <span>{appliedTop3 ? 'Applied to Top 3' : 'Apply Proposed Top 3'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dailyPlanResult.top3TaskIds?.map((id: string, index: number) => {
                      const task = taskMap.get(id);
                      return (
                        <div
                          key={id}
                          className="p-3 rounded-lg border border-neutral-800 bg-neutral-850 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-violet-400">0{index + 1}.</span>
                            <span className="text-neutral-100 font-medium truncate">
                              {task ? task.title : `Task #${id}`}
                            </span>
                          </div>
                          {task && (
                            <span className="font-mono tabular-nums text-[11px] text-neutral-400 shrink-0">
                              {task.estimatedDurationMinutes}m est
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Suggested Time-Blocked Schedule */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-neutral-200">Recommended Schedule:</span>
                  <div className="space-y-2">
                    {dailyPlanResult.scheduleSuggestions?.map((slot: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-neutral-800 bg-neutral-850 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-violet-400 font-semibold">{slot.timeSlot}</span>
                            <span className="font-medium text-neutral-200 truncate">{slot.title}</span>
                          </div>
                          {slot.reason && (
                            <p className="text-[11px] text-neutral-400 mt-0.5">{slot.reason}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleApplyScheduleBlock(slot)}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-medium shrink-0"
                        >
                          Schedule
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactical Advice */}
                {dailyPlanResult.tacticalAdvice && (
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-850/60 space-y-2">
                    <span className="text-xs font-semibold text-neutral-200 block">Tactical Operator Advice:</span>
                    <ul className="space-y-1 text-xs text-neutral-300 list-disc list-inside">
                      {dailyPlanResult.tacticalAdvice.map((adv: string, i: number) => (
                        <li key={i}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
                <Bot size={28} className="mx-auto text-neutral-600" />
                <p>Click "Generate Daily Plan" to synthesize your tasks, deadlines, and focus targets.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Distraction Pattern Audit */}
      {activeTab === 'distractions' && (
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Friction & Distraction Pattern Analysis</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Examines logged interruptions to diagnose root causes and suggest deep-work insulation rules.
              </p>
            </div>
            <button
              onClick={handleGenerateDistractionAudit}
              disabled={distractionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              {distractionLoading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
              <span>{distractionLoading ? 'Analyzing Patterns...' : 'Run Distraction Audit'}</span>
            </button>
          </div>

          {distractionResult ? (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-850 space-y-1.5">
                <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block">Primary Trigger</span>
                <h4 className="text-sm font-semibold text-neutral-100">{distractionResult.primaryTrigger}</h4>
                <p className="text-neutral-300 leading-relaxed mt-1">{distractionResult.patternAnalysis}</p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-850 space-y-2">
                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">Recommended Interventions</span>
                <ul className="space-y-1.5 text-neutral-200 list-disc list-inside">
                  {distractionResult.actionableInterventions?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
              <ShieldAlert size={28} className="mx-auto text-neutral-600" />
              <p>Click "Run Distraction Audit" to review your logged friction events.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Conversational Coach Dialogue */}
      {activeTab === 'chat' && (
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-4 flex flex-col h-[600px]">
          <div className="pb-3 border-b border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-100">Executive Strategic Dialogue</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Ask about agency capacity, time management, dealing with demanding clients, or fatigue recovery.
            </p>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-xl max-w-lg leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-xs'
                      : 'bg-neutral-850 border border-neutral-800 text-neutral-200 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Bot size={15} className="animate-pulse text-violet-400" />
                <span>Coach is analyzing context...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-neutral-800">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask for schedule triage, client strategy, or focus advice..."
              className="flex-1 bg-neutral-850 border border-neutral-750 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
