import { GoogleGenAI } from '@google/genai';
import type { Task, FocusSession, DistractionRecord, UserSettings } from '../src/types.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

export interface DailyPlanInput {
  tasks: Task[];
  focusTargetMinutes: number;
  workHours: { start: number; end: number };
  distractions: DistractionRecord[];
}

export interface DailyPlanOutput {
  top3TaskIds: string[];
  scheduleSuggestions: Array<{
    timeSlot: string;
    taskId?: string;
    title: string;
    reason: string;
  }>;
  overloaded: boolean;
  overloadNotes?: string;
  deferredTaskIds: string[];
  tacticalAdvice: string[];
}

export async function generateDailyPlanRecommendations(data: DailyPlanInput): Promise<DailyPlanOutput> {
  const client = getAiClient();
  const activeTasks = data.tasks.filter(t => t.status !== 'completed');

  // Fallback if client unavailable
  if (!client) {
    const sorted = [...activeTasks].sort((a, b) => {
      const pMap = { critical: 4, high: 3, medium: 2, low: 1 };
      return (pMap[b.priority] || 1) - (pMap[a.priority] || 1);
    });
    const top3 = sorted.slice(0, 3).map(t => t.id);
    const deferred = sorted.slice(6).map(t => t.id);
    return {
      top3TaskIds: top3,
      scheduleSuggestions: [
        { timeSlot: '09:00 - 10:30', taskId: top3[0], title: 'Deep Work: High-Priority Client Deliverable', reason: 'Highest cognitive energy slot for critical ROAS/revenue task.' },
        { timeSlot: '11:00 - 12:30', taskId: top3[1], title: 'Focused Execution: Client Task #2', reason: 'Pre-lunch focused execution window.' },
        { timeSlot: '14:00 - 15:30', taskId: top3[2], title: 'Pipeline & Agency Growth Outreach', reason: 'Protect daily outbound habit to keep sales funnel full.' },
        { timeSlot: '16:00 - 17:00', title: 'Client Communications & Async Loom Updates', reason: 'Batch emails and slack messages to prevent mid-day interruption.' },
        { timeSlot: '17:30 - 18:00', title: 'Daily Review & Tomorrow Top 3 Lock-in', reason: 'Clear mental residue and set clear focus for tomorrow.' },
      ],
      overloaded: activeTasks.length > 7,
      overloadNotes: activeTasks.length > 7 ? 'You have more than 7 active tasks queued today. Consider deferring low-priority items to maintain high execution quality.' : undefined,
      deferredTaskIds: deferred,
      tacticalAdvice: [
        'Place phone on airplane mode during the 09:00-10:30 deep work sprint.',
        'Batch all client correspondence into 16:00 window rather than reacting to pings in real time.',
        'Protect your 4-hour focus block before scheduling impromptu calls.',
      ],
    };
  }

  try {
    const prompt = `
You are the executive productivity and agency operations coach for a solo digital marketer and growth agency owner.
Analyze the user's active tasks and workload data to create a high-leverage daily plan.

Active tasks:
${JSON.stringify(
  activeTasks.map(t => ({
    id: t.id,
    title: t.title,
    category: t.category,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline,
    estimatedMinutes: t.estimatedDurationMinutes,
    isDailyTop3: t.isDailyTop3,
  })),
  null,
  2
)}

Working hours: ${data.workHours.start}:00 to ${data.workHours.end}:00.
Daily Focus Target: ${data.focusTargetMinutes} minutes.
Recent Distractions logged: ${data.distractions.length} interruptions.

Return a valid JSON object matching this schema:
{
  "top3TaskIds": ["id1", "id2", "id3"],
  "scheduleSuggestions": [
    {"timeSlot": "09:00 - 10:30", "taskId": "id1", "title": "Deep Work Block", "reason": "Justification"}
  ],
  "overloaded": true/false,
  "overloadNotes": "string or null",
  "deferredTaskIds": ["id..."],
  "tacticalAdvice": ["string", "string"]
}
`;

    const response = await withTimeout(
      client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      8000,
      'Gemini daily plan timed out'
    );

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error('Gemini daily plan error:', err);
    // Return graceful fallback
    const top3 = activeTasks.slice(0, 3).map(t => t.id);
    return {
      top3TaskIds: top3,
      scheduleSuggestions: [
        { timeSlot: '09:00 - 10:30', taskId: top3[0], title: 'Morning Deep Focus Block', reason: 'High impact priority work.' },
        { timeSlot: '11:00 - 12:30', taskId: top3[1], title: 'Core Client Sprint', reason: 'Deliverable completion.' },
        { timeSlot: '14:00 - 15:30', taskId: top3[2], title: 'Outbound & Growth Block', reason: 'Pipeline building.' },
      ],
      overloaded: activeTasks.length > 8,
      deferredTaskIds: [],
      tacticalAdvice: [
        'Focus on the #1 critical deliverable before opening inbox.',
        'Keep sessions strictly bounded with Pomodoro timers.',
      ],
    };
  }
}

