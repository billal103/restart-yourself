import { describe, expect, it } from 'vitest'
import { truncate } from '@/lib/utils'

describe('truncate', () => {
  it('returns the original string when shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and appends an ellipsis when longer than maxLength', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })
})
