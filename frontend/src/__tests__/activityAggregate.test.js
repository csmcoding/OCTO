import { describe, it, expect } from 'vitest'
import {
  indexActivityByPath,
  getNodeActivity,
  aggregateFolderActivity,
  getActivityLevel,
  computeActivitySummary,
  scoreActivity,
  getChurnLabel,
  computeActivityLevelCounts,
} from '../utils/activityAggregate.js'

// ── helpers ─────────────────────────────────────────────────────────────────

const file   = (name, path) => ({ id: path, name, path, type: 'file',   signals: {}, children: [] })
const folder = (name, path, children = []) => ({ id: path, name, path, type: 'folder', signals: {}, children })

const activity = (path, opts = {}) => ({
  path,
  relPath:           path,
  commitCount30d:    opts.commitCount30d ?? 0,
  commitCount7d:     opts.commitCount7d  ?? 0,
  isDirty:           opts.isDirty        ?? false,
  lastCommitAt:      opts.lastCommitAt   ?? null,
  lastCommitSha:     null,
  lastCommitMessage: null,
  author:            null,
})

// ── indexActivityByPath ──────────────────────────────────────────────────────

describe('indexActivityByPath', () => {
  // 1
  it('indexes items by path', () => {
    const items = [activity('/a/b.js'), activity('/a/c.js')]
    const index = indexActivityByPath(items)
    expect(index['/a/b.js']).toBeDefined()
    expect(index['/a/c.js']).toBeDefined()
    expect(Object.keys(index)).toHaveLength(2)
  })

  it('returns empty object for empty array', () => {
    expect(indexActivityByPath([])).toEqual({})
  })
})

// ── getNodeActivity ──────────────────────────────────────────────────────────

describe('getNodeActivity', () => {
  // 2
  it('file node resolves direct activity', () => {
    const index = { '/a/b.js': activity('/a/b.js', { commitCount7d: 3 }) }
    const result = getNodeActivity(file('b.js', '/a/b.js'), index)
    expect(result.commitCount7d).toBe(3)
  })

  it('returns null for unknown path', () => {
    expect(getNodeActivity(file('x.js', '/x.js'), {})).toBeNull()
  })
})

// ── aggregateFolderActivity ──────────────────────────────────────────────────

describe('aggregateFolderActivity', () => {
  // 3
  it('sums commitCounts from descendant files', () => {
    const parent = folder('root', '/root', [
      file('a.js', '/root/a.js'),
      file('b.js', '/root/b.js'),
    ])
    const index = {
      '/root/a.js': activity('/root/a.js', { commitCount30d: 3, commitCount7d: 1 }),
      '/root/b.js': activity('/root/b.js', { commitCount30d: 2, commitCount7d: 2 }),
    }
    const result = aggregateFolderActivity(parent, index)
    expect(result.commitCount30d).toBe(5)
    expect(result.commitCount7d).toBe(3)
  })

  // 4
  it('dirty descendant marks folder dirty', () => {
    const parent = folder('root', '/root', [file('dirty.js', '/root/dirty.js')])
    const index  = { '/root/dirty.js': activity('/root/dirty.js', { isDirty: true }) }
    expect(aggregateFolderActivity(parent, index).isDirty).toBe(true)
  })

  it('returns null when no descendants have activity data', () => {
    const parent = folder('empty', '/empty', [file('x.js', '/empty/x.js')])
    expect(aggregateFolderActivity(parent, {})).toBeNull()
  })

  it('picks most recent lastCommitAt across descendants', () => {
    const recent = new Date(Date.now() - 3600000).toISOString()
    const older  = new Date(Date.now() - 86400000).toISOString()
    const parent = folder('r', '/r', [file('a.js', '/r/a.js'), file('b.js', '/r/b.js')])
    const index  = {
      '/r/a.js': activity('/r/a.js', { lastCommitAt: older }),
      '/r/b.js': activity('/r/b.js', { lastCommitAt: recent }),
    }
    const result = aggregateFolderActivity(parent, index)
    expect(result.lastCommitAt).toBe(recent)
  })
})

