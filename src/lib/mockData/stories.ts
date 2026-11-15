import type { ReactionType, Story, StoryStatus } from '@/types/domain'
import { makeAuthor } from './authors'
import { categories } from './categories'
import { tags } from './tags'

const storySeeds: Array<{
  title: string
  excerpt: string
  content: string
  categoryIndex: number
  tagIndexes: number[]
  warnings: string[]
  status: StoryStatus
  daysAgo: number
}> = [
  {
    title: 'I left my marriage after twelve years, and I finally feel like myself again',
    excerpt:
      'It took me a long time to admit the relationship was no longer safe for either of us. This is the story of how I found the courage to leave.',
    content:
      'For twelve years I told myself things would get better. I kept waiting for the version of my marriage I remembered from the beginning to come back. It never did.\n\nThe hardest part was not the leaving itself — it was admitting to myself that staying was its own kind of harm. I spent months in a fog of guilt, wondering what I could have done differently.\n\nNow, almost a year later, I can say I am breathing easier. I am not writing this to say leaving is always the answer. I am writing it because somewhere, someone else is in the fog I was in, and I want them to know it is possible to come out the other side.',
    categoryIndex: 0,
    tagIndexes: [1, 2, 6],
    warnings: [],
    status: 'published',
    daysAgo: 2,
  },
  {
    title: 'Losing my job of ten years taught me who I actually am',
    excerpt:
      'I thought my career was my identity. When the layoffs came, I had to rebuild from nothing — and found something more honest underneath.',
    content:
      'When the email came through at 9:04am on a Tuesday, I read it three times before it made sense. Ten years, gone in a paragraph.\n\nFor weeks I did not know who I was without the job title. I had built so much of my self-worth around being useful to that company.\n\nSlowly, through a lot of difficult mornings, I started to separate my value as a person from my output as an employee. I am still looking for the next thing, but I am looking from a steadier place now.',
    categoryIndex: 5,
    tagIndexes: [4, 2, 6],
    warnings: [],
    status: 'published',
    daysAgo: 5,
  },
  {
    title: "My partner and I are divorcing, and I'm scared for my kids",
    excerpt:
      'Co-parenting feels impossible some days. I am sharing this because I need to hear from people who have been through it and made it work.',
    content:
      "We decided to separate six months ago. The decision itself felt almost like relief after years of trying to make something work that wasn't working.\n\nWhat scares me now is my children. I see the confusion in their eyes when they go between two houses. I worry constantly that I am failing them even while trying to do the right thing.\n\nIf you have been through this and found a rhythm that worked for your family, I would be grateful to hear about it.",
    categoryIndex: 1,
    tagIndexes: [3, 7],
    warnings: ['Discussion of family separation'],
    status: 'published',
    daysAgo: 1,
  },
  {
    title: 'Three years after the breakup, I finally stopped checking his social media',
    excerpt:
      'Healing from heartbreak is not linear. Here is what finally helped me let go after years of holding on.',
    content:
      "I am almost embarrassed to admit how long I held on. Three years of quietly checking in on someone who had clearly moved on.\n\nWhat changed wasn't one big moment. It was a slow accumulation of small choices — deleting an app, muting a name, filling the time I used to spend scrolling with something that was actually mine.\n\nIf you are still checking, still waiting for a sign, I understand. I just want you to know that the day you stop will feel lighter than you expect.",
    categoryIndex: 2,
    tagIndexes: [0, 6, 9],
    warnings: [],
    status: 'published',
    daysAgo: 8,
  },
  {
    title: 'I failed my final year of university and thought my life was over',
    excerpt:
      'Academic failure felt like the end of everything I had worked toward. It was actually the beginning of a very different, better path.',
    content:
      'I had built my entire identity around being "the smart one" in my family. When I failed my final year, it felt like the ground disappeared beneath me.\n\nFor months I avoided calls from friends and family, convinced I had disappointed everyone who believed in me.\n\nEventually I retook the year on different terms, studying something that actually interested me rather than what I thought I should study. I am graduating this spring, and for the first time, genuinely excited about what comes next.',
    categoryIndex: 8,
    tagIndexes: [2, 6, 7],
    warnings: [],
    status: 'published',
    daysAgo: 12,
  },
  {
    title: 'Learning to be alone without being lonely',
    excerpt:
      'After my closest friendships fell apart in the same year, I had to learn how to be my own company again.',
    content:
      "Within the same twelve months, I lost touch with two of my closest friends and ended a long relationship. I went from a full calendar to an empty one almost overnight.\n\nThe silence was unbearable at first. I filled it with noise — shows, scrolling, anything to avoid sitting with myself.\n\nSomewhere along the way, I started enjoying my own company instead of just tolerating it. I'm not saying loneliness doesn't visit anymore. It does. But it doesn't live here the way it used to.",
    categoryIndex: 4,
    tagIndexes: [0, 9],
    warnings: [],
    status: 'published',
    daysAgo: 3,
  },
  {
    title: 'Declaring bankruptcy at 29 was the hardest and most honest thing I have done',
    excerpt:
      'Financial collapse felt like a personal failure for a long time. Writing this is part of letting that shame go.',
    content:
      "I avoided looking at my bank account for almost a year before things got bad enough that I had no choice. The shame of financial failure is its own particular weight.\n\nFiling for bankruptcy did not feel like relief right away. It felt like admission, like defeat. It took time to see it as a reset rather than a verdict on my worth.\n\nTwo years later, I manage a small budget carefully and talk openly with friends about money in a way I never used to. That openness has been its own kind of recovery.",
    categoryIndex: 7,
    tagIndexes: [2, 9],
    warnings: ['Discussion of financial hardship'],
    status: 'published',
    daysAgo: 20,
  },
  {
    title: 'My father and I did not speak for six years. We are rebuilding now, slowly.',
    excerpt:
      'Family estrangement is complicated and rarely talked about honestly. This is our story of tentative repair.',
    content:
      "Six years of silence started with one argument that neither of us would back down from, and then became its own habit.\n\nWhat brought us back into contact was not a dramatic reconciliation scene. It was a short, awkward phone call neither of us planned.\n\nWe are not where we used to be, and we may never be. But we are talking, and for both of us, that is more than we expected to have again.",
    categoryIndex: 3,
    tagIndexes: [7, 9, 3],
    warnings: [],
    status: 'published',
    daysAgo: 15,
  },
  {
    title: 'Starting over in a new city with no one who knows my name',
    excerpt:
      'Moving somewhere completely new after my divorce terrified me. It also gave me room to become someone I actually wanted to be.',
    content:
      "After the divorce finalized, I packed what fit in my car and drove somewhere I had never been, mostly because no one there knew the version of me from my marriage.\n\nThe first few months were lonely in a way I was not prepared for. But slowly, I started building a life out of choices that were entirely mine.\n\nI am not going to pretend starting over is easy. It is one of the hardest things I have done. It is also, so far, one of the best.",
    categoryIndex: 10,
    tagIndexes: [1, 6, 7],
    warnings: [],
    status: 'published',
    daysAgo: 6,
  },
  {
    title: "I'm rebuilding my confidence after a public professional failure",
    excerpt:
      'A mistake at work followed me for a long time. This is how I slowly started trusting myself again.',
    content:
      "A mistake I made at work became the subject of gossip in my small industry for longer than I thought possible. For a while I believed everyone saw me as only that mistake.\n\nI considered changing careers entirely just to escape the feeling of being watched and judged.\n\nInstead, I stayed, rebuilt my work slowly and deliberately, and let the quality of what I did now speak louder than what happened before. It has taken over a year, but people's memories move on faster than I expected.",
    categoryIndex: 9,
    tagIndexes: [2, 6],
    warnings: [],
    status: 'published',
    daysAgo: 9,
  },
  {
    title: 'Draft: thinking about how to talk about my anxiety at work',
    excerpt: 'Still working through how to phrase this one.',
    content: 'This is a draft I am still working on. Not ready to publish yet.',
    categoryIndex: 5,
    tagIndexes: [5],
    warnings: [],
    status: 'draft',
    daysAgo: 0,
  },
  {
    title: 'Pending review: my experience leaving an unsafe relationship',
    excerpt: 'Submitted for moderation review before publishing.',
    content:
      'This story is currently awaiting moderation review before it becomes visible to the community.',
    categoryIndex: 0,
    tagIndexes: [1, 7],
    warnings: ['Discussion of relationship difficulty'],
    status: 'pending',
    daysAgo: 0,
  },
]

function buildReactionCounts(seed: number): Record<ReactionType, number> {
  return {
    understand: (seed * 3) % 40 + 2,
    sending_support: (seed * 5) % 60 + 5,
    not_alone: (seed * 2) % 30 + 1,
    stay_strong: (seed * 7) % 25 + 1,
    thank_you: (seed * 4) % 20 + 1,
  }
}

export const stories: Story[] = storySeeds.map((seed, index) => {
  const createdAt = new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000).toISOString()
  const category = categories[seed.categoryIndex] ?? categories[0]!
  return {
    id: `story-${index + 1}`,
    title: seed.title,
    content: seed.content,
    excerpt: seed.excerpt,
    author: makeAuthor(index + 1),
    category,
    tags: seed.tagIndexes.map((i) => tags[i]).filter((t): t is NonNullable<typeof t> => Boolean(t)),
    status: seed.status,
    contentWarnings: seed.warnings,
    publishedAt: seed.status === 'published' ? createdAt : null,
    createdAt,
    reactionCounts: buildReactionCounts(index + 1),
    commentCount: (index * 3) % 18,
    bookmarked: index % 4 === 0,
  }
})

export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id)
}

export function getPublishedStories(): Story[] {
  return stories.filter((story) => story.status === 'published')
}
