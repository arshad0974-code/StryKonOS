import React from 'react';
import { Search, Plus, Play, Moon, Sun, Flame, MessageSquare, Mic } from 'lucide-react';
import type { NavSection } from './Sidebar.js';

interface TopBarProps {
  currentSection: NavSection;
  onOpenQuickTask: () => void;
  onStartFocusShortcut: () => void;
  onOpenAiChat?: () => void;
  onOpenVoiceModal?: () => void;
  activeTimerRunning: boolean;
  activeTimerRemaining: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  streakCount: number;
}

const sectionTitles: Record<NavSection, string> = {
  dashboard: 'Executive Dashboard',
  my_day: 'My Day · Daily Focus Cockpit',
  tasks: 'Deliverables & Task Management',
  projects: 'Client Campaigns & Projects',
  clients: 'Agency Client Directory',
  calendar: 'Time Blocking & Schedule',
  focus: 'Deep Work Focus Chamber',
  habits: 'Habit Architecture & Distraction Journal',
  analytics: 'Performance Analytics & Reports',
  ai_coach: 'Gemini Executive Coach',
  settings: 'System & Workspace Settings',
};

export const TopBar: React.FC<TopBarProps> = ({
  currentSection,
  onOpenQuickTask,
  onStartFocusShortcut,
  onOpenAiChat,
  onOpenVoiceModal,
  activeTimerRunning,
  activeTimerRemaining,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  streakCount,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md px-6 flex items-center justify-between gap-6 shrink-0 z-20 transition-colors">
      {/* Zone 1: Breadcrumb / View Title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 tracking-tight truncate whitespace-nowrap">
          {sectionTitles[currentSection] || 'StrykonOS'}
        </h1>
        {streakCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 font-medium whitespace-nowrap font-mono tabular-nums">
            <Flame size={14} className="text-amber-500 fill-amber-500/20" />
            <span>{streakCount}d streak</span>
          </div>
        )}
      </div>

      {/* Zone 2: Contextual Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search deliverables, clients, projects, tags..."
            className="w-full bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Gemini Live Voice Shortcut */}
        {onOpenVoiceModal && (
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-300 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-xs font-medium transition-colors"
            title="Start Gemini Live Voice Session (gemini-3.8-live)"
          >
            <Mic size={14} className="animate-pulse text-violet-600 dark:text-violet-400" />
            <span className="hidden sm:inline">Voice Coach</span>
          </button>
        )}

        {/* Gemini Chat Shortcut */}
        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-750 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-750 text-xs font-medium transition-colors"
            title="Chat with Gemini Coach (gemini-3.8-flash)"
          >
            <MessageSquare size={13} className="text-violet-500 dark:text-violet-400" />
            <span className="hidden sm:inline">Ask Coach</span>
          </button>
        )}

        {/* Active Timer Pill if running, otherwise Quick Focus button */}
        {activeTimerRunning ? (
          <button
            onClick={onStartFocusShortcut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-violet-500/50 bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 animate-pulse" />
            <span className="font-mono tabular-nums">{activeTimerRemaining}</span>
          </button>
        ) : (
          <button
            onClick={onStartFocusShortcut}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-750 text-slate-700 dark:text-neutral-200 text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Play size={13} className="text-violet-600 dark:text-violet-400 fill-violet-400/20" />
            <span>Start Focus</span>
          </button>
        )}

        {/* New Task Button */}
        <button
          onClick={onOpenQuickTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-sm transition-colors whitespace-nowrap active:scale-[0.98]"
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-800/60 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
        </button>
      </div>
    </header>
  );
};
