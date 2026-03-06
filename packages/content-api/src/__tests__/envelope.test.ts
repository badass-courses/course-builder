import { describe, it, expect } from 'vitest'
import { success, error } from '../schemas/envelope'

describe('envelope helpers', () => {
  it('creates a success response', () => {
    const result = success({ id: '1', type: 'post' })

    expect(result).toEqual({
      ok: true,
      data: { id: '1', type: 'post' },
    })
  })

  it('creates a success response with meta', () => {
    const result = success({ id: '1' }, { version: 3 })

    expect(result).toEqual({
      ok: true,
      data: { id: '1' },
      meta: { version: 3 },
    })
  })

  it('creates an error response', () => {
    const result = error('Not found', 'NOT_FOUND')

    expect(result).toEqual({
      ok: false,
      error: { message: 'Not found', code: 'NOT_FOUND' },
    })
  })

  it('creates an error response with details', () => {
    const result = error('Validation failed', 'VALIDATION_ERROR', {
      field: 'title',
    })

    expect(result).toEqual({
      ok: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { field: 'title' },
      },
    })
  })
})
