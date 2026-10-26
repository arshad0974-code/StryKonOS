import type {
  Client,
  FocusSession,
  HabitCompletion,
  ProductivityScoreBreakdown,
  Task,
  TimeBlock,
  UserSettings,
} from '../types.js';

export function calculateProductivityScore(
  dateStr: string,
  tasks: Task[],
  focusSessions: FocusSession[],
  timeBlocks: TimeBlock[],
  settings: UserSettings
): ProductivityScoreBreakdown {
  // 1. Priority completion
  const top3Planned = tasks.filter(t => t.isDailyTop3 && (t.scheduledDate === dateStr || t.createdAt.startsWith(dateStr)));
  const top3Completed = top3Planned.filter(t => t.status === 'completed');

  let priorityScore = 100;
  if (top3Planned.length > 0) {
    priorityScore = Math.round((top3Completed.length / top3Planned.length) * 100);
  } else {
    // If no top3 set, evaluate all planned tasks for today
    const todayTasks = tasks.filter(t => t.scheduledDate === dateStr);
    if (todayTasks.length > 0) {
      const done = todayTasks.filter(t => t.status === 'completed').length;
      priorityScore = Math.round((done / todayTasks.length) * 100);
    } else {
      priorityScore = 80; // Baseline if no tasks were explicitly scheduled
    }
  }

  // 2. Focus Target Score
  const daySessions = focusSessions.filter(
    s => s.startTime.startsWith(dateStr) && s.status === 'completed'
  );
  const actualFocusMinutes = Math.round(
    daySessions.reduce((acc, s) => acc + s.actualElapsedSeconds, 0) / 60
  );
  const targetMinutes = settings.dailyFocusTargetMinutes || 240;
  const focusScore = Math.min(100, Math.round((actualFocusMinutes / targetMinutes) * 100));

  // 3. Schedule Adherence Score
  const dayBlocks = timeBlocks.filter(b => b.date === dateStr);
  let scheduleScore = 100;
  if (dayBlocks.length > 0) {
    const doneBlocks = dayBlocks.filter(b => b.completed).length;
    scheduleScore = Math.round((doneBlocks / dayBlocks.length) * 100);
  }

  // Weighted total
  const wp = settings.scoreWeightPriority || 40;
  const wf = settings.scoreWeightFocus || 40;
  const ws = settings.scoreWeightSchedule || 20;
  const totalWeight = wp + wf + ws || 100;

  const rawScore = (priorityScore * wp + focusScore * wf + scheduleScore * ws) / totalWeight;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  const formulaDescription = `Calculated as: (${wp}% Priority Completion [${priorityScore}%] + ${wf}% Focus Target [${focusScore}%] + ${ws}% Schedule Adherence [${scheduleScore}%])`;

  return {
    score,
    priorityScore,
    focusScore,
    scheduleScore,
    formulaDescription,
  };
}

export function calculateStreakDays(completions: HabitCompletion[], focusSessions: FocusSession[]): number {
  const activeDates = new Set<string>();

  completions.forEach(c => {
    if (c.completed) activeDates.add(c.date);
  });

  focusSessions.forEach(s => {
    if (s.status === 'completed' && s.actualElapsedSeconds >= 1200) {
      activeDates.add(s.startTime.split('T')[0]);
    }
  });

  let streak = 0;
  const current = new Date();

  // Check today or yesterday as start
  const todayStr = current.toISOString().split('T')[0];
  const yesterday = new Date(current);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let checkDate = activeDates.has(todayStr) ? current : (activeDates.has(yesterdayStr) ? yesterday : null);

  if (!checkDate) return 0;

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Gentle audio chime using Web Audio API (zero external assets)
export function playFocusChime(enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell chime: 528Hz (clarity) & 1056Hz
    const freqs = [528, 792, 1056];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.15 / (idx + 1), now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  } catch (err) {
    console.warn('Audio chime playback omitted:', err);
  }
}

// Export tasks & analytics to CSV
export function exportToCSV(tasks: Task[], clients: Client[], focusSessions: FocusSession[]) {
  const clientMap = new Map(clients.map(c => [c.id, c.businessName]));

  const headers = [
    'Task ID',
    'Title',
    'Category',
    'Client',
    'Priority',
    'Status',
    'Est Minutes',
    'Actual Minutes',
    'Is Daily Top 3',
    'Scheduled Date',
    'Created At',
    'Completed At',
  ];

  const rows = tasks.map(t => [
    `"${t.id}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.clientId ? (clientMap.get(t.clientId) || t.clientId).replace(/"/g, '""') : 'Personal/Internal'}"`,
    `"${t.priority}"`,
    `"${t.status}"`,
    t.estimatedDurationMinutes,
    t.actualDurationMinutes,
    t.isDailyTop3 ? 'Yes' : 'No',
    `"${t.scheduledDate || ''}"`,
    `"${t.createdAt}"`,
    `"${t.completedAt || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `StrykonOS_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
