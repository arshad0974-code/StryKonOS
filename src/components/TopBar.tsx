import React from 'react';
import { Search, Plus, Play, Moon, Sun, Flame } from 'lucide-react';
import type { NavSection } from './Sidebar.js';

interface TopBarProps {
  currentSection: NavSection;
  onOpenQuickTask: () => void;
  onStartFocusShortcut: () => void;
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
  activeTimerRunning,
  activeTimerRemaining,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  streakCount,
}) => {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Breadcrumb / View Title (Single line, no pills) */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold text-neutral-100 tracking-tight truncate whitespace-nowrap">
          {sectionTitles[currentSection] || 'StrykonOS'}
        </h1>
        {streakCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 font-medium whitespace-nowrap font-mono tabular-nums">
            <Flame size={14} className="text-amber-500 fill-amber-500/20" />
            <span>{streakCount}d streak</span>
          </div>
        )}
      </div>

      {/* Zone 2: Contextual Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks, clients, projects, tags..."
            className="w-full bg-neutral-800/80 border border-neutral-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Active Timer Pill if running, otherwise Quick Focus button */}
        {activeTimerRunning ? (
          <button
            onClick={onStartFocusShortcut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-violet-500/50 bg-violet-950/60 text-violet-200 text-xs font-medium hover:bg-violet-900/50 transition-colors whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="font-mono tabular-nums">{activeTimerRemaining}</span>
          </button>
        ) : (
          <button
            onClick={onStartFocusShortcut}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Play size={13} className="text-violet-400 fill-violet-400/20" />
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

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
};
