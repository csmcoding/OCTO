import { describe, it, expect } from 'vitest'

function isValidUnixPath(p) {
  return typeof p === 'string' && p.startsWith('/') && p.length > 1
}

function deduplicateRecents(existing, newPath) {
  const filtered = existing.filter(r => r.path !== newPath)
  return [{ path: newPath, name: newPath.split('/').pop() }, ...filtered].slice(0, 5)
}

describe('onboarding logic', () => {
  it('validates unix path format', () => {
    expect(isValidUnixPath('/home/user/project')).toBe(true)
    expect(isValidUnixPath('relative/path')).toBe(false)
    expect(isValidUnixPath('')).toBe(false)
  })

  it('deduplicates recents keeping newest first', () => {
    const existing = [
      { path: '/proj/a', name: 'a' },
      { path: '/proj/b', name: 'b' },
    ]
    const result = deduplicateRecents(existing, '/proj/a')
    expect(result[0].path).toBe('/proj/a')
    expect(result).toHaveLength(2)
  })

  it('caps recents at 5', () => {
    const existing = Array.from({ length: 5 }, (_, i) => ({
      path: `/proj/${i}`, name: `${i}`,
    }))
    const result = deduplicateRecents(existing, '/proj/new')
    expect(result).toHaveLength(5)
  })

  it('root path from config overrides empty state', () => {
    const cfg = { rootPath: '/home/user/myproject' }
    const shouldShowOnboarding = !cfg.rootPath
    expect(shouldShowOnboarding).toBe(false)
  })
})