// ── getActivityLevel ─────────────────────────────────────────────────────────

describe('getActivityLevel', () => {
  // 5 (part of summarizeActivity spec, tested here)
  it('returns null for null item', () => {
    expect(getActivityLevel(null)).toBeNull()
  })

  it('returns hot for commit within 24h', () => {
    const recent = new Date(Date.now() - 3 * 3600000).toISOString()
    expect(getActivityLevel({ lastCommitAt: recent })).toBe('hot')
  })

  it('returns warm for commit 2–6 days ago', () => {
    const threedays = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(getActivityLevel({ lastCommitAt: threedays })).toBe('warm')
  })

  it('returns cool for commit 8–29 days ago', () => {
    const twoweeks = new Date(Date.now() - 14 * 86400000).toISOString()
    expect(getActivityLevel({ lastCommitAt: twoweeks })).toBe('cool')
  })

  it('returns stale for null lastCommitAt', () => {
    expect(getActivityLevel({ lastCommitAt: null })).toBe('stale')
  })

  it('returns stale for commit older than 30d', () => {
    const old = new Date(Date.now() - 45 * 86400000).toISOString()
    expect(getActivityLevel({ lastCommitAt: old })).toBe('stale')
  })
})

// ── computeActivitySummary ───────────────────────────────────────────────────

describe('computeActivitySummary', () => {
  // 6 (scene summary counts)
  it('counts active-week + dirty + tracked from visible nodes', () => {
    const nodes = [
      file('a.js', '/a.js'),
      file('b.js', '/b.js'),
      file('c.js', '/c.js'),
    ]
    const index = {
      '/a.js': activity('/a.js', { commitCount7d: 2, isDirty: true }),
      '/b.js': activity('/b.js', { commitCount7d: 0 }),
      // c.js not in index — not tracked
    }
    const summary = computeActivitySummary(nodes, index)
    expect(summary).toContain('1 active this week')
    expect(summary).toContain('1 dirty')
    expect(summary).toContain('2 tracked')
  })

  it('returns null when nothing is tracked', () => {
    expect(computeActivitySummary([file('x.js', '/x.js')], {})).toBeNull()
  })
})

// ── scoreActivity ─────────────────────────────────────────────────────────────

describe('scoreActivity', () => {
  it('returns 0 for null', () => {
    expect(scoreActivity(null)).toBe(0)
  })

  it('returns 3 for hot item (commit < 24h)', () => {
    const recent = new Date(Date.now() - 3600000).toISOString()
    expect(scoreActivity({ lastCommitAt: recent, isDirty: false })).toBe(3)
  })

  it('returns 3 for dirty item regardless of recency', () => {
    const old = new Date(Date.now() - 45 * 86400000).toISOString()
    expect(scoreActivity({ lastCommitAt: old, isDirty: true })).toBe(3)
  })

  it('returns 2 for warm item (2–6 days ago)', () => {
    const threedays = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(scoreActivity({ lastCommitAt: threedays, isDirty: false })).toBe(2)
  })

  it('returns 1 for cool item (8–29 days ago)', () => {
    const twoweeks = new Date(Date.now() - 14 * 86400000).toISOString()
    expect(scoreActivity({ lastCommitAt: twoweeks, isDirty: false })).toBe(1)
  })

  it('returns 0 for stale item (> 30 days ago)', () => {
    const old = new Date(Date.now() - 45 * 86400000).toISOString()
    expect(scoreActivity({ lastCommitAt: old, isDirty: false })).toBe(0)
  })

  it('returns 0 for item with null lastCommitAt and not dirty', () => {
    expect(scoreActivity({ lastCommitAt: null, isDirty: false })).toBe(0)
  })
})

// ── getChurnLabel ─────────────────────────────────────────────────────────────

