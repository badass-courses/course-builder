import { describe, it, expect } from 'vitest'
import { validateEdge, type EdgeRule } from '../schemas/edge-matrix'

describe('validateEdge', () => {
  const edges: EdgeRule[] = [
    { parentType: 'lesson', childType: 'videoResource' },
    { parentType: 'lesson', childType: 'solution' },
    { parentType: 'section', childType: 'lesson' },
    { parentType: 'workshop', childType: 'section' },
    { parentType: 'solution', childType: 'videoResource' },
    { parentType: 'videoResource', childType: 'raw-transcript' },
  ]

  it('returns true for valid edges', () => {
    expect(validateEdge(edges, 'lesson', 'videoResource')).toBe(true)
    expect(validateEdge(edges, 'lesson', 'solution')).toBe(true)
    expect(validateEdge(edges, 'section', 'lesson')).toBe(true)
    expect(validateEdge(edges, 'workshop', 'section')).toBe(true)
  })

  it('returns false for invalid edges', () => {
    expect(validateEdge(edges, 'post', 'videoResource')).toBe(false)
    expect(validateEdge(edges, 'lesson', 'workshop')).toBe(false)
    expect(validateEdge(edges, 'raw-transcript', 'workshop')).toBe(false)
  })

  it('returns false for reversed edges', () => {
    expect(validateEdge(edges, 'videoResource', 'lesson')).toBe(false)
    expect(validateEdge(edges, 'solution', 'lesson')).toBe(false)
  })

  it('returns true for empty edge list', () => {
    expect(validateEdge([], 'anything', 'anything')).toBe(false)
  })
})
