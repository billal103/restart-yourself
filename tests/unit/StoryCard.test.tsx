import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StoryCard } from '@/components/stories/StoryCard'
import { getPublishedStories } from '@/lib/mockData'

describe('StoryCard', () => {
  it('renders the story title and category', () => {
    const story = getPublishedStories()[0]!
    render(
      <MemoryRouter>
        <StoryCard story={story} />
      </MemoryRouter>,
    )
    expect(screen.getByText(story.title)).toBeInTheDocument()
    expect(screen.getByText(story.category.name)).toBeInTheDocument()
  })
})
