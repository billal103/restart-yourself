import type { NotificationItem } from '@/types/domain'

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export const notifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'message_request',
    title: 'New message request',
    body: 'Someone sent you a message request after reading your story.',
    createdAt: hoursAgoIso(1),
    isRead: false,
  },
  {
    id: 'notif-2',
    type: 'reaction',
    title: 'New support reaction',
    body: 'Your story received a new "Sending Support" reaction.',
    createdAt: hoursAgoIso(4),
    isRead: false,
  },
  {
    id: 'notif-3',
    type: 'comment',
    title: 'New comment',
    body: 'Someone commented on your story.',
    createdAt: hoursAgoIso(10),
    isRead: true,
  },
  {
    id: 'notif-4',
    type: 'group_discussion',
    title: 'New activity in Starting Over',
    body: 'There are 3 new messages in a group you belong to.',
    createdAt: hoursAgoIso(20),
    isRead: true,
  },
  {
    id: 'notif-5',
    type: 'recovery_reminder',
    title: 'Mood check-in reminder',
    body: 'You have not logged your mood in 2 days.',
    createdAt: hoursAgoIso(26),
    isRead: true,
  },
  {
    id: 'notif-6',
    type: 'moderation',
    title: 'Story moderation update',
    body: 'One of your submitted stories has been published.',
    createdAt: hoursAgoIso(48),
    isRead: true,
  },
]
