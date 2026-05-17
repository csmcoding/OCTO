import { describe, it, expect } from 'vitest'
import { buildRingLayout } from '../utils/buildRingLayout'

describe('buildRingLayout', () => {
  it('returns empty array for no children', () => {
    expect(buildRingLayout([])).toEqual([])
  })

  it('returns correct count', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(buildRingLayout(nodes)).toHaveLength(3)
  })

  it('each entry has node and position with 3 numbers', () => {
    const nodes = [{ id: 'a' }]
    const [item] = buildRingLayout(nodes)
    expect(item.node).toBe(nodes[0])
    expect(item.position).toHaveLength(3)
    expect(typeof item.position[0]).toBe('number')
    expect(typeof item.position[1]).toBe('number')
    expect(typeof item.position[2]).toBe('number')
  })

  it('y is always 0 (XZ plane)', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    buildRingLayout(nodes).forEach(({ position }) => {
      expect(position[1]).toBe(0)
    })
  })

  it('radius param scales positions', () => {
    const nodes = [{ id: 'a' }]
    const [small] = buildRingLayout(nodes, 2)
    const [large] = buildRingLayout(nodes, 8)
    const dist = (p) => Math.sqrt(p[0] ** 2 + p[2] ** 2)
    expect(dist(small.position)).toBeCloseTo(2)
    expect(dist(large.position)).toBeCloseTo(8)
  })

  it('default radius is 4', () => {
    const nodes = [{ id: 'a' }]
    const [item] = buildRingLayout(nodes)
    const dist = Math.sqrt(item.position[0] ** 2 + item.position[2] ** 2)
    expect(dist).toBeCloseTo(4)
  })
})
