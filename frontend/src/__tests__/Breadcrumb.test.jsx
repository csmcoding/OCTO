import { describe, it, expect } from 'vitest'
import { buildCrumbList } from '../components/Breadcrumb'

const makeStack = (n) =>
  Array.from({ length: n }, (_, i) => ({ name: `node${i}`, path: `/path/${i}` }))

describe('buildCrumbList', () => {
  it('returns empty array when navStack has 1 item (at root)', () => {
    expect(buildCrumbList(makeStack(1))).toEqual([])
  })

  it('returns one entry per node for a 3-item stack', () => {
    const crumbs = buildCrumbList(makeStack(3))
    expect(crumbs).toHaveLength(3)
    expect(crumbs.map(c => c.label)).toEqual(['node0', 'node1', 'node2'])
  })

  it('last crumb is not clickable', () => {
    const crumbs = buildCrumbList(makeStack(3))
    expect(crumbs[crumbs.length - 1].clickable).toBe(false)
  })

  it('first crumb has index 0 and is clickable (handler target)', () => {
    const crumbs = buildCrumbList(makeStack(3))
    expect(crumbs[0].clickable).toBe(true)
    expect(crumbs[0].index).toBe(0)
  })

  it('truncates to first + ellipsis + last 3 when stack has 7 items', () => {
    const crumbs = buildCrumbList(makeStack(7))
    const labels = crumbs.map(c => c.label)
    expect(labels).toContain('...')
    expect(labels[0]).toBe('node0')
    expect(labels[labels.length - 1]).toBe('node6')
    expect(crumbs).toHaveLength(5) // first + ... + 3 last
  })
})
