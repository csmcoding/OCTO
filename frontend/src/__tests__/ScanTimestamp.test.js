import { describe, it, expect } from 'vitest'
import { relativeTime } from '../components/ScanTimestamp'

describe('ScanTimestamp', () => {
  it('shows just now when scannedAt is null', () => {
    expect(relativeTime(null)).toBe('just now')
  })

  it('shows just now for a very recent date', () => {
    expect(relativeTime(new Date())).toBe('just now')
  })

  it('shows minutes ago for dates 1-59 minutes old', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(relativeTime(fiveMinutesAgo)).toBe('5 mins ago')
  })

  it('uses singular for exactly 1 minute', () => {
    const oneMinuteAgo = new Date(Date.now() - 61 * 1000)
    expect(relativeTime(oneMinuteAgo)).toBe('1 min ago')
  })
})
