import { describe, it, expect } from 'vitest'
import { summarizeActivity, processActivityResponse } from '../utils/loadActivity.js'

// ── summarizeActivity ────────────────────────────────────────────────────────

describe('summarizeActivity', () => {
  // 1
  it('returns stale for null input', () => {
    expect(summarizeActivity(null)).toBe('stale')
  })

  // 2
  it('returns "edited today" for commit < 24h ago', () => {
    const item = {
      lastCommitAt: new Date().toISOString(),
      commitCount7d: 1,
      isDirty: false,
    }
    expect(summarizeActivity(item)).toBe('edited today')
  })

  // 3
  it('returns "dirty + active" when isDirty and commitCount7d > 0', () => {
    const item = {
      lastCommitAt: new Date().toISOString(),
      commitCount7d: 3,
      isDirty: true,
    }
    expect(summarizeActivity(item)).toBe('dirty + active')
  })

  // 4
  it('returns stale for very old commit and no 30d activity', () => {
    const old = new Date(Date.now() - 60 * 86400000).toISOString()
    const item = { lastCommitAt: old, commitCount7d: 0, commitCount30d: 0, isDirty: false }
    expect(summarizeActivity(item)).toBe('stale')
  })

  // 5
  it('returns "dirty" for dirty file with no recent commits', () => {
    const old = new Date(Date.now() - 60 * 86400000).toISOString()
    const item = { lastCommitAt: old, commitCount7d: 0, commitCount30d: 0, isDirty: true }
    expect(summarizeActivity(item)).toBe('dirty')
  })

  it('returns commits-this-week label for active week', () => {
    const recent = new Date(Date.now() - 2 * 86400000).toISOString()
    const item = { lastCommitAt: recent, commitCount7d: 4, commitCount30d: 6, isDirty: false }
    expect(summarizeActivity(item)).toBe('4 commits this week')
  })

  it('returns single-commit label for 1 commit this week', () => {
    const recent = new Date(Date.now() - 2 * 86400000).toISOString()
    const item = { lastCommitAt: recent, commitCount7d: 1, commitCount30d: 3, isDirty: false }
    expect(summarizeActivity(item)).toBe('1 commit this week')
  })
})

// ── processActivityResponse ───────────────────────────────────────────────────

describe('processActivityResponse', () => {
  // 6 — not_git_repo response handled gracefully
  it('not_git_repo response sets unavailable and empty byPath', () => {
    const raw = {
      root: '/some/path',
      generatedAt: new Date().toISOString(),
      items: [],
      unavailable: 'not_git_repo',
    }
    const result = processActivityResponse(raw)
    expect(result.unavailable).toBe('not_git_repo')
    expect(result.byPath).toEqual({})
  })

  it('normal response indexes items by path', () => {
    const raw = {
      root: '/root',
      generatedAt: new Date().toISOString(),
      items: [
        { path: '/root/a.js', relPath: 'a.js', commitCount30d: 2, commitCount7d: 1,
          isDirty: false, lastCommitAt: null, lastCommitSha: null, lastCommitMessage: null, author: null },
      ],
    }
    const result = processActivityResponse(raw)
    expect(result.unavailable).toBeNull()
    expect(result.byPath['/root/a.js']).toBeDefined()
    expect(result.byPath['/root/a.js'].commitCount30d).toBe(2)
  })
})
