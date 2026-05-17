import { describe, it, expect } from 'vitest'
import { searchTree } from '../utils/searchTree'

const makeTree = (names) => ({
  name: 'root',
  path: '/root',
  children: names.map(n => ({ name: n, path: `/root/${n}`, children: [] })),
})

describe('searchTree', () => {
  it('filters nodes by name', () => {
    const tree = makeTree(['proj-a', 'proj-b', 'other'])
    const results = searchTree(tree, 'proj')
    expect(results.map(n => n.name)).toEqual(['proj-a', 'proj-b'])
  })

  it('is case-insensitive', () => {
    const tree = makeTree(['projects', 'notes'])
    const results = searchTree(tree, 'PROJ')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('projects')
  })

  it('returns at most max results (default 8)', () => {
    const names = Array.from({ length: 20 }, (_, i) => `item${i}`)
    const tree = makeTree(names)
    const results = searchTree(tree, 'item')
    expect(results).toHaveLength(8)
  })
})
