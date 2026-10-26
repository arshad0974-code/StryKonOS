import React from 'react';
import {
  LayoutDashboard,
  Sun,
  CheckSquare,
  FolderKanban,
  Users,
  Calendar,
  Timer,
  Flame,
  BarChart3,
  Sparkles,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Play,
  UserCheck,
} from 'lucide-react';
import type { UserProfile } from '../types.js';

export type NavSection =
  | 'dashboard'
  | 'my_day'
  | 'tasks'
  | 'projects'
  | 'clients'
  | 'calendar'
  | 'focus'
  | 'habits'
  | 'analytics'
  | 'ai_coach'
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenQuickTask: () => void;
  activeTimerRunning: boolean;
  activeTimerRemaining: string;
  activeTaskTitle?: string;
  user: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapsed,
  onOpenQuickTask,
  activeTimerRunning,
  activeTimerRemaining,
  activeTaskTitle,
  user,
}) => {
  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my_day' as NavSection, label: 'My Day', icon: Sun },
    { id: 'tasks' as NavSection, label: 'Tasks', icon: CheckSquare },
    { id: 'projects' as NavSection, label: 'Projects', icon: FolderKanban },
    { id: 'clients' as NavSection, label: 'Clients', icon: Users },
    { id: 'calendar' as NavSection, label: 'Calendar', icon: Calendar },
    { id: 'focus' as NavSection, label: 'Focus Mode', icon: Timer, highlight: activeTimerRunning },
    { id: 'habits' as NavSection, label: 'Habits & Routines', icon: Flame },
    { id: 'analytics' as NavSection, label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'ai_coach' as NavSection, label: 'AI Coach', icon: Sparkles },
    { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-neutral-800 bg-neutral-900/90 backdrop-blur-md transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-violet-900/30 text-sm shrink-0">
              S
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-neutral-100 tracking-tight truncate">StrykonOS</span>
              <span className="text-[11px] text-neutral-400 truncate">Strykon Workspace</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
            S
          </div>
        )}
        <button
          onClick={onToggleCollapsed}
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenQuickTask}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all shadow-sm shadow-violet-900/40 active:scale-[0.98] ${
            collapsed ? 'px-0' : ''
          }`}
          title="Create New Task"
        >
          <Plus size={16} />
          {!collapsed && <span>New Task</span>}
        </button>
      </div>

      {/* Live Focus Timer Alert Pill in Sidebar if running */}
      {activeTimerRunning && (
        <div className="px-3 mb-2">
          <button
            onClick={() => onSelectSection('focus')}
            className={`w-full text-left p-2.5 rounded-lg border border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/30 transition-colors ${
              collapsed ? 'px-2' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Deep Focus</span>
                    <span className="font-mono text-xs text-violet-200 tabular-nums">{activeTimerRemaining}</span>
                  </div>
                  {activeTaskTitle && (
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{activeTaskTitle}</p>
                  )}
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Main Navigation List */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={17} className={`shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.id === 'focus' && activeTimerRunning && (
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-neutral-800">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-neutral-800/40">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-neutral-200 shrink-0">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-neutral-200 truncate">{user?.name || 'Arshad Qazi'}</span>
              <span className="text-[11px] text-neutral-400 truncate">{user?.agencyName || 'Strykon'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
