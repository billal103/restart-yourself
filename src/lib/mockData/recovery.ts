import type { JournalEntry, MoodEntry, MoodLevel, RecoveryGoal } from '@/types/domain'

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function dateOnly(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

export const journalEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    title: 'A better day',
    content: 'Woke up feeling lighter today. Went for a walk and called an old friend.',
    createdAt: daysAgoIso(1),
    updatedAt: daysAgoIso(1),
  },
  {
    id: 'journal-2',
    title: 'Hard morning',
    content: 'Struggled to get out of bed. Reminded myself that it is okay to have hard days.',
    createdAt: daysAgoIso(3),
    updatedAt: daysAgoIso(3),
  },
  {
    id: 'journal-3',
    title: 'Small win',
    content: 'Finished a task I had been avoiding for weeks. Feels good to have momentum again.',
    createdAt: daysAgoIso(6),
    updatedAt: daysAgoIso(5),
  },
]

const moodPattern: MoodLevel[] = [3, 2, 3, 4, 3, 5, 4, 3, 2, 4, 4, 5, 3, 4]

export const moodEntries: MoodEntry[] = moodPattern.map((level, index) => ({
  id: `mood-${index + 1}`,
  date: dateOnly(moodPattern.length - index),
  level,
  note: '',
}))

export const recoveryGoals: RecoveryGoal[] = [
  {
    id: 'goal-1',
    title: 'Rebuild a daily routine',
    description: 'Establish consistent sleep, meals, and movement each day.',
    createdAt: daysAgoIso(30),
    targetDate: dateOnly(-30),
    isComplete: false,
    milestones: [
      { id: 'ms-1', title: 'Consistent wake time for 1 week', isComplete: true },
      { id: 'ms-2', title: 'Daily 20-minute walk for 2 weeks', isComplete: true },
      { id: 'ms-3', title: 'Consistent sleep schedule for 1 month', isComplete: false },
    ],
  },
  {
    id: 'goal-2',
    title: 'Reconnect with one friend each week',
    description: 'Rebuild my support network after a period of isolation.',
    createdAt: daysAgoIso(20),
    targetDate: null,
    isComplete: false,
    milestones: [
      { id: 'ms-4', title: 'Reach out to 3 old friends', isComplete: true },
      { id: 'ms-5', title: 'Schedule one in-person meetup', isComplete: false },
    ],
  },
  {
    id: 'goal-3',
    title: 'Complete a financial recovery plan',
    description: 'Create and stick to a realistic monthly budget.',
    createdAt: daysAgoIso(60),
    targetDate: dateOnly(-10),
    isComplete: true,
    milestones: [
      { id: 'ms-6', title: 'List all debts and monthly expenses', isComplete: true },
      { id: 'ms-7', title: 'Build a workable monthly budget', isComplete: true },
    ],
  },
]
