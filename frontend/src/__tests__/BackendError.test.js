import { describe, it, expect } from 'vitest'
import { ERROR_HEADING } from '../components/BackendError'

describe('BackendError', () => {
  it('error heading text is "backend unreachable"', () => {
    expect(ERROR_HEADING).toBe('backend unreachable')
  })
})
