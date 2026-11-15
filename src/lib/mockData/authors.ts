import type { AnonymousAuthor } from '@/types/domain'

const adjectives = [
  'Quiet',
  'Gentle',
  'Brave',
  'Hopeful',
  'Resilient',
  'Steady',
  'Calm',
  'Wandering',
  'Patient',
  'Bright',
]

const nouns = [
  'Willow',
  'River',
  'Harbor',
  'Maple',
  'Comet',
  'Meadow',
  'Lantern',
  'Sparrow',
  'Horizon',
  'Juniper',
]

const colors = ['#6d4bd6', '#ab8fe1', '#4caf6f', '#d9a43c', '#5934c0', '#8a6fe3']

export function generateAnonymousName(seed: number): string {
  const adjective = adjectives[seed % adjectives.length] ?? 'Quiet'
  const noun = nouns[(seed * 3) % nouns.length] ?? 'Willow'
  const number = ((seed * 7) % 900) + 100
  return `${adjective}${noun}${number}`
}

export function makeAuthor(seed: number, isVerifiedProfessional = false): AnonymousAuthor {
  return {
    anonymousId: `anon-${seed}`,
    displayName: generateAnonymousName(seed),
    avatarColor: colors[seed % colors.length] ?? '#6d4bd6',
    isVerifiedProfessional,
  }
}
