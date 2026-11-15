import type { Conversation, Group, GroupMessage, Message } from '@/types/domain'
import { makeAuthor } from './authors'

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export const conversations: Conversation[] = [
  {
    id: 'conv-1',
    participant: makeAuthor(201),
    lastMessage: 'Thank you for listening, it really helped to talk this through.',
    lastMessageAt: hoursAgoIso(2),
    unreadCount: 2,
    isRequest: false,
    isBlocked: false,
  },
  {
    id: 'conv-2',
    participant: makeAuthor(202),
    lastMessage: 'I read your story and wanted to reach out, I went through something similar.',
    lastMessageAt: hoursAgoIso(20),
    unreadCount: 0,
    isRequest: true,
    isBlocked: false,
  },
  {
    id: 'conv-3',
    participant: makeAuthor(203),
    lastMessage: 'How are you doing this week?',
    lastMessageAt: daysAgoIso(3),
    unreadCount: 0,
    isRequest: false,
    isBlocked: false,
  },
]

export const messages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'anon-201',
    content: 'Hi, I just wanted to check in after reading your story.',
    sentAt: hoursAgoIso(3),
    readAt: hoursAgoIso(3),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'me',
    content: 'That means a lot, thank you for reaching out.',
    sentAt: hoursAgoIso(2.5),
    readAt: hoursAgoIso(2.5),
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'anon-201',
    content: 'Thank you for listening, it really helped to talk this through.',
    sentAt: hoursAgoIso(2),
    readAt: null,
  },
]

export function getMessagesForConversation(conversationId: string): Message[] {
  return messages.filter((message) => message.conversationId === conversationId)
}

export const groups: Group[] = [
  {
    id: 'group-1',
    slug: 'starting-over',
    name: 'Starting Over',
    description: 'For anyone rebuilding their life after a major life change.',
    memberCount: 342,
    guidelines: 'Be respectful. No solicitation. No sharing of personal contact information.',
    isMember: true,
  },
  {
    id: 'group-2',
    slug: 'career-recovery',
    name: 'Career Recovery',
    description: 'Support for job loss, career pivots, and professional setbacks.',
    memberCount: 218,
    guidelines: 'Keep discussions constructive. No recruiting or self-promotion.',
    isMember: false,
  },
  {
    id: 'group-3',
    slug: 'personal-growth',
    name: 'Personal Growth',
    description: 'A space focused on habits, mindset, and gradual self-improvement.',
    memberCount: 401,
    guidelines: 'Share experiences, not advice presented as medical fact.',
    isMember: true,
  },
  {
    id: 'group-4',
    slug: 'building-confidence',
    name: 'Building Confidence',
    description: 'For people working through low self-esteem and self-doubt.',
    memberCount: 276,
    guidelines: 'Encourage, do not criticize. Report anything that feels unsafe.',
    isMember: false,
  },
  {
    id: 'group-5',
    slug: 'academic-challenges',
    name: 'Academic Challenges',
    description: 'Students and former students navigating academic pressure or failure.',
    memberCount: 159,
    guidelines: 'No sharing of academic dishonesty requests. Respect all education paths.',
    isMember: false,
  },
  {
    id: 'group-6',
    slug: 'life-after-separation',
    name: 'Life After Separation',
    description: 'Divorce, separation, and co-parenting support.',
    memberCount: 298,
    guidelines: 'No discussion of ongoing legal case specifics that identify others.',
    isMember: true,
  },
  {
    id: 'group-7',
    slug: 'emotional-support',
    name: 'Emotional Support',
    description: 'General emotional support for anyone going through a hard time.',
    memberCount: 512,
    guidelines: 'This is peer support, not professional therapy.',
    isMember: false,
  },
]

export const groupMessages: GroupMessage[] = [
  {
    id: 'gmsg-1',
    groupId: 'group-1',
    author: makeAuthor(301),
    content: 'Moved to a new city last month. It is scary but also kind of exciting.',
    sentAt: hoursAgoIso(5),
  },
  {
    id: 'gmsg-2',
    groupId: 'group-1',
    author: makeAuthor(302),
    content: 'That takes courage. Rooting for you.',
    sentAt: hoursAgoIso(4),
  },
  {
    id: 'gmsg-3',
    groupId: 'group-1',
    author: makeAuthor(303),
    content: 'Welcome! This group helped me a lot when I moved for similar reasons.',
    sentAt: hoursAgoIso(3),
  },
]

export function getMessagesForGroup(groupId: string): GroupMessage[] {
  return groupMessages.filter((message) => message.groupId === groupId)
}