export async function analyzeDistractionPatterns(distractions: DistractionRecord[], sessions: FocusSession[]): Promise<{
  primaryTrigger: string;
  patternAnalysis: string;
  actionableInterventions: string[];
}> {
  const client = getAiClient();

  if (!client || distractions.length === 0) {
    return {
      primaryTrigger: distractions.length > 0 ? distractions[0].category.replace('_', ' ') : 'Phone / Client Alerts',
      patternAnalysis: 'Distraction data indicates interruptions tend to cluster around midday context switches and unbatched client messaging pings.',
      actionableInterventions: [
        'Implement an asynchronous communication policy: establish set check-in windows at 12:00 PM and 4:30 PM.',
        'Use physical phone distance during deep work sessions (keep phone in another room).',
        'When an urgent client issue arises, log it in the distraction journal and finish the active pomodoro before replying.',
      ],
    };
  }

  try {
    const prompt = `
Analyze these digital agency operator distraction records and focus sessions:
Distractions:
${JSON.stringify(distractions, null, 2)}

Sessions count: ${sessions.length}.
Cancelled or interrupted sessions: ${sessions.filter(s => s.status !== 'completed').length}.

Provide practical, non-punitive advice for a solo digital marketer managing multiple clients (Meta ads, Google ads, SEO, Shopify).
Return JSON:
{
  "primaryTrigger": "Top distraction category and pattern",
  "patternAnalysis": "Detailed 2-3 sentence analysis of why and when distractions happen",
  "actionableInterventions": ["Practical step 1", "Practical step 2", "Practical step 3"]
}
`;

    const response = await withTimeout(
      client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      8000,
      'Distraction analysis timed out'
    );

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return parsed;
  } catch (err) {
    console.error('Distraction analysis error:', err);
    return {
      primaryTrigger: 'Unbatched Client Communications',
      patternAnalysis: 'Midday notifications interrupt flow during complex ad account setup and optimization.',
      actionableInterventions: [
        'Batch client correspondence into a 16:00 - 17:00 window.',
        'Keep phone on Do Not Disturb during 50-minute deep work blocks.',
      ],
    };
  }
}

export async function coachChatResponse(messages: Array<{ role: 'user' | 'assistant'; text: string }>, context: any): Promise<string> {
  const client = getAiClient();
  const userMsg = messages[messages.length - 1]?.text || '';

  if (!client) {
    return `As your StrykonOS Coach: To maintain peak agency performance at Strykon, focus on finishing your Daily Top 3 before taking on reactionary requests. Currently you have ${context.activeTasksCount || 4} active tasks queued. How can I assist you with your schedule or client prioritization?`;
  }

  try {
    const systemPrompt = `
You are the StrykonOS Executive AI Coach for the Strykon digital marketing agency operator.
You assist the operator with client priority triage (Meta/Google Ads, SEO, Shopify, Lead Gen), calendar time-blocking, fighting fatigue/distractions, and protecting deep work blocks.
Be concise, punchy, strategic, practical, and data-grounded. Never fabricate metrics. Provide specific advice and offer concrete actions (like suggesting which task to tackle in the next 50-minute block).

Current Operator Context:
- Active Tasks: ${context.activeTasksCount}
- Completed Today: ${context.completedTodayCount}
- Today's Focus Minutes: ${context.focusMinutesToday} / Target: ${context.targetFocusMinutes}m
- Recorded Distractions Today: ${context.distractionsToday}
- Clients: ${context.clientsList?.join(', ')}
`;

    const contents = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userMsg}` }] }
    ];

    const response = await withTimeout(
      client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
      }),
      8000,
      'Coach response timed out'
    );

    return response.text || 'Let me help you optimize your focus session and client priorities.';
  } catch (err) {
    console.error('Coach chat error:', err);
    return 'I am currently operating in offline mode. Prioritize your highest-leverage client deliverable and initiate a 25-minute focus session!';
  }
}