describe('getChurnLabel', () => {
  it('returns null for null item', () => {
    expect(getChurnLabel(null)).toBeNull()
  })

  it('returns null for zero commits', () => {
    expect(getChurnLabel(activity('/x.js'))).toBeNull()
  })

  it('returns high churn when commitCount7d >= 5', () => {
    expect(getChurnLabel(activity('/x.js', { commitCount7d: 5, commitCount30d: 5 }))).toBe('high churn')
  })

  it('returns high churn when commitCount30d >= 15', () => {
    expect(getChurnLabel(activity('/x.js', { commitCount7d: 1, commitCount30d: 15 }))).toBe('high churn')
  })

  it('returns steady when commitCount7d >= 2', () => {
    expect(getChurnLabel(activity('/x.js', { commitCount7d: 2, commitCount30d: 2 }))).toBe('steady')
  })

  it('returns steady when commitCount30d >= 5', () => {
    expect(getChurnLabel(activity('/x.js', { commitCount7d: 0, commitCount30d: 5 }))).toBe('steady')
  })

  it('returns light for any commits in last 30d below steady threshold', () => {
    expect(getChurnLabel(activity('/x.js', { commitCount7d: 1, commitCount30d: 4 }))).toBe('light')
  })

  it('high churn beats steady (7d threshold)', () => {
    expect(getChurnLabel(activity('/x.js', { commitCount7d: 6, commitCount30d: 20 }))).toBe('high churn')
  })
})

// ── computeActivityLevelCounts ────────────────────────────────────────────────

describe('computeActivityLevelCounts', () => {
  it('returns all zeros for empty node list', () => {
    const counts = computeActivityLevelCounts([], {})
    expect(counts).toEqual({ hot: 0, warm: 0, cool: 0, stale: 0, unknown: 0 })
  })

  it('counts unknown for untracked file node', () => {
    const counts = computeActivityLevelCounts([file('x.js', '/x.js')], {})
    expect(counts.unknown).toBe(1)
  })

  it('counts hot for file with commit < 24h', () => {
    const recent = new Date(Date.now() - 3600000).toISOString()
    const index = { '/a.js': activity('/a.js', { lastCommitAt: recent }) }
    const counts = computeActivityLevelCounts([file('a.js', '/a.js')], index)
    expect(counts.hot).toBe(1)
    expect(counts.warm).toBe(0)
  })

  it('counts stale for file with null lastCommitAt', () => {
    const index = { '/a.js': activity('/a.js') }
    const counts = computeActivityLevelCounts([file('a.js', '/a.js')], index)
    expect(counts.stale).toBe(1)
  })

  it('aggregates folder node activity before counting', () => {
    const recent = new Date(Date.now() - 3600000).toISOString()
    const parent = folder('root', '/root', [file('a.js', '/root/a.js')])
    const index = { '/root/a.js': activity('/root/a.js', { lastCommitAt: recent }) }
    const counts = computeActivityLevelCounts([parent], index)
    expect(counts.hot).toBe(1)
    expect(counts.unknown).toBe(0)
  })

  it('counts folder with no tracked children as unknown', () => {
    const parent = folder('empty', '/empty', [file('x.js', '/empty/x.js')])
    const counts = computeActivityLevelCounts([parent], {})
    expect(counts.unknown).toBe(1)
  })

  it('accumulates across multiple nodes', () => {
    const recent = new Date(Date.now() - 3600000).toISOString()
    const old    = new Date(Date.now() - 45 * 86400000).toISOString()
    const nodes = [file('a.js', '/a.js'), file('b.js', '/b.js'), file('c.js', '/c.js')]
    const index = {
      '/a.js': activity('/a.js', { lastCommitAt: recent }),
      '/b.js': activity('/b.js', { lastCommitAt: old }),
    }
    const counts = computeActivityLevelCounts(nodes, index)
    expect(counts.hot).toBe(1)
    expect(counts.stale).toBe(1)
    expect(counts.unknown).toBe(1)
  })
})
