import { describe, it, expect } from 'vitest'
import {
  SIGNAL_COLORS,
  SIGNAL_LABELS,
  getActiveSignals,
  getDominantColor,
} from '../utils/signals'

describe('SIGNAL_COLORS', () => {
  it('has all five signal keys', () => {
    const expected = ['gitUnpushed', 'gitDirty', 'noReadme', 'recentlyModified', 'dormant']
    expect(Object.keys(SIGNAL_COLORS)).toEqual(expect.arrayContaining(expected))
    expect(Object.keys(SIGNAL_COLORS)).toHaveLength(5)
  })
})

describe('getActiveSignals', () => {
  it('returns empty array when no signals', () => {
    expect(getActiveSignals({ signals: {} })).toEqual([])
  })

  it('returns only active signal keys', () => {
    const node = { signals: { gitDirty: true, noReadme: false, gitUnpushed: false, recentlyModified: false, dormant: false } }
    expect(getActiveSignals(node)).toEqual(['gitDirty'])
  })

  it('handles missing signals field gracefully', () => {
    expect(getActiveSignals({})).toEqual([])
  })
})

describe('getDominantColor', () => {
  it('returns null when no signals active', () => {
    expect(getDominantColor({ signals: {}, dominantColor: null })).toBeNull()
  })

  it('returns dominantColor from node when present', () => {
    const node = { signals: {}, dominantColor: '#ff4444' }
    expect(getDominantColor(node)).toBe('#ff4444')
  })
})
